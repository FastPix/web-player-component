import { VolumeHighIcon, VolumeMutedIcon } from "../icons/VolumeIcon/index";
import { isChromecastConnected } from "./CastHandler";

// Helper function to safely remove child element
function removeChildIfExists(parent: any, child: any) {
  if (parent && child && parent.contains(child)) {
    parent.removeChild(child);
  }
}

// Helper function to hide element if it exists
function hideElementIfExists(element: any) {
  if (element) {
    element.style.display = "none";
  }
}

// Helper function to handle cart button visibility for mini devices
function handleCartButtonForMiniDevices(context: any) {
  if (context.cartButton) {
    const theme = context.getAttribute ? context.getAttribute("theme") : null;
    if (theme !== "shoppable-shorts") {
      context.cartButton.style.display = "none";
    }
  }
}

function removeUnusedControlsForMiniDevices(context: any) {
  if (window.innerWidth > 768) return; // Exit if not a mini device

  // Remove controls from leftControls
  removeChildIfExists(context.leftControls, context.parentVolumeDiv);
  removeChildIfExists(
    context.leftControls,
    context.forwardRewindControlsWrapper
  );
  removeChildIfExists(context.leftControls, context.prevButton);
  removeChildIfExists(context.leftControls, context.nextButton);
  removeChildIfExists(context.leftControls, context.timeDisplay);

  // Remove controls from mobileControlButtonsBlock
  removeChildIfExists(
    context.mobileControlButtonsBlock,
    context.forwardRewindControlsWrapper
  );

  // Remove controls from forwardRewindControlsWrapper
  removeChildIfExists(
    context.forwardRewindControlsWrapper,
    context.rewindBackButton
  );
  removeChildIfExists(
    context.forwardRewindControlsWrapper,
    context.fastForwardButton
  );

  // Handle cart button visibility
  handleCartButtonForMiniDevices(context);

  // Hide elements
  hideElementIfExists(context.subtitleContainer);
  hideElementIfExists(context.forwardRewindControlsWrapper);
}

function removeUnusedControlsForSmallDevices(context: any) {
  if (window.innerWidth > 768) return; // Exit if not a mini device
  if (context.leftControls.contains(context.forwardRewindControlsWrapper)) {
    context.leftControls.removeChild(context.forwardRewindControlsWrapper);
  }
  if (
    context.mobileControlButtonsBlock.contains(
      context.forwardRewindControlsWrapper
    )
  ) {
    context.mobileControlButtonsBlock.removeChild(
      context.forwardRewindControlsWrapper
    );
  }
  if (context.leftControls.contains(context.timeDisplay)) {
    context.leftControls.removeChild(context.timeDisplay);
  }

  if (context.forwardRewindControlsWrapper.contains(context.rewindBackButton)) {
    context.forwardRewindControlsWrapper.removeChild(context.rewindBackButton);
  }

  if (
    context.forwardRewindControlsWrapper.hasChildNodes(
      context.fastForwardButton
    )
  ) {
    context.forwardRewindControlsWrapper.removeChild(context.fastForwardButton);
  }

  // Show cartButton on small devices
  if (context.cartButton) {
    context.cartButton.style.display = "flex";
  }

  // Show subtitleContainer on small devices
  if (context.subtitleContainer) {
    context.subtitleContainer.style.display = "block";
  }

  // Hide forward/rewind controller on small devices
  if (context.forwardRewindControlsWrapper) {
    context.forwardRewindControlsWrapper.style.display = "none";
  }
}

function modifyControlsForMobileDevices(context: any) {
  if (
    context.controlsContainer.getElementsByClassName("timeDisplay").length > 0
  ) {
    context.leftControls.removeChild(context.timeDisplay);
  }
  if (
    context.forwardRewindControlsWrapper.hasChildNodes(context.rewindBackButton)
  ) {
    context.forwardRewindControlsWrapper.removeChild(context.rewindBackButton);
  }
  if (
    context.forwardRewindControlsWrapper.hasChildNodes(
      context.fastForwardButton
    )
  ) {
    context.forwardRewindControlsWrapper.removeChild(context.fastForwardButton);
  }

  // Show cartButton on responsive devices
  if (context.cartButton) {
    context.cartButton.style.display = "flex";
  }

  // Show subtitleContainer on responsive devices
  if (context.subtitleContainer) {
    context.subtitleContainer.style.display = "block";
  }

  // Hide forward/rewind controller on responsive devices
  if (context.forwardRewindControlsWrapper) {
    context.forwardRewindControlsWrapper.style.display = "none";
  }
}

function removeMobileControls(context: any) {
  if (context.controlsContainer.hasChildNodes(context.mobileControls)) {
    context.controlsContainer.removeChild(context.mobileControls);
  }
}

