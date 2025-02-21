import {
  fastForwardButtonClickHandler,
  rewindButtonClickHandler,
  toggleKeyForPlayPause,
} from "./ClickHandlers";
import {
  hidebackDropColor,
  hideMenus,
  showbackDropColor,
} from "./DomVisibilityManager";
import { smoothTransitionToControls } from "./index";
import { moveSubtitlesDown, moveSubtitlesUp } from "./SubtitleHandler";
import {
  toggleFullScreen,
  toggleSubtitleWithKeyC,
  toggleVideoPlayback,
} from "./ToggleController";
import { adjustVolume, toggleMuteUnmute } from "./VolumeController";

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
  if (context.controlsContainer.contains(context.mobileControls)) {
    context.mobileControls.style.opacity = "1";
  }
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
    hideMenus(context);
  });

  if (!context.disableKeyboardControls) {
    document.addEventListener("keydown", (event) => {
      context.lastKeyPressTimestamp = Date.now();
      if (context.hotKeys?.includes(event.code)) {
        event.preventDefault();
        return;
      }

      if (!context.initialPlayClick || context.retryButtonVisible) return;

      const noVolumePref = context.hasAttribute("no-volume-pref");

      const keyActions: Record<string, () => void> = {
        KeyK: () => {
          if (!context.isLoading) {
            toggleKeyForPlayPause(context);
          } else {
            context.pauseAfterLoading = context.video.paused;
          }
        },
        ArrowUp: () =>
          context.video.volume < 1 && adjustVolume(context, 0.1, noVolumePref),
        ArrowDown: () =>
          context.video.volume > 0 && adjustVolume(context, -0.1, noVolumePref),
        ArrowRight: () =>
          context.streamType !== "live-stream" &&
          (event.preventDefault(), fastForwardButtonClickHandler(context)),
        ArrowLeft: () =>
          context.streamType !== "live-stream" &&
          (event.preventDefault(), rewindButtonClickHandler(context)),
        KeyM: () => toggleMuteUnmute(context, noVolumePref),
        KeyF: () => toggleFullScreen(context),
        KeyC: () => toggleSubtitleWithKeyC(context),
      };

      keyActions[event.code]?.();
    });
  }
};

export { isMouseOverControl, showControls, KeyBoardInputManager };
