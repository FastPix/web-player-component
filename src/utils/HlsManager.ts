import type { HlsConfig, Hls as HlsInstanceType } from "hls.js";

import { getHlsConstructor, loadHlsFromCdn } from "./loadHlsFromCdn.js";
import { hideError, showError } from "./ErrorElement.js";
import { hideLoader, hideMenus, showLoader } from "./DomVisibilityManager.js";
import {
  hideShowSubtitlesMenu,
  toggleAudioMenu,
  togglePlaybackRateButtons,
  toggleResolutionMenu,
} from "./ToggleController.js";
import { documentObject } from "./CustomElements.js";
import { isChromecastConnected } from "./CastHandler.js";
import {
  applyQualityAuto,
  dispatchFastpixQualityChange,
  dispatchFastpixQualityFailed,
  dispatchFastpixQualityLevelsReady,
  performManualQualitySwitch,
} from "./qualityResolution.js";

function HlsApi(): any {
  return getHlsConstructor();
}

/** Defer past the next paint so timer callbacks only schedule work (fewer DevTools violations). */
export function runAfterNextPaint(fn: () => void): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(fn);
  });
}

/** Prefetch next fragment for VOD only — helps alt-audio after track change; off for live to avoid extra edge requests. */
export function startFragPrefetchForStreamType(
  streamType: string | null | undefined
): boolean {
  return streamType === "on-demand";
}

const configHls: Partial<HlsConfig> = {
  maxMaxBufferLength: 120,
  autoStartLoad: true,
  debug: false,
  enableWorker: false,
  startLevel: -1, // ABR picks initial level → fast start, then upgrades as network allows
  backBufferLength: 90,
  emeEnabled: true,
  lowLatencyMode: true,
  capLevelToPlayerSize: true,

  // ABR: fast start + upgrade when network improves
  abrMaxWithRealBitrate: true,
  abrEwmaFastLive: 2.0,
  abrEwmaSlowLive: 8.0,
  abrEwmaFastVoD: 3.0, // VOD: react quickly to bandwidth changes
  abrEwmaSlowVoD: 9.0, // VOD: smooth estimate, still allows upgrade when network improves
  abrBandWidthUpFactor: 0.85, // Use 85% of estimated bandwidth for upgrade → switch up sooner when headroom exists
  abrBandWidthFactor: 0.8, // Slightly conservative on initial pick for stability

  drmSystems: {
    "com.widevine.alpha": {
      robustness: "SW_SECURE_CRYPTO",
    },
    "com.apple.fps": {
      robustness: "SW_SECURE_CRYPTO",
    },
  },
};

const hlsInstance: HlsInstanceType | null = null;

async function setupSafariFairPlayDRM(context: any) {
  const fairplayConfig = context.config.drmSystems["com.apple.fps"];

  if (!fairplayConfig || !fairplayConfig.licenseUrl) {
    console.warn("No FairPlay license URL configured for Safari");
    return;
  }

  console.log(
    "Setting up Safari FairPlay DRM with license URL:",
    fairplayConfig.licenseUrl
  );
  console.log("FairPlay config:", fairplayConfig);

  // Check if we're actually in Safari and if FairPlay is supported
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  console.log("Browser detection - Safari:", isSafari);
  console.log("Video element:", context.video);
  console.log("Video src:", context.video.src);
  console.log(
    "Video canPlayType('application/vnd.apple.mpegurl'):",
    context.video.canPlayType("application/vnd.apple.mpegurl")
  );

  // Set up DRM robustness level to avoid warnings for both FairPlay and Widevine
  console.log("Setting up DRM robustness level");
  try {
    // Try FairPlay first (for Safari)
    try {
      const fairplayKeySystemAccess =
        await navigator.requestMediaKeySystemAccess("com.apple.fps.1_0", [
          {
            initDataTypes: ["cenc"],
            audioCapabilities: [
              {
                contentType: 'audio/mp4;codecs="mp4a.40.2"',
                robustness: "SW_SECURE_CRYPTO",
              },
            ],
            videoCapabilities: [
              {
                contentType: 'video/mp4;codecs="avc1.42E01E"',
                robustness: "SW_SECURE_CRYPTO",
              },
            ],
          },
        ]);

      console.log(
        "FairPlay key system access granted:",
        fairplayKeySystemAccess
      );
      const fairplayMediaKeys = await fairplayKeySystemAccess.createMediaKeys();
      await context.video.setMediaKeys(fairplayMediaKeys);
      console.log("FairPlay MediaKeys set successfully");
    } catch (fairplayError) {
      console.log("FairPlay not available, trying Widevine:", fairplayError);

      // Try Widevine (for Chrome and other browsers)
      try {
        const widevineKeySystemAccess =
          await navigator.requestMediaKeySystemAccess("com.widevine.alpha", [
            {
              initDataTypes: ["cenc"],
              audioCapabilities: [
                {
                  contentType: 'audio/mp4;codecs="mp4a.40.2"',
                  robustness: "SW_SECURE_CRYPTO",
                },
              ],
              videoCapabilities: [
                {
                  contentType: 'video/mp4;codecs="avc1.42E01E"',
                  robustness: "SW_SECURE_CRYPTO",
                },
              ],
            },
          ]);

        console.log(
          "Widevine key system access granted:",
          widevineKeySystemAccess
        );
        const widevineMediaKeys =
          await widevineKeySystemAccess.createMediaKeys();
        await context.video.setMediaKeys(widevineMediaKeys);
        console.log("Widevine MediaKeys set successfully");
      } catch (widevineError) {
        console.warn("Widevine not available:", widevineError);
      }
    }
  } catch (error) {
    console.warn("Failed to set up DRM robustness level:", error);
  }

  // Add debugging for all video events
  context.video.addEventListener("loadstart", () => {
    console.log("Video loadstart event");
  });

  context.video.addEventListener("loadedmetadata", () => {
    console.log("Video loadedmetadata event");
  });

  context.video.addEventListener("canplay", () => {
    console.log("Video canplay event");
  });

  // Handle FairPlay key message events
  console.log("Adding webkitkeymessage event listener to video element");
  context.video.addEventListener("webkitkeymessage", async (event: any) => {
    console.log("=== SAFARI FAIRPLAY EVENT FIRED ===");
    console.log("Safari FairPlay key message event:", event);
    console.log("Event messageType:", event.messageType);
    console.log(
      "Event message length:",
      event.message ? event.message.byteLength : "no message"
    );
    console.log("Event target:", event.target);
    console.log("Event currentTarget:", event.currentTarget);

    try {
      if (event.messageType === "certificate-request") {
        console.log("Handling certificate request");
        // Handle certificate request - Safari might need this to be handled properly
        const certUrl =
          fairplayConfig.certificateUrl || fairplayConfig.serverCertificateUrl;
        if (certUrl) {
          console.log("Fetching certificate from:", certUrl);
          const response = await fetch(certUrl);
          const certificate = await response.arrayBuffer();

          // Send certificate back to Safari
          const certEvent = new (window as any).WebKitMediaKeyMessageEvent(
            "webkitkeymessage",
            {
              message: certificate,
              messageType: "certificate",
            }
          );
          context.video.dispatchEvent(certEvent);
        }
      } else if (event.messageType === "license-request") {
        console.log("Handling license request - making license URL call");
        const spc = event.message;
        const licenseUrl = fairplayConfig.licenseUrl;

        console.log("Requesting FairPlay license from:", licenseUrl);

        // Send SPC to license server
        const response = await fetch(licenseUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
          },
          body: spc,
        });

        if (!response.ok) {
          throw new Error(
            `License request failed: ${response.status} ${response.statusText}`
          );
        }

        const ckc = await response.arrayBuffer();
        console.log("Received FairPlay license response");

        // Send CKC back to Safari
        const keyEvent = new (window as any).WebKitMediaKeyMessageEvent(
          "webkitkeymessage",
          {
            message: ckc,
            messageType: "license",
          }
        );

        context.video.dispatchEvent(keyEvent);
      } else {
        console.log("Unknown messageType:", event.messageType);
      }
    } catch (error) {
      console.error("FairPlay license request failed:", error);
    }
  });
}