function AppendMobileControls(context: any) {
  //  Appending Mobile Controls to parent div
  context.controlsContainer.appendChild(context.mobileControls);

  //  Creating a mobile control buttons block
  context.mobileControls.appendChild(context.mobileControlButtonsBlock);

  //  Appending Forward & Rewind Controls to MobileControls div
  context.mobileControlButtonsBlock.appendChild(context.rewindBackButton);
  context.mobileControlButtonsBlock.appendChild(context.fastForwardButton);

  const forwardSkipButtonValue = getComputedStyle(
    context.mobileControlButtonsBlock
  )
    .getPropertyValue("--forward-skip-button")
    .trim();

  const rewindBackButtonValue = getComputedStyle(
    context.mobileControlButtonsBlock
  )
    .getPropertyValue("--backward-skip-button")
    .trim();

  const nextButtonValue = getComputedStyle(context.mobileControlButtonsBlock)
    .getPropertyValue("--next-episode-button")
    .trim();

  const prevButtonValue = getComputedStyle(context.mobileControlButtonsBlock)
    .getPropertyValue("--previous-episode-button")
    .trim();

  if (forwardSkipButtonValue === "none") {
    context.mobileControls.classList.add("forwardSkipButtonHidden");
  }

  if (rewindBackButtonValue === "none") {
    context.mobileControls.classList.add("rewindBackButtonHidden");
  }

  if (nextButtonValue === "none") {
    context.mobileControls.classList.add("nextButtonDisabledMobile");
  }

  if (prevButtonValue === "none") {
    context.mobileControls.classList.add("prevButtonDisabledMobile");
  }

  if (context.controlsContainer.classList.contains("hasPlaylist")) {
    context.mobileControlButtonsBlock.prepend(context.prevButton);
    context.mobileControlButtonsBlock.appendChild(context.nextButton);
  }
}

function updateVolumeUIDuringResize(context: any) {
  if (context.video.muted) {
    context.volumeiOSButton.innerHTML = VolumeMutedIcon;
  } else {
    context.volumeiOSButton.innerHTML = VolumeHighIcon;
  }

  if (
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    typeof window !== "undefined" &&
    !(window as any).MSStream
  ) {
    // iOS: use iOS volume button and hide standard controls via CSS class
    context.parentVolumeDiv.classList.add("volumeControliOS");
    context.volumeiOSButton.style.display = "flex";
  } else {
    // Non-iOS: ensure standard controls visible and iOS class removed
    context.parentVolumeDiv.classList.remove("volumeControliOS");
    context.volumeControl.style.display = "flex";
    context.volumeButton.style.display = "flex";
    context.volumeiOSButton.style.display = "none";
  }
}

function freezeLocalVideoDuringCasting(context: any): void {
  if (isChromecastConnected()) {
    const video = context.video;
    if (!video.paused) {
      video.pause();
    }
  }
}

// Set max height for menus
const updateMenuHeight = (
  menu: HTMLElement,
  offset: number,
  videoHeight: number
) => {
  menu.style.maxHeight = `${videoHeight - offset}px`;
};

function updateMenuHeightResponsive(context: any) {
  const videoHeight = context.video.offsetHeight;

  updateMenuHeight(context.resolutionMenu, 59, videoHeight);
  updateMenuHeight(context.audioMenu, 79, videoHeight);
  updateMenuHeight(context.subtitleMenu, 79, videoHeight);
  updateMenuHeight(context.thumbnail, 59, videoHeight);
}

function hidePlaylistButtonIfNoPlaylist(context: any) {
  if (
    !context.controlsContainer.classList.contains("hasPlaylist") &&
    context.bottomRightDiv.contains(context.playlistButton)
  ) {
    context.bottomRightDiv.removeChild(context.playlistButton);
  }
}

