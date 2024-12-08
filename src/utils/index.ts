import { showError } from "./ErrorElement";
import { initializeHLS } from "./Hls";
import { setupLazyLoading } from "./LazyLoadingHandler";

interface FetchStreamResponse {
  status: number;
  playlist?: boolean;
  errorMessage?: string | string[];
  errorFields?: any;
}

interface Context {
  video?: HTMLVideoElement;
  hasAttribute(attribute: string): boolean;
  getAttribute(attribute: string): string | null;
  initializeHLS(streamUrl: string | null, streamType: string): void;
  fetchStream: (url: string) => Promise<FetchStreamResponse>;
  appendAttributesToStream: (url: string) => string;
  handle422Error: (errorFields: any) => void;
  src: string | null;
  cache: Map<string, number>;
  wrapper: any;
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

function handle422Error(context: Context, errorFields: any[]): void {
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
    422: () => handle422Error(context, errorFields),
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
    404: () => showError(context, "Stream details not found."),
  };

  (
    errorHandlers[status] ||
    (() =>
      showError(
        context,
        "Video stream couldn't be fetched. Please check your internet connection or playback ID."
      ))
  )();
};

// Unified stream fetcher
const fetchAndHandleStream = async (
  context: Context,
  url: string | any
): Promise<string | null> => {
  const response = await fetchStream(context, url);

  if (response.status === 200 && response.playlist) {
    context.src = url;
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

async function fetchStream(
  context: any,
  url: RequestInfo | URL | string[] | any
) {
  if (context.cache.has(url)) {
    return {
      status: context.cache.get(url),
      errorFields: null,
      errorMessage: null,
    };
  }

  try {
    const response = await fetch(url);
    const contentType: string | any = response.headers.get("Content-Type");
    const responseText = await response.text();

    if (contentType.includes("application/json")) {
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText);
      } catch (e) {
        console.warn("Failed to parse response as JSON:", e);
        return {
          status: response.status,
          errorFields: null,
          errorMessage: null,
        };
      }

      if (parsedResponse?.success) {
        context.src = url;
        return {
          status: response.status,
          errorFields: null,
          errorMessage: null,
        };
      }

      let errorMessage =
        parsedResponse?.error?.message || "Unknown error occurred.";
      let errorFields = parsedResponse?.error?.fields || null;
      if (response.status === 401 && url.includes("token")) {
        showError(
          context,
          "Invalid playback URL. Please check the playback URL or verify if the token is invalid."
        );
      }

      // Return status, errorFields, and errorMessage
      return { status: response.status, errorFields, errorMessage };
    } else if (
      contentType.includes("application/vnd.apple.mpegurl") ||
      contentType.includes("text/plain")
    ) {
      // Handle M3U8 playlist response
      return {
        status: response.status,
        playlist: responseText,
        errorMessage: null,
      }; // Return the M3U8 playlist text
    }

    return { status: response.status, errorFields: null, errorMessage: null }; // Handle other statuses
  } catch (error) {
    showError(
      context,
      "Network Error. Please check your internet connection and try refreshing the page."
    );
    return { status: null, errorFields: null, errorMessage: "Network Error" }; // Return null for network error
  }
}

// Main function to fetch stream
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

  initializeStream(context, streamUrl, streamType);
  return streamUrl;
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

  // Set the `src` property
  context.src = streamUrl;
  context.video.src = streamUrl;
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
  const elements: string[] = [
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
  ];

  const opacityValue = isVisible ? "1" : "0";
  const transitionStyle = isVisible ? "opacity 0.9s ease" : "";

  elements.forEach((elementName) => {
    const element = context[elementName];
    if (element) {
      element.style.opacity = opacityValue;
      element.style.transition = transitionStyle;
    }
  });
}

function adjustCurrentTimeBy(context: any, change: number) {
  const newTime = Math.min(
    Math.max(context.video.currentTime + change, 0),
    context.video.duration
  );
  context.video.currentTime = newTime;
}

function updateTimeDisplay(context: any) {
  const currentTime = Math.floor(context.video.currentTime);
  const duration = Math.floor(context.video.duration);
  let currentTimeFormatted;
  let durationFormatted;

  // Calculate remaining time if default-show-remaining-time attribute is provided
  const showRemainingTime =
    context.getAttribute("default-show-remaining-time") !== null;

  if (showRemainingTime) {
    const remainingTime = duration - currentTime;
    currentTimeFormatted = !isNaN(remainingTime)
      ? "-" + formatVideoDuration(remainingTime)
      : "0:00";
    durationFormatted = !isNaN(remainingTime)
      ? formatVideoDuration(duration)
      : "0:00";
  } else {
    currentTimeFormatted = !isNaN(currentTime)
      ? formatVideoDuration(currentTime)
      : "0:00";

    if (isNaN(duration)) {
      if (!isNaN(context.defaultDuration)) {
        durationFormatted = formatVideoDuration(context.defaultDuration);
      } else {
        durationFormatted = "0:00";
      }
    } else {
      durationFormatted = formatVideoDuration(duration);
    }
  }

  context.timeDisplay.textContent = `${currentTimeFormatted} / ${durationFormatted}`;

  // Update the buffered range
  if (context.video.buffered.length > 0) {
    const bufferedPercentage = (context.video.buffered.end(0) / duration) * 100;
    context.bufferedRange.style.width = `${bufferedPercentage}%`;
  }
}

export {
  setStreamUrl,
  formatVideoDuration,
  smoothTransitionToControls,
  videoEvents,
  updateTimeDisplay,
  adjustCurrentTimeBy,
};