/** Remove online/offline handlers from a prior `setupErrorHandling` (avoids duplicate startLoad on reconnect). */
function teardownHlsWindowNetworkListeners(context: any) {
  const t = context?.__fpHlsNetworkListenersTeardown;
  if (typeof t === "function") {
    try {
      t();
    } catch {
      /* ignore */
    }
  }
  context.__fpHlsNetworkListenersTeardown = undefined;
}

function setupErrorHandling(context: any, streamType: string | null) {
  teardownHlsWindowNetworkListeners(context);

  let networkErrorLogged = false;
  let isLoadingAllowed = true;
  let fatalFragLoadCheck = false;

  const retryHLSLoad = () => {
    const h = context?.hls;
    if (!navigator.onLine || !isLoadingAllowed || !h) return;
    try {
      if (typeof h.startLoad === "function") {
        h.startLoad();
      }
    } catch {
      /* ignore */
    }
  };

  /** Yield so startLoad is not executed inside setTimeout / online handler stacks (DevTools violations). */
  const scheduleRetryHLSLoad = () => {
    requestAnimationFrame(() => retryHLSLoad());
  };

  const handleOnline = () => {
    if (fatalFragLoadCheck) {
      showError(
        context,
        "A fatal error occurred previously while loading a fragment. Please refresh the page to try again."
      );
      fatalFragLoadCheck = false;
    } else {
      isLoadingAllowed = true;
      hideError(context);
      networkErrorLogged = false;
      scheduleRetryHLSLoad();
    }
  };

  const handleOffline = () => {
    if (context?.debugAttribute) {
      console.warn(
        "[fastpix-player] Network offline or suspended; playback may pause until connection returns."
      );
    }
    if (isChromecastConnected()) return;
    showError(
      context,
      "You are currently offline. Please connect to a network to continue watching."
    );
    isLoadingAllowed = false;
  };

  function fatalErrorHandling(context: any, details: any) {
    const H = HlsApi();
    if (
      details === H.ErrorDetails.LEVEL_LOAD_ERROR ||
      details === H.ErrorDetails.LEVEL_EMPTY_ERROR ||
      details === H.ErrorDetails.LEVEL_LOAD_TIMEOUT
    ) {
      dispatchFastpixQualityFailed(
        context,
        String(details),
        undefined,
        details
      );
    }

    // Handle specific fatal key system errors
    if (details === HlsApi().ErrorDetails.KEY_SYSTEM_SESSION_UPDATE_FAILED) {
      showError(
        context,
        "A DRM (Digital Rights Management) error occurred. The playback session cannot continue due to a session update failure."
      );
      return;
    }

    if (details === HlsApi().ErrorDetails.BUFFER_STALLED_ERROR) {
      showLoader(context); // Show loader if buffering stalls
      return;
    }

    if (details.startsWith("key")) {
      showError(
        context,
        "A DRM (Digital Rights Management) error occurred. Please check your drm-token or token for the stream."
      );
      return;
    }

    if (details === HlsApi().ErrorDetails.FRAG_LOAD_ERROR) {
      fatalFragLoadCheck = true;
      showError(
        context,
        "An error occurred while loading a fragment. Please try refreshing the page."
      );
      context.hls.destroy();
    } else if (
      details === HlsApi().ErrorDetails.LEVEL_LOAD_ERROR ||
      details === HlsApi().ErrorDetails.LEVEL_EMPTY_ERROR
    ) {
      showError(
        context,
        "An Error occurred while loading the stream. Please try refreshing the page."
      );
    } else if (details === HlsApi().ErrorDetails.LEVEL_LOAD_TIMEOUT) {
      context.hls.destroy();
      showError(
        context,
        "An error occurred while loading the stream. Please try refreshing the page."
      );
    } else if (
      details === HlsApi().ErrorDetails.AUDIO_TRACK_LOAD_TIMEOUT ||
      details === HlsApi().ErrorDetails.MANIFEST_PARSING_ERROR
    ) {
      showError(
        context,
        "An error occurred while loading the video. Please try refreshing the page."
      );
      context.hls.destroy();
    } else {
      showError(
        context,
        "An error occurred while loading the video. Playback session cannot continue, try refreshing the page."
      );
      context.hls.destroy();
    }
  }

  function keySystemErrorHandlingNonFatal(context: any, details: any) {
    // Handle non-fatal key system errors
    if (details.startsWith("KEY_SYSTEM")) {
      showError(
        context,
        "A DRM error occurred, but the player is attempting to recover."
      );
      context.hls.recoverMediaError(); // Attempt recovery for non-fatal key system errors
    }
  }

  function mediaErrorHandlingNonFatal(context: any, fatal: boolean, type: any) {
    // Handle media errors (buffering, stalling, etc.)
    if (type === HlsApi().ErrorTypes.MEDIA_ERROR) {
      if (fatal === true) {
        showError(
          context,
          "A problem occurred while buffering media. Playback cannot continue."
        );
      } else {
        setTimeout(() => requestAnimationFrame(() => retryHLSLoad()), 1000);
      }
    }

    // Handle network errors
    if (type === HlsApi().ErrorTypes.NETWORK_ERROR) {
      if (!navigator.onLine && !networkErrorLogged) {
        showError(
          context,
          "You are offline. Please connect to a network to continue watching."
        );
        networkErrorLogged = true;
      } else {
        retryHLSLoad();
        networkErrorLogged = false;
      }
    }
  }

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
  context.__fpHlsNetworkListenersTeardown = () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };

  context.hls.on(
    HlsApi().Events.ERROR,
    (data: { details: any; type?: any; fatal?: any }, event: any) => {
      // Check for fatal errors
      if (event.fatal) {
        console.error("Fatal Hls error DD:", event.details);

        fatalErrorHandling(context, event.details);
      } else {
        keySystemErrorHandlingNonFatal(context, event.details);
      }

      // Handle specific error cases for different stream types
      if (streamType === "on-demand") {
        handleOnDemandErrors(context, data);
      } else {
        handleLiveStreamErrors(context, data);
        mediaErrorHandlingNonFatal(context, event.fatal, event.type);
      }
    }
  );
}

// Function to handle on-demand errors
function handleOnDemandErrors(context: any, data: any) {
  if (data.fatal) {
    if (data.response && data.response.code === 404) {
      showError(
        context,
        "The video you are trying to access is not available."
      );
    } else if (data.response && data.response.code === 500) {
      showError(
        context,
        "Server error while loading the video. Please try again later."
      );
    }
  }
}

// Function to handle live stream errors
function handleLiveStreamErrors(context: any, data: any) {
  if (data.fatal) {
    if (
      data.response &&
      data.response.code === 404 &&
      data.details === HlsApi().ErrorDetails.MANIFEST_LOAD_ERROR
    ) {
      showError(context, "No live stream is currently active on this channel.");
    } else if (data.response && data.response.code === 403) {
      showError(context, "Invalid token. Please check your access rights.");
    }
  }
}

