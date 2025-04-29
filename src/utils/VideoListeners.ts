import { Hls } from "./HlsManager";
import {
  initializeControlsAfterPlayClick,
  toggleVideoPlayback,
} from "./ToggleController";

import { PauseIcon, PlayIcon } from "../icons/PlayPauseIcon/index";
import { activeChapter, ensureChaptersLoaded } from "./ChaptersHandlers";
import { hideLoader, hideMenus, showLoader } from "./DomVisibilityManager";
import {
  adjustCurrentTimeBy,
  isChromeBrowser,
  updateTimeDisplay,
} from "./index";
import { resizeVideoWidth } from "./ResizeVideo";
import {
  disableAllSubtitles,
  initializeSubtitles,
  preloadSubtitles,
} from "./SubtitleHandler";
import {
  updateVolumeButtonIcon,
  updateVolumeButtonIconiOS,
  updateVolumeControlBackground,
} from "./VolumeController";
import {
  controlCastMedia,
  getCurrentTime,
  isChromecastConnected,
  onVolumeChangeDuringCasting,
  seekChromecastProgressbar,
  syncVolumeWithChromecast,
} from "./CastHandler";

// connectedCallback
const videoListeners = (context: any) => {
  if (context) {
    context.video.addEventListener("loadedmetadata", () => {
      if (!isChromeBrowser()) {
        context.bottomRightDiv.removeChild(context.castButton);
      }
      preloadSubtitles(context);
      const tracksArray = Array.from(context.video.textTracks);

      if (context.hasAttribute("disable-hidden-captions")) {
        disableAllSubtitles(context);
      } else if (context.isOnline) {
        initializeSubtitles(context, tracksArray);
      }
    });

    // Instead of setTimeout, rely on actual loading:
    context.video.addEventListener("loadedmetadata", () => {
      context._readyState = 1;
      context.dispatchEvent(new Event("loadedmetadata"));
    });

    context.video.addEventListener("volumechange", () => {
      context.volumeControl.value = context.video.volume;

      const volume = context.video.volume;
      const isMuted = context.video.muted;

      if (isMuted) {
        context.video.volume = 0;
        context.volumeControl.value = "0";
      }

      updateVolumeButtonIcon(context);
      updateVolumeControlBackground(context);
      updateVolumeButtonIconiOS(context);
      localStorage.setItem("media-volume", String(context.video.volume));
      syncVolumeWithChromecast(volume, isMuted); // ✅ Ensure mute is also synced

      // Sync volume with Chromecast if connected
      if (isChromecastConnected()) {
        onVolumeChangeDuringCasting(volume);
      }
    });

    context.video.addEventListener("pause", () => {
      if (isChromecastConnected()) {
        controlCastMedia("pause", context);
      } else {
        context.playPauseButton.innerHTML = PlayIcon;
        context.wasManuallyPaused = true;
      }
    });

    context.video.addEventListener("play", () => {
      if (isChromecastConnected()) {
        controlCastMedia("play", context);
      } else {
        context.playPauseButton.innerHTML = PauseIcon;
        context.wasManuallyPaused = false;
      }
    });

    context.video.addEventListener("waiting", () => {
      context.isLoading = true;
      context.isBuffering = true;
      showLoader(context);
      context.playPauseButton.disabled = true;
    });

    context.video.addEventListener("playing", () => {
      if (!context.isBuffering) {
        hideLoader(context);
      }

      hideLoader(context);

      context.playPauseButton.disabled = false;

      if (context.pauseAfterLoading && !context.resolutionSwitching) {
        context.video.pause();
        context.pauseAfterLoading = false;
      }
    });

    context.video.addEventListener("canplaythrough", () => {
      context.isBuffering = false;
      context.isLoading = false;
      setTimeout(() => {
        hideLoader(context);
      }, 10);
    });

    context.video.addEventListener("loadedmetadata", () => {
      updateTimeDisplay(context);
      context.video.addEventListener("timeupdate", updateTimeDisplay(context));

      if (context.hasAutoPlayAttribute === true) {
        context.video.muted = true;
        context.video.autoplay = true;
        context.video.volume = 0;
        toggleVideoPlayback(
          context,
          context.playbackId,
          context.thumbnailUrlFinal,
          context.streamType
        );
        context.volumeControl.value = context.video.volume;
        updateVolumeControlBackground(context);
        updateVolumeButtonIcon(context);
        localStorage.setItem("savedVolume", context.volumeControl.value);
        localStorage.setItem("savedVolumeIcon", context.volumeButton.innerHTML);
      }

      if (context.mutedAttribute === true) {
        context.video.muted = true;
        context.video.volume = 0;
        context.volumeControl.value = context.video.volume;
        updateVolumeControlBackground(context);
        updateVolumeButtonIcon(context);
        localStorage.setItem("savedVolume", context.volumeControl.value);
        localStorage.setItem("savedVolumeIcon", context.volumeButton.innerHTML);
      } else {
        localStorage.removeItem("muted");
        const savedVolume = localStorage.getItem("savedVolume");

        if (savedVolume !== null) {
          context.video.volume = parseFloat(savedVolume);
          context.volumeControl.value = context.video.volume;
          updateVolumeControlBackground(context);
          updateVolumeButtonIcon(context);
        }
        const savedVolumeIcon = localStorage.getItem("savedVolumeIcon");

        if (savedVolumeIcon !== null) {
          context.volumeButton.innerHTML = savedVolumeIcon;
        }
      }
    });

    context.video.addEventListener("timeupdate", () => {
      let currentTime = getCurrentTime(context);
      const duration = context.video.duration;
      const bufferEnd =
        context.video.buffered.length > 0
          ? context.video.buffered.end(context.video.buffered.length - 1)
          : 0;
      const bufferedPercentage = (bufferEnd / context.video.duration) * 100;
      const seekedPercentage = Math.min((currentTime / duration) * 100, 100);
      context.progressBar.style.background = `linear-gradient(to right, ${context.accentColor} 0%, ${context.accentColor} ${seekedPercentage}%, ${context.primaryColor} ${seekedPercentage}%, ${context.primaryColor} ${bufferedPercentage}%, rgba(255, 255, 255, 0.2) ${bufferedPercentage}%, rgba(255, 255, 255, 0.2) 100%)`;

      if (duration > 0) {
        context.progressBar.value = seekedPercentage;
        context.progressBar.style.setProperty(
          "--progressBar-thumb-position",
          `${seekedPercentage}%`
        );
      }
      updateTimeDisplay(context);
      activeChapter(context);
    });

    context.video.addEventListener("seeked", () => {
      let currentTime = getCurrentTime(context);
      const duration = context.video.duration;
      const bufferEnd =
        context.video.buffered.length > 0
          ? context.video.buffered.end(context.video.buffered.length - 1)
          : 0;
      const bufferedPercentage = (bufferEnd / duration) * 100;
      const seekedPercentage = Math.min((currentTime / duration) * 100, 100);

      context.progressBar.style.background = `linear-gradient(to right, ${context.accentColor} 0%, ${context.accentColor} ${seekedPercentage}%, ${context.primaryColor} ${seekedPercentage}%, ${context.primaryColor} ${bufferedPercentage}%, rgba(255, 255, 255, 0.2) ${bufferedPercentage}%, rgba(255, 255, 255, 0.2) 100%)`;

      context.progressBar.style.setProperty(
        "--progressBar-thumb-position",
        `${seekedPercentage}%`
      );
    });

    context.video.addEventListener("progress", () => {
      let currentTime = getCurrentTime(context);
      const bufferEnd =
        context.video.buffered.length > 0
          ? context.video.buffered.end(context.video.buffered.length - 1)
          : 0;
      const bufferedPercentage = (bufferEnd / context.video.duration) * 100;
      const seekedPercentage = Math.min(
        (currentTime / context.video.duration) * 100,
        100
      );
      context.progressBar.style.background = `linear-gradient(to right, ${context.accentColor} 0%, ${context.accentColor} ${seekedPercentage}%, ${context.primaryColor} ${seekedPercentage}%, ${context.primaryColor} ${bufferedPercentage}%, rgba(255, 255, 255, 0.2) ${bufferedPercentage}%, rgba(255, 255, 255, 0.2) 100%)`;
      context.progressBar.style.setProperty(
        "--progressBar-thumb-position",
        `${seekedPercentage}%`
      );
    });

    context.video.addEventListener("ended", () => {
      context.videoEnded = true;
      context.liveStreamDisplay.addEventListener("click", () => {
        context.video.play();
        context.videoEnded = false;
      });
    });

    // Listen for progressbar input changes

    context.progressBar.addEventListener("keydown", (event: KeyboardEvent) => {
      if (shouldDisableKeyboardControls(context)) return;

      switch (event.code) {
        case "ArrowLeft":
        case "ArrowRight":
          handleSeek(event.code, context);
          break;
        case "ArrowUp":
        case "ArrowDown":
          handleVolume(event.code, context);
          break;
      }
    });

    function shouldDisableKeyboardControls(context: HTMLElement): boolean {
      return (
        context.hasAttribute("disable-keyboard-controls") &&
        context.getAttribute("disable-keyboard-controls") !== "false"
      );
    }

    function handleSeek(code: string, context: HTMLElement) {
      const seekOffset =
        code === "ArrowRight"
          ? getSeekOffset(context, "forward-seek-offset", 10)
          : -getSeekOffset(context, "backward-seek-offset", 10);

      adjustCurrentTimeBy(context, seekOffset);
    }

    function getSeekOffset(
      context: HTMLElement,
      attr: string,
      defaultValue: number
    ): number {
      return context.hasAttribute(attr)
        ? parseInt(context.getAttribute(attr)!) || defaultValue
        : defaultValue;
    }

    function handleVolume(code: string, context: any) {
      const volumeStep = 0.1;
      const newVolume =
        code === "ArrowUp"
          ? Math.min(1, context.video.volume + volumeStep)
          : Math.max(0, context.video.volume - volumeStep);

      updateVolume(context, newVolume);
    }

    function updateVolume(context: any, newVolume: number) {
      context.video.volume = newVolume;
      if (context.video.muted && newVolume > 0) {
        context.video.muted = false;
      }

      if (!context.hasAttribute("no-volume-pref")) {
        localStorage.setItem("savedVolume", newVolume.toString());
      }

      context.volumeControl.value = newVolume;
      updateVolumeControlBackground(context);
      updateVolumeButtonIcon(context);
    }

    function updateProgressBarBackground(
      context: any,
      seekedPercentage: number,
      bufferedPercentage: number
    ) {
      context.progressBar.style.background = `linear-gradient(to right, ${context.accentColor} 0%, ${context.accentColor} ${seekedPercentage}%, ${context.primaryColor} ${seekedPercentage}%, ${context.primaryColor} ${bufferedPercentage}%, rgba(255, 255, 255, 0.2) ${bufferedPercentage}%, rgba(255, 255, 255, 0.2) 100%)`;
      context.progressBar.style.setProperty(
        "--progressBar-thumb-position",
        `${seekedPercentage}%`
      );
    }

    function handleChromecastSeek(seekTime: number) {
      if (isChromecastConnected()) {
        seekChromecastProgressbar(seekTime);
      }
    }

    function handleLocalVideoSeek(
      context: any,
      seekTime: number,
      bufferEnd: number
    ) {
      if (isFinite(seekTime)) {
        if (seekTime > bufferEnd) {
          showLoader(context);
        }

        if (seekTime < bufferEnd) {
          context.hls.trigger(Hls.Events.BUFFER_FLUSHING, {
            startOffset: seekTime,
            endOffset: Number.POSITIVE_INFINITY,
          });
        }

        context.video.currentTime = seekTime;
      } else {
        console.error("Seek time is not finite, skipping currentTime update.");
      }
    }

    function handlePlaybackAfterSeek(context: any) {
      if (context.video.paused && !context.userPaused) {
        context.video.pause();
      } else if (!context.video.paused) {
        context.video.play().catch((error: any) => {
          console.error("Playback error after seeking:", error);
        });
      }
    }

    function hideLoaderIfNeeded(
      seekTime: number,
      bufferEnd: number,
      context: any
    ) {
      if (seekTime <= bufferEnd) {
        hideLoader(context);
      }
    }

    context.progressBar.addEventListener("input", () => {
      const duration = context.video.duration;
      if (!isFinite(duration)) {
        console.error("Video duration is not finite, cannot seek.");
        return;
      }

      const seekedPercentage = context.progressBar.value;
      const seekTime = (seekedPercentage / 100) * duration;
      const bufferEnd =
        context.video.buffered.length > 0
          ? context.video.buffered.end(context.video.buffered.length - 1)
          : 0;
      const bufferedPercentage = (bufferEnd / duration) * 100;

      // Update progress bar background
      updateProgressBarBackground(
        context,
        seekedPercentage,
        bufferedPercentage
      );

      // Handle Chromecast and local video seek logic
      handleChromecastSeek(seekTime);
      if (!isChromecastConnected()) {
        handleLocalVideoSeek(context, seekTime, bufferEnd);
        handlePlaybackAfterSeek(context);
        hideLoaderIfNeeded(seekTime, bufferEnd, context);
      }

      // Hide menus and active chapter
      hideMenus(context);
      activeChapter(context);
    });

    context.volumeControl.addEventListener("input", () => {
      const primaryColor = context.getAttribute("primary-color") ?? "#F5F5F5";
      const volume = context.volumeControl.value;
      const gradient = `linear-gradient(to right, ${primaryColor} 0%, ${primaryColor} ${(
        volume * 100
      ).toFixed(2)}%, rgba(255, 255, 255, 0.1) ${(volume * 100).toFixed(
        2
      )}%, rgba(255, 255, 255, 0.1) 100%)`;
      context.volumeControl.style.background = gradient;

      const noVolumePrefAttribute = context.hasAttribute("no-volume-pref");

      if (!noVolumePrefAttribute) {
        localStorage.setItem("savedVolumeIcon", context.volumeButton.innerHTML);
      } else {
        localStorage.removeItem("savedVolumeIcon");
      }

      // Update video volume
      context.video.volume = volume;

      // Update mute state if volume is 0
      if (volume === "0") {
        context.video.muted = true;
      } else {
        context.video.muted = false;
      }

      // Update volume control
      context.volumeControl.value = volume;
      updateVolumeControlBackground(context);
      updateVolumeButtonIcon(context);

      syncVolumeWithChromecast(volume, context.video.muted);

      if (!noVolumePrefAttribute) {
        localStorage.setItem("savedVolumeIcon", context.volumeButton.innerHTML);
        localStorage.setItem("savedVolume", context.video.volume.toString());
      } else {
        localStorage.removeItem("savedVolumeIcon");
        localStorage.removeItem("savedVolume");
      }

      hideMenus(context);
    });

    context.video.addEventListener("loadedmetadata", async () => {
      ensureChaptersLoaded(context);

      // Check if a saved volume exists in localStorage
      const savedVolume = localStorage.getItem("savedVolume");
      if (savedVolume !== null && !context.hasAttribute("no-volume-pref")) {
        const parsedVolume = parseFloat(savedVolume);
        context.video.volume = parsedVolume; // Restore saved volume
        context.volumeControl.value = parsedVolume.toString();
        updateVolumeControlBackground(context); // Update UI background
        updateVolumeButtonIcon(context); // Update volume button icon
      } else {
        // If no saved volume, set to default
        context.video.volume = 1;
        context.volumeControl.value = "1";
        updateVolumeControlBackground(context); // Update UI background
        updateVolumeButtonIcon(context); // Update volume button icon
      }

      context.video.playbackRate = context.defaultPlaybackRate;

      if (
        context.preloadAttribute === "auto" ||
        context.preloadAttribute === "none" ||
        context.preloadAttribute !== null
      ) {
        context.video.preload = context.preloadAttribute;
      } else {
        context.video.preload = "metadata";
      }

      if (context.crossoriginAttribute !== null) {
        context.video.crossOrigin = context.crossoriginAttribute;
      } else {
        context.video.crossOrigin = "";
      }

      resizeVideoWidth(context);
    });
  }
};

function hideControlsShowLoader(context: any) {
  showLoader(context);
  context.controlsContainer.style.setProperty("--controls", "none");
}

function resumePlaybackOnLoadOnActiveSession(context: any) {
  if (localStorage.getItem("chromecastActive") === "true") {
    context.initialPlayClick = true;
    showLoader(context);
    context.controlsContainer.style.setProperty(
      "--initial-play-button",
      "none"
    );

    setTimeout(() => {
      initializeControlsAfterPlayClick(context);

      const pausedFlag = localStorage.getItem("pausedOnCasting") === "true";
      context.pausedOnCasting = pausedFlag;

      if (context.pausedOnCasting) {
        controlCastMedia("pause", context);
      } else {
        controlCastMedia("play", context);
      }

      hideLoader(context);
    }, 1200);
  }
}

export {
  videoListeners,
  resumePlaybackOnLoadOnActiveSession,
  hideControlsShowLoader,
};