function miniDevice(
  context: any,
  videoHeight: number,
  scalingFactor: number,
  sizeClass: string,
  chapterMarkers: any
) {
  context.forwardRewindControlsWrapper.id = "forwardRewindControlsWrapperMini";
  context.forwardRewindControlsWrapper.style.bottom = "50%";
  context.forwardRewindControlsWrapper.style.display = "none";
  context.forwardRewindControlsWrapper.style.opacity = "0";

  // Ensure mobile buttons are visible without requiring a click
  context.mobileControls.style.display = "flex";
  context.mobileControlButtonsBlock.style.display = "flex";
  context.rewindBackButton.style.opacity = 1;
  context.fastForwardButton.style.opacity = 1;
  context.progressBar.id = "progressBarMini";
  context.bottomRightDiv.id = "bottomRightDivMini";
  context.parentVolumeDiv.id = "parentVolumeMini";

  removeUnusedControlsForMiniDevices(context);

  context.leftControls.classList.add("mobile");
  context.playPauseButton.classList.add("mobile");
  context.titleElement.classList.add("mobile");
  context.bottomRightDiv.classList.add("mobile");
  context.subtitleContainer.classList.add("mobile");
  context.progressBarContainer.classList.add("mobile");
  context.progressBar.classList.add("mobile");
  context.parentVolumeDiv.classList.add("mobile");

  if (context.playlistPanel) {
    updateMenuHeight(context.playlistPanel, 20, videoHeight);
  }

  // for subtitle styling of medium devices
  context.subtitleContainer.classList.add("medium");
  context.subtitleContainer.classList.remove("large");

  context.progressBarContainer.classList.remove("mobile");
  context.progressBar.classList.remove("mobile");

  // Update chapter marker classes
  chapterMarkers.forEach(
    (marker: { classList: { add: (arg0: string) => any } }) =>
      marker.classList.add("chapter-marker-mini")
  );

  // Update chapter marker classes
  chapterMarkers.forEach(
    (marker: { classList: { remove: (arg0: string) => any } }) =>
      marker.classList.remove("chapter-marker-md")
  );

  // Update chapter marker classes
  chapterMarkers.forEach(
    (marker: { classList: { remove: (arg0: string) => any } }) =>
      marker.classList.remove("chapter-marker-lg")
  );

  //  Parent div adding mobile class
  context.controlsContainer.classList.add("mobile");
}

function smallMobileDevice(
  context: any,
  videoHeight: number,
  scalingFactor: number,
  sizeClass: string,
  chapterMarkers: any
) {
  context.forwardRewindControlsWrapper.id = "forwardRewindControlsWrapperMini";
  context.forwardRewindControlsWrapper.style.bottom = "50%";
  context.forwardRewindControlsWrapper.style.display = "none";
  context.forwardRewindControlsWrapper.style.opacity = "0";
  context.mobileControlButtonsBlock.style.display = "flex";
  context.progressBar.id = "progressBarMini";
  context.bottomRightDiv.id = "bottomRightDivMini";
  context.parentVolumeDiv.id = "parentVolumeMini";
  context.leftControls.appendChild(context.parentVolumeDiv);

  // Add mobile Class for leftControls
  context.leftControls.classList.add("mobile");
  context.playPauseButton.classList.add("mobile");
  context.titleElement.classList.add("mobile");
  context.bottomRightDiv.classList.add("mobile");
  context.subtitleContainer.classList.add("mobile");
  context.progressBarContainer.classList.add("mobile");
  context.progressBar.classList.add("mobile");
  context.parentVolumeDiv.classList.add("mobile");

  if (context.playlistPanel) {
    updateMenuHeight(context.playlistPanel, 20, videoHeight);
  }

  removeUnusedControlsForSmallDevices(context);

  // for subtitle styling of medium devices
  context.subtitleContainer.classList.add("medium");
  context.subtitleContainer.classList.remove("large");

  context.progressBar.classList.remove("mobile");

  // Update chapter marker classes
  chapterMarkers.forEach(
    (marker: { classList: { add: (arg0: string) => any } }) =>
      marker.classList.add("chapter-marker-mini")
  );

  // Update chapter marker classes
  chapterMarkers.forEach(
    (marker: { classList: { remove: (arg0: string) => any } }) =>
      marker.classList.remove("chapter-marker-md")
  );

  // Update chapter marker classes
  chapterMarkers.forEach(
    (marker: { classList: { remove: (arg0: string) => any } }) =>
      marker.classList.remove("chapter-marker-lg")
  );

  //  Parent div adding mobile class
  context.controlsContainer.classList.add("mobile");
}

