import {
  isChromecastConnected,
  lastPlaybackTimeCasting,
  seekInChromecast,
} from "./CastHandler";
import { updateControlsVisibility } from "./DomVisibilityManager";
import { showError } from "./ErrorElement";
import { initializeHLS } from "./HlsManager";
import { setupLazyLoading } from "./LazyLoadingHandler";

export interface FetchStreamResponse {
  status: number;
  playlist?: boolean;
  errorMessage?: string | string[];
  errorFields?: any;
}

export interface Context {
  wrapper: HTMLElement;
  video: HTMLVideoElement;
  controlsContainer: HTMLElement;
  progressBarContainer: HTMLElement;
  volumeControl: HTMLInputElement;
  pipButton: HTMLElement;
  fullScreenButton: HTMLElement;
  ccButton: HTMLElement;
  fastForwardButton: HTMLElement;
  rewindBackButton: HTMLElement;
  playPauseButton: HTMLElement;
  timeDisplay: HTMLElement;
  parentVolumeDiv: HTMLElement;
  volumeButton: HTMLElement;
  playbackRateButton: HTMLElement;
  volumeiOSButton: HTMLElement;
  resolutionMenuButton: HTMLElement;
  titleElement: HTMLElement;
  mobileControls?: Node;
  leftControls: HTMLElement;
  resolutionMenu: HTMLElement;
  playbackRateDiv: HTMLElement;
  liveStreamDisplay: HTMLElement;
  audioMenuButton: HTMLElement;
  subtitleMenu: HTMLElement;
  audioMenu: HTMLElement;
  initialPlayClick: boolean;
  disableKeyboardControls: boolean;
  hotKeys?: string[];
  isLoading: boolean;
  pauseAfterLoading: boolean;
  streamType: string;
  playbackId: string;
  thumbnailUrlFinal: string;
  retryButtonVisible?: boolean;
  hideControlsTimer: number;
  lastInteractionTimestamp: number;
  lastKeyPressTimestamp: number;
  getSavedVolume: string;
  contains: (target: EventTarget | null) => boolean;
  getAttribute: (attr: string) => string | null;
  hasAttribute: (attr: string) => boolean;
  initializeHLS(streamUrl: string | null, streamType: string | null): void;
  fetchStream: (url: string) => Promise<FetchStreamResponse>;
  appendAttributesToStream: (url: string) => string;
  handleFieldError: (errorFields: any) => void;
  cache: Map<string, number>;
  currentSubtitleTrackIndex: number;
  subtitleContainer: HTMLElement;
  [key: string]: any; // Add this line to allow dynamic key access
}

const videoEvents: string[] = [
  "abort",
  "canplay",
  "canplaythrough",
  "durationchange",
  "emptied",
  "ended",
  "error",
  "loadeddata",
  "loadedmetadata",
  "loadstart",
  "pause",
  "play",
  "playing",
  "progress",
  "ratechange",
  "seeked",
  "seeking",
  "stalled",
  "suspend",
  "timeupdate",
  "volumechange",
  "waiting",
  "encrypted",
  "waitingforkey",
];

let globalSource: string | null = null;

function handleFieldError(context: Context, errorFields: any[]): void {
  if (errorFields && Array.isArray(errorFields)) {
    errorFields.forEach((fieldError) => {
      switch (fieldError.field) {
        case "playbackId":
          showError(
            context,
            "Error loading the media. This can happen due to invalid Playback ID."
          );
          break;
        case "minResolution":
          showError(
            context,
            "Error loading the media. This can happen due to invalid Minimum resolution."
          );
          break;
        case "maxResolution":
          showError(
            context,
            "Error loading the media. This can happen due to invalid Maximum resolution."
          );
          break;
        case "resolution":
          showError(
            context,
            "Error loading the media. This can happen due to invalid resolution."
          );
          break;
        case "order":
          showError(
            context,
            `Error loading the media. This can happen due to invalid renditionOrder, it should be either "asc" or "desc".`
          );
          break;
        default:
          console.warn(`Unhandled error field: ${fieldError.field}`);
          break;
      }
    });
  }
}

function appendAttributesToStream(context: any, url: string | string[]) {
  let params = [];

  if (context.hasAttribute("min-resolution")) {
    const minRes = context.getAttribute("min-resolution");
    params.push(`minResolution=${minRes}`);
  }

  if (context.hasAttribute("max-resolution")) {
    const maxRes = context.getAttribute("max-resolution");
    params.push(`maxResolution=${maxRes}`);
  }

  if (context.hasAttribute("resolution")) {
    const resolution = context.getAttribute("resolution");
    params.push(`resolution=${resolution}`);
  }

  if (context.hasAttribute("rendition-order")) {
    const renditionOrder = context.getAttribute("rendition-order");
    params.push(`renditionOrder=${renditionOrder}`);
  }

  if (params.length > 0) {
    const paramString = params.join("&");
    return url.includes("?")
      ? `${url}&${paramString}`
      : `${url}?${paramString}`;
  }

  return url;
}

