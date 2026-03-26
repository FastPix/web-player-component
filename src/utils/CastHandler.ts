import {
  ChromecastActiveIcon,
  ChromecastIcon,
} from "../icons/ChromecastIcon/index";
import { PauseIcon, PlayIcon } from "../icons/PlayPauseIcon/index";
import {
  hideInitControls,
  hideLoader,
  hideMenus,
  showLoader,
} from "./DomVisibilityManager";
import { formatVideoDuration, isIOS } from "./index";
import { getRemotePlaybackInstance } from "./ToggleController";

const CAST_LOG_PREFIX = "[Cast]";
const CAST_DIAGNOSE = false; // Set to true for low-level debugging

// Global flag controlled by the player `debug` attribute.
let castDebugEnabled = false;

function setCastDebugFromContext(playerContext: any): void {
  castDebugEnabled = !!playerContext?.debugAttribute;
}

function castLog(message: string, data?: unknown): void {
  if (!castDebugEnabled) return;
  if (data !== undefined) {
    // eslint-disable-next-line no-console
    console.log(CAST_LOG_PREFIX, message, data);
  } else {
    // eslint-disable-next-line no-console
    console.log(CAST_LOG_PREFIX, message);
  }
}

function castStep(step: number, message: string, data?: unknown): void {
  if (!castDebugEnabled) return;
  const label = `--- STEP ${step} ---`;
  if (CAST_DIAGNOSE) {
    if (data !== undefined) {
      // eslint-disable-next-line no-console
      console.log(CAST_LOG_PREFIX, label, message, data);
    } else {
      // eslint-disable-next-line no-console
      console.log(CAST_LOG_PREFIX, label, message);
    }
  } else {
    castLog(message, data);
  }
}

function castError(...args: any[]): void {
  if (!castDebugEnabled) return;
  // eslint-disable-next-line no-console
  console.error(...args);
}

function castWarn(...args: any[]): void {
  if (!castDebugEnabled) return;
  // eslint-disable-next-line no-console
  console.warn(...args);
}

// For APIs that expect an error callback function
function castErrorFn(...args: any[]): void {
  if (!castDebugEnabled) return;
  // eslint-disable-next-line no-console
  console.error(...args);
}

export interface CastDrmConfig {
  widevineLicenseUrl?: string;
  playReadyLicenseUrl?: string;
  licenseRequestHeaders?: Record<string, string>;
  licenseRequestData?: string;
}

/**
 * The shape of customData we send to the CAF receiver for DRM.
 * The custom receiver reads this in its setMediaPlaybackInfoHandler.
 *
 * IMPORTANT: chrome.cast.media.ContentProtection does NOT exist on the sender
 * SDK — DRM must be forwarded as plain JSON via mediaInfo.customData and
 * handled entirely on the receiver side via PlaybackConfig.
 */
export interface CastCustomData {
  drm?: {
    widevine?: {
      licenseUrl: string;
      headers?: Record<string, string>;
      licenseRequestData?: string;
    };
    playready?: {
      licenseUrl: string;
      headers?: Record<string, string>;
    };
  };
}

let castScriptAdded = false;

function loadCastAPI(): void {
  if ((window as any)?.cast?.framework) return;
  if ((window as any).__fastpixCastLoading) return;
  if (castScriptAdded) return;
  if (
    document.querySelector(
      'script[src*="cast_sender.js"][data-fastpix-cast="true"]'
    )
  ) {
    return;
  }

  const script = document.createElement("script");
  script.src =
    "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1";
  script.async = true;
  script.defer = true as any;
  (script as any).dataset.fastpixCast = "true";
  (window as any).__fastpixCastLoading = true;
  castScriptAdded = true;
  script.onload = () => {
    (window as any).__fastpixCastLoading = false;
    castLog("Cast sender script loaded");
  };
  script.onerror = () => {
    (window as any).__fastpixCastLoading = false;
    castError(CAST_LOG_PREFIX, "Cast sender script failed to load");
  };
  document.head.appendChild(script);
  castLog("Loading Cast sender script...");
}

let hasDispatchedEndedEvent = false;

/** One media poll for the whole page — avoids N `setInterval`s when several players init Cast (e.g. Shorts). */
let castMediaSyncPollId: ReturnType<typeof setInterval> | null = null;

