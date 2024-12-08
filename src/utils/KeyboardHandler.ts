import { VolumeHighIcon, VolumeMutedIcon } from "../icons/VolumeIcon/index";
import { hidebackDropColor, showbackDropColor } from "./DomVisibilityManager";
import { adjustCurrentTimeBy, smoothTransitionToControls } from "./index";
import { moveSubtitlesDown, moveSubtitlesUp } from "./SubtitleHandler";
import {
  toggleFullScreen,
  toggleSubtitleWithKeyC,
  toggleVideoPlayback,
} from "./ToggleController";
import {
  updateVolumeButtonIcon,
  updateVolumeControlBackground,
} from "./VolumeController";

const isMouseOverControl = (context: any) => {
  return (
    context.progressBarContainer.matches(":hover") ||
    context.volumeControl.matches(":hover") ||
    context.pipButton.matches(":hover") ||
    context.fullScreenButton.matches(":hover") ||
    context.fastForwardButton.matches(":hover") ||
    context.rewindBackButton.matches(":hover") ||
    context.playPauseButton.matches(":hover") ||
    context.timeDisplay.matches(":hover") ||
    context.volumeButton.matches(":hover") ||
    context.volumeiOSButton.matches(":hover") ||
    context.resolutionMenu.matches(":hover") ||
    context.resolutionMenuButton.matches(":hover") ||
    context.playbackRateDiv.matches(":hover") ||
    context.playbackRateButton.matches(":hover")
  );
};

const showControls = (context: any) => {
  context.progressBarContainer.style.opacity = "1";
  context.volumeControl.style.opacity = "1";
  context.pipButton.style.opacity = "1";
  context.fullScreenButton.style.opacity = "1";
  context.ccButton.style.opacity = "1";
  context.fastForwardButton.style.opacity = "1";
  context.rewindBackButton.style.opacity = "1";
  context.playPauseButton.style.opacity = "1";
  context.timeDisplay.style.opacity = "1";
  context.parentVolumeDiv.style.opacity = "1";
  context.volumeButton.style.opacity = "1";
  context.playbackRateButton.style.opacity = "1";
  context.volumeiOSButton.style.opacity = "1";
  context.resolutionMenuButton.style.opacity = "1";
  context.titleElement.style.opacity = "1";
  context.mobileControls.style.opacity = "1";
  context.leftControls.style.opacity = "1";
  context.resolutionMenu.style.opacity = "1";
  context.playbackRateDiv.style.opacity = "1";
  context.liveStreamDisplay.style.opacity = "1";
  context.titleElement.style.opacity = "1";
  context.audioMenuButton.style.opacity = "1";
  context.subtitleMenu.style.opacity = "1";
  moveSubtitlesUp(context);
  showbackDropColor(context);
  context.resetHideControlsTimer();
};