/**
 * For Shorts: choose startLevel from network when possible.
 * -1 = let ABR pick (better initial quality on good network).
 * 0 = start at lowest level (fastest time-to-first-frame on slow network).
 */
function getStartLevelForShorts(): number {
  const conn = (navigator as any).connection;
  if (!conn) return 0; // no API: prefer fastest start
  if (conn.saveData === true) return 0; // user asked for less data
  const effectiveType = (conn.effectiveType || "").toLowerCase();
  const downlink = typeof conn.downlink === "number" ? conn.downlink : 10;
  if (effectiveType === "slow-2g" || effectiveType === "2g") return 0;
  if (effectiveType === "3g" && downlink < 1) return 0;
  return -1; // 4g or decent 3g: let ABR choose
}

function initializeHLS(
  context: any,
  src: string | null,
  streamType: string | null
) {
  // Ensure the URL is correct and includes the cache-busting parameter only when needed
  const url = context.enableCacheBusting ? `${src}?t=${Date.now()}` : src;

  // Load HLS source using HLS.js
  if (HlsApi().isSupported()) {
    if (src && typeof src === "string") {
      context.hls.attachMedia(context.video);
      context.video.loop = !!context.loopAttribute;
      if (context.hasAttribute("autoplay-shorts")) {
        context.hls.startLevel = getStartLevelForShorts();
      }
      context.hls.loadSource(url);
    } else {
      console.warn("Stream URL is invalid or null:", src);
    }

    // Hide loading indicator when the fragment has been loaded (only when not auto-play; with auto-play we hide on ready state in VideoListeners)
    const autoplayAttrs =
      context.hasAttribute("auto-play") ||
      context.hasAttribute("autoplay-shorts") ||
      context.hasAttribute("loop-next");
    context.hls.on(HlsApi().Events.FRAG_LOADED, () => {
      if (!autoplayAttrs) hideLoader(context);
    });

    setupErrorHandling(context, streamType);

    context.hls.on(HlsApi().Events.FRAG_BUFFERED, () => {
      if (!autoplayAttrs) hideLoader(context);
    });
  } else if (context.video.canPlayType("application/vnd.apple.mpegurl")) {
    // Safari or other native HLS-supporting browsers
    if (context.debugAttribute) {
      console.log("Using native HLS support (Safari)");
      console.log("DRM configuration for Safari:", context.config.drmSystems);
    }

    // Set up Safari FairPlay DRM handling
    setupSafariFairPlayDRM(context);

    context._src = url;
    context.video.src = url;
    context.video.loop = !!context.loopAttribute;
  } else {
    // Handle case where HLS is not supported in the browser
    showError(
      context,
      "HLS is not supported, and the browser does not support the HLS format."
    );
  }
}

function hlsListeners(context: any) {
  context.hls.on(HlsApi().Events.RECOVERED, () => {
    hideError(context);
  });

  context.hls.on(HlsApi().Events.MANIFEST_PARSED, () => {
    context.hls.attachMedia(context.video);
  });
}

function parseKeyAttributes(manifestText: string) {
  const keyLines = manifestText
    .split("\n")
    .filter((line) => line.startsWith("#EXT-X-KEY"));
  return keyLines.map((line) => extractKeyAttributes(line));
}

function extractKeyAttributes(line: string) {
  const keyAttributes: any = {};
  const attributes = line.substring("#EXT-X-KEY:".length).split(",");
  attributes.forEach((attribute) => {
    const [key, value] = attribute.split("=");
    if (value) {
      keyAttributes[key.trim()] = value.replace(/^"(.*)"$/, "$1"); // Remove quotes
    }
  });
  return keyAttributes;
}

function handleHlsQualityAndTrackSetup(context: any) {
  context.hls.on(
    HlsApi().Events.MANIFEST_PARSED,
    (_: any, data: { levels: any; audioTracks: any; subtitleTracks: any }) => {
      context._lastQualityEmitLoadedId = null;

      let levelsRetrieved = data.levels;
      const subtitleTracks = data.subtitleTracks;

      context.audioTracksRetrieved = data.audioTracks;

      const renditionOrderAttr = context.getAttribute("rendition-order");
      const levels =
        renditionOrderAttr === "desc"
          ? [...levelsRetrieved].reverse()
          : levelsRetrieved;

      // Do not override startLevel: let ABR choose so playback starts as soon as possible.
      // When network improves, hls.js (nextLevel = -1) will switch to higher quality automatically.
      setupResolutionUI(context, levels);
      setupAudioTracksUI(context, context.audioTracksRetrieved);
      setupAudioTracks(context); // Populate player.audioTracks with formatted track info
      setupSubtitleButton(context, subtitleTracks);
      setupResolutionMenuButton(context);
      // Auto is always highlighted by default.
      // Only a manual user click on a rendition button changes the highlight.

      // Emit fastpixtracksready event so external UIs know tracks are available
      try {
        const { audioTracks, currentAudioTrackId } =
          getFormattedAudioTracks(context);
        const { subtitleTracks: formattedSubtitles, currentSubtitleTrackId } =
          getFormattedSubtitleTracks(context);
        const currentAudioTrackLoaded = Array.isArray(audioTracks)
          ? (audioTracks.find((t: any) => t?.isCurrent) ?? null)
          : null;
        const currentSubtitleLoaded = Array.isArray(formattedSubtitles)
          ? (formattedSubtitles.find((t: any) => t?.isCurrent) ?? null)
          : null;

        context.dispatchEvent(
          new CustomEvent("fastpixtracksready", {
            detail: {
              audioTracks,
              subtitleTracks: formattedSubtitles,
              // Backward-compatible ids (numeric indices) – prefer the full objects below.
              currentAudioId: currentAudioTrackId,
              currentSubtitleId: currentSubtitleTrackId,
              // Preferred: full current track objects
              currentAudioTrackLoaded,
              currentSubtitleLoaded,
            },
          })
        );
      } catch (e) {
        console.warn("fastpixtracksready event emission failed:", e);
      }

      try {
        dispatchFastpixQualityLevelsReady(context);
        dispatchFastpixQualityChange(context);
      } catch (e) {
        console.warn("fastpix quality events emission failed:", e);
      }
    }
  );

  context.hls.on(HlsApi().Events.LEVEL_SWITCHED, () => {
    dispatchFastpixQualityChange(context);
  });

  context.hls.on(HlsApi().Events.BUFFER_FLUSHED, () =>
    handleBufferFlushed(context)
  );
}

function setupResolutionUI(context: any, levels: any) {
  context.qualityLevelsOrdered = Array.isArray(levels) ? levels : [];

  // Clear previous resolution buttons to avoid duplicates
  if (context.resolutionMenu) {
    while (context.resolutionMenu.firstChild) {
      context.resolutionMenu.removeChild(context.resolutionMenu.firstChild);
    }
  }
  context.resolutionButtons = [];

  let levelsArray = levels.map((item: { height: any }) => item.height);

  if (levelsArray[0] === 0) {
    context.bottomRightDiv.removeChild(context.resolutionMenuButton);
    context.bottomRightDiv.removeChild(context.pipButton);
    return;
  }

  context.autoResolutionButton = createResolutionButton("Auto", () => {
    applyQualityAuto(context);
    toggleResolutionMenu(context);
  });

  context.resolutionMenu.appendChild(context.autoResolutionButton);
  context.resolutionButtons = levels.map(
    (level: { height: any; width: any }, index: any) => {
      // Use the *vertical* pixel count ("p") for labels.
      // For 9:16 video, this should be 854p/1280p/1920p (not 480p/720p/1080p).
      const dimension =
        typeof level.height === "number" && level.height > level.width
          ? level.width
          : level.height;

      const resolutionButton = createResolutionButton(`${dimension}p`, () =>
        handleResolutionSwitch(context, index, dimension)
      );
      context.resolutionMenu.appendChild(resolutionButton);
      return resolutionButton;
    }
  );

  setActiveButton(context.autoResolutionButton, [
    ...context.resolutionButtons,
    context.autoResolutionButton,
  ]);
}

