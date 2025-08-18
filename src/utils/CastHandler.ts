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

let castScriptAdded = false;

function loadCastAPI(): void {
  // If Cast is already available (e.g., injected by extension or loaded once), skip
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
    // Mark as loaded; future calls will no-op
    (window as any).__fastpixCastLoading = false;
  };
  document.head.appendChild(script);
}

let hasDispatchedEndedEvent = false;

function setupChromecast(
  button: HTMLButtonElement,
  video: HTMLVideoElement,
  streamUrl: string,
  playerContext: any
): void {
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
  if (isIOS(playerContext)) return;
  if (checkChromecastAvailability()) {
    initializeCastApi(button, video, streamUrl, playerContext);
  } else {
    handleChromecastError();
  }
}

function handleChromecastError(): void {
  console.error("Google Cast API did NOT load.");
}

// Check if Chromecast is connected
function isChromecastConnected(): boolean {
  const castContext = getCastContext();
  return !!castContext?.getCurrentSession();
}

function freezeVideoWhileUpdatingProgress(
  video: HTMLVideoElement,
  playerContext: any
) {
  function updateTime() {
    if (!isChromecastConnected()) return; // Ensure Chromecast is active

    const session = (
      window as any
    ).cast.framework.CastContext.getInstance().getCurrentSession();
    if (session) {
      const media = session.getMediaSession();
      if (media) {
        const castTime = media.getEstimatedTime();

        // Update UI only, don't change video.currentTime
        playerContext.progressBar.value = (castTime / video.duration) * 100;
        playerContext.textContent = formatVideoDuration(castTime); // Use formatVideoDuration instead of formatTime
      }
    }
  }
  setInterval(updateTime, 1000); // Update progress every second
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
        (error: any) => console.error("Chromecast sravani: Seek failed", error)
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
      (error: any) => console.error("[Cast] Seek failed", error)
    );
  }
}