// Centralized error handler
const handleStreamError = (
  context: Context,
  status: number,
  errorMessage?: string | string[],
  errorFields?: any
): void => {
  const errorHandlers: Record<number, () => void> = {
    422: () => handleFieldError(context, errorFields),
    401: () =>
      showError(
        context,
        "Error loading the video. Incorrect playback ID or token."
      ),
    400: () =>
      showError(
        context,
        errorMessage?.includes("ready")
          ? "The media is currently unavailable. Please wait until it's ready and then refresh the page."
          : "Token should not be provided for public streams."
      ),
  };

  // Assign a common handler for 403 and 404
  [403, 404].forEach((code) => {
    errorHandlers[code] = () =>
      showError(
        context,
        "Stream details not found. Playback ID is missing or invalid."
      );
  });

  (
    errorHandlers[status] ||
    (() =>
      showError(
        context,
        "Video stream couldn't be fetched. Please check your playback ID or internet connection."
      ))
  )();
};

// Unified stream fetcher
const fetchAndHandleStream = async (
  context: Context,
  url: string
): Promise<string | null> => {
  const response = await fetchStream(context, url);

  if (response.status === 200) {
    context._src = url;
    return url;
  }

  handleStreamError(
    context,
    response.status,
    response.errorMessage,
    response.errorFields
  );
  return null;
};

function getCurrentTime(context: any) {
  return context.video.currentTime;
}

function getSyncedCurrentTime(context: any) {
  return isChromecastConnected()
    ? lastPlaybackTimeCasting()
    : getCurrentTime(context);
}

async function fetchStream(context: Context, url: string) {
  if (context.cache.has(url)) {
    return {
      status: context.cache.get(url),
      errorFields: null,
      errorMessage: null,
    };
  }

  try {
    const response = await fetch(url);
    const contentType = response.headers.get("Content-Type") ?? "";
    const responseText = await response.text();

    if (contentType.includes("application/json")) {
      try {
        const parsedResponse = JSON.parse(responseText);
        if (parsedResponse?.success) {
          context._src = url;
          return {
            status: response.status,
            errorFields: null,
            errorMessage: null,
          };
        }

        const errorMessage =
          parsedResponse?.error?.message ?? "Unknown error occurred.";
        const errorFields = parsedResponse?.error?.fields ?? null;

        if (response.status === 401 && url.includes("token")) {
          showError(
            context,
            "Invalid playback URL. Please check the playback URL or verify if the token is invalid."
          );
        }

        return { status: response.status, errorFields, errorMessage };
      } catch (jsonError) {
        console.warn("Failed to parse response as JSON:", jsonError);
      }
    }

    if (
      contentType.includes("application/vnd.apple.mpegurl") ||
      contentType.includes("text/plain")
    ) {
      return {
        status: response.status,
        playlist: responseText,
        errorMessage: null,
      };
    }

    return {
      status: response.status,
      errorFields: null,
      errorMessage: "Unexpected content type.",
    };
  } catch (error) {
    console.error("Network request failed:", error);
    showError(
      context,
      "Network Error. Please check your internet connection and try refreshing the page."
    );
    return { status: null, errorFields: null, errorMessage: "Network Error" };
  }
}

const fetchStreamWithToken = async (
  context: Context,
  playbackId: string | null,
  token: string | null,
  playbackUrl: string | undefined
): Promise<string | null> => {
  const unsignedUrl = appendAttributesToStream(
    context,
    `${playbackUrl}/${playbackId}.m3u8`
  );
  const signedUrl = token
    ? appendAttributesToStream(
        context,
        `${playbackUrl}/${playbackId}.m3u8?token=${token}`
      )
    : null;

  try {
    // Try fetching signed URL if available
    if (signedUrl && token) {
      const signedResult = await fetchAndHandleStream(context, signedUrl);
      if (signedResult) return signedResult;
    }

    // Fallback to unsigned URL
    return await fetchAndHandleStream(context, unsignedUrl);
  } catch (error) {
    console.warn("Error fetching stream:", error);
    showError(
      context,
      "Network Error. Please check your internet connection and try refreshing the page."
    );
    return null;
  }
};

