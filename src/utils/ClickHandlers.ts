import { showError } from "./ErrorElement";
import { adjustCurrentTimeBy, Context } from "./index";

import { VolumeHighIcon, VolumeMutedIcon } from "../icons/VolumeIcon/index";
import {
  updateVolumeButtonIcon,
  updateVolumeControlBackground,
} from "./VolumeController";
import {
  hideShowSubtitlesMenu,
  toggleAudioMenu,
  toggleFullScreen,
  togglePlaybackRateButtons,
  toggleResolutionMenu,
  toggleSubtitlesMenu,
  toggleVideoPlayback,
} from "./ToggleController";
import { PauseIcon, PlayIcon } from "../icons/PlayPauseIcon/index";
import { hideMenus } from "./DomVisibilityManager";

function subtileButtonClickHandler(context: any) {
  context.ccButton.addEventListener("click", () => {
    if (context.subtitleMenu.style.display === "flex") {
      context.subtitleMenu.style.display = "none";
    } else {
      toggleSubtitlesMenu(context);
    }

    if (context.resolutionMenu.style.display !== "none") {
      toggleResolutionMenu(context);
    }

    if (context.playbackRateDiv.style.display !== "none") {
      togglePlaybackRateButtons(context);
    }

    if (context.audioMenu.style.display !== "none") {
      toggleAudioMenu(context);
    }
  });
}

function audioButtonClickHandler(context: any) {
  context.audioMenuButton.addEventListener("click", () => {
    // Close the resolution menu if it's open
    if (context.playbackRateDiv.style.display !== "none") {
      togglePlaybackRateButtons(context);
    }

    if (context.resolutionMenu.style.display !== "none") {
      toggleResolutionMenu(context);
    }

    if (context.subtitleMenu.style.display !== "none") {
      hideShowSubtitlesMenu(context);
    }

    if (context.playbackRateDiv.style.display !== "none") {
      togglePlaybackRateButtons(context);
    }

    toggleAudioMenu(context);
  });
}

function fullScreenButtonClickHandler(context: any) {
  context.fullScreenButton.addEventListener("click", () => {
    toggleFullScreen(context);
    hideMenus(context);
  });
}

function fastForwardButtonClickHandler(context: Context) {
  context.forwardSeekOffset = context.forwardSeekAttribute
    ? parseInt(context.forwardSeekAttribute)
    : 10;
  adjustCurrentTimeBy(context, context.forwardSeekOffset); // Increase currentTime by forwardSeekOffset seconds
  hideMenus(context);
}

function rewindButtonClickHandler(context: Context) {
  // Default time is 10sec
  context.backwardSeekOffset = context.backwardSeekAttribute
    ? parseInt(context.backwardSeekAttribute)
    : 10;
  adjustCurrentTimeBy(context, -context.backwardSeekOffset); // Decrease currentTime by backwardSeekOffset seconds
  hideMenus(context);
}

function fastForwardRewindButtonClickHandler(context: any) {
  context.fastForwardButton.addEventListener("click", () => {
    fastForwardButtonClickHandler(context);
  });

  // Listen for decrease time button clicks
  context.rewindBackButton.addEventListener("click", () => {
    rewindButtonClickHandler(context);
  });
}

function toggleKeyForPlayPause(context: any) {
  if (context.video.paused) {
    context.video.play();
    context.playPauseButton.innerHTML = PauseIcon;
  } else {
    context.video.pause();
    context.playPauseButton.innerHTML = PlayIcon;
  }
  hideMenus(context);
}

function VolumeButtonClickHandler(context: any) {
  context.volumeButton.addEventListener("click", () => {
    const noVolumePrefAttribute = context.hasAttribute("no-volume-pref");

    if (!noVolumePrefAttribute) {
      localStorage.setItem("savedVolumeIcon", context.volumeButton.innerHTML);
    } else {
      localStorage.removeItem("savedVolumeIcon");
    }

    // Retrieve saved volume from local storage
    const savedVolume = parseFloat(localStorage.getItem("savedVolume") ?? "1");

    // Check if the volume is 0 and the video is muted
    if (context.video.muted || savedVolume === 0) {
      // If video is muted or volume is 0 in localStorage, set volume to 0.6 and unmute it
      context.video.muted = false;
      context.volumeButton.innerHTML = VolumeHighIcon;

      // Set volume to 1
      context.volumeControl.value = "1";
      context.video.volume = 1;
    } else {
      context.video.muted = true;
      context.volumeButton.innerHTML = VolumeMutedIcon;
      context.volumeControl.value = 0; // Set volume control value to 0 for muted state
      context.video.volume = 0; // Set video volume to 0 when muting
    }

    // Update UI
    updateVolumeControlBackground(context);
    updateVolumeButtonIcon(context);

    if (!noVolumePrefAttribute) {
      // Save the volume to localStorage
      localStorage.setItem("savedVolume", context.video.volume.toString());
      localStorage.setItem("savedVolumeIcon", context.volumeButton.innerHTML);
    } else {
      localStorage.removeItem("savedVolume");
      localStorage.removeItem("savedVolumeIcon");
    }
    hideMenus(context);
  });
}

function pipButtonClickHandler(context: any) {
  context.pipButton.addEventListener("click", () => {
    if (
      document.pictureInPictureEnabled &&
      !context.video.disablePictureInPicture
    ) {
      if (document.pictureInPictureElement) {
        document
          .exitPictureInPicture()
          .then(() => {})
          .catch((error) => {
            showError(context, "Error exiting Picture-in-Picture");
          });
      } else {
        context.video
          .requestPictureInPicture()
          .then(() => {})
          .catch((error: any) => {
            showError(context, "Error entering Picture-in-Picture");
          });
      }
    } else {
      showError(
        context,
        "Picture-in-Picture is not supported in this browser."
      );
    }
    hideMenus(context);
  });
}

function playPauseButtonClickHandler(context: any) {
  context.playPauseButton.addEventListener("click", () => {
    context.videoEnded = false; // Reset the flag when the user manually starts playback
    toggleVideoPlayback(
      context,
      context.playbackId,
      context.thumbnailUrlFinal,
      context.streamType
    );
  });
}

function playbackRateButtonClickHandler(context: any) {
  context.playbackRateButton.addEventListener("click", () => {
    if (context.audioMenu.style.display !== "none") {
      toggleAudioMenu(context);
    }

    if (context.resolutionMenu.style.display !== "none") {
      toggleResolutionMenu(context);
    }

    if (context.subtitleMenu.style.display !== "none") {
      hideShowSubtitlesMenu(context);
    }
    togglePlaybackRateButtons(context);
  });
}

export {
  subtileButtonClickHandler,
  audioButtonClickHandler,
  fullScreenButtonClickHandler,
  fastForwardButtonClickHandler,
  rewindButtonClickHandler,
  fastForwardRewindButtonClickHandler,
  VolumeButtonClickHandler,
  pipButtonClickHandler,
  playPauseButtonClickHandler,
  playbackRateButtonClickHandler,
  toggleKeyForPlayPause,
};