type CastMediaSyncActive = {
  video: HTMLVideoElement;
  playerContext: any;
};

let castMediaSyncActive: CastMediaSyncActive | null = null;

function clearCastMediaSyncPoll(): void {
  if (castMediaSyncPollId !== null) {
    clearInterval(castMediaSyncPollId);
    castMediaSyncPollId = null;
  }
  castMediaSyncActive = null;
}

function setupChromecast(
  button: HTMLButtonElement,
  video: HTMLVideoElement,
  streamUrl: string,
  playerContext: any
): void {
  setCastDebugFromContext(playerContext);
  if (isIOS(playerContext)) return;
  (window as any).__onGCastApiAvailable = () => {
    initializeCastIfAvailable(button, video, streamUrl, playerContext);
  };
}

function checkChromecastAvailability(): boolean {
  return (
    !!(window as any).chrome?.cast && !!(window as any).chrome.cast.isAvailable
  );
}

const isChromecastAvailable = () => {
  const castContext = (
    window as any
  )?.cast?.framework?.CastContext?.getInstance?.();
  if (!castContext) return false;
  const state = castContext.getCastState?.();
  return state === "AVAILABLE" || state === "CONNECTED";
};

function initializeCastIfAvailable(
  button: HTMLButtonElement,
  video: HTMLVideoElement,
  streamUrl: string,
  playerContext: any
): void {
  if (isIOS(playerContext)) {
    castLog("Cast init skipped (iOS)");
    return;
  }
  if (checkChromecastAvailability()) {
    castLog("Cast API available, initializing");
    initializeCastApi(button, video, streamUrl, playerContext);
  } else {
    handleChromecastError();
  }
}

function handleChromecastError(): void {
  castError("Google Cast API did NOT load.");
}

function isChromecastConnected(): boolean {
  const castContext = getCastContext();
  return !!castContext?.getCurrentSession();
}

function freezeVideoWhileUpdatingProgress(
  video: HTMLVideoElement,
  playerContext: any
) {
  if (playerContext.__fpCastFreezeProgressInterval != null) {
    clearInterval(playerContext.__fpCastFreezeProgressInterval);
    playerContext.__fpCastFreezeProgressInterval = null;
  }
  function updateTime() {
    if (!isChromecastConnected()) return;
    const session = (
      window as any
    ).cast.framework.CastContext.getInstance().getCurrentSession();
    if (session) {
      const media = session.getMediaSession();
      if (media) {
        const castTime = media.getEstimatedTime();
        playerContext.progressBar.value = (castTime / video.duration) * 100;
        playerContext.textContent = formatVideoDuration(castTime);
      }
    }
  }
  playerContext.__fpCastFreezeProgressInterval = window.setInterval(() => {
    // Yield out of the interval turn so Chrome does not attribute heavy work to setInterval.
    requestAnimationFrame(updateTime);
  }, 1000);
}

function syncSeekWithChromecast(playerContext: any) {
  const castContext = getCastContext();
  const session = castContext.getCurrentSession();
  if (session) {
    const media = session.getMediaSession();
    if (media) {
      const seekTime = playerContext.video.currentTime;
      media.seek(
        new (window as any).chrome.cast.media.SeekRequest(seekTime),
        () => {},
        (error: any) => castError("Chromecast: Seek failed", error)
      );
    }
  }
}

function seekChromecastProgressbar(time: number): void {
  const session = (
    window as any
  ).cast.framework.CastContext.getInstance().getCurrentSession();
  if (!session) return;
  const media = session.getMediaSession();
  if (media) {
    const seekRequest = new (window as any).chrome.cast.media.SeekRequest();
    seekRequest.currentTime = time;
    media.seek(
      seekRequest,
      () => {},
      (error: any) => castError("[Cast] Seek failed", error)
    );
  }
}

