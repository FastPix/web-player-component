import { updateChapterMarkers } from "./ChaptersHandlers";
import { resizeVideoWidth } from "./ResizeVideo";
import { thumbnailSeeking } from "./thumbnailSeeking";

function showAllControls(context: any) {
  context.controlsContainer.style.opacity = "1";

  if (context.subtitleContainer) {
    context.subtitleContainer.style.opacity = "1";
  }
}

function hideAllControls(context: any) {
  context.controlsContainer.style.opacity = "0";
  if (context.playbackRateButton) {
    context.playbackRateButton.style.opacity = "0";
  }

  if (context.playbackRateDiv) {
    context.playbackRateDiv.style.opacity = "0";
  }
  context.volumeiOSButton.style.opacity = "0";
  context.resolutionMenuButton.style.opacity = "0";
  if (context.titleElement) {
    context.titleElement.style.opacity = "0";
  }

  if (context.subtitleContainer) {
    context.subtitleContainer.style.opacity = "0";
  }
}

function showInitControls(context: any) {
  context.controlsContainer.style.display = "flex";
}

function hideInitControls(context: any) {
  context.controlsContainer.style.display = "none";
}

function showInitialControls(
  context: any,
  videoWidth: number,
  playbackId: any,
  thumbnailUrlFinal: any,
  streamType: string
) {
  // Check if the mobile control buttons block should be displayed
  if (context.controlsContainer.contains(context.mobileControlButtonsBlock)) {
    context.mobileControlButtonsBlock.style.display = "flex";
  }

  if (videoWidth >= 471) {
    context.playPauseButton.style.position = "absolute"; // Uncomment if needed
    context.playPauseButton.id = "playPauseAfterClickBreakPoint"; // Fix typo
  }

  // Update styles based on video width
  resizeVideoWidth(context);

  // Handle specific stream types
  if (streamType === "on-demand") {
    thumbnailSeeking(context, playbackId, thumbnailUrlFinal);
  }

  showInitControls(context);
  updateChapterMarkers(context);
}

function showbackDropColor(context: any) {
  context.videoOverLay.classList.add("overlay-show");
}

function hidebackDropColor(context: any) {
  context.videoOverLay.classList.remove("overlay-show");
}

function showLoader(context: any) {
  context.loader.style.display = "block";

  if (context.video.offsetWidth <= 471) {
    context.playPauseButton.classList.remove("showPlayButton");
  }
}

function hideLoader(context: any) {
  context.loader.style.display = "none"; // none
  context.playPauseButton.classList.add("showPlayButton");
}

function handleTitleContainer(context: any) {
  if (context.titleText) {
    context.titleElement.textContent = context.titleText;
    context.streamType === "live-stream"
      ? (context.titleElement.className = "title")
      : (context.titleElement.className = "title-on-demand");
    context.parentLiveTitleContainer.appendChild(context.titleElement);
  }

  if (context.streamType === "live-stream") {
    context.liveStreamDisplay.textContent = "LIVE";
    context.liveStreamDisplay.className = "liveTag";

    context.fastForwardButton.style.display = "none";
    context.rewindBackButton.style.display = "none";
    context.playbackRateButton.style.display = "none";
    context.progressBarContainer.style.display = "none";

    if (!context.hasAttribute("target-live-window")) {
      context.bottomRightDiv.removeChild(context.playbackRateButton);
      context.timeDisplay.style.display = "none";
    } else {
      context.bottomRightDiv.appendChild(context.playbackRateButton);
      context.timeDisplay.style.display = "flex";
    }

    context.parentLiveTitleContainer.appendChild(context.liveStreamDisplay);
  }
}

export {
  showInitialControls,
  showAllControls,
  hideAllControls,
  hideInitControls,
  showLoader,
  hideLoader,
  showbackDropColor,
  hidebackDropColor,
  handleTitleContainer,
};