function responsiveDevice(
  context: any,
  videoHeight: number,
  scalingFactor: number,
  sizeClass: string,
  chapterMarkers: any
) {
  context.progressBar.id = "progressBarResponsive";
  context.bottomRightDiv.id = "bottomRightDivResponsive";
  context.forwardRewindControlsWrapper.id =
    "forwardRewindControlsWrapperResponsive";
  context.forwardRewindControlsWrapper.style.bottom = "50%";
  context.mobileControlButtonsBlock.style.display = "flex";
  context.timeDisplay.id = "timeDisplayResponsive";
  context.parentVolumeDiv.id = "parentVolumeResponsive";
  context.leftControls.appendChild(context.parentVolumeDiv);
  context.leftControls.appendChild(context.volumeiOSButton);

  modifyControlsForMobileDevices(context);

  if (context.playlistPanel) {
    updateMenuHeight(context.playlistPanel, 79, videoHeight);
  }

  context.leftControls.classList.add("mobile");
  context.playPauseButton.classList.add("mobile");
  context.titleElement.classList.add("mobile");
  context.bottomRightDiv.classList.add("mobile");
  context.subtitleContainer.classList.add("mobile");
  context.progressBarContainer.classList.add("mobile");
  context.progressBar.classList.add("mobile");

  context.subtitleContainer.classList.remove("medium");
  context.subtitleContainer.classList.remove("large");
  context.progressBarContainer.classList.remove("medium");

  // Update chapter marker classes
  chapterMarkers.forEach(
    (marker: { classList: { add: (arg0: string) => any } }) =>
      marker.classList.add("chapter-marker-mini")
  );

  // Update chapter marker classes
  chapterMarkers.forEach(
    (marker: { classList: { remove: (arg0: string) => any } }) =>
      marker.classList.remove("chapter-marker-md")
  );

  // Update chapter marker large
  chapterMarkers.forEach(
    (marker: { classList: { remove: (arg0: string) => any } }) =>
      marker.classList.remove("chapter-marker-lg")
  );

  //  Parent div adding mobile class
  context.controlsContainer.classList.add("mobile");
}

function tabletDevice(
  context: any,
  videoHeight: number,
  scalingFactor: number,
  sizeClass: string,
  chapterMarkers: any
) {
  if (context.ccButton.style.display !== "none") {
    context.playbackRateButton.classList.add("showPlaybackrateButton");
  } else {
    context.playbackRateButton.classList.remove("showPlaybackrateButton");
  }

  context.progressBar.id = "progressBarResponsiveMd";
  context.bottomRightDiv.id = "bottomRightDivMd";
  context.forwardRewindControlsWrapper.id = "forwardRewindControlsWrapperMd";
  context.forwardRewindControlsWrapper.style.bottom = "10px";
  context.parentVolumeDiv.id = "parentVolumeResponsiveMd";
  context.playPauseButton.id = "playPauseButtonMd";

  if (context.playlistPanel) {
    updateMenuHeight(context.playlistPanel, 100, videoHeight);
  }

  // Append the time display element to the parent div
  context.leftControls.prepend(context.forwardRewindControlsWrapper);
  if (context.controlsContainer.classList.contains("hasPlaylist")) {
    context.forwardRewindControlsWrapper.prepend(context.nextButton);
    context.forwardRewindControlsWrapper.prepend(context.prevButton);
  }
  context.forwardRewindControlsWrapper.style.display = "inline-flex";
  context.forwardRewindControlsWrapper.style.opacity = "1";
  context.leftControls.appendChild(context.timeDisplay);
  context.timeDisplay.style.opacity = "1";

  //  Forward & Rewind buttons
  context.forwardRewindControlsWrapper.appendChild(context.rewindBackButton);
  context.rewindBackButton.style.opacity = 1;
  context.forwardRewindControlsWrapper.appendChild(context.fastForwardButton);
  context.fastForwardButton.style.opacity = 1;
  context.leftControls.appendChild(context.parentVolumeDiv);
  context.leftControls.appendChild(context.volumeiOSButton);

  //  Remove Mobile Controls
  if (context.controlsContainer.hasChildNodes(context.mobileControls)) {
    context.controlsContainer.removeChild(context.mobileControls);
  }

  // for subtitle styling of medium devices
  context.subtitleContainer.classList.add("medium");
  context.subtitleContainer.classList.remove("large");

  // Remove mobile class from leftControls class
  context.leftControls.classList.remove("mobile");
  context.playPauseButton.classList.remove("mobile");
  context.titleElement.classList.remove("mobile");
  context.bottomRightDiv.classList.remove("mobile");
  context.subtitleContainer.classList.remove("mobile");
  context.progressBarContainer.classList.remove("mobile");
  context.progressBar.classList.remove("mobile");
  context.parentVolumeDiv.classList.remove("mobile");

  context.progressBarContainer.classList.add("medium");

  context.progressBarContainer.classList.remove("large");

  // Update chapter marker classes
  chapterMarkers.forEach(
    (marker: { classList: { remove: (arg0: string) => any } }) =>
      marker.classList.remove("chapter-marker-mini")
  );

  // Update chapter marker classes
  chapterMarkers.forEach(
    (marker: { classList: { add: (arg0: string) => any } }) =>
      marker.classList.add("chapter-marker-md")
  );

  // Update chapter marker large
  chapterMarkers.forEach(
    (marker: { classList: { remove: (arg0: string) => any } }) =>
      marker.classList.remove("chapter-marker-lg")
  );

  //  Parent div removing mobile class
  context.controlsContainer.classList.remove("mobile");

  // Show elements that were hidden on mini devices
  if (context.cartButton) {
    context.cartButton.style.display = "flex";
  }
  if (context.subtitleContainer) {
    context.subtitleContainer.style.display = "block";
  }
  if (context.forwardRewindControlsWrapper) {
    context.forwardRewindControlsWrapper.style.display = "inline-flex";
  }
}