function syncPlaybackWithChromecast(
  video: HTMLVideoElement,
  playerContext: any
) {
  const castContext = getCastContext();
  const SessionState = (window as any).cast.framework.SessionState;

  castContext.addEventListener(
    (window as any).cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
    (event: any) => {
      const session = castContext.getCurrentSession();
      const w = window as any;
      const intendedSenderPc = w.__fastpixCastingPlayerContext;

      castLog("SESSION_STATE_CHANGED", {
        sessionState: event.sessionState,
        hasSession: !!session,
        hasMediaSession: !!session?.getMediaSession?.(),
      });
      switch (event.sessionState) {
        case SessionState.SESSION_STARTED:
        case SessionState.SESSION_RESUMED: {
          playerContext.currentCastSession = session;

          if (intendedSenderPc != null && intendedSenderPc !== playerContext) {
            video.pause();
            break;
          }

          if (castMediaSyncPollId !== null) {
            video.pause();
            break;
          }

          const { isMuted, mediaVolume } = getStoredVolume(playerContext);
          const safeVolume = Math.min(Math.max(mediaVolume, 0), 1);

          localStorage.setItem("chromecastFinished", "false");
          lastPlaybackTime = video.currentTime;
          localStorage.setItem("chromecastActive", "true");
          freezeVideoWhileUpdatingProgress(video, playerContext);
          syncVolumeWithChromecast(safeVolume, isMuted);
          video.pause();

          castMediaSyncActive = { video, playerContext };
          let lastLoggedState: string | null = null;

          castMediaSyncPollId = window.setInterval(() => {
            requestAnimationFrame(() => {
              const active = castMediaSyncActive;
              if (!active) return;
              const sessNow = getCastContext()?.getCurrentSession?.();
              const media = sessNow?.getMediaSession?.();
              if (!media) return;

              const pc = active.playerContext;
              const vid = active.video;
              const rp = getRemotePlaybackInstance(pc).remotePlayer;

              const state = media.playerState;
              if (state !== lastLoggedState) {
                castLog("Media state", {
                  playerState: state,
                  estimatedTime: media.getEstimatedTime?.(),
                });
                lastLoggedState = state;
              }
              lastPlaybackTime = media.getEstimatedTime();

              if (media.playerState === "BUFFERING") {
                showLoader(pc);
              } else {
                hideLoader(pc);
              }

              pc.pausedOnCasting = media.playerState === "PAUSED";

              const loopEnabled = pc.loopEnabled ?? rp?.isLoopingEnabled;

              if (
                rp?.duration &&
                Math.floor(lastPlaybackTime) >= Math.floor(rp.duration) &&
                !loopEnabled &&
                !hasDispatchedEndedEvent
              ) {
                const endedEvent = new Event("ended");
                vid.dispatchEvent(endedEvent);
                hasDispatchedEndedEvent = true;
                hideInitControls(pc);
                showLoader(pc);
                localStorage.setItem("chromecastFinished", "true");
                localStorage.setItem("chromecastActive", "false");
                showLoader(pc);
              }

              if (
                rp?.duration &&
                Math.floor(lastPlaybackTime) < Math.floor(rp.duration) &&
                hasDispatchedEndedEvent
              ) {
                hasDispatchedEndedEvent = false;
              }

              vid.dispatchEvent(new Event("timeupdate"));
            });
          }, 1000);
          break;
        }

        case SessionState.SESSION_ENDED: {
          const media = session?.getMediaSession();
          castLog("SESSION_ENDED", {
            finalTime: media?.getEstimatedTime?.() ?? lastPlaybackTime,
          });

          if (localStorage.getItem("chromecastActive") === "true") {
            localStorage.setItem("chromecastActive", "false");
          }

          lastPlaybackTime = media?.getEstimatedTime() ?? lastPlaybackTime;
          playerContext.currentCastSession = null;

          const senderPc = w.__fastpixCastingPlayerContext;
          const senderVid = w.__fastpixCastingVideo as
            | HTMLVideoElement
            | undefined;

          const isSenderStop = senderPc == null || senderPc === playerContext;

          if (isSenderStop) {
            if (senderPc?.__fpCastFreezeProgressInterval != null) {
              clearInterval(senderPc.__fpCastFreezeProgressInterval);
              senderPc.__fpCastFreezeProgressInterval = null;
            }
            clearCastMediaSyncPoll();
            const v = senderVid ?? video;
            v.currentTime = lastPlaybackTime;
            localStorage.setItem("media-volume", v.volume.toString());
            w.__fastpixCastingPlayerContext = null;
            w.__fastpixCastingVideo = null;
          }

          if (playerContext.pausedOnCasting) {
            video.pause();
          } else {
            video.play();
          }
          break;
        }
      }
    }
  );
}

