import { VolumeHighIcon, VolumeMutedIcon } from "../icons/VolumeIcon/index";

function resizeVideoWidth(context: any) {
  const video = context.video;
  const videoWidth = video.offsetWidth;
  const videoHeight = video.offsetHeight;
  let scalingFactor;
  let sizeClass;

  context.resolutionMenu.style.maxHeight = `${videoHeight - 59}px`;
  context.audioMenu.style.maxHeight = `${videoHeight - 79}px`;
  context.subtitleMenu.style.maxHeight = `${videoHeight - 79}px`;

  context.thumbnail.style.maxHeight = `${videoHeight - 59}px`;

  // Update classes for chapter markers based on videoWidth
  const chapterMarkers =
    context.progressBarContainer.querySelectorAll(".chapter-marker");

  //  Appending Mobile Controls to parent div
  context.controlsContainer.appendChild(context.mobileControls);

  //  Creating a mobile control buttons block
  context.mobileControls.appendChild(context.mobileControlButtonsBlock);

  //  Appending Forward & Rewind Controls to MobileControls div
  context.mobileControlButtonsBlock.appendChild(context.rewindBackButton);
  context.mobileControlButtonsBlock.appendChild(context.fastForwardButton);

  if (context.video.muted) {
    context.volumeiOSButton.innerHTML = VolumeHighIcon;
  } else {
    context.volumeiOSButton.innerHTML = VolumeMutedIcon;
  }

  if (
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    typeof window !== "undefined" &&
    !(window as any).MSStream
  ) {
    context.volumeControl.style.display = "none";
    context.volumeButton.style.display = "none";
    context.volumeiOSButton.style.display = "flex";
    context.pipButton.style.display = "flex";
  } else {
    context.volumeControl.style.display = "flex";
    context.volumeButton.style.display = "flex";
    context.volumeiOSButton.style.display = "none";
  }

  if (videoWidth < 150) {
    context.forwardRewindControlsWrapper.id =
      "forwardRewindControlsWrapperMini";
    context.forwardRewindControlsWrapper.style.bottom = "50%";
    context.mobileControlButtonsBlock.style.display = "none";
    context.progressBar.id = "progressBarMini";
    context.bottomRightDiv.id = "bottomRightDivMini";
    context.parentVolumeDiv.id = "parentVolumeMini";

    context.leftControls.contains(context.parentVolumeDiv)
      ? context.leftControls.removeChild(context.parentVolumeDiv)
      : null;

    context.leftControls.contains(context.forwardRewindControlsWrapper)
      ? context.leftControls.removeChild(context.forwardRewindControlsWrapper)
      : null;
    context.mobileControlButtonsBlock.contains(
      context.forwardRewindControlsWrapper
    )
      ? context.mobileControlButtonsBlock.removeChild(
          context.forwardRewindControlsWrapper
        )
      : null;
    context.leftControls.contains(context.timeDisplay)
      ? context.leftControls.removeChild(context.timeDisplay)
      : null;
    context.forwardRewindControlsWrapper.hasChildNodes(context.rewindBackButton)
      ? context.forwardRewindControlsWrapper.removeChild(
          context.rewindBackButton
        )
      : null;
    context.forwardRewindControlsWrapper.hasChildNodes(
      context.fastForwardButton
    )
      ? context.forwardRewindControlsWrapper.removeChild(
          context.fastForwardButton
        )
      : null;

    context.leftControls.classList.add("mobile");
    context.playPauseButton.classList.add("mobile");
    context.titleElement.classList.add("mobile");
    context.bottomRightDiv.classList.add("mobile");
    context.subtitleContainer.classList.add("mobile");
    context.progressBarContainer.classList.add("mobile");
    context.progressBar.classList.add("mobile");
    context.parentVolumeDiv.classList.add("mobile");

    // for thumbnail seeking
    scalingFactor = 0.6;
    sizeClass = "sm";

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
  } else if (videoWidth >= 150 && videoWidth <= 244) {
    context.forwardRewindControlsWrapper.id =
      "forwardRewindControlsWrapperMini";
    context.forwardRewindControlsWrapper.style.bottom = "50%";
    context.mobileControlButtonsBlock.style.display = "flex";
    context.progressBar.id = "progressBarMini";
    context.bottomRightDiv.id = "bottomRightDivMini";
    context.parentVolumeDiv.id = "parentVolumeMini";
    context.leftControls.appendChild(context.parentVolumeDiv);

    context.leftControls.contains(context.forwardRewindControlsWrapper)
      ? context.leftControls.removeChild(context.forwardRewindControlsWrapper)
      : null;
    context.mobileControlButtonsBlock.contains(
      context.forwardRewindControlsWrapper
    )
      ? context.mobileControlButtonsBlock.removeChild(
          context.forwardRewindControlsWrapper
        )
      : null;
    context.leftControls.contains(context.timeDisplay)
      ? context.leftControls.removeChild(context.timeDisplay)
      : null;
    context.forwardRewindControlsWrapper.hasChildNodes(context.rewindBackButton)
      ? context.forwardRewindControlsWrapper.removeChild(
          context.rewindBackButton
        )
      : null;
    context.forwardRewindControlsWrapper.hasChildNodes(
      context.fastForwardButton
    )
      ? context.forwardRewindControlsWrapper.removeChild(
          context.fastForwardButton
        )
      : null;

    // Add mobile Class for leftControls
    context.leftControls.classList.add("mobile");
    context.playPauseButton.classList.add("mobile");
    context.titleElement.classList.add("mobile");
    context.bottomRightDiv.classList.add("mobile");
    context.subtitleContainer.classList.add("mobile");
    context.progressBarContainer.classList.add("mobile");
    context.progressBar.classList.add("mobile");
    context.parentVolumeDiv.classList.add("mobile");

    // for thumbnail seeking
    scalingFactor = 0.6;
    sizeClass = "sm";

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
  } else if (videoWidth >= 245 && videoWidth <= 502) {
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
    context.controlsContainer.getElementsByClassName("timeDisplay").length > 0
      ? context.leftControls.removeChild(context.timeDisplay)
      : null;
    context.forwardRewindControlsWrapper.hasChildNodes(context.rewindBackButton)
      ? context.forwardRewindControlsWrapper.removeChild(
          context.rewindBackButton
        )
      : null;
    context.forwardRewindControlsWrapper.hasChildNodes(
      context.fastForwardButton
    )
      ? context.forwardRewindControlsWrapper.removeChild(
          context.fastForwardButton
        )
      : null;

    context.leftControls.classList.add("mobile");
    context.playPauseButton.classList.add("mobile");
    context.titleElement.classList.add("mobile");
    context.bottomRightDiv.classList.add("mobile");
    context.subtitleContainer.classList.add("mobile");
    context.progressBarContainer.classList.add("mobile");
    context.progressBar.classList.add("mobile");
    scalingFactor = 0.6;
    sizeClass = "sm";

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
  } else if (videoWidth >= 471 && videoWidth <= 950) {
    if (context.ccButton.style.display !== "none") {
      context.playbackRateButton.classList.add("showPlaybackrateButton");
    } else {
      context.playbackRateButton.classList.remove("showPlaybackrateButton");
    }
    // context.subtitleMenu.style.display = "flex";
    context.progressBar.id = "progressBarResponsiveMd";
    context.bottomRightDiv.id = "bottomRightDivMd";
    context.forwardRewindControlsWrapper.id = "forwardRewindControlsWrapperMd";
    context.forwardRewindControlsWrapper.style.bottom = "10px";
    context.parentVolumeDiv.id = "parentVolumeResponsiveMd";
    context.playPauseButton.id = "playPauseButtonMd";

    // Append the time display element to the parent div
    context.leftControls.appendChild(context.forwardRewindControlsWrapper);
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
    /* if (context.controlsContainer.hasChildNodes(context.mobileControls)) {
          context.controlsContainer.removeChild(context.mobileControls)
        } */

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

    // for thumbnail seeking
    scalingFactor = 0.6;
    sizeClass = "md";

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
  } else if (videoWidth < videoHeight) {
    // Apply styles for portrait mode
    context.progressBar.id = "progressBarResponsiveHeightWidth";
    context.parentVolumeDiv.id = "parentVolumeHeightWidth";
    context.bottomRightDiv.id = "bottomRightDivHeightWidth";
    context.leftControls.classList.remove("mobile");
    context.titleElement.classList.remove("mobile");
    context.progressBarContainer.classList.remove("mobile");
    context.progressBar.classList.remove("mobile");

    // for thumbnail seeking
    scalingFactor = 0.6;
    sizeClass = "md";

    context.subtitleContainer.classList.remove("large");

    // for subtitle styling of medium devices
    context.subtitleContainer.classList.add("medium");

    // Append the time display element to the parent div
    context.leftControls.appendChild(context.forwardRewindControlsWrapper);
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
    context.controlsContainer.hasChildNodes(context.mobileControls)
      ? context.controlsContainer.removeChild(context.mobileControls)
      : null;

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
  } else {
    context.progressBar.id = "progressBar";
    context.parentVolumeDiv.id = "parentVolume";
    context.bottomRightDiv.id = "bottomRightDiv";
    context.forwardRewindControlsWrapper.id = "forwardRewindControlsWrapperLg";
    context.forwardRewindControlsWrapper.style.bottom = "6px";
    context.leftControls.classList.remove("mobile");
    context.progressBarContainer.classList.remove("mobile");
    context.progressBar.classList.remove("mobile");

    // Append the time display element to the parent div
    context.leftControls.appendChild(context.forwardRewindControlsWrapper);
    context.forwardRewindControlsWrapper.style.display = "inline-flex";
    context.forwardRewindControlsWrapper.style.opacity = "1";
    context.leftControls.appendChild(context.timeDisplay);
    context.timeDisplay.style.opacity = "1";

    context.subtitleContainer.classList.remove("medium");
    context.subtitleContainer.classList.remove("mobile");
    context.subtitleContainer.classList.add("large");

    context.progressBarContainer.classList.remove("medium");

    //  Forward & Rewind buttons
    context.forwardRewindControlsWrapper.appendChild(context.rewindBackButton);
    context.rewindBackButton.style.opacity = 1;
    context.forwardRewindControlsWrapper.appendChild(context.fastForwardButton);
    context.fastForwardButton.style.opacity = 1;
    context.leftControls.appendChild(context.parentVolumeDiv);
    context.leftControls.appendChild(context.volumeiOSButton);

    //  Remove Mobile Controls
    context.controlsContainer.hasChildNodes(context.mobileControls)
      ? context.controlsContainer.removeChild(context.mobileControls)
      : null;

    // Remove mobile class from leftControls class
    context.leftControls.classList.remove("mobile");
    context.playPauseButton.classList.remove("mobile");
    context.titleElement.classList.remove("mobile");
    context.bottomRightDiv.classList.remove("mobile");
    context.wrapper.classList.remove("mobile");
    context.parentVolumeDiv.classList.remove("mobile");

    // for thumbnail seeking
    scalingFactor = 0.6;
    sizeClass = "lg";

    chapterMarkers.forEach(
      (marker: { classList: { remove: (arg0: string) => any } }) =>
        marker.classList.remove("chapter-marker-mini")
    );

    chapterMarkers.forEach(
      (marker: { classList: { remove: (arg0: string) => any } }) =>
        marker.classList.remove("chapter-marker-md")
    );

    chapterMarkers.forEach(
      (marker: { classList: { add: (arg0: string) => any } }) =>
        marker.classList.add("chapter-marker-lg")
    );

    context.controlsContainer.classList.remove("mobile");
  }

  context.thumbnail.style.setProperty("--scaling-factor", scalingFactor);
  context.thumbnail.classList.remove("lg", "md", "sm");
  context.thumbnail.classList.add(sizeClass);
}

export { resizeVideoWidth };