function portraitMode(
  context: any,
  videoHeight: number,
  scalingFactor: number,
  sizeClass: string,
  chapterMarkers: any
) {
  // Apply styles for portrait mode
  context.progressBar.id = "progressBarResponsiveHeightWidth";
  context.parentVolumeDiv.id = "parentVolumeHeightWidth";
  context.bottomRightDiv.id = "bottomRightDivHeightWidth";
  context.leftControls.classList.remove("mobile");
  context.titleElement.classList.remove("mobile");
  context.progressBarContainer.classList.remove("mobile");
  context.progressBar.classList.remove("mobile");

  context.subtitleContainer.classList.remove("large");

  // for subtitle styling of medium devices
  context.subtitleContainer.classList.add("medium");

  // Append the time display element to the parent div
  context.leftControls.prepend(context.forwardRewindControlsWrapper);
  context.forwardRewindControlsWrapper.style.display = "inline-flex";
  context.forwardRewindControlsWrapper.style.opacity = "1";
  context.leftControls.appendChild(context.timeDisplay);
  context.timeDisplay.style.opacity = "1";

  if (context.controlsContainer.classList.contains("hasPlaylist")) {
    context.leftControls.appendChild(context.prevButton);
    context.leftControls.appendChild(context.nextButton);
  }
  //  Forward & Rewind buttons
  context.forwardRewindControlsWrapper.appendChild(context.rewindBackButton);
  context.rewindBackButton.style.opacity = 1;
  context.forwardRewindControlsWrapper.appendChild(context.fastForwardButton);
  context.fastForwardButton.style.opacity = 1;
  context.leftControls.appendChild(context.parentVolumeDiv);
  context.leftControls.appendChild(context.volumeiOSButton);

  //  Remove Mobile Controls
  removeMobileControls(context);

  // Remove mobile class from leftControls class
  context.leftControls.classList.remove("mobile");
  context.playPauseButton.classList.remove("mobile");
  context.titleElement.classList.remove("mobile");
  context.bottomRightDiv.classList.remove("mobile");
  context.wrapper.classList.remove("mobile");
  context.progressBarContainer.classList.remove("mobile");
  context.progressBar.classList.remove("mobile");
  context.parentVolumeDiv.classList.remove("mobile");

  // Update chapter marker classes
  chapterMarkers.forEach(
    (marker: { classList: { remove: (arg0: string) => any } }) =>
      marker.classList.remove("chapter-marker-mini")
  );

  // Update chapter marker classes
  chapterMarkers.forEach(
    (marker: { classList: { remove: (arg0: string) => any } }) =>
      marker.classList.remove("chapter-marker-md")
  );

  // Update chapter marker large
  chapterMarkers.forEach(
    (marker: { classList: { remove: (arg0: string) => any } }) =>
      marker.classList.remove("chapter-marker-lg")
  );

  //  Parent div removing mobile class
  context.controlsContainer.classList.remove("mobile");

  // Show elements that were hidden on mini devices
  if (context.cartButton) {
    context.cartButton.style.display = "flex";
  }
  if (context.subtitleContainer) {
    context.subtitleContainer.style.display = "block";
  }
  if (context.forwardRewindControlsWrapper) {
    context.forwardRewindControlsWrapper.style.display = "inline-flex";
  }
}

// Helper functions to reduce cognitive complexity
function checkControlsOverlap(context: any): boolean {
  const leftControls = context.leftControls;
  const bottomRightControls = context.bottomRightDiv;

  if (!leftControls || !bottomRightControls) return false;

  // Get bounding rectangles
  const leftRect = leftControls.getBoundingClientRect();
  const rightRect = bottomRightControls.getBoundingClientRect();

  // Check for overlap
  const isOverlapping = !(
    leftRect.right < rightRect.left ||
    leftRect.left > rightRect.right ||
    leftRect.bottom < rightRect.top ||
    leftRect.top > rightRect.bottom
  );

  return isOverlapping;
}

function getOverlapWidth(context: any): number {
  const leftControls = context.leftControls;
  const bottomRightControls = context.bottomRightDiv;

  if (!leftControls || !bottomRightControls) return 0;

  // Get bounding rectangles
  const leftRect = leftControls.getBoundingClientRect();
  const rightRect = bottomRightControls.getBoundingClientRect();

  // Calculate overlap width
  const overlapLeft = Math.max(leftRect.left, rightRect.left);
  const overlapRight = Math.min(leftRect.right, rightRect.right);
  const overlapWidth = Math.max(0, overlapRight - overlapLeft);

  return overlapWidth;
}