function createResolutionButton(label: string, onClick: () => void) {
  const button = documentObject.createElement("button");
  button.className = "qualitySelectorButtons";
  button.textContent = label;
  button.title = label;
  button.addEventListener("click", onClick);
  return button;
}

function handleResolutionSwitch(context: any, index: number, _height: any) {
  performManualQualitySwitch(context, index);

  setActiveButton(context.resolutionButtons[index], [
    ...context.resolutionButtons,
    context.autoResolutionButton,
  ]);

  toggleResolutionMenu(context);
  dispatchFastpixQualityChange(context);
}

/**
 * Track info shape returned by getAudioTracks / getSubtitleTracks.
 */
type TrackInfo = {
  id: number;
  label: string;
  language?: string;
  isDefault: boolean;
  isCurrent: boolean;
};

function normalizeTrackKey(label: string): string {
  return (label || "").toString().trim().toLowerCase();
}

/**
 * De-dupe tracks by label (case-insensitive), keeping order.
 * If duplicates exist, prefer the entry that isCurrent, otherwise keep the first.
 */
function dedupeByLabel(tracks: TrackInfo[]): TrackInfo[] {
  const out: TrackInfo[] = [];
  const posByKey = new Map<string, number>();
  for (const t of tracks) {
    const key = normalizeTrackKey(t.label);
    if (!key) {
      out.push(t);
      continue;
    }
    const existingPos = posByKey.get(key);
    if (existingPos === undefined) {
      posByKey.set(key, out.length);
      out.push(t);
      continue;
    }
    const existing = out[existingPos];
    // Prefer the current one if duplicates exist
    if (!existing.isCurrent && t.isCurrent) {
      out[existingPos] = t;
    }
  }
  return out;
}

/**
 * Helper: returns formatted audio tracks from HLS instance.
 * Used by player.getAudioTracks() to expose tracks to external UIs.
 */
function getFormattedAudioTracks(context: any): {
  audioTracks: TrackInfo[];
  currentAudioTrackId: number | null;
} {
  const hlsAny: any = context.hls;
  // Use audioTracksRetrieved (from MANIFEST_PARSED) or fall back to hls.audioTracks
  const rawTracks: any[] = Array.isArray(context.audioTracksRetrieved)
    ? context.audioTracksRetrieved
    : Array.isArray(hlsAny?.audioTracks)
      ? hlsAny.audioTracks
      : [];

  // Determine current track index:
  // 1. Use hls.audioTrack if it's a valid index (>= 0)
  // 2. Otherwise find the default track (default: true flag)
  // 3. Otherwise a track named "default"
  // 4. Otherwise use index 0
  let currentIndex: number =
    typeof hlsAny?.audioTrack === "number" && hlsAny.audioTrack >= 0
      ? hlsAny.audioTrack
      : -1;

  if (currentIndex < 0 && rawTracks.length > 0) {
    // Optional: default-audio-track attribute by NAME (case-insensitive).
    // Example: <fastpix-player default-audio-track="French">
    const defaultAudioName = context.getAttribute?.("default-audio-track");
    if (typeof defaultAudioName === "string" && defaultAudioName.trim()) {
      const key = defaultAudioName.trim().toLowerCase();
      const byName = rawTracks.findIndex(
        (t: any) =>
          ((t?.name ?? "") as string).toString().trim().toLowerCase() === key
      );
      if (byName >= 0) currentIndex = byName;
    }

    // If not set, find default track from manifest
    if (currentIndex < 0) {
      currentIndex = rawTracks.findIndex((t: any) => t?.default === true);
    }
    if (currentIndex < 0) {
      currentIndex = rawTracks.findIndex(
        (t: any) => (t?.name ?? "").toString().toLowerCase() === "default"
      );
    }
    if (currentIndex < 0) {
      currentIndex = 0; // Fall back to first track
    }
  }

  const audioTracksAll: TrackInfo[] = rawTracks.map((t, index) => {
    const lang = (t?.lang ?? "").toString().trim();
    return {
      // Keep id as the underlying HLS index so it's stable even if we de-dupe display entries.
      id: index,
      label: (t?.name ?? "").toString().trim() || lang || `Track ${index + 1}`,
      language: lang || undefined,
      isDefault: !!t?.default,
      isCurrent: index === currentIndex,
    };
  });

  const audioTracks = dedupeByLabel(audioTracksAll);
  const currentTrack = audioTracksAll.find((t) => t.isCurrent);
  const currentAudioTrackId = currentTrack ? currentTrack.id : null;

  return { audioTracks, currentAudioTrackId };
}

/**
 * Helper: returns formatted subtitle tracks from video.textTracks.
 * Used by player.getSubtitleTracks() to expose tracks to external UIs.
 */
function getFormattedSubtitleTracks(context: any): {
  subtitleTracks: TrackInfo[];
  currentSubtitleTrackId: number | null;
} {
  const video = context.video as HTMLVideoElement | undefined;
  if (!video || !video.textTracks) {
    return { subtitleTracks: [], currentSubtitleTrackId: null };
  }

  const tracks: TextTrack[] = Array.from(video.textTracks || []);
  const filtered = tracks
    .map((t, index) => ({ track: t, index }))
    .filter(
      ({ track }) => track.kind === "subtitles" || track.kind === "captions"
    );

  const subtitleTracks: TrackInfo[] = filtered.map(({ track, index }) => {
    const lang = (track.language || "").toString().trim();
    return {
      id: index,
      label:
        (track.label || lang || "").toString().trim() || `Track ${index + 1}`,
      language: lang || undefined,
      isDefault: track.mode === "showing",
      isCurrent: track.mode === "showing",
    };
  });

  const subtitleTracksDeduped = dedupeByLabel(subtitleTracks);
  const current = subtitleTracks.find((t) => t.isCurrent);
  const currentSubtitleTrackId = current ? current.id : null;

  return { subtitleTracks: subtitleTracksDeduped, currentSubtitleTrackId };
}

function setupAudioTracks(context: any) {
  const { audioTracks, currentAudioTrackId } = getFormattedAudioTracks(context);
  context.audioTracks = audioTracks;
  context.currentAudioTrackId = currentAudioTrackId;
}

/** Rebuild native audio menu buttons from current `hls.audioTrack` (e.g. after `setAudioTrack`). */
function rebuildAudioMenuUI(context: any) {
  if (!context?.audioMenu) return;
  setupAudioTracks(context);
  const { audioTracks: formattedAudioTracks } =
    getFormattedAudioTracks(context);
  context.audioMenu.innerHTML = "";
  const audioButtons = (formattedAudioTracks || []).map((t: TrackInfo) =>
    createAudioButton(context, t.label, t.id, !!t.isCurrent)
  );
  context.audioMenu.append(...audioButtons);

  const currentPos = (formattedAudioTracks || []).findIndex(
    (t: TrackInfo) => t?.isCurrent
  );
  if (currentPos >= 0 && audioButtons[currentPos]) {
    setActiveButton(audioButtons[currentPos], context.audioMenu.children);
  }

  context.audioMenuButton.style.display =
    (formattedAudioTracks || []).length > 1
      ? context.audioMenuButton.classList.add("audioMenuButtonShow")
      : context.audioMenuButton.classList.remove("audioMenuButtonShow");
}