function isChromeBrowser(): boolean {
  const userAgent = navigator.userAgent;

  const isChrome = /Chrome/.exec(userAgent) || /CriOS/.exec(userAgent);
  const isEdge = /Edg/.exec(userAgent);
  const isOpera = /OPR|Opera/.exec(userAgent);

  return !!window.chrome && !!isChrome && !isEdge && !isOpera;
}

function isIOS(context: any): boolean {
  const isiOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  context.isiOS = isiOS; // Storing the result in context for future reference
  return isiOS; // Returning the result
}

function renderPlaylistPanel(context: any) {
  if (!Array.isArray(context.playlist)) return;

  context.playlistPanel.innerHTML = ""; // Clear before render

  context.playlist.forEach((ep: any, idx: number) => {
    const item = document.createElement("div");
    item.className = "playlist-item";
    if (ep.playbackId === context.playbackId) {
      item.classList.add("selected");
    }

    // Thumbnail
    const thumb = document.createElement("div");
    thumb.className = "thumb";
    thumb.style.backgroundImage = `url('${ep.thumbnail}')`;

    // Info container
    const info = document.createElement("div");
    info.className = "info";

    const title = document.createElement("div");
    title.className = "playlist-title";
    title.textContent = ep.title;

    info.appendChild(title);

    // Conditionally add duration
    if (ep.duration) {
      const duration = document.createElement("div");
      duration.className = "playlist-item-duration";
      duration.textContent = ep.duration;
      info.appendChild(duration);
    }

    item.appendChild(thumb);
    item.appendChild(info);

    item.addEventListener("click", (e) => {
      // Prevent parent toggle button from re-toggling the panel
      e.preventDefault();
      e.stopPropagation();

      // If this item is already active, skip reloading
      if (item.classList.contains("selected")) {
        context.playlistPanel.classList.remove("open");
        context.playlistPanel.classList.add("closing");
        setTimeout(() => {
          context.playlistPanel.classList.remove("closing");
        }, 200);
        return;
      }

      context.selectEpisodeByPlaybackId(ep.playbackId);
      // Smooth close of panel
      context.playlistPanel.classList.remove("open");
      context.playlistPanel.classList.add("closing");
      setTimeout(() => {
        context.playlistPanel.classList.remove("closing");
      }, 200);
    });

    context.playlistPanel.appendChild(item);
  });
}

// Wrapper functions for live and on-demand streams
const fetchStreamWithTokenOnDemand = (
  context: Context,
  playbackId: string | null,
  token: string | null,
  playbackUrl: string | undefined
) => fetchStreamWithToken(context, playbackId, token, playbackUrl);

const fetchStreamWithTokenLiveStream = (
  context: Context,
  playbackId: string | null,
  token: string | null,
  playbackUrl: string | undefined
) => fetchStreamWithToken(context, playbackId, token, playbackUrl);

async function getStreamUrl(
  context: any,
  playbackId: string | null,
  token: string | null,
  playbackUrl: string | undefined,
  streamType: string | null
): Promise<string | null> {
  if (streamType === "on-demand") {
    return await fetchStreamWithTokenOnDemand(
      context,
      playbackId,
      token,
      playbackUrl
    );
  } else if (streamType === "live-stream") {
    return await fetchStreamWithTokenLiveStream(
      context,
      playbackId,
      token,
      playbackUrl
    );
  } else {
    showError(context, "Unsupported stream type");
    context.video.poster = ""; // Clear poster if error occurs
    return null;
  }
}

async function setStreamUrl(
  context: any,
  playbackId: string | null,
  token: string | null,
  playbackUrl: string | undefined,
  streamType: string | null
): Promise<string | null> {
  const streamUrl = await getStreamUrl(
    context,
    playbackId,
    token,
    playbackUrl,
    streamType
  );

  if (!streamUrl) {
    console.warn("Failed to set the stream URL.");
    return null;
  }

  globalSource = streamUrl;

  initializeStream(context, streamUrl, streamType);
  return streamUrl;
}

function getSRC() {
  return globalSource;
}

function initializeStream(
  context: any,
  streamUrl: string,
  streamType: string | null
): void {
  if (context.hasAttribute("enable-lazy-loading")) {
    setupLazyLoading(context.video as HTMLElement, () => {
      initializeHLS(context, streamUrl, streamType);
    });
  } else {
    initializeHLS(context, streamUrl, streamType);
  }
}
function formatVideoDuration(seconds: number) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const hrsStr = hrs > 0 ? `${hrs}:` : "";
  const minsStr = mins.toString().padStart(2, "0");
  const secsStr = secs.toString().padStart(2, "0");
  return `${hrsStr}${minsStr}:${secsStr}`;
}