function repositionHotspots(context: any) {
  // Only reposition if hotspots are visible
  if (!context.isHotspotVisible) return;

  const hotspots = context.wrapper?.querySelectorAll(".hotspot");
  if (!hotspots || hotspots.length === 0) return;

  hotspots.forEach((spot: any) => {
    // Get the original percentage values from data attributes or recalculate
    const xPercent = spot.dataset.xPercent || spot.dataset.x;
    const yPercent = spot.dataset.yPercent || spot.dataset.y;

    if (xPercent !== undefined && yPercent !== undefined) {
      // Reposition using the stored percentage values
      context.positionHotspot(spot, Number(xPercent), Number(yPercent));
    }
  });
}

function setupLargeDeviceLayout(
  context: any,
  chapterMarkers: NodeListOf<Element>
) {
  context.progressBar.id = "progressBar";
  context.parentVolumeDiv.id = "parentVolume";
  context.bottomRightDiv.id = "bottomRightDiv";
  context.forwardRewindControlsWrapper.id = "forwardRewindControlsWrapperLg";
  context.forwardRewindControlsWrapper.style.bottom = "6px";

  // Remove mobile classes
  context.leftControls.classList.remove("mobile");
  context.progressBarContainer.classList.remove("mobile");
  context.progressBar.classList.remove("mobile");

  // Setup forward/rewind controls
  context.leftControls.prepend(context.forwardRewindControlsWrapper);
  context.forwardRewindControlsWrapper.style.display = "inline-flex";
  context.forwardRewindControlsWrapper.style.opacity = "1";
  context.leftControls.appendChild(context.timeDisplay);
  context.timeDisplay.style.opacity = "1";

  // Setup playlist controls if needed
  if (context.controlsContainer.classList.contains("hasPlaylist")) {
    context.forwardRewindControlsWrapper.prepend(context.nextButton);
    context.forwardRewindControlsWrapper.prepend(context.prevButton);
    context.prevButton.id = "prevButtonLg";
    context.nextButton.id = "nextButtonLg";
    context.prevButton.classList.add("prevButtonLg");
    context.nextButton.classList.add("nextButtonLg");
  }

  // Setup subtitle container
  context.subtitleContainer.classList.remove("medium", "mobile");
  context.subtitleContainer.classList.add("large");
  context.progressBarContainer.classList.remove("medium");

  // Setup forward & rewind buttons
  context.forwardRewindControlsWrapper.appendChild(context.rewindBackButton);
  context.rewindBackButton.style.opacity = 1;
  context.forwardRewindControlsWrapper.appendChild(context.fastForwardButton);
  context.fastForwardButton.style.opacity = 1;
  context.leftControls.appendChild(context.parentVolumeDiv);
  context.leftControls.appendChild(context.volumeiOSButton);

  // Remove mobile controls
  removeMobileControls(context);

  // Remove mobile classes
  const mobileClasses = [
    context.leftControls,
    context.playPauseButton,
    context.titleElement,
    context.bottomRightDiv,
    context.wrapper,
    context.parentVolumeDiv,
    context.controlsContainer,
  ];
  mobileClasses.forEach((el) => el?.classList?.remove("mobile"));

  // Show elements that were hidden on mini devices
  if (context.cartButton) {
    context.cartButton.style.display = "flex";
  }
  if (context.subtitleContainer) {
    context.subtitleContainer.style.display = "block";
  }
  if (context.forwardRewindControlsWrapper) {
    context.forwardRewindControlsWrapper.style.display = "inline-flex";
  }

  // Setup chapter markers for large devices
  chapterMarkers.forEach((marker: any) => {
    marker.classList.remove("chapter-marker-mini", "chapter-marker-md");
    marker.classList.add("chapter-marker-lg");
  });
}

function handleMediumWidthSidebar(
  context: any,
  videoWidth: number,
  isOpen: boolean
) {
  if (videoWidth < 600 || videoWidth > 800) return;

  const timeDisplay = context.timeDisplay;
  const volumeControl = context.volumeControl;

  if (isOpen) {
    if (timeDisplay) timeDisplay.style.display = "none";
    if (volumeControl) volumeControl.style.display = "none";
  } else {
    if (timeDisplay) timeDisplay.style.display = "";
    if (volumeControl) volumeControl.style.display = "";
  }
}

function handleSpecificRangeSidebar(
  context: any,
  videoWidth: number,
  isOpen: boolean
) {
  // Handle 488-615px range specifically
  if (videoWidth < 488 || videoWidth > 615) return;

  const timeDisplay = context.timeDisplay;
  const volumeControl = context.volumeControl;

  if (isOpen) {
    if (timeDisplay) timeDisplay.style.display = "none";
    if (volumeControl) volumeControl.style.display = "none";
  } else {
    if (timeDisplay) timeDisplay.style.display = "";
    if (volumeControl) volumeControl.style.display = "";
  }
}