function disconnectIfCastFinished() {
  const castContext = getCastContext();
  const session = castContext.getCurrentSession();
  const chromecastFinished =
    localStorage.getItem("chromecastFinished") === "true";
  const chromecastActive = localStorage.getItem("chromecastActive") === "true";
  if (chromecastActive && chromecastFinished && session) {
    session.endSession(true);
    localStorage.setItem("chromecastActive", "false");
    localStorage.setItem("chromecastFinished", "false");
  }
}

function getStoredVolume(playerContext: any) {
  const storedVolume = localStorage.getItem("media-volume");
  const mediaVolume = storedVolume !== null ? parseFloat(storedVolume) : 1;
  const isMuted = mediaVolume === 0;
  playerContext.isMuted = isMuted;
  return { isMuted, mediaVolume };
}

function syncVolumeWithChromecast(volume: number, isMuted: boolean) {
  if (!isChromecastConnected()) return;

  const chromeCast = (window as any).chrome.cast;
  const session = (
    window as any
  ).cast.framework.CastContext.getInstance().getCurrentSession();

  const maxRetries = 10;
  let attempts = 0;

  const trySetVolume = () => {
    if (!session) return;
    const media = session.getMediaSession();
    if (media !== null) {
      const volumeRequest = new chromeCast.media.VolumeRequest(
        new chromeCast.Volume()
      );
      volumeRequest.volume.level = volume;
      volumeRequest.volume.muted = isMuted;
      media.setVolume(
        volumeRequest,
        () => {},
        (error: any) => castError("❌ Chromecast: Volume update failed", error)
      );
    } else if (attempts < maxRetries) {
      attempts++;
      setTimeout(trySetVolume, 300);
    }
  };

  trySetVolume();
}

function isChromecastActive() {
  return localStorage.getItem("chromecastActive");
}

function onVolumeChangeDuringCasting(volume: number): void {
  const session = (
    window as any
  ).cast.framework.CastContext.getInstance().getCurrentSession();
  if (session) {
    session
      .setVolume(volume)
      .then(() => {})
      .catch((error: any) => castError("Volume change error:", error));
  }
}

function initializeCastApi(
  button: HTMLButtonElement,
  video: HTMLVideoElement,
  streamUrl: string,
  playerContext: any
): void {
  const castContext = getCastContext();
  const chromeCast = (window as any).chrome?.cast;

  if (!castContext || !chromeCast) {
    castError("Chromecast API is not available.");
    return;
  }

  syncPlaybackWithChromecast(video, playerContext);

  // ─── RECEIVER APP ID ──────────────────────────────────────────────────────
  // Use your registered custom CAF receiver app ID when casting DRM content.
  // The Default Media Receiver (CC1AD845) cannot handle DRM via customData.
  // Register your custom receiver at: https://cast.google.com/publish
  // and host the receiver HTML from cast-receiver.html in this repo.
  const receiverAppId = playerContext.castReceiverAppId ?? "CC1AD845";

  castContext.setOptions({
    receiverApplicationId: receiverAppId,
    autoJoinPolicy: chromeCast.AutoJoinPolicy.ORIGIN_SCOPED,
    androidReceiverCompatible: true,
    language: "en-US",
    resumeSavedSession: true,
  });

  castStep(1, "Receiver", { receiverAppId });

  castContext.addEventListener(
    (window as any).cast.framework.CastContextEventType.CAST_STATE_CHANGED,
    (event: any) => updateCastButton(button, event.castState, playerContext)
  );

  updateCastButton(button, castContext.getCastState(), playerContext);

  button.addEventListener("click", () =>
    toggleCasting(castContext, button, video, streamUrl, playerContext)
  );
}