function smoothTransitionToControls(context: Context, isVisible: boolean) {
  const elements: string[] | number = [
    "progressBarContainer",
    "volumeControl",
    "volumeButton",
    "pipButton",
    "fullScreenButton",
    "ccButton",
    "fastForwardButton",
    "rewindBackButton",
    "playPauseButton",
    "timeDisplay",
    "parentVolumeDiv",
    "playbackRateButton",
    "volumeiOSButton",
    "resolutionMenuButton",
    "audioMenuButton",
    "titleElement",
    "mobileControls",
    "leftControls",
    "resolutionMenu",
    "playbackRateDiv",
    "liveStreamDisplay",
    "subtitleMenu",
    "playlistButton",
    "castButton",
    "playlistSlot",
  ];

  const opacityValue = isVisible ? "1" : "0";
  const transitionStyle = isVisible ? "opacity 0.9s ease" : "";

  elements.forEach((elementName) => {
    const element = (context as any)[elementName];
    if (element) {
      if (elementName === "playlistSlot") {
        // Only reveal slot when controls are visible AND the external panel is open
        const shouldShow = isVisible && !!context.externalPlaylistOpen;
        element.style.opacity = shouldShow ? "1" : "0";
        element.style.transition = transitionStyle;
        return;
      }
      element.style.opacity = opacityValue;
      element.style.transition = transitionStyle;
    }
  });
}

function adjustCurrentTimeBy(context: any, change: number) {
  if (isChromecastConnected()) {
    seekInChromecast(change); // Seek in Chromecast if connected
  } else {
    // Local player seek
    const newTime = Math.min(
      Math.max(context.video.currentTime + change, 0),
      context.video.duration
    );
    context.video.currentTime = newTime;
  }
}

function getFormattedDuration(
  duration: number,
  defaultDuration: number
): string {
  if (!isNaN(duration)) {
    return formatVideoDuration(duration);
  }
  return !isNaN(defaultDuration)
    ? formatVideoDuration(defaultDuration)
    : "0:00";
}

function updateTimeDisplay(context: any): void {
  let currentTime;
  if (isChromecastConnected()) {
    currentTime = Math.floor(lastPlaybackTimeCasting());
  } else {
    currentTime = Math.floor(context.video.currentTime);
  }
  const duration = Math.floor(context.video.duration);
  const showRemainingTime =
    context.getAttribute("default-show-remaining-time") !== null;
  let currentTimeFormatted, durationFormatted;

  if (showRemainingTime) {
    const remainingTime = duration - currentTime;
    const isValidTime = !isNaN(remainingTime);
    currentTimeFormatted = isValidTime
      ? "-" + formatVideoDuration(remainingTime)
      : "0:00";
    durationFormatted = isValidTime ? formatVideoDuration(duration) : "0:00";
  } else {
    currentTimeFormatted = !isNaN(currentTime)
      ? formatVideoDuration(currentTime)
      : "0:00";
    durationFormatted = getFormattedDuration(duration, context.defaultDuration);
  }

  context.timeDisplay.textContent = `${currentTimeFormatted} / ${durationFormatted}`;

  if (context.video.buffered.length > 0) {
    const bufferedPercentage = (context.video.buffered.end(0) / duration) * 100;
    context.bufferedRange.style.width = `${bufferedPercentage}%`;
  }
}