function setupAudioTracksUI(context: any, audioTracks: any) {
  // Determine default track:
  // 1. Prefer default-audio-track attribute by NAME (case-insensitive)
  // 2. Otherwise prefer manifest default flag
  // 3. Otherwise a track named "default"
  // 4. Otherwise index 0
  let defaultIndex = -1;
  if (Array.isArray(audioTracks) && audioTracks.length > 0) {
    const defaultAudioName = context.getAttribute?.("default-audio-track");
    if (typeof defaultAudioName === "string" && defaultAudioName.trim()) {
      const key = defaultAudioName.trim().toLowerCase();
      const byName = audioTracks.findIndex(
        (t: any) => (t?.name ?? "").toString().trim().toLowerCase() === key
      );
      if (byName >= 0) defaultIndex = byName;
    }
    if (defaultIndex === -1) {
      defaultIndex = audioTracks.findIndex((t: any) => t?.default === true);
    }
    if (defaultIndex === -1) {
      defaultIndex = audioTracks.findIndex(
        (t: any) => (t?.name ?? "").toString().toLowerCase() === "default"
      );
    }
    if (defaultIndex === -1) {
      defaultIndex = 0;
    }
  }

  // Apply default selection (do not emit change event here)
  if (
    defaultIndex >= 0 &&
    Array.isArray(audioTracks) &&
    audioTracks.length > 0
  ) {
    try {
      context.hls.audioTrack = defaultIndex;
      // Ensure it's applied after internal state settles
      setTimeout(() => {
        runAfterNextPaint(() => {
          try {
            if (context.hls?.audioTrack !== defaultIndex)
              context.hls.audioTrack = defaultIndex;
          } catch {}
        });
      }, 0);
    } catch (error) {
      console.error("Error setting default audio track:", error);
    }
  }

  rebuildAudioMenuUI(context);
}

function fpAudioDebugLog(context: any, ...args: unknown[]) {
  try {
    if (context?.debugAttribute) {
      console.debug("[fastpix-audio]", ...args);
    }
  } catch {
    /* ignore */
  }
}

function logAudioSwitchLoaderDisplayTime(
  context: any,
  sessionId: number | null,
  ms: number,
  reason: string
) {
  fpAudioDebugLog(context, "audio-switch loader display time (ms)", {
    ms,
    sessionId,
    reason,
  });
}

/** Seconds since `__fpAudioSwitchT0`; only when `debug` is set. */
function logAudioSwitchElapsedSec(
  context: any,
  phase: string,
  extra?: Record<string, unknown>
) {
  const t0 = context?.__fpAudioSwitchT0;
  if (typeof t0 !== "number") return;
  const elapsedSec = Math.round((performance.now() - t0) / 10) / 100;
  fpAudioDebugLog(context, "audio-switch timing (s)", {
    phase,
    elapsedSec,
    ...(extra ?? {}),
  });
}

/** One-line summary at end of a switch (debug only). Clears `__fpAudioSwitchMeta`. */
function logAudioSwitchTotalDurationSummary(
  context: any,
  path: "lightweight" | "heavy" | "lightweight-fallback" | "heavy-fallback"
) {
  const t0 = context?.__fpAudioSwitchT0;
  if (typeof t0 !== "number") return;
  const totalSec = Math.round((performance.now() - t0) / 10) / 100;
  const meta = context.__fpAudioSwitchMeta as
    | { from?: number; to?: number }
    | undefined;
  fpAudioDebugLog(
    context,
    "audio-switch TOTAL duration (request → this point)",
    {
      totalSec,
      path,
      fromTrackIndex: meta?.from,
      toTrackIndex: meta?.to,
    }
  );
  context.__fpAudioSwitchMeta = undefined;
}

/** Only call `play()` after an audio switch if playback was not paused when the switch was requested. */
function audioSwitchResumeIfWasPlaying(context: any, vid?: HTMLVideoElement) {
  const v = vid ?? (context?.video as HTMLVideoElement | undefined);
  if (!v || context?.__fpAudioSwitchUserHadPaused) return;
  void v.play().catch(() => {});
}

/** One loader for the whole audio-switch operation; `showLoader` already no-ops if visible. */
function beginAudioTrackSwitchLoader(context: any): number {
  clearTimeout(context.__fpAudioSwitchHideTimer);
  context.__fpAudioSwitchSession = (context.__fpAudioSwitchSession || 0) + 1;
  const id = context.__fpAudioSwitchSession;
  showLoader(context);
  context.__fpAudioSwitchLoaderShownAt = performance.now();
  return id;
}

function scheduleEndAudioTrackSwitchLoader(context: any, sessionId: number) {
  if (sessionId < 0) return;
  clearTimeout(context.__fpAudioSwitchHideTimer);
  context.__fpAudioSwitchHideTimer = setTimeout(() => {
    runAfterNextPaint(() => {
      if (context.__fpAudioSwitchSession !== sessionId) return;
      const t0 = context.__fpAudioSwitchLoaderShownAt;
      if (typeof t0 === "number") {
        logAudioSwitchLoaderDisplayTime(
          context,
          sessionId,
          Math.round(performance.now() - t0),
          "hide-after-switch"
        );
        context.__fpAudioSwitchLoaderShownAt = undefined;
      } else {
        logAudioSwitchLoaderDisplayTime(
          context,
          sessionId,
          0,
          "hide-after-switch (no show timestamp)"
        );
      }
      hideLoader(context);
      logAudioSwitchElapsedSec(
        context,
        "switch-complete (heavy: ui-loader-hidden)",
        {
          sessionId,
          note: "elapsed since switch-requested; includes 280ms post-SWITCHED debounce",
        }
      );
      const outcome = context.__fpAudioSwitchOutcomePath ?? "heavy";
      context.__fpAudioSwitchOutcomePath = undefined;
      logAudioSwitchTotalDurationSummary(
        context,
        outcome === "heavy-fallback" ? "heavy-fallback" : "heavy"
      );
      context.__fpAudioSwitchT0 = undefined;
      context.__fpAudioSwitchUserHadPaused = undefined;
    });
  }, 280);
}

/** Same idea as hls.js internal `useAlternateAudio`: separate audio rendition vs muxed main. */
function audioTrackIsAlternate(hlsAny: any, trackIndex: number): boolean {
  try {
    const tracks = hlsAny?.audioTracks;
    const t = Array.isArray(tracks) ? tracks[trackIndex] : null;
    const url = t?.url as string | undefined;
    if (!url) return false;
    const levelUri = hlsAny?.loadLevelObj?.uri;
    return url !== levelUri;
  } catch {
    return false;
  }
}

/**
 * Heavy recovery (blocking loader, hold, directResume/startLoad) is only needed when leaving
 * separate-audio rendition for muxed-in-video main (hls.js `altToMain`). For alternate↔alternate
 * (e.g. default URL + Bengali URL), both look “alternate” vs level URI — use lightweight path.
 */