function updateCastButton(
  button: HTMLButtonElement,
  castState: string,
  playerContext: any
): void {
  const castFramework = (window as any).cast?.framework;
  const noDevices = castFramework?.CastState?.NO_DEVICES_AVAILABLE;
  const notSupported = castFramework?.CastState?.NOT_SUPPORTED;
  const showButton =
    castState !== noDevices &&
    castState !== notSupported &&
    (castState === castFramework?.CastState?.CONNECTED ||
      castState === castFramework?.CastState?.NOT_CONNECTED ||
      castState === castFramework?.CastState?.CONNECTING);
  playerContext?.castButton?.style?.setProperty(
    "--cast-button-display",
    showButton ? "flex" : "none"
  );
  button.innerHTML =
    castState === castFramework?.CastState?.CONNECTED
      ? ChromecastActiveIcon
      : ChromecastIcon;
}

function getCastContext() {
  return (window as any).cast?.framework?.CastContext?.getInstance();
}

function toggleCasting(
  context: any,
  button: HTMLButtonElement,
  video: HTMLVideoElement,
  streamUrl: string,
  playerContext: any
): void {
  const castContext = getCastContext();
  const session = castContext.getCurrentSession();
  castLog("toggleCasting", {
    hasSession: !!session,
    streamUrl: streamUrl || "(empty)",
    videoSrc: video.currentSrc || video.src,
  });
  hideMenus(playerContext);
  if (session) {
    castLog("Session exists, opening session menu");
    castContext
      .requestSession()
      .catch((error: Error) =>
        castError(CAST_LOG_PREFIX, "Error opening session menu", error)
      );
  } else {
    castLog("No session, requesting session then sending media");
    (window as any).__fastpixCastingPlayerContext = playerContext;
    (window as any).__fastpixCastingVideo = video;
    castContext
      .requestSession()
      .then(() =>
        sendMediaToChromecast(context, video, streamUrl, button, playerContext)
      )
      .catch((error: Error) => {
        const msg = String(error?.message || error).toLowerCase();
        if (msg === "cancel" || msg.includes("cancel"))
          castLog("Cast cancelled (no device selected)");
        else
          castError(CAST_LOG_PREFIX, "Unable to start casting session", error);
      });
  }
}

function controlCastMedia(action: "play" | "pause", playerContext: any) {
  const session = (
    window as any
  ).cast.framework.CastContext.getInstance().getCurrentSession();
  if (!session) return;
  const media = session.getMediaSession();
  if (!media) return;

  if (action === "play") {
    media.play(null, () => {}, castErrorFn);
    playerContext.playPauseButton.innerHTML = PauseIcon;
  } else {
    media.pause(null, () => {}, castErrorFn);
    playerContext.playPauseButton.innerHTML = PlayIcon;
  }
}

let lastPlaybackTime: number = 0;

function seekInChromecast(offset: number) {
  const castContext = getCastContext();
  const session = castContext.getCurrentSession();
  if (session) {
    const media = session.getMediaSession();
    if (media) {
      const currentTime = media.getEstimatedTime();
      const seekTime = Math.max(0, currentTime + offset);
      const seekRequest = new (window as any).chrome.cast.media.SeekRequest();
      seekRequest.currentTime = seekTime;
      media.seek(
        seekRequest,
        () => {},
        (error: any) => castError("Chromecast: Seek failed", error)
      );
    }
  }
}

function fastForwardButtonClickHandler() {
  seekInChromecast(10);
}

function rewindButtonClickHandler() {
  seekInChromecast(-10);
}

// ─── AUTO-EXTRACT DRM CONFIG FROM HLS.JS ──────────────────────────────────────
function extractDrmConfigFromHls(hls: any): CastDrmConfig | null {
  try {
    const drmSystems = hls?.config?.drmSystems;
    if (!drmSystems) return null;

    const widevine = drmSystems["com.widevine.alpha"];
    const playready = drmSystems["com.microsoft.playready"];

    if (!widevine && !playready) return null;

    const config: CastDrmConfig = {};

    if (widevine?.licenseUrl) {
      config.widevineLicenseUrl = widevine.licenseUrl;
      castLog("DRM: Auto-extracted Widevine license URL from hls.js", {
        url: widevine.licenseUrl.substring(0, 80),
      });
    }

    if (playready?.licenseUrl) {
      config.playReadyLicenseUrl = playready.licenseUrl;
      castLog("DRM: Auto-extracted PlayReady license URL from hls.js");
    }

    return config;
  } catch (err) {
    castWarn(CAST_LOG_PREFIX, "Failed to extract DRM config from hls.js", err);
    return null;
  }
}