function getVisibleButtonCount(context: any): number {
  const buttons = [
    context.audioButton,
    context.castButton,
    context.playlistButton,
    context.ccButton,
  ];

  return buttons.filter((button) => button && button.style.display !== "none")
    .length;
}

function setButtonVisibility(
  pipButton: HTMLButtonElement,
  playbackRateButton: HTMLButtonElement | null,
  pipVisible: boolean,
  playbackRateVisible: boolean
): void {
  pipButton.style.display = pipVisible ? "" : "none";
  if (playbackRateButton) {
    playbackRateButton.style.display = playbackRateVisible ? "" : "none";
  }
}

function handleSmallScreenVisibility(
  context: any,
  pipButton: HTMLButtonElement,
  playbackRateButton: HTMLButtonElement | null,
  videoWidth: number
): void {
  const visibleButtonCount = getVisibleButtonCount(context);

  if (visibleButtonCount >= 2) {
    setButtonVisibility(pipButton, playbackRateButton, false, false);
  } else if (visibleButtonCount === 0) {
    setButtonVisibility(pipButton, playbackRateButton, true, true);
  } else {
    setButtonVisibility(pipButton, playbackRateButton, true, false);
  }
}

function handlePipButtonVisibility(context: any, videoWidth: number) {
  const pipButton = context.pipButton;
  const playbackRateButton = context.playbackRateButton;

  if (!pipButton) return;

  // For mobile devices (≤471px), never show pipButton
  if (videoWidth <= 471) {
    pipButton.style.display = "none";
    return;
  }

  // For 600px and below, check button count
  if (videoWidth <= 600) {
    handleSmallScreenVisibility(
      context,
      pipButton,
      playbackRateButton,
      videoWidth
    );
  } else {
    // For larger devices (>600px), show both buttons normally
    setButtonVisibility(pipButton, playbackRateButton, true, true);
  }
}

function handleMediumClassForSpecificRange(context: any, videoWidth: number) {
  // Handle 485-510px range specifically
  if (videoWidth < 485 || videoWidth > 510) return;

  // Add medium class to relevant elements
  if (context.leftControls) {
    context.leftControls.classList.add("medium");
  }
  if (context.progressBarContainer) {
    context.progressBarContainer.classList.add("medium");
  }
  if (context.progressBar) {
    context.progressBar.classList.add("medium");
  }
  if (context.subtitleContainer) {
    context.subtitleContainer.classList.add("medium");
  }
  if (context.bottomRightDiv) {
    context.bottomRightDiv.classList.add("medium");
  }
  if (context.wrapper) {
    context.wrapper.classList.add("medium");
  }
}

function handleNonMediumWidthSidebar(context: any, videoWidth: number) {
  if (videoWidth >= 600 && videoWidth <= 800) return;
  if (videoWidth >= 488 && videoWidth <= 615) return; // Exclude specific range

  if (context.timeDisplay) context.timeDisplay.style.display = "";
  if (context.volumeControl) context.volumeControl.style.display = "";
}

function handleMobileSidebarLayout(context: any, videoWidth: number) {
  if (videoWidth > 471) return;

  const hasCartSidebarOpen = context.progressBar?.classList?.contains(
    "cartSidebarOpen-progress-bar"
  );
  if (hasCartSidebarOpen && context.bottomRightDiv) {
    context.bottomRightDiv.classList.add("mobile");
  }
}

function handleSidebarLayout(context: any, videoWidth: number) {
  const isOpen = Boolean(context.isCartOpen);

  handleMediumWidthSidebar(context, videoWidth, isOpen);
  handleSpecificRangeSidebar(context, videoWidth, isOpen);
  handleNonMediumWidthSidebar(context, videoWidth);
  handleMediumClassForSpecificRange(context, videoWidth);
  handleMobileSidebarLayout(context, videoWidth);
}

function handleProductContainerMobile(context: any, videoWidth: number) {
  const productsContainer = context.cartSidebar?.querySelector(
    ".cartSidebarProducts"
  ) as HTMLElement;
  if (productsContainer) {
    if (videoWidth <= 471) {
      productsContainer.classList.add("mobile");
    } else {
      productsContainer.classList.remove("mobile");
    }
  }
}