function syncPlaybackWithChromecast(
  video: HTMLVideoElement,
  playerContext: any
) {
  const castContext = getCastContext();
  const SessionState = (window as any).cast.framework.SessionState;
  let updateInterval: number | null = null;

  castContext.addEventListener(
    (window as any).cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
    (event: any) => {
      const session = castContext.getCurrentSession();
      switch (event.sessionState) {
        case SessionState.SESSION_STARTED:
        case SessionState.SESSION_RESUMED: {
          const { isMuted, mediaVolume } = getStoredVolume(playerContext);
          const safeVolume = Math.min(Math.max(mediaVolume, 0), 1);
          const { remotePlayer } = getRemotePlaybackInstance(playerContext);

          localStorage.setItem("chromecastFinished", "false");
          lastPlaybackTime = video.currentTime;
          localStorage.setItem("chromecastActive", "true");
          playerContext.currentCastSession = session;
          freezeVideoWhileUpdatingProgress(video, playerContext);
          syncVolumeWithChromecast(safeVolume, isMuted);
          video.pause();

          if (updateInterval) clearInterval(updateInterval as any);
          updateInterval = window.setInterval(() => {
            const media = session?.getMediaSession();
            if (!media) {
              console.warn(
                "[Chromecast] No media session found during interval."
              );
              return;
            }

            lastPlaybackTime = media.getEstimatedTime();

            if (media.playerState === "BUFFERING") {
              showLoader(playerContext);
            } else {
              hideLoader(playerContext);
            }

            playerContext.pausedOnCasting = media.playerState === "PAUSED";

            const loopEnabled =
              playerContext.loopEnabled ?? remotePlayer?.isLoopingEnabled;

            if (
              remotePlayer?.duration &&
              Math.floor(lastPlaybackTime) >=
                Math.floor(remotePlayer.duration) &&
              !loopEnabled &&
              !hasDispatchedEndedEvent
            ) {
              const endedEvent = new Event("ended");
              video.dispatchEvent(endedEvent);
              hasDispatchedEndedEvent = true;

              hideInitControls(playerContext);
              showLoader(playerContext);
              localStorage.setItem("chromecastFinished", "true");
              localStorage.setItem("chromecastActive", "false");
              showLoader(playerContext);
            }

            if (
              remotePlayer?.duration &&
              Math.floor(lastPlaybackTime) <
                Math.floor(remotePlayer.duration) &&
              hasDispatchedEndedEvent
            ) {
              hasDispatchedEndedEvent = false;
            }
          }, 1000);
          break;
        }

        case SessionState.SESSION_ENDED: {
          const media = session?.getMediaSession();

          if (localStorage.getItem("chromecastActive") === "true") {
            localStorage.setItem("chromecastActive", "false");
          }

          lastPlaybackTime = media?.getEstimatedTime() ?? lastPlaybackTime;
          video.currentTime = lastPlaybackTime;
          playerContext.currentCastSession = null;

          if (updateInterval) {
            clearInterval(updateInterval as any);
            updateInterval = null;
          }

          localStorage.setItem("media-volume", video.volume.toString());

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
    session.endSession(true); // Force disconnect
    localStorage.setItem("chromecastActive", "false");
    localStorage.setItem("chromecastFinished", "false"); // Reset
  }
}

function getStoredVolume(playerContext: any) {
  const storedVolume = localStorage.getItem("media-volume");
  const mediaVolume = storedVolume !== null ? parseFloat(storedVolume) : 1; // Default volume = 1
  const isMuted = mediaVolume === 0; // Determine if muted

  // Update the player context
  playerContext.isMuted = isMuted;

  return { isMuted, mediaVolume }; // Return both values
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
        (error: any) =>
          console.error("❌ Chromecast: Volume update failed", error)
      );
    } else if (attempts < maxRetries) {
      attempts++;
      setTimeout(trySetVolume, 300); // Retry after 300ms
    } else {
      console.warn("⚠️ Chromecast: Media session not available to set volume.");
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
      .catch((error: any) => console.error("Volume change error:", error));
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
    console.error("Chromecast API is not available.");
    return;
  }

  syncPlaybackWithChromecast(video, playerContext);

  castContext.setOptions({
    receiverApplicationId: "7E13138A",
    autoJoinPolicy: chromeCast.AutoJoinPolicy.ORIGIN_SCOPED,
    androidReceiverCompatible: true,
    language: "en-US",
    resumeSavedSession: true,
  });

  castContext.addEventListener(
    (window as any).cast.framework.CastContextEventType.CAST_STATE_CHANGED,
    (event: any) => updateCastButton(button, event.castState, playerContext)
  );

  setInterval(() => {
    const session = castContext.getCurrentSession();
    if (session) {
      const media = session.getMediaSession();
      if (media) {
        lastPlaybackTime = media.getEstimatedTime();
        video.dispatchEvent(new Event("timeupdate"));
      }
    }
  }, 1000);

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
  const castFramework = (window as any).cast.framework;

  // Update the CSS variable --cast-button-display based on castState
  playerContext?.castButton.style.setProperty(
    "--cast-button-display",
    castState === castFramework.CastState.NO_DEVICES_AVAILABLE ? "none" : "flex"
  );

  button.innerHTML =
    castState === castFramework.CastState.CONNECTED
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
  hideMenus(playerContext);
  if (session) {
    castContext
      .requestSession()
      .catch((error: Error) =>
        console.error("Chromecast: Error opening session menu", error)
      );
  } else {
    castContext
      .requestSession()
      .then(() =>
        sendMediaToChromecast(context, video, streamUrl, button, playerContext)
      )
      .catch((error: Error) =>
        console.error("Chromecast: Unable to start casting session", error)
      );
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
    media.play(null, () => {}, console.error);
    playerContext.playPauseButton.innerHTML = PauseIcon;
  } else {
    media.pause(null, () => {}, console.error);
    playerContext.playPauseButton.innerHTML = PlayIcon;
  }
}

let lastPlaybackTime: number = 0;

// Seek function for Chromecast
function seekInChromecast(offset: number) {
  const castContext = getCastContext();
  const session = castContext.getCurrentSession();

  if (session) {
    const media = session.getMediaSession();
    if (media) {
      const currentTime = media.getEstimatedTime();
      const seekTime = Math.max(0, currentTime + offset); // Ensure non-negative seek time

      const seekRequest = new (window as any).chrome.cast.media.SeekRequest();
      seekRequest.currentTime = seekTime;

      media.seek(
        seekRequest,
        () => {},
        (error: any) => console.error("Chromecast: Seek failed", error)
      );
    }
  }
}

function fastForwardButtonClickHandler() {
  seekInChromecast(10); // Seek forward by 10 seconds in Chromecast
}

function rewindButtonClickHandler() {
  seekInChromecast(-10); // Seek backward by 10 seconds in Chromecast
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
    console.error("❌ Chromecast: No session available.");
    return;
  }

  lastPlaybackTime = video.currentTime;

  const chromeCast = (window as any).chrome.cast;
  const mediaInfo = new chromeCast.media.MediaInfo(
    streamUrl,
    "application/vnd.apple.mpegurl"
  );

  mediaInfo.metadata = new chromeCast.media.GenericMediaMetadata();

  const textTracks = Array.from(video.textTracks);
  const trackElements = Array.from(video.querySelectorAll("track"));
  const tracks: any[] = [];

  // Prefer track elements if they exist
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
    // Fallback: use textTracks metadata if no <track> elements are found
    for (let i = 0; i < textTracks.length; i++) {
      const textTrack = textTracks[i];
      const castTrack = new chromeCast.media.Track(
        i + 1,
        chromeCast.media.TrackType.TEXT
      );

      castTrack.trackContentId = ""; // No src available
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
  request.currentTime = lastPlaybackTime;
  request.autoplay = !playerContext.wasManuallyPaused;

  session
    .loadMedia(request)
    .then(() => {
      button.innerHTML = ChromecastActiveIcon;

      video.pause();
      freezeVideoWhileUpdatingProgress(video, playerContext);

      // Volume restore
      const { mediaVolume } = getStoredVolume(playerContext);
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
      console.error("❌ Chromecast: Load media error", err);
    });
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