/**
 * Builds the customData payload that the custom CAF receiver will consume
 * to configure PlaybackConfig with the correct licenseUrl + protectionSystem.
 *
 * NOTE: The Cast Sender SDK has NO `chrome.cast.media.ContentProtection`
 * constructor — that class lives only on the receiver (cast.framework.ContentProtection).
 * The correct sender-side pattern is to pass DRM info as plain JSON in
 * mediaInfo.customData and let the receiver apply it to PlaybackConfig.
 */
function buildCastCustomData(drmConfig: CastDrmConfig): CastCustomData {
  const customData: CastCustomData = {};

  if (drmConfig.widevineLicenseUrl || drmConfig.playReadyLicenseUrl) {
    customData.drm = {};

    if (drmConfig.widevineLicenseUrl) {
      customData.drm.widevine = {
        licenseUrl: drmConfig.widevineLicenseUrl,
      };
      if (drmConfig.licenseRequestHeaders) {
        customData.drm.widevine.headers = drmConfig.licenseRequestHeaders;
      }
      if (drmConfig.licenseRequestData) {
        customData.drm.widevine.licenseRequestData =
          drmConfig.licenseRequestData;
      }
      castLog("DRM: Widevine config added to customData", {
        licenseUrl: drmConfig.widevineLicenseUrl.substring(0, 80),
        hasHeaders: !!drmConfig.licenseRequestHeaders,
      });
    }

    if (drmConfig.playReadyLicenseUrl) {
      customData.drm.playready = {
        licenseUrl: drmConfig.playReadyLicenseUrl,
      };
      if (drmConfig.licenseRequestHeaders) {
        customData.drm.playready.headers = drmConfig.licenseRequestHeaders;
      }
      castLog("DRM: PlayReady config added to customData");
    }
  }

  return customData;
}