function handleForwardRewindVisibility(context: any, videoWidth: number) {
  const wrapper = context.forwardRewindControlsWrapper;
  if (!wrapper) return;

  // Show forward/rewind controls for medium devices (472-950px) and larger
  if (videoWidth >= 472) {
    wrapper.style.display = "inline-flex";
    wrapper.style.opacity = "1";
  } else {
    wrapper.style.display = "none";
    wrapper.style.opacity = "0";
    const parent = wrapper.parentElement;
    if (parent && parent !== context.mobileControlButtonsBlock) {
      parent.removeChild(wrapper);
    }
  }
}

function getDeviceConfig(videoWidth: number, videoHeight: number) {
  if (videoWidth < 150) {
    return { scalingFactor: 0.6, sizeClass: "sm", deviceType: "mini" };
  } else if (videoWidth >= 150 && videoWidth <= 244) {
    return { scalingFactor: 0.6, sizeClass: "sm", deviceType: "smallMobile" };
  } else if (videoWidth >= 245 && videoWidth <= 471) {
    return { scalingFactor: 0.6, sizeClass: "sm", deviceType: "responsive" };
  } else if (videoWidth >= 472 && videoWidth <= 950) {
    return { scalingFactor: 0.6, sizeClass: "md", deviceType: "tablet" };
  } else if (videoWidth < videoHeight) {
    return { scalingFactor: 0.6, sizeClass: "md", deviceType: "portrait" };
  } else {
    return { scalingFactor: 0.6, sizeClass: "lg", deviceType: "large" };
  }
}

function applyDeviceLayout(
  context: any,
  config: any,
  videoHeight: number,
  chapterMarkers: NodeListOf<Element>
) {
  const { deviceType, scalingFactor, sizeClass } = config;

  switch (deviceType) {
    case "mini":
      miniDevice(
        context,
        videoHeight,
        scalingFactor,
        sizeClass,
        chapterMarkers
      );
      break;
    case "smallMobile":
      smallMobileDevice(
        context,
        videoHeight,
        scalingFactor,
        sizeClass,
        chapterMarkers
      );
      break;
    case "responsive":
      responsiveDevice(
        context,
        videoHeight,
        scalingFactor,
        sizeClass,
        chapterMarkers
      );
      break;
    case "tablet":
      tabletDevice(
        context,
        videoHeight,
        scalingFactor,
        sizeClass,
        chapterMarkers
      );
      break;
    case "portrait":
      portraitMode(
        context,
        videoHeight,
        scalingFactor,
        sizeClass,
        chapterMarkers
      );
      break;
    case "large":
      setupLargeDeviceLayout(context, chapterMarkers);
      break;
  }
}

function resizeVideoWidth(context: any) {
  freezeLocalVideoDuringCasting(context);
  const video = context.video;
  const videoWidth = video.offsetWidth;
  const videoHeight = video.offsetHeight;

  updateMenuHeightResponsive(context);

  // Update classes for chapter markers based on videoWidth
  const chapterMarkers =
    context.progressBarContainer.querySelectorAll(".chapter-marker");

  AppendMobileControls(context);
  updateVolumeUIDuringResize(context);
  hidePlaylistButtonIfNoPlaylist(context);

  // Get device configuration and apply layout
  const config = getDeviceConfig(videoWidth, videoHeight);
  applyDeviceLayout(context, config, videoHeight, chapterMarkers);

  // Update playlistSlot classes based on device config
  if (context.playlistSlot) {
    const slot = context.playlistSlot as HTMLElement;
    // remove prior classes
    slot.classList.remove(
      "playlistSlot-sm",
      "playlistSlot-md",
      "playlistSlot-lg",
      "device-mini",
      "device-smallMobile",
      "device-responsive",
      "device-tablet",
      "device-portrait",
      "device-large"
    );
    // add current classes
    slot.classList.add(`playlistSlot-${config.sizeClass}`);
    slot.classList.add(`device-${config.deviceType}`);
  }

  // Handle sidebar-specific layouts
  handleSidebarLayout(context, videoWidth);
  handleProductContainerMobile(context, videoWidth);
  handleForwardRewindVisibility(context, videoWidth);
  handlePipButtonVisibility(context, videoWidth);

  // Apply thumbnail scaling
  context.thumbnail.style.setProperty("--scaling-factor", config.scalingFactor);
  context.thumbnail.classList.remove("lg", "md", "sm");
  context.thumbnail.classList.add(config.sizeClass);

  repositionHotspots(context);

  // Check for controls overlap
  const isOverlapping = checkControlsOverlap(context);
  const overlapWidth = getOverlapWidth(context);

  if (isOverlapping) {
    if (context.debugAttribute) {
      console.log(
        `Controls overlap detected! Overlap width: ${overlapWidth}px`
      );
      console.log(
        `Video width: ${videoWidth}px, Device type: ${config.deviceType}`
      );
    }
  }
}

export { resizeVideoWidth };