function shouldUseLightweightAudioTrackSwitchPath(
  hlsAny: HlsInstanceType | null | undefined,
  previousAudioTrackId: number | undefined,
  expectedAudioTrackId: number
): boolean {
  const h = hlsAny as any;
  if (!h || expectedAudioTrackId < 0) return true;
  const leavingAlternate =
    typeof previousAudioTrackId === "number" &&
    previousAudioTrackId >= 0 &&
    audioTrackIsAlternate(h, previousAudioTrackId);
  const altToMain =
    leavingAlternate && !audioTrackIsAlternate(h, expectedAudioTrackId);
  return !altToMain;
}

/**
 * Single imperceptible seek + play — avoids stacked seeks that make audio “stutter”.
 * Does not call `hls.startLoad()`.
 */
function nudgeVideoElementOnly(context: any): void {
  const vid = context?.video as HTMLVideoElement | undefined;
  if (!vid || !Number.isFinite(vid.currentTime) || vid.paused) return;
  try {
    const t = vid.currentTime;
    const d = vid.duration;
    const bump = t + 0.001;
    vid.currentTime =
      Number.isFinite(d) && bump >= d ? Math.max(0, t - 0.001) : bump;
  } catch {
    /* ignore */
  }
  requestAnimationFrame(() => {
    void vid.play().catch(() => {});
  });
}

const FP_DIRECT_RESUME_THROTTLE_MS = 380;

/**
 * One `startLoad` at the playhead as soon as hls begins a track change
 * (`AUDIO_TRACK_SWITCHED` fires only after buffers are ready, often ~0.5–2s later).
 */
function kickHlsLoadAtPlayhead(context: any): void {
  const hlsAny = context?.hls as any;
  const vid = context?.video as HTMLVideoElement | undefined;
  if (!hlsAny || !vid || !Number.isFinite(vid.currentTime)) return;
  try {
    if (typeof hlsAny.startLoad === "function") {
      hlsAny.startLoad(vid.currentTime, true);
    }
  } catch {
    /* ignore */
  }
}

/**
 * `startLoad` restarts network controllers; calling it on every BUFFER_FLUSHED/nudge
 * delays `AUDIO_TRACK_SWITCHED` and real audio by seconds. Throttle bursts; use
 * `force` when hls has finished the switch (AUDIO_TRACK_SWITCHED).
 */
function directResumePlaybackAfterAudioTrackChange(
  context: any,
  force?: boolean
): void {
  const hlsAny = context?.hls as any;
  const vid = context?.video as HTMLVideoElement | undefined;
  if (!hlsAny || !vid || !Number.isFinite(vid.currentTime)) {
    fpAudioDebugLog(context, "directResume: skip (no hls/video/time)");
    return;
  }

  const now = Date.now();
  const last = context.__fpDirectResumeAt ?? 0;
  if (!force && now - last < FP_DIRECT_RESUME_THROTTLE_MS) {
    fpAudioDebugLog(context, "directResume: throttled, video nudge only");
    nudgeVideoElementOnly(context);
    return;
  }
  context.__fpDirectResumeAt = now;

  const tick = (label: string, withStartLoad: boolean) => {
    if (!Number.isFinite(vid.currentTime)) return;
    const ct = vid.currentTime;
    fpAudioDebugLog(context, `directResume: ${label}`, {
      t: ct,
      muted: vid.muted,
      paused: vid.paused,
      hlsAudioTrack: hlsAny.audioTrack,
      force: !!force,
      withStartLoad,
    });
    if (withStartLoad) {
      try {
        if (typeof hlsAny.startLoad === "function") {
          hlsAny.startLoad(ct, true);
        }
      } catch (e) {
        fpAudioDebugLog(context, "directResume: startLoad error", e);
      }
    }
    if (vid.paused) return;
    try {
      const d = vid.duration;
      const bump = ct + 0.001;
      vid.currentTime =
        Number.isFinite(d) && bump >= d ? Math.max(0, ct - 0.001) : bump;
    } catch {
      /* ignore */
    }
    void vid.play().catch(() => {});
  };

  queueMicrotask(() => tick("1", true));
  setTimeout(() => runAfterNextPaint(() => tick("2", false)), force ? 90 : 55);
}

/**
 * Register before `hls.audioTrack = …`. Nudges after `AUDIO_TRACK_SWITCHED`.
 * Alternate → muxed main: hls.js often emits SWITCHED only after BUFFER_FLUSHED,
 * so it can arrive after 1s; we keep listening + BUFFER_FLUSHED nudge + late fallbacks.
 */
