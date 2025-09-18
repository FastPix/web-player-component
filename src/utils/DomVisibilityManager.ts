import { updateChapterMarkers } from "./ChaptersHandlers";
import { resizeVideoWidth } from "./ResizeVideo";
import { thumbnailSeeking } from "./thumbnailSeeking";

function updateControlsVisibility(context: any) {
  const controlsValue = getComputedStyle(context)
    .getPropertyValue("--controls")
    .trim();

  return controlsValue;
}

function hideAllControls(context: any) {
  context.controlsContainer.style.opacity = "0";
  if (context.playbackRateButton) {
    context.playbackRateButton.style.opacity = "0";
  }

  if (context.castButton) {
    context.castButton.style.opacity = "0";
  }

  if (context.playlistSlot) {
    context.playlistSlot.style.opacity = "0";
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

function showAllControls(context: any) {
  context.controlsContainer.style.opacity = "1";
  if (context.subtitleContainer) {
    context.subtitleContainer.style.opacity = "1";
  }
}

function showInitControls(context: any) {
  if (context.controlsContainerValue !== "none") {
    context.controlsContainer.style.setProperty("--controls", "flex");
  }
}

function hideInitControls(context: any) {
  context.controlsContainer.style.setProperty("--controls", "none");
}

function showInitialControls(
  context: any,
  videoWidth: number,
  playbackId: string | null,
  thumbnailUrlFinal: string | null,
  streamType: string | null
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
    thumbnailSeeking(context, playbackId, thumbnailUrlFinal ?? "");
  }

  showInitControls(context);
  updateChapterMarkers(context);
}

function showbackDropColor(context: any) {
  context.videoOverLay.classList.add("overlay-show");
}

function hideMenus(context: any) {
  const menus: any[] = [
    context.playbackRateDiv,
    context.resolutionMenu,
    context.audioMenu,
    context.subtitleMenu,
    context.playlistPanel,
  ].filter(Boolean);

  let shouldHide = false;
  try {
    shouldHide = menus.some((m) => m?.style?.display !== "none");
  } catch {}

  if (shouldHide) {
    menus.forEach((m) => {
      try {
        if (m?.style) m.style.display = "none";
      } catch {}
    });
  }

  // Close playlist panel if open (same smooth transition used elsewhere)
  try {
    if (context.playlistPanel?.classList?.contains("open")) {
      context.playlistPanel.classList.remove("open");
      context.playlistPanel.classList.add("closing");
      setTimeout(() => {
        try {
          context.playlistPanel?.classList?.remove("closing");
          if (context.playlistPanel?.style)
            context.playlistPanel.style.display = "none";
        } catch {}
      }, 500);
    }
  } catch {}
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

    if (context.streamType === "live-stream") {
      context.titleElement.className = "title";
    } else {
      context.titleElement.className = "title-on-demand";
    }

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
  updateControlsVisibility,
  hideMenus,
};