function sendMediaToChromecast(
  context: any,
  video: HTMLVideoElement,
  streamUrl: string,
  button: HTMLButtonElement,
  playerContext: any
): void {
  const session = context.getCurrentSession();
  if (!session) {
    castError(CAST_LOG_PREFIX, "No session available.");
    return;
  }

  const hlsUrl =
    playerContext.hls && typeof (playerContext.hls as any).url === "string"
      ? (playerContext.hls as any).url
      : "";
  const initialUrl = (
    hlsUrl && hlsUrl.trim() !== ""
      ? hlsUrl
      : streamUrl && String(streamUrl).trim() !== ""
        ? streamUrl
        : video.currentSrc || video.src
  ) as string;

  if (!initialUrl || initialUrl.trim() === "") {
    castError(
      CAST_LOG_PREFIX,
      "No stream URL. Ensure the video has loaded and try casting again."
    );
    return;
  }

  lastPlaybackTime = video.currentTime;
  (window as any).__fastpixCastingPlayerContext = playerContext;
  (window as any).__fastpixCastingVideo = video;
  const autoplay = true;
  const url = initialUrl;

  (function sendWithUrl() {
    castStep(2, "URL sent to Chromecast", {
      url: url.substring(0, 90) + (url.length > 90 ? "..." : ""),
      isMaster: url.toLowerCase().includes(".m3u8"),
    });

    castLog("sendMediaToChromecast", {
      url: url.substring(0, 80) + (url.length > 80 ? "..." : ""),
      currentTime: lastPlaybackTime,
      autoplay,
    });

    if (/^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0)/i.test(url)) {
      castWarn(
        CAST_LOG_PREFIX,
        "Stream URL is localhost — Chromecast cannot reach it."
      );
    }

    const chromeCast = (window as any).chrome.cast;

    const mediaInfo = new chromeCast.media.MediaInfo(
      url,
      "application/vnd.apple.mpegurl"
    );

    mediaInfo.streamType = chromeCast.media.StreamType.BUFFERED;
    mediaInfo.metadata = new chromeCast.media.GenericMediaMetadata();
    mediaInfo.hlsSegmentFormat = chromeCast.media.HlsSegmentFormat.FMP4;
    mediaInfo.hlsVideoSegmentFormat =
      chromeCast.media.HlsVideoSegmentFormat.FMP4;

    // ─── DRM VIA customData (SENDER-SIDE) ────────────────────────────────────
    //
    // The Cast Sender SDK does NOT have chrome.cast.media.ContentProtection.
    // That constructor exists only on the Web Receiver (cast.framework.ContentProtection).
    //
    // The correct approach:
    //   SENDER  → puts DRM info as plain JSON into mediaInfo.customData
    //   RECEIVER → reads customData in setMediaPlaybackInfoHandler and applies
    //              it to PlaybackConfig (licenseUrl, protectionSystem, headers)
    //
    // Priority:
    //   1. Explicit playerContext.drmConfig
    //   2. Auto-extract from hls.js config
    //   3. No DRM
    let drmConfig: CastDrmConfig | undefined = playerContext.drmConfig;

    if (!drmConfig && playerContext.hls) {
      castLog(
        "DRM: No explicit drmConfig — attempting auto-extract from hls.js"
      );
      drmConfig = extractDrmConfigFromHls(playerContext.hls) ?? undefined;
    }

    if (
      drmConfig &&
      (drmConfig.widevineLicenseUrl || drmConfig.playReadyLicenseUrl)
    ) {
      castLog(
        "DRM: Encrypted stream detected — passing DRM config in customData"
      );
      const customData = buildCastCustomData(drmConfig);
      mediaInfo.customData = customData;
      castLog("DRM: customData attached to mediaInfo", {
        hasWidevine: !!customData.drm?.widevine,
        hasPlayReady: !!customData.drm?.playready,
      });
    } else {
      castLog(
        "DRM: No drmConfig found — casting as clear (unencrypted) stream"
      );
    }
    // ────────────────────────────────────────────────────────────────────────

    const textTracks = Array.from(video.textTracks);
    const trackElements = Array.from(video.querySelectorAll("track"));
    const tracks: any[] = [];

    if (trackElements.length > 0) {
      for (let i = 0; i < trackElements.length; i++) {
        const trackEl = trackElements[i];
        const castTrack = new chromeCast.media.Track(
          i + 1,
          chromeCast.media.TrackType.TEXT
        );
        castTrack.trackContentId = trackEl.src || "";
        castTrack.trackContentType = "text/vtt";
        castTrack.name = trackEl.label || `Subtitle ${i + 1}`;
        castTrack.language = trackEl.srclang || "en";
        castTrack.subtype = chromeCast.media.TextTrackType.SUBTITLES;
        tracks.push(castTrack);
      }
    } else if (textTracks.length > 0) {
      for (let i = 0; i < textTracks.length; i++) {
        const textTrack = textTracks[i];
        const castTrack = new chromeCast.media.Track(
          i + 1,
          chromeCast.media.TrackType.TEXT
        );
        castTrack.trackContentId = "";
        castTrack.trackContentType = "text/vtt";
        castTrack.name = textTrack.label || `Subtitle ${i + 1}`;
        castTrack.language = textTrack.language || "en";
        castTrack.subtype = chromeCast.media.TextTrackType.SUBTITLES;
        tracks.push(castTrack);
      }
    }

    if (tracks.length > 0) {
      mediaInfo.tracks = tracks;
      playerContext.currentCastSession = session;
    }

    const request = new chromeCast.media.LoadRequest(mediaInfo);
    request.currentTime = 0;
    request.autoplay = autoplay;

    castLog("LoadRequest", {
      currentTime: request.currentTime,
      autoplay: request.autoplay,
      requestedSeekAfterLoad: lastPlaybackTime,
      hasDrm: !!(
        drmConfig?.widevineLicenseUrl || drmConfig?.playReadyLicenseUrl
      ),
    });

    castStep(3, "Sending loadMedia request", {
      currentTime: 0,
      autoplay: true,
    });

    session
      .loadMedia(request)
      .then(() => {
        castStep(
          3,
          "loadMedia accepted by receiver (waiting for media session)",
          null
        );
        castLog("loadMedia success");
        button.innerHTML = ChromecastActiveIcon;

        video.pause();
        freezeVideoWhileUpdatingProgress(video, playerContext);

        const logMediaStatus = (media: any, label: string) => {
          if (!media) return;
          const status: Record<string, unknown> = {
            playerState: media.playerState,
            estimatedTime: media.getEstimatedTime?.(),
          };
          if (media.idleReason != null) {
            status.idleReason = media.idleReason;
            status._hint =
              "idleReason set = receiver had a problem (LOAD_FAILED / CORS / DRM license failure)";
          }
          castLog(label, status);
        };

        // FIX: Stop diagnostic polling once media session appears and is PLAYING
        let diagnosticTicks = 0;
        let foundPlaying = false;
        const diagnosticInterval = window.setInterval(() => {
          requestAnimationFrame(() => {
            const media = session.getMediaSession();
            if (media) {
              logMediaStatus(media, `TV status #${++diagnosticTicks}`);

              if (media.playerState === "PLAYING") {
                foundPlaying = true;
                window.clearInterval(diagnosticInterval);
                castLog("✅ Stream is PLAYING on Chromecast!");
              }

              if (
                typeof media.addUpdateListener === "function" &&
                diagnosticTicks === 1
              ) {
                media.addUpdateListener((isAlive: boolean) => {
                  castLog("TV media update", {
                    isAlive,
                    playerState: media.playerState,
                    idleReason: media.idleReason,
                  });
                });
              }
            } else {
              castLog(`TV status #${++diagnosticTicks}`, {
                mediaSession: "not ready yet",
              });
            }
            if (diagnosticTicks >= 10) window.clearInterval(diagnosticInterval);
          });
        }, 2000);

        const tryPlay = (attempt: number) => {
          const media = session.getMediaSession();
          if (media) {
            logMediaStatus(media, "tryPlay");
            if (media.playerState === "PLAYING") {
              castLog("Already PLAYING");
              if (lastPlaybackTime > 0)
                setTimeout(
                  () => seekChromecastProgressbar(lastPlaybackTime),
                  300
                );
              return;
            }
            castLog("Calling media.play()", { attempt });
            media.play(
              null,
              () => {
                castLog("media.play() success");
                if (lastPlaybackTime > 0)
                  setTimeout(
                    () => seekChromecastProgressbar(lastPlaybackTime),
                    300
                  );
              },
              (err: unknown) =>
                castWarn(CAST_LOG_PREFIX, "media.play() error", err)
            );
          } else if (attempt < 6) {
            setTimeout(() => tryPlay(attempt + 1), 600);
          } else {
            castLog(
              "Media session not available after retries — TV may be stuck or stream unreachable"
            );
          }
        };
        tryPlay(0);

        const { mediaVolume, isMuted } = getStoredVolume(playerContext);
        syncVolumeWithChromecast(mediaVolume, isMuted);

        const remotePlayer = new (window as any).cast.framework.RemotePlayer();
        const remotePlayerController = new (
          window as any
        ).cast.framework.RemotePlayerController(remotePlayer);
        if (remotePlayer.volumeLevel !== mediaVolume) {
          remotePlayer.volumeLevel = mediaVolume;
          remotePlayerController.setVolumeLevel();
        }
      })
      .catch((err: Error) => {
        castStep(3, "loadMedia FAILED", {
          error: String(err?.message || err),
        });
        castError(CAST_LOG_PREFIX, "Load media error", err);
      });
  })();
}

function lastPlaybackTimeCasting() {
  return lastPlaybackTime;
}

function getCurrentTime(context: any) {
  let currentTime: number;
  if (isChromecastConnected()) {
    currentTime = lastPlaybackTimeCasting();
  } else {
    currentTime = context.video.currentTime;
  }
  return currentTime;
}

export {
  loadCastAPI,
  setupChromecast,
  syncSeekWithChromecast,
  fastForwardButtonClickHandler,
  rewindButtonClickHandler,
  seekInChromecast,
  isChromecastConnected,
  lastPlaybackTimeCasting,
  getCurrentTime,
  controlCastMedia,
  isChromecastActive,
  syncVolumeWithChromecast,
  seekChromecastProgressbar,
  isChromecastAvailable,
  getCastContext,
  disconnectIfCastFinished,
  onVolumeChangeDuringCasting,
};