function nudgePlaybackAfterAudioTrackSwitch(
  context: any,
  hls: HlsInstanceType | null | undefined,
  expectedAudioTrackId: number,
  previousAudioTrackId?: number
): void {
  const vid = context?.video as HTMLVideoElement | undefined;
  const hlsInstance =
    hls !== undefined && hls !== null
      ? hls
      : (context?.hls as HlsInstanceType | undefined);

  if (
    !vid ||
    !Number.isFinite(vid.currentTime) ||
    !hlsInstance ||
    typeof (hlsInstance as any).on !== "function" ||
    typeof (hlsInstance as any).off !== "function" ||
    expectedAudioTrackId < 0
  ) {
    fpAudioDebugLog(
      context,
      "nudge: skip register (missing deps or invalid id)"
    );
    return;
  }

  // Any switch away from an alternate rendition can involve buffer flush + delayed SWITCHED.
  const leavingAlternate =
    typeof previousAudioTrackId === "number" &&
    previousAudioTrackId >= 0 &&
    audioTrackIsAlternate(hlsInstance, previousAudioTrackId);
  const altToMain =
    leavingAlternate &&
    !audioTrackIsAlternate(hlsInstance, expectedAudioTrackId);
  const lightweightAudioSwitch = !altToMain;

  const runNudgeWave = (reason: string) => {
    fpAudioDebugLog(context, `nudge wave (${reason})`, {
      muted: vid.muted,
      paused: vid.paused,
    });
    if (vid.paused) {
      directResumePlaybackAfterAudioTrackChange(context, true);
      return;
    }
    nudgeVideoElementOnly(context);
  };

  const prevCleanup = context.__fpAudioTrackSwitchNudgeCleanup as
    | (() => void)
    | undefined;
  if (typeof prevCleanup === "function") {
    try {
      prevCleanup();
    } catch {
      /* ignore */
    }
  }

  context.__fpAudioSwitchUserHadPaused = vid.paused;
  if (context.__fpAudioSwitchHoldActive) {
    context.__fpAudioSwitchHoldActive = false;
    audioSwitchResumeIfWasPlaying(context, vid);
  }

  const switchUiSession = lightweightAudioSwitch
    ? -1
    : beginAudioTrackSwitchLoader(context);

  context.__fpAudioSwitchT0 = performance.now();
  context.__fpAudioSwitchSwitchingAt = undefined;
  context.__fpAudioSwitchMeta = {
    from: previousAudioTrackId,
    to: expectedAudioTrackId,
  };
  fpAudioDebugLog(context, "audio-switch timing (s)", {
    phase: "switch-requested",
    elapsedSec: 0,
    from: previousAudioTrackId,
    to: expectedAudioTrackId,
    lightweightAudioSwitch,
    altToMain,
  });

  let settled = false;
  let didSwitchingKick = false;
  let fallbackMidTimer: ReturnType<typeof setTimeout> | undefined;
  let fallbackFinalTimer: ReturnType<typeof setTimeout> | undefined;

  const onSwitching = (_: string, data: { id?: number; name?: string }) => {
    if (settled || didSwitchingKick) return;
    const evId = data?.id;
    const hlsAt = hlsInstance.audioTrack;
    if (evId != expectedAudioTrackId && hlsAt != expectedAudioTrackId) {
      return;
    }
    didSwitchingKick = true;
    context.__fpAudioSwitchSwitchingAt = performance.now();
    logAudioSwitchElapsedSec(context, "hls-AUDIO_TRACK_SWITCHING", {
      id: evId,
      name: data?.name,
    });
    if (lightweightAudioSwitch) {
      fpAudioDebugLog(
        context,
        "AUDIO_TRACK_SWITCHING: lightweight — no early startLoad (hls default)"
      );
      return;
    }
    fpAudioDebugLog(
      context,
      "AUDIO_TRACK_SWITCHING: early startLoad at playhead"
    );
    kickHlsLoadAtPlayhead(context);
  };

  const onAltToMainBufferFlushed = () => {
    try {
      hlsInstance.off(HlsApi().Events.BUFFER_FLUSHED, onAltToMainBufferFlushed);
    } catch {
      /* ignore */
    }
    if (settled) return;
    if (hlsInstance.audioTrack != expectedAudioTrackId) return;
    fpAudioDebugLog(context, "BUFFER_FLUSHED after alt→main, nudge");
    logAudioSwitchElapsedSec(context, "hls-BUFFER_FLUSHED (alt→main only)", {
      altToMain,
    });
    // Hold + loader only when rebuilding muxed-in-main audio after leaving a separate
    // audio rendition — not for alternate↔alternate (both tracks can look "alternate").
    if (altToMain && !vid.paused && !context.__fpAudioSwitchHoldActive) {
      context.__fpAudioSwitchHoldActive = true;
      context.__fpAudioSwitchHoldTime = vid.currentTime;
      fpAudioDebugLog(
        context,
        "hold: pause playhead while main audio buffer rebuilds (avoids silent skip)"
      );
      showLoader(context);
      vid.pause();
    }
    runNudgeWave("buffer-flushed");
    queueMicrotask(() => {
      kickHlsLoadAtPlayhead(context);
      directResumePlaybackAfterAudioTrackChange(context, true);
    });
  };

  const cleanup = () => {
    if (settled) return;
    settled = true;
    context.__fpAudioSwitchSwitchingAt = undefined;
    try {
      hlsInstance.off(HlsApi().Events.AUDIO_TRACK_SWITCHING, onSwitching);
    } catch {
      /* ignore */
    }
    try {
      hlsInstance.off(HlsApi().Events.AUDIO_TRACK_SWITCHED, onSwitched);
    } catch {
      /* ignore */
    }
    try {
      hlsInstance.off(HlsApi().Events.BUFFER_FLUSHED, onAltToMainBufferFlushed);
    } catch {
      /* ignore */
    }
    if (fallbackMidTimer !== undefined) {
      clearTimeout(fallbackMidTimer);
    }
    if (fallbackFinalTimer !== undefined) {
      clearTimeout(fallbackFinalTimer);
    }
    if (context.__fpAudioTrackSwitchNudgeCleanup === cleanupRef) {
      context.__fpAudioTrackSwitchNudgeCleanup = undefined;
    }
  };

  const cleanupRef = () => {
    cleanup();
  };

  const onSwitched = (_: string, data: { id?: number; name?: string }) => {
    const evId = data?.id;
    const hlsAt = hlsInstance.audioTrack;
    if (evId != expectedAudioTrackId && hlsAt != expectedAudioTrackId) {
      fpAudioDebugLog(context, "AUDIO_TRACK_SWITCHED ignored", {
        evId,
        hlsAt,
        expected: expectedAudioTrackId,
        name: data?.name,
      });
      return;
    }
    fpAudioDebugLog(context, "AUDIO_TRACK_SWITCHED matched", {
      evId,
      hlsAt,
      expected: expectedAudioTrackId,
      muted: vid.muted,
    });
    logAudioSwitchElapsedSec(context, "hls-AUDIO_TRACK_SWITCHED", {
      id: evId,
      name: data?.name,
    });
    const tSwitching = context.__fpAudioSwitchSwitchingAt as number | undefined;
    if (typeof tSwitching === "number") {
      const engineWindowSec =
        Math.round((performance.now() - tSwitching) / 10) / 100;
      fpAudioDebugLog(
        context,
        "audio-switch HLS window (SWITCHING→SWITCHED, mux-equivalent)",
        {
          engineWindowSec,
          id: evId,
          name: data?.name,
        }
      );
    }
    cleanup();
    rebuildAudioMenuUI(context);
    if (context.__fpAudioSwitchHoldActive) {
      context.__fpAudioSwitchHoldActive = false;
      const holdT = context.__fpAudioSwitchHoldTime;
      if (typeof holdT === "number" && Number.isFinite(holdT)) {
        try {
          vid.currentTime = holdT;
        } catch {
          /* ignore */
        }
      }
      fpAudioDebugLog(context, "hold: resume after audio track ready");
    }
    if (lightweightAudioSwitch) {
      fpAudioDebugLog(
        context,
        "AUDIO_TRACK_SWITCHED: lightweight path (no loader / no directResume)"
      );
      logAudioSwitchLoaderDisplayTime(
        context,
        null,
        0,
        "lightweight-no-loader"
      );
      logAudioSwitchElapsedSec(context, "switch-complete (lightweight total)", {
        note: "no blocking loader",
      });
      logAudioSwitchTotalDurationSummary(context, "lightweight");
      context.__fpAudioSwitchT0 = undefined;
      queueMicrotask(() => {
        audioSwitchResumeIfWasPlaying(context, vid);
        context.__fpAudioSwitchUserHadPaused = undefined;
      });
      return;
    }
    runNudgeWave("switched");
    queueMicrotask(() => {
      context.__fpAudioSwitchOutcomePath = "heavy";
      directResumePlaybackAfterAudioTrackChange(context, true);
      scheduleEndAudioTrackSwitchLoader(context, switchUiSession);
      audioSwitchResumeIfWasPlaying(context, vid);
      context.__fpAudioSwitchUserHadPaused = undefined;
    });
  };

  hlsInstance.on(HlsApi().Events.AUDIO_TRACK_SWITCHING, onSwitching);
  hlsInstance.on(HlsApi().Events.AUDIO_TRACK_SWITCHED, onSwitched);
  context.__fpAudioTrackSwitchNudgeCleanup = cleanupRef;

  fpAudioDebugLog(context, "listening for AUDIO_TRACK_SWITCHING / SWITCHED", {
    expected: expectedAudioTrackId,
    previous: previousAudioTrackId,
    altToMain,
    lightweightAudioSwitch,
    muted: vid.muted,
    paused: vid.paused,
  });

  if (altToMain) {
    hlsInstance.on(HlsApi().Events.BUFFER_FLUSHED, onAltToMainBufferFlushed);
  }

  if (!lightweightAudioSwitch) {
    // Mid fallback: nudge but keep listening — SWITCHED can arrive >1s after alt→main.
    fallbackMidTimer = setTimeout(() => {
      runAfterNextPaint(() => {
        if (settled) return;
        if (hlsInstance.audioTrack == expectedAudioTrackId) {
          fpAudioDebugLog(
            context,
            "nudge mid-fallback @650ms (still listening for SWITCHED)"
          );
          runNudgeWave("fallback-mid");
        }
      });
    }, 650);
  }

  fallbackFinalTimer = setTimeout(
    () => {
      runAfterNextPaint(() => {
        if (settled) return;
        const ok = hlsInstance.audioTrack == expectedAudioTrackId;
        fpAudioDebugLog(
          context,
          lightweightAudioSwitch
            ? "lightweight audio switch final cleanup @3s"
            : "nudge final-fallback @4s (stop listening)",
          { ok }
        );
        cleanup();
        rebuildAudioMenuUI(context);
        if (context.__fpAudioSwitchHoldActive) {
          context.__fpAudioSwitchHoldActive = false;
          const holdT = context.__fpAudioSwitchHoldTime;
          if (typeof holdT === "number" && Number.isFinite(holdT)) {
            try {
              vid.currentTime = holdT;
            } catch {
              /* ignore */
            }
          }
          fpAudioDebugLog(context, "hold: resume (final fallback)");
        }
        if (lightweightAudioSwitch) {
          logAudioSwitchLoaderDisplayTime(
            context,
            null,
            0,
            "lightweight-fallback-timer-no-loader"
          );
          logAudioSwitchElapsedSec(
            context,
            "fallback-3s (!SWITCHED) lightweight",
            { ok }
          );
          logAudioSwitchTotalDurationSummary(context, "lightweight-fallback");
          context.__fpAudioSwitchT0 = undefined;
          audioSwitchResumeIfWasPlaying(context, vid);
          context.__fpAudioSwitchUserHadPaused = undefined;
          return;
        }
        logAudioSwitchElapsedSec(
          context,
          "fallback-4s (!SWITCHED yet) heavy path → schedule loader hide",
          { ok }
        );
        if (ok) {
          runNudgeWave("fallback-final");
        }
        directResumePlaybackAfterAudioTrackChange(context, true);
        context.__fpAudioSwitchOutcomePath = "heavy-fallback";
        scheduleEndAudioTrackSwitchLoader(context, switchUiSession);
        audioSwitchResumeIfWasPlaying(context, vid);
        context.__fpAudioSwitchUserHadPaused = undefined;
      });
    },
    lightweightAudioSwitch ? 3000 : 4000
  );
}