const KeyBoardInputManager = (context: any) => {
  context.hideControlsTimer;
  context.lastInteractionTimestamp = Date.now();
  context.lastKeyPressTimestamp = Date.now();
  context.wrapper.addEventListener("keydown", () => {
    showControls(context);
    context.resetHideControlsTimer();
  });
  context.resetHideControlsTimer = () => {
    clearTimeout(context.hideControlsTimer);
    context.hideControlsTimer = setTimeout(hideControls, 3000);
  };
  const hideControls = () => {
    if (
      context.initialPlayClick &&
      !context.video.paused &&
      !isMouseOverControl(context)
    ) {
      const elapsedTime = Date.now() - context.lastInteractionTimestamp;

      if (elapsedTime >= 3000 || recentKeyboardInteraction()) {
        smoothTransitionToControls(context, true);
        smoothTransitionToControls(context, false);
        moveSubtitlesDown(context);
        hidebackDropColor(context);
      } else {
        clearTimeout(context.hideControlsTimer);
        context.hideControlsTimer = setTimeout(
          hideControls,
          3000 - elapsedTime
        );
      }
    }
  };

  const recentKeyboardInteraction = () => {
    return Date.now() - context.lastKeyPressTimestamp < 3000;
  };

  context.addEventListener("mousemove", () => {
    showControls(context);
  });
  context.addEventListener("mouseout", (event: any) => {
    setTimeout(() => {
      if (!context.contains(event?.relatedTarget)) {
        hideControls();
      }
    }, 200);
  });

  showControls(context);

  context.video.addEventListener("click", () => {
    toggleVideoPlayback(
      context,
      context.playbackId,
      context.thumbnailUrlFinal,
      context.streamType
    );
    context.playbackRateDiv.style.display = "none";
    context.resolutionMenu.style.display = "none";
  });

  if (!context.disableKeyboardControls) {
    document.addEventListener("keydown", (event) => {
      context.lastKeyPressTimestamp = Date.now();

      if (context.hotKeys && context.hotKeys.includes(event.code)) {
        event.preventDefault();
        return;
      }

      const noVolumePrefAttribute = context.hasAttribute("no-volume-pref");

      if (context.initialPlayClick && !context.retryButtonVisible) {
        switch (event.code) {
          case "Space":
          case "KeyK":
            if (!context.isLoading) {
              if (context.video.paused) {
                context.video.play();
                context.playPauseButton.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M6 19H10V5H6V19ZM14 5V19H18V5H14Z" fill="currentColor"></path>
                                              </svg>`;
              } else {
                context.video.pause();
                context.playPauseButton.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M3.5 14C3.36739 14 3.24021 13.9473 3.14645 13.8536C3.05268 13.7598 3 13.6326 3 13.5V2.5C3.00001 2.41312 3.02267 2.32773 3.06573 2.25227C3.1088 2.17681 3.17078 2.11387 3.24558 2.06966C3.32037 2.02545 3.4054 2.00149 3.49227 2.00015C3.57915 1.9988 3.66487 2.02012 3.741 2.062L13.741 7.562C13.8194 7.60516 13.8848 7.66857 13.9303 7.74562C13.9758 7.82266 13.9998 7.91051 13.9998 8C13.9998 8.08949 13.9758 8.17734 13.9303 8.25438C13.8848 8.33143 13.8194 8.39484 13.741 8.438L3.741 13.938C3.66718 13.9786 3.58427 14 3.5 14Z" fill="currentColor"></path>
                                              </svg>`;
              }
            } else {
              context.pauseAfterLoading = context.video.paused;
            }
            break;
          case "ArrowUp":
            if (context.video.volume < 1) {
              context.video.volume = Math.min(1, context.video.volume + 0.1);
              if (context.video.muted) {
                context.video.muted = false;
              }
              context.volumeControl.value = context.video.volume;
              updateVolumeControlBackground(context);
              updateVolumeButtonIcon(context);

              if (!noVolumePrefAttribute) {
                localStorage.setItem(
                  "savedVolumeIcon",
                  context.volumeButton.innerHTML
                );
                localStorage.setItem(
                  "savedVolume",
                  context.video.volume.toString()
                );
              } else {
                localStorage.removeItem("savedVolumeIcon");
                localStorage.removeItem("savedVolume");
              }
            }
            break;
          case "ArrowDown":
            if (context.video.volume > 0) {
              context.video.volume = Math.max(0, context.video.volume - 0.1);
              context.volumeControl.value = context.video.volume;
              updateVolumeControlBackground(context);
              updateVolumeButtonIcon(context);

              if (!noVolumePrefAttribute) {
                localStorage.setItem(
                  "savedVolumeIcon",
                  context.volumeButton.innerHTML
                );
                localStorage.setItem(
                  "savedVolume",
                  context.video.volume.toString()
                );
              } else {
                localStorage.removeItem("savedVolumeIcon");
                localStorage.removeItem("savedVolume");
              }
            }
            break;

          // Forward 10 seconds
          case "ArrowRight":
            if (context.streamType !== "live-stream") {
              event.preventDefault();
              context.forwardSeekOffset = context.getAttribute(
                "forward-seek-offset"
              )
                ? parseInt(context.getAttribute("forward-seek-offset"))
                : 10;
              adjustCurrentTimeBy(context, context.forwardSeekOffset);
            } else {
              return;
            }
            break;

          // Backward 10 seconds
          case "ArrowLeft":
            if (context.streamType !== "live-stream") {
              context.backwardSeekOffset = context.getAttribute(
                "backward-seek-offset"
              )
                ? parseInt(context.getAttribute("backward-seek-offset"))
                : 10;
              adjustCurrentTimeBy(context, -context.backwardSeekOffset);
            } else {
              return;
            }
            break;

          case "KeyM": // Mute/Unmute
            if (!noVolumePrefAttribute) {
              localStorage.setItem(
                "savedVolumeIcon",
                context.volumeButton.innerHTML
              );
            } else {
              localStorage.removeItem("savedVolumeIcon");
            }

            // Retrieve saved volume from local storage
            context.getSavedVolume = localStorage.getItem("savedVolume");
            const savedVolume: any = parseFloat(context.getSavedVolume);

            // Check if the volume is 0 and the video is muted
            if (context.video.muted || savedVolume === 0) {
              // If video is muted or volume is 0 in localStorage, set volume to 0.6 and unmute it
              context.video.muted = false;
              context.volumeButton.innerHTML = VolumeMutedIcon;
              // Set volume to 0.6
              context.volumeControl.value = "1";
              context.video.volume = 1;
            } else {
              // If video is not muted, mute it
              context.video.muted = true;
              context.volumeButton.innerHTML = VolumeHighIcon;

              // Set volume-control-value and volume to 0 for muted state
              context.volumeControl.value = 0;
              context.video.volume = 0;
            }

            // Update UI
            updateVolumeControlBackground(context);
            updateVolumeButtonIcon(context);

            if (!noVolumePrefAttribute) {
              localStorage.setItem(
                "savedVolume",
                context.video.volume.toString()
              );
              localStorage.setItem(
                "savedVolumeIcon",
                context.volumeButton.innerHTML
              );
            } else {
              localStorage.removeItem("savedVolume");
              localStorage.removeItem("savedVolumeIcon");
            }
            break;

          case "KeyF":
            toggleFullScreen(context);
            break;

          case "KeyC":
            toggleSubtitleWithKeyC(context);
            break;

          default:
            break;
        }
      }
    });
  }
};

export { isMouseOverControl, showControls, KeyBoardInputManager };