function receiveAttributes(context: any) {
  context.mutedAttribute = context.hasAttribute("muted");
  context.hasAutoPlayAttribute = context.hasAttribute("auto-play");
  context.loopAttribute = context.hasAttribute("loop");
  context.disableVideoClickAttr = context.hasAttribute("disable-video-click");
  context.enableCacheBusting = context.hasAttribute("enable-cache-busting");
  context.controlsContainerValue = updateControlsVisibility(context);
  context.hideControlAttr = context.hasAttribute("hide-controls");

  context.loopPlaylistTillEnd = context.hasAttribute("loop-next");

  context.token = context.getAttribute("token");
  context.drmToken = context.getAttribute("drm-token");
  context.playbackId = context.getAttribute("playback-id");

  // New: optional default playback for playlists
  context.defaultPlaybackId = context.getAttribute("default-playback-id");

  context.defaultStreamType =
    context.getAttribute("default-stream-type") ?? "on-demand";
  context.streamType =
    context.getAttribute("stream-type") ??
    context.defaultStreamType ??
    "on-demand";
  context.debugAttribute = context.hasAttribute("debug");
  context.startTimeAttribute = context.hasAttribute("start-time")
    ? context.getAttribute("start-time")
    : 0;

  // NEW: attribute to hide default playlist panel while keeping button available
  context.hideDefaultPlaylistPanel = context.hasAttribute(
    "hide-default-playlist-panel"
  );

  // thumbnail attributes
  context.thumbnailTime =
    context.getAttribute("thumbnail-time") ?? context.startTimeAttribute;
  context.getThumbnailAttribute = context.getAttribute("thumbnail-time");
  context.thumbnailTimeAttribute =
    parseFloat(context.getThumbnailAttribute) ||
    parseFloat(context.thumbnailTime);
  context.posterAttribute = context.getAttribute("poster");
  context.placeholderAttribute = context.getAttribute("placeholder");
  context.thumbnailUrlAttribute = context.getAttribute("spritesheet-src");
  const baseUrl = context?.thumbnailUrlAttribute ?? "images.fastpix.io";
  context.thumbnailUrlFinal = `https://${baseUrl}`;

  // playbackrates
  context.playbackRatesAttribute = context.getAttribute("playback-rates");
  context.defaultPlaybackRateAttribute = context.getAttribute(
    "default-playback-rate"
  );

  context.titleText = context.getAttribute("title");
  context.preloadAttribute = context.getAttribute("preload");
  context.crossoriginAttribute = context.getAttribute("crossorigin");

  const defaultAccent = "#5D09C7";
  const defaultPrimary = "#F5F5F5";
  const defaultSecondary = "transparent";

  context.accentColor = context.getAttribute("accent-color") ?? defaultAccent;
  context.primaryColor =
    context.getAttribute("primary-color") ?? defaultPrimary;
  context.secondaryColor =
    context.getAttribute("secondary-color") ?? defaultSecondary;

  context.style.setProperty("--accent-color", context.accentColor);
  context.style.setProperty("--primary-color", context.primaryColor);
  context.style.setProperty("--secondary-color", context.secondaryColor);

  context.defaultDuration = context.getAttribute("default-duration");
  context.disableKeyboardControls =
    context.hasAttribute("disable-keyboard-controls") &&
    context.getAttribute("disable-keyboard-controls") !== "false";
  const getHotKeys: string | null = context.getAttribute("hot-keys");
  context.hotKeys = context.hasAttribute("hot-keys")
    ? getHotKeys?.split(" ")
    : [];

  context.forwardSeekAttribute = context.getAttribute("forward-seek-offset");
  context.backwardSeekAttribute = context.getAttribute("backward-seek-offset");

  // Skip Intro attributes (in seconds)
  const skipIntroStartAttr = context.getAttribute("skip-intro-start");
  const skipIntroEndAttr = context.getAttribute("skip-intro-end");
  const parsedSkipStart =
    skipIntroStartAttr != null ? parseFloat(skipIntroStartAttr) : NaN;
  const parsedSkipEnd =
    skipIntroEndAttr != null ? parseFloat(skipIntroEndAttr) : NaN;
  context.skipIntroStart = Number.isFinite(parsedSkipStart)
    ? parsedSkipStart
    : null;
  context.skipIntroEnd = Number.isFinite(parsedSkipEnd) ? parsedSkipEnd : null;

  // Next episode overlay attribute (seconds)
  const nextEpisodeOverlayAttr = context.getAttribute(
    "next-episode-button-overlay"
  );
  const parsedNextOverlay =
    nextEpisodeOverlayAttr != null ? parseFloat(nextEpisodeOverlayAttr) : NaN;
  context.nextEpisodeOverlayStart = Number.isFinite(parsedNextOverlay)
    ? parsedNextOverlay
    : null;
}

function DrmSetup(context: any) {
  // Set up drmSystems config before creating Hls
  context.config.drmSystems["com.widevine.alpha"].licenseUrl =
    `https://api.fastpix.app/v1/on-demand/drm/license/widevine/${context.playbackId}?token=${context.drmToken}`;
  context.config.drmSystems["com.apple.fps"].licenseUrl =
    `https://api.fastpix.app/v1/on-demand/drm/license/fairplay/${context.playbackId}?token=${context.drmToken}`;
  context.config.drmSystems["com.apple.fps"].serverCertificateUrl =
    `https://api.fastpix.app/v1/on-demand/drm/cert/fairplay/${context.playbackId}?token=${context.drmToken}`;
}

export {
  setStreamUrl,
  formatVideoDuration,
  smoothTransitionToControls,
  videoEvents,
  updateTimeDisplay,
  adjustCurrentTimeBy,
  receiveAttributes,
  DrmSetup,
  isChromeBrowser,
  isIOS,
  getSyncedCurrentTime,
  renderPlaylistPanel,
  getSRC,
};