function emitAudioChange(context: any) {
  try {
    const tracks =
      typeof context.getAudioTracks === "function"
        ? context.getAudioTracks()
        : [];
    const currentId =
      context.currentAudioTrackId !== undefined
        ? context.currentAudioTrackId
        : null;
    const currentTrack = Array.isArray(tracks)
      ? (tracks.find((t: any) => t?.isCurrent) ?? null)
      : null;

    context.dispatchEvent(
      new CustomEvent("fastpixaudiochange", {
        detail: { tracks, currentId, currentTrack },
      })
    );
  } catch {}
}

function createAudioButton(
  context: any,
  name: string,
  index: number,
  isActive: boolean
) {
  const button = documentObject.createElement("button");
  button.className = "audioSelectorButtons";
  const displayName =
    (name ?? "").toString().toLowerCase() === "default"
      ? "Default"
      : (name ?? "").toString();
  button.textContent = displayName;
  button.title = displayName;

  if (isActive) {
    button.classList.add("active");
  }

  button.addEventListener("click", (event) => {
    const resolvedIndex = index;
    fpAudioDebugLog(context, "audio UI: switch request", {
      to: resolvedIndex,
      from: context.hls?.audioTrack,
      muted: context.video?.muted,
      paused: context.video?.paused,
    });
    const previousAudioTrackId =
      typeof context.hls?.audioTrack === "number" ? context.hls.audioTrack : -1;
    nudgePlaybackAfterAudioTrackSwitch(
      context,
      context.hls,
      resolvedIndex,
      previousAudioTrackId
    );
    context.hls.audioTrack = resolvedIndex;
    if (
      !shouldUseLightweightAudioTrackSwitchPath(
        context.hls,
        previousAudioTrackId,
        resolvedIndex
      )
    ) {
      directResumePlaybackAfterAudioTrackChange(context, true);
    }
    setTimeout(() => {
      runAfterNextPaint(() => {
        try {
          if (context.hls?.audioTrack !== resolvedIndex) {
            fpAudioDebugLog(context, "audio UI: re-apply track index");
            context.hls.audioTrack = resolvedIndex;
          }
        } catch {
          /* ignore */
        }
      });
    }, 0);
    setActiveButton(button, context.audioMenu.children);
    toggleAudioMenu(context);
    // Emit so external UIs always receive the current track snapshot
    emitAudioChange(context);
    event.stopPropagation();
  });

  return button;
}

function setupSubtitleButton(context: any, subtitleTracks: any) {
  context.ccButton.style.display =
    subtitleTracks.length > 0
      ? context.ccButton.classList.add("ccButtonLength")
      : context.ccButton.classList.remove("ccButtonLength");
}

function setupResolutionMenuButton(context: any) {
  // Remove any previous click listeners to avoid duplicates
  const newButton = context.resolutionMenuButton;
  const oldButton = newButton.cloneNode(true);
  newButton.parentNode.replaceChild(oldButton, newButton);
  context.resolutionMenuButton = oldButton;

  context.resolutionMenuButton.addEventListener("click", () => {
    // True toggle: if resolution menu is open, close and return
    const isOpen =
      context.resolutionMenu && context.resolutionMenu.style.display !== "none";
    if (isOpen) {
      context.resolutionMenu.style.display = "none";
      return;
    }
    // Otherwise, close other menus then open resolution
    hideMenus(context);
    toggleResolutionMenu(context);
  });
}

function handleBufferFlushed(context: any) {
  // Only for resolution / quality changes. Audio (and other) track switches also flush
  // buffers; running seek+play here races with our audio-switch logic and logs AbortError.
  if (!context.resolutionSwitching) return;
  if (!context.initialPlayClick) return;
  if (context.isBufferFlushed) {
    context.resolutionSwitching = false;
    return;
  }
  // Optional: force seeking to prevent desync
  const currentTime = context.video.currentTime;
  context.video.currentTime = currentTime + 0.001; // Small offset for accuracy

  if (!context.wasPausedBeforeSwitch) {
    context.video
      .play()
      .then(() => {
        context.isBufferFlushed = true;
        hideLoader(context);
        context.resolutionSwitching = false;
      })
      .catch((error: any) => {
        const name = error?.name ?? "";
        if (name !== "AbortError") {
          console.error("Playback error:", error);
        }
        hideLoader(context);
        context.isBufferFlushed = true;
        context.resolutionSwitching = false;
      });
  } else {
    hideLoader(context);
    context.resolutionSwitching = false;
  }
}

function setActiveButton(activeButton: any, buttons: any) {
  Array.from(buttons).forEach((button: any) =>
    button.classList.remove("active")
  );
  activeButton.classList.add("active");
}

/** Creates `context.hls`, wires core listeners; safe to call multiple times. */
export async function ensureHlsRuntime(context: any): Promise<void> {
  await loadHlsFromCdn();
  if (context.hls) return;
  const H = getHlsConstructor();
  context.config = {
    ...context.config,
    startFragPrefetch: startFragPrefetchForStreamType(context.streamType),
  };
  context.hls = new H(context.config);
  hlsListeners(context);
  handleHlsQualityAndTrackSetup(context);
}

export {
  hlsInstance,
  initializeHLS,
  hlsListeners,
  handleHlsQualityAndTrackSetup,
  configHls,
  getFormattedAudioTracks,
  getFormattedSubtitleTracks,
  nudgePlaybackAfterAudioTrackSwitch,
  nudgeVideoElementOnly,
  directResumePlaybackAfterAudioTrackChange,
  shouldUseLightweightAudioTrackSwitchPath,
  teardownHlsWindowNetworkListeners,
  rebuildAudioMenuUI,
  getHlsConstructor,
  loadHlsFromCdn,
};

export type { TrackInfo };
