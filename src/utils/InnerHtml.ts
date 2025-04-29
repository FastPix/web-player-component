export const skeleton: string = `
   
/* CSS Variables */
:host {
    --icon-width: 24px;
    --icon-height: 30px;
    --icon-big-width: 30px;
    --icon-big-height: 30px;
    --button-width: 32px;
    --button-height: 32px;
    --button-big-width: 64px;
    --button-big-height: 64px;
    --font-size: 16px;
    --border-radius: 3px;
    --media-object-fit: cover;
    --media-object-position: center;
    --accent-color: #5D09C7;
    --primary-color: #F5F5F5;
    --secondary-color: #000;
    --thumbnail-max-width: 150px;
    --cast-button-display: flex;
    aspect-ratio: 16 / 9;
    display: block; /* Ensure the custom element is a block-level element */
    font-family: Arial, sans-serif;
    aspect-ratio: var(--aspect-ratio); /* Use the aspect ratio variable */
}

:host(:focus) {
    outline: none;
}
        
video {
    width: 100%;
    max-width: 100% !important; /* Ensure the video does not exceed its container */
    max-height: 100% !important; /* Ensure the video does not exceed its container */
    object-fit: contain; /* Adjust this based on your requirement */
    overflow: hidden;
    background-color: #000; /* Fallback color */
}

google-cast-launcher {
  width: 40px;
  height: 40px;
  cursor: pointer;
  color: #fff;
}

  
.video-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none; /* Allow clicks to pass through the overlay to the video */
}

.overlay-show {
    background-color: var(--backdrop-color, transparent);
}

.parent.subtitle-container {
    opacity: 0;
}

.parent.initialized .subtitle-container {
    opacity: 1;
}

.subtitle-container.contained {
    position: absolute;
    bottom: 10%; /* Adjust this value as needed to position the subtitles */
    left: 50%;
    transform: translateX(-50%);
    width: auto; /* Allows the width to adjust based on content */
    pointer-events: none; /* Allows interaction with the video element */
    transition: bottom 0.6s ease; /* Smooth transition */
    text-align: center;
    background: rgba(0, 0, 0, 0.4); /* Semi-transparent black background */
    color: white;
    padding: 0.25em 0.5em; /* Adds some padding for better readability */
    border-radius: 3px; /* Optional: adds a slight border-radius */
    overflow-y: hidden;
}

/* Default subtitle position */
.subtitle-container.large {
    bottom: 20px; /* Adjust this value to set the default position */
    font-size: 24px;
}

/* Class to move subtitles up */
.subtitles-up .subtitle-container.large {
    bottom: 98px; /* Adjust this value to move subtitles up */
    font-size: 24px;
}

.subtitle-container.medium {
    bottom: 20px; /* Adjust this value to set the default position */
    font-size: 14px;
}

/* Class to move subtitles up */
.subtitles-up .subtitle-container.medium {
    bottom: 70px; /* Adjust this value to move subtitles up */
    font-size: 14px;
    max-height: 150px;
}

.subtitle-container.mobile {
    bottom: 20px;
    font-size: 8px;
}

.subtitles-up .subtitle-container.mobile {
    bottom: 50px; /* Adjust this value to move subtitles up */
    font-size: 8px;
    max-height: 90px;
    position: absolute;
    width: calc(100% - 100px);
}
    
/* General ::cue styling */
::cue {
    display: none !important;
    background: none !important;
    color: transparent !important;
    text-shadow: none !important;
    box-shadow: none !important;
    border: none !important;
    outline: none !important;
}

/* Specific video::cue styling */
video::cue {
    display: none !important;
    background: none !important;
    color: transparent !important;
    text-shadow: none !important;
    box-shadow: none !important;
    border: none !important;
    outline: none !important;
}

/* Fallback for Webkit-based browsers */
video::-webkit-media-text-track-display {
    display: none !important;
    background: none !important;
    color: transparent !important;
    text-shadow: none !important;
    box-shadow: none !important;
    border: none !important;
    outline: none !important;
}

.leftControls.initialized {
    display: var(--left-controls-bottom, flex)
}

.leftControls.mobile.initialized {
    display: var(--left-controls-bottom-mobile, flex);
    bottom: 3px;
    position: absolute;
}

.bottomRightContainer.mobile.initialized {
    display: var(--bottom-right-controls-mobile, flex)
}

.controlsContainer {
    display: var(--controls, flex)
}

.volumeiOSButton {
    display: var(--volume-iOS-button, flex)
}

.castButton {
    display: var(--cast-button-display);
} 

#decreaseTimeBtn,
#increaseTimeBtn,
.timeDisplay,
.parentVolumeDiv,
.initialplayPauseButtonStyle,
.castButton {
    border-radius: var(--border-radius);
}

#forwardSeekBtnSvg {
    height: 24px;
     width: 24px;
}

.roundedCorners {
     border-radius: 50%;
}

.bottomCenterDiv {
    display: flex
}

.initialplayPauseButtonStyle {
    display: flex;
    align-items: center;
    justify-content: center;
}

.playbackRateButtonInitial {
    height: 24px;
    width: 30px;
    color: var(--primary-color);
    font-size: 14px;
}

.playbackRateButtonInitial:hover,
.audioMenuButton:hover,
.castButton:hover {
    background-color: var(--accent-color); /* Color on hover */
    border-radius: 2px;
}

.playbackRateButton {
    border: 1px solid transparent;
    margin-right: 3px;
}

.playbackRateButton.active {
    background-color: var(--accent-color); /* Color on hover */
    color: var(--primary-color);
    border-radius: 2px;
}

.volumeiOSButton {
    color: var(--primary-color);
}

.parent.mobile.resolution-menu {
    bottom: 36px;
    right: 0;
}

.resolution-menu {
    display: flex;
    flex-direction: column;
    position: absolute;
    background-color: var(--primary-color);
    padding: 5px 7px;
    border-radius: 2px;
    font-size: 14px;
    color: #100023;
    bottom: 46px;
    overflow-y: auto;
    left: 0;
    right: auto;
}

.title,
.title-on-demand {
    display: none;
    color: var(--primary-color);
}

.title-on-demand.initialized {
    display: var(--title, flex);
    align-items: center;
    justify-content: center;
    margin-left: 10px;
    font-weight: 600;
}

.title-on-demand.mobile.initialized {
     display: none;
 }

.title.initialized {
    display: var(--title, flex);
    align-items: center;
    justify-content: center;
    margin-left: 60px;
    font-weight: 600;
    font-size: 14px;
}

.liveTag {
    position: absolute;
    color: #F5F5F5;
    margin-right:90px;
    padding: 2px 12px;
    font-size: 14px;
    font-weight: 600;
}

.liveTag::before {
    display: block;
    content: "";
    width: 6px;
    height: 6px;
    border-radius: 50%;
    position: absolute;
    left: 0px;
    top: calc(50% - 3px);
    background-color: red;
}

.parentTextContainer {
    display: none;
    position: absolute;
    padding: 10px 20px;
    left: 0;
    top: 10px;}

.parent.initialized .parentTextContainer {
    display: flex;
    flex-direction: row;
    width: 100%;
    justify-content: space-between;
    align-items: center;
}

.title.initialized {
    display: var(--title, flex);
    align-items: center;
    justify-content: center;
}

.qualitySelectorButtons,
.audioSelectorButtons,
.subtitleSelectorButtons,
.offSubtitles {
    padding: 6px 10px 6px 20px;
    position: relative;
    white-space: nowrap;
    text-overflow: ellipsis; 
}

.parent.initialized.mobile .qualitySelectorButtons,
.parent.initialized.mobile .audioSelectorButtons,
.parent.initialized.mobile .subtitleSelectorButtons,
.parent.initialized.mobile .offSubtitles {
    padding: 6px 10px 6px 15px;
}

.qualitySelectorButtons:hover,
.audioSelectorButtons:hover,
.subtitleSelectorButtons:hover,
.offSubtitles:hover {
    border-radius: 2px;
    background: var(--accent-color);
    color: var(--primary-color);
}

.playbackRateButton:hover {
    border-color: var(--accent-color); /* Color on hover */
    border-radius: 2px;
}

#playPauseAferClickBreakPoint {
    align-items: center;
    justify-content: center;
}

#playPauseAferClickBreakPoint:hover {
    border-radius:2px;
    transition: background-color 0.2s ease-in;
}

.parent {
    display: flex;
    row-gap: 1.875rem;
    height: 100%;
    transition: all 1s ease-in-out;  /* Smooth resizing */
}

.parent::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 50px; /* Adjust the height as needed */
     background: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.3)); /* Adjust the gradient as needed */
    pointer-events: none; /* Allow clicks to pass through the gradient background */
    border-radius: 0 0 10px 10px; /* Apply border-radius to match the video's border-radius */
}

#playPauseButtonId:hover {
    background-color: blue;
    border-radius: 2px;
    transition: background-color 0.3s ease-in;
}

.playbackRatesButton:hover {
    background-color: var(--accent-color);
    color: var(--primary-color);
}
    
.parentVolumeDiv {
    display: none;
    flex-direction: row;
    /* position: absolute; */
    width: auto;
    justify-content: space-between;
    align-items: center;
}

#parentVolumeDivResponse {
    display: flex;
    flex-direction: row;
    position: absolute;
    left: 5%;
    width: auto;
    justify-content: space-between;
     align-items: center;
    bottom: 0;
}

#forwardRewindControlsWrapperResponsive,
#forwardRewindControlsWrapperMini {
    z-index: 1;
    position: absolute;
    width: 120px;
    left: 50%;
    bottom: 50%;
    transform: translateX(-50%);
    display: flex;
    justify-content: space-between;
}

#forwardRewindControlsWrapperMd {
    display: flex;
    flex-direction: row;
}

.qualitySelectorButtons.active::before,
.audioSelectorButtons.active::before,
.subtitleSelectorButtons.active::before,
.offSubtitles.active::before {
    display: block;
    content: "";
    width: 6px;
    height: 6px;
    border-radius: 50%;
    position: absolute;
    left: 5px;
    top: calc(50% - 3px);
    background-color: var(--accent-color);
}

.qualitySelectorButtons.active:hover::before,
.audioSelectorButtons.active:hover::before,
.subtitleSelectorButtons:hover::before,
.offSubtitles.active:hover::before {
    background-color: var(--primary-color);
}

.qualitySelectorButtons.active,
.audioSelectorButtons.active,
.subtitleSelectorButtons.active,
.offSubtitles.active {
    font-weight: bold;
}

.forwardRewindControlsWrapper {
    display: flex;
}

.playPauseBeforeClick {
    display:flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    bottom: 50%;
    left: 45%;
    color: var(--primary-color);
    height: 40px;
    width: 40px;
    border-radius: 50%;
}

.playPauseBeforeClick:hover,
.resolutionMenuButton:hover {
    background-color: var(--accent-color);
}

.volumeButton {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius);
}

.volumeButton:hover {
    background-color: var(--accent-color);
}

.bottomRightContainer {
    display: none;
    flex-direction: row;
    position: absolute;
    right: 20px;
    width: auto;
    justify-content: space-between;
    align-items: center;
    bottom: 0;
    z-index: 8;
}

.bottomRightContainer.initialized {
    display: var(--bottom-right-controls, flex);
}

#bottomRightDivMd {
bottom: 10px;
    right: 18px;
}

#increaseTimeBtn,
#decreaseTimeBtn {
    display: inline-flex;
    justify-content: center;
    align-items: center;
}

#increaseTimeBtn:hover,#decreaseTimeBtn:hover {
    background-color: var(--accent-color);
    border-radius: 2px;
}

.subtitle-menu,
.audio-menu {
    display: flex;
    flex-direction: column;
    position: absolute;
    background-color: var(--primary-color);
    padding: 5px 7px;
    border-radius: 2px;
    font-size: 14px;
    color: #100023;
    bottom: 46px;
    overflow-y: auto;
    left: 32px;
    right: auto;
    max-width: 116px;
    overflow-y: auto;
    white-space: nowrap;
    text-overflow: ellipsis;        
}

.timeDisplay {
    font-family: sans-serif;
    font-size: 0.875rem;
    color: var(--primary-color);
    padding: 0px 5px;
    white-space: nowrap;
    border-radius: var(--border-radius);
}

#playPauseButtonHeightWidth {
    position: absolute;
    bottom: 50%;
}

/* Additional styling for each button */
.fullScreenButton:hover,
.pipButton:hover,
.ccButton:hover {
    background-color: var(--accent-color);}

.spinner {
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-left-color: var(--accent-color);
    border-radius: 50%;
    width: 30px;
    height: 30px;
    animation: spin 0.5s linear infinite; /* Changed duration to 0.5s */
    position: absolute; /* Position the spinner relative to the viewport */
    top: 50%; /* Align the spinner vertically at the center of the viewport */
    left: 50%; /* Align the spinner horizontally at the center of the viewport */
    transform: translate(-50%, -50%); /* Center the spinner precisely */
    z-index: 9999; /* Ensure the spinner is on top of other elements */
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.retryButton {
    color: var(--accent-color);
}


/* Default styles for volume controls */
.volumeControl {
    width: 3.5rem; /* Adjust width as needed */
    display: inline-block;
    -webkit-appearance: none;
    border-radius: 0.313rem;
    height: 3px;
    background: linear-gradient(to right, var(--primary-color) 0%, var(--primary-color) 100%, #ddd 50%, #ddd 100%);
}

/* Styling the volume control thumb */
.volumeControl::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 10px; /* Adjust thumb width as needed */
    height: 10px; /* Adjust thumb height as needed */
    background-color: var(--primary-color); /* Thumb color */
    border-radius: 50%; /* Make thumb round */
    cursor: pointer; /* Show pointer cursor */
    position: relative; /* Required for positioning the dot */
}

/* Styling the volume control thumb on hover */
.volumeControl:hover::-webkit-slider-thumb {
    visibility: visible; /* Show the thumb on hover */
}

/* Additional styles for the thumb */
.volumeControl::-webkit-slider-thumb::before {
    content: ""; /* No content for the pseudo-element */
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 6px; /* Adjust the size of the dot as needed */
    height: 6px; /* Adjust the size of the dot as needed */
    background-color: white; /* Color of the dot */
    border-radius: 50%;
 }

/* Styling the volume control thumb for Firefox */
.volumeControl::-moz-range-thumb {
    width: 10px; /* Adjust thumb width as needed */
    height: 10px; /* Adjust thumb height as needed */
    background-color: var(--primary-color); /* Thumb color */
    border-radius: 50%; /* Make thumb round */
    cursor: pointer; /* Show pointer cursor */
    border: none; /* Remove default border */
    -moz-appearance: none; /* Remove default styling */}

/* Additional styles for the thumb */
.volumeControl::-moz-range-thumb::before {
    content: ""; /* No content for the pseudo-element */
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 6px; /* Adjust the size of the dot as needed */
    height: 6px; /* Adjust the size of the dot as needed */
    background-color: var(--accent-color); /* Color of the dot */
    border-radius: 50%;
}

.playPauseButton {
    background-color: rgba(255, 255, 255, 0.1);
    border: none;
    cursor: pointer;
    fill: white;
    outline: none;
    width: 3.75rem;
    height: 3.75rem;
    border-radius: 50%;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    bottom: 45%;
}

.playPauseButton:hover {
    background-color: var(--accent-color);
}

#playBackAfterClick {
    background-color: rgba(255, 255, 255, 0.1)
    right: 45%;
    width: 2.5rem;
    height: 2.5rem;
    bottom: 0%;
}

#playBackAfterClick:hover {
    background-color: var(--accent-color);
}

.timeDisplay:hover {
    background-color: var(--accent-color);
}

.progressBar.initialized {
    display: var(--progress-bar, flex);
 }

.progressBar.initialized.mobile {
    display: var(--progress-bar, flex);
}

/* Only Firefox */
@supports (-moz-appearance:none) {
    .pipButton {
        display: var(--pip-button, none) !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
    }
}

#progressBar {
    position: absolute;
    height: 4.5px;
    bottom: 46px;
    left: 20px;
    right: 20px;
    margin: 0;
    padding: 0;
    cursor: pointer;
    -moz-appearance: none;
}

#progressBarResponsiveMd {
    position: absolute;
    height: 3.5px;
    bottom: 46px;
    left: 20px;
    right: 20px;
    cursor: pointer;
    width: calc(100% - 40px);
}

.chapter-marker-mini {
    height: 4.5px;
    bottom: 35px;
    position: absolute;
    left: 0;
    width: 3px;
    background-color: rgba(0, 0, 0, 0.4);
}

.chapter-marker-md {
    bottom: 47px;
    height: 4.5px;
    position: absolute;
    left: 0;
    width: 2.5px;
    background-color: rgba(0, 0, 0, 0.4); 
}

.chapter-marker-lg {
    bottom: 46px;
    height: 4.5px;
    position: absolute;
    left: 0;
    width: 2.5px;
    background-color: rgba(0, 0, 0, 0.4);
} 

.progressBar {
    display: none;
    -webkit-appearance: none;
    border-radius: 0.313rem;
    height: 3px;
    width: calc(100% - 40px);
    -moz-appearance: none;
    background-color: rgba(255, 255, 255, 0.2); 
}


/* Styling the volume control thumb */
.progressBar::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px; /* Adjust thumb width as needed */
    height: 12px; /* Adjust thumb height as needed */
    background-color: var(--accent-color); /* Thumb color */
    border-radius: 50%; /* Make thumb round */
    cursor: pointer; /* Show pointer cursor */
    visibility: hidden;
    cursor: pointer;
    position: relative; /* Required for positioning the dot */
}

/* Styling the volume control thumb on hover */
.progressBar:hover::-webkit-slider-thumb {
    visibility: visible; /* Show the thumb on hover */
}

/* Additional styles for the thumb */
.progressBar::-webkit-slider-thumb::before {
    content: ""; /* No content for the pseudo-element */
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 6px; /* Adjust the size of the dot as needed */
    height: 6px; /* Adjust the size of the dot as needed */
    background-color: var(--accent-color); /* Color of the dot */
    border-radius: 50%;}

/* Styling the volume control thumb for Firefox */
.progressBar::-moz-range-thumb {
    -moz-appearance: none;
    width: 12px; /* Adjust thumb width as needed */
    height: 12px; /* Adjust thumb height as needed */
    background-color: var(--accent-color); /* Thumb color */
    border-radius: 50%; /* Make thumb round */
    cursor: pointer; /* Show pointer cursor */
    visibility: hidden;
    cursor: pointer;
    position: relative; /* Required for positioning the dot */
    border: none; /* Remove default border */
    -moz-appearance: none;
}

/* Styling the volume control thumb on hover for Firefox */
.progressBar:hover::-moz-range-thumb {
    visibility: visible; /* Show the thumb on hover */
    -moz-appearance: none;
}

/* Additional styles for the thumb in Firefox */
.progressBar::-moz-range-thumb::before {
    content: ""; /* No content for the pseudo-element */
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 6px; /* Adjust the size of the dot as needed */
    height: 6px; /* Adjust the size of the dot as needed */
    background-color: var(--accent-color); /* Color of the dot */
    border-radius: 50%;
    -moz-appearance: none;
}

#mediaFullScreenResponsiveMd {
    position: absolute;
    bottom: 9.1px;
    right: 0;
    height: 24px;
    width: 30px;
    border-radius: 2px;
}

#mediaFullScreenResponsiveMd:hover {
    background-color: var(--accent-color);
}

#pipButtonResponsiveMd {
    position: absolute;
    bottom: 9.1px;
    right: 0;
    height: 24px;
width: 30px;
}

#pipButtonResponsiveMd:hover {
    background-color: #
}

#bottomRightDivResponsive {
    position: absolute;
    right: 10px;
    bottom: 10px;
}

.mobile #bottomRightDivResponsive {
    bottom: 3px;
}

.mobile #bottomRightDivResponsive .pipButton,
.mobile #bottomRightDivResponsive .playbackRateButtonInitial {
    display: none;
}

.mobile #progressBarResponsive {
    bottom: 33px; !important
}

#timeDisplayResponsiveMd {
    position: absolute;
    bottom: 8px;
    font-size: 0.875rem;
    left: 126px;
    color: var(--primary-color);
    font-family: Arial, sans-serif;
    padding: 4px;
    border-radius: 2px;
}

#timeDisplayResponsiveMd:hover {
    background-color: var(--accent-color);
}

#forwardSeekInHeightWidth {
    position: absolute;
    bottom: 1px;
    left: 60%;
}

#backwardSeekInHeightWidth {
    position: absolute;
    bottom: 50%;
    right: 60%;
}

#mediaFullScreenResponsiveHeightWidth,
#pipButtonHeightWidth {
    bottom: 0%;
}

#progressBar:hover {
    cursor: pointer;
}

#progressBarResponsive {
    position: absolute;
    bottom: 2.5rem;
    height: 4px;
    left: 20px;
    right: 20px;
}

#playPauseButtonResponsive {
    display:flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    bottom: 45%;
    left: 45%;
    color: var(--primary-color);
    height: 40px;
    width: 40px;
    border-radius: 50%;
}

#initialPlayButton {
    display: flex;
     align-items: center;
    justify-items: center;
}

#progressBarMini {
    position: absolute;
    height: 3px;
    width: 84%;
    bottom: 40px;
    display: none;
}

#bottomRightDivMini {
    display: none;
}

#parentVolumeMini {
    bottom: 0;
}

#pipButtonMini, #fullScreenButtonMini {
    position: absolute;
    bottom: 1px;
}

#bottomRightContainerMini {
    bottom: 40px;
}

#progressBarResponsiveHeightWidth {
    position: absolute;
    bottom: 3.75rem;
    height: 0.25 rem;
    width: 96%;
    right: 2%;
    left: 2%;
}

#timeDisplayHeightWidth {
    position: absolute;
    bottom: 3.75rem;
    font-size: 0.875rem;
    right: 2%;
    color: var(--primary-color);
    font-family: Arial, sans-serif;
}

#bottomRightDiv {
    position: absolute;
    bottom: 10px;
}

/* for screens/video width less <=481 */
#pipButtonResponsive {
    position: absolute;
    bottom: 12px;
    right: 0;
    height: 24px;
    width: 30px;
}

#pipButtonResponsive:hover {
    background-color: var(--accent-color);
}

#mediaFullScreenResponsive {
    bottom: 12px;
    right: 0;
    height: 24px;
    width: 30px;
}

#mediaFullScreenResponsive:hover {
    background-color: var(--accent-color);
}

#play:hover,
#pause:hover {
    background-color: rgba(255, 255, 255, 0.1)
}

#fowardSeekInsecs {
    background-color: transparent;
    border: gray
    cursor: pointer;
    fill: green;
    outline: none;
    width: 24px;
    height: 30px;
    border-radius: 50%;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 0.875;
    position: absolute;
    bottom: 50%; /* Default bottom position */
    left: 54%;
}

#backwardSeekInsecs {
    position: absolute;
    bottom: 50%;
    right: 57%;
    height: 30px;
}

#playPauseButtonResponsiveMd {
    position: absolute;
    bottom: 45%;
    left: 45%;
    color: var(--primary-color);
    height: 2.875rem;
    width: 2.875rem;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
}

#backwardSeekInsecsMd {
    position: absolute;
    bottom: 10px;
    left: 61px;
    height: 24px;
    width: 30px;
}

#backwardSeekInsecsMd:hover {
    background-color: var(--accent-color);
}

#fowardSeekInsecsMd {
    border: gray;
    cursor: pointer;
    fill: green;
    outline: none;
    height: 24px;
    width: 30px;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 0.875;
    position: absolute;
    bottom: 10px; /* Default bottom position */
    left: 93px;
}

#fowardSeekInsecsMd:hover {
    background-color: var(--accent-color);
}

#mediaFullScreenLandscape {
    background-color: transparent;
    border: gray;
    cursor: pointer;
    fill: white;
    outline: none;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 20%;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
}

#timeControlButtonIncrease {
    background-color: transparent
    border: gray;
    cursor: pointer;
    outline: none;
    border-radius: 2px;
    width: 30px;
    height: 24px;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    bottom: 10px;
    left: 8.5%;
    font-size: 0.875rem;
}

#timeControlButtonDecrease {
    background-color: transparent
    border: gray;
    cursor: pointer;
    outline: none;
    border-radius: 2px;
    width: 30px;
    height: 24px;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    bottom: 10px;
    left: 6%;
    font-size: 0.875rem;
}

#timeControlButtonIncrease:hover,
#timeControlButtonDecrease:hover {
    background-color: var(--accent-color);
}

.retryButton, button {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    font-family: inherit;
    font-size: inherit;
    color: inherit;
    cursor: pointer;
    outline: none; /* Prevents default focus outline */
}

.leftControls {
    display: none;
    position: absolute;
    left: 50px;
    bottom: 10px;
    flex-direction: row;
    align-items: center;
    z-index: 4;
}

.leftControls.mobile {
    display: none;
    position: absolute;
    left: 10px;"load    bottom: 3px;
    flex-direction: row;
    align-items: center;
    z-index: 4;
}

.mobileControls {
     display: none;
    position: absolute;
    width: 100%;
    height: 40px;
    bottom: calc(50% - 18px);
    align-items: center;
    justify-content: center;
    left: 0;
}

.parent.initialized .mobileControls {
    display: var(--middle-controls-mobile, flex);
}

.parent.mobile.initialized .title {
    display: none;
}

.parent.mobile.initialized .title-on-demand {
    display: none;
}

.mobile .title {
     display: none;
}

.mobile .playbackRateButtonInitial,
.mobile .pipButton {
    display: none;
}

.pipButton {
display: none;
}

.live-stream {
    --backward-button: none;
    --forward-button: none;
}
    
.mobileControlsButtonsBlock {
    display: none;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 120px;
}

.mobileControlsButtonsBlock #increaseTimeBtn,
.mobileControlsButtonsBlock #decreaseTimeBtn,
.mobileControlsButtonsBlock #increaseTimeBtn svg,
.mobileControlsButtonsBlock #decreaseTimeBtn svg,
.castButton svg {
    width: 30px !important;
    height: 30px !important;
}

.timeDisplay {
    height: var(--button-height);
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--secondary-color);
}

/* All Icons */
.initialPlayBigButton.initialized svg,
#decreaseTimeBtn svg,
#increaseTimeBtn svg,
.parentVolumeDiv svg,
.playbackRateButtonInitial svg,
.ccButton svg,
.pipButton svg,
.fullScreenButton svg,
.resolutionMenuButton svg,
#audioMenuButton svg,
.default-icon,
.castButton svg,
.volumeiOSButton {
     width: var(--icon-width);
     height: var(--icon-height);
}

/* All Icon Buttons */
.initialPlayBigButton.initialized:not(.mobile),
#decreaseTimeBtn,
#increaseTimeBtn,
.playbackRateButtonInitial,
.ccButton,
.pipButton,
.fullScreenButton,
.volumeButton,
.resolutionMenuButton,
.audioMenuButton,
.castButton,
.default-button {
    width: var(--button-width);
    height: var(--button-height);
    background-color: var(--secondary-color);
    border-radius: var(--border-radius);
    color: var(--primary-color);
    bottom: 10px;
}

.initialplayPauseButtonStyle svg,
#decreaseTimeBtn svg,
#increaseTimeBtn svg,
.parentVolumeDiv svg,
.playbackRateButtonInitial svg,
.ccButton svg,
pipButton svg,
fullScreenButton svg,
volumeiOSButton svg,
playbackRateButtonInitial,
.timeDisplay {
    color: var(--primary-color);
}

.initialPlayBigButton:not(.initialized),
.initialPlayBigButton.initialized.mobile {
    width: var(--button-big-width);
    height: var(--button-big-height);
    border-radius: 50%;
    display: var(--initial-play-button, flex);
    align-items: center;
    justify-content: center;
    left: calc(50% - (var(--button-big-width) / 2));
    bottom: calc(50% - (var(--button-big-height) / 2));
    background-color: transparent;
}

.initialPlayBigButton.initialplayPauseButtonStyle.initialized.showPlayButton {
    display: var(--play-button-initialized, flex)
}

.initialPlayBigButton.initialized:not(.mobile) {
    left: 20px;
    bottom 10px;
}

.initialPlayBigButton svg {
    width: var(--icon-big-width);
    height: var(--icon-big-height);
}

.initialPlayBigButton.initialized svg {
    width: var(--icon-width);
    height: var(--icon-height);
}

.initialPlayBigButton:hover,
.initialPlayBigButton.initialized:hover {
    background-color: var(--accent-color);
}

.spinner {
    display: var(--loading-indicator, flex);
    align-items: center;
    justify-content: center;
}

.resolutionMenuButton {
    display: var(--resolution-selector, flex);
    align-items: center;
    justify-content: center;
}

.audioMenuButton {
    display: none;
    align-items: center;
    justify-content: center;
    color: var(--primary-color);
}

.initialplayPauseButton.showPlayButton {
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Mobile hide on hover status */
.mobile .initialPlayBigButton:hover,
.mobile #decreaseTimeBtn:hover,
.mobile #increaseTimeBtn:hover,
.mobile .playbackRateButtonInitial:hover,
.mobile .ccButton:hover,
.mobile .pipButton:hover,
.mobile .fullScreenButton:hover,
.mobile .volumeButton:hover,
.mobile .default-button:hover,
.mobile #audioMenuButton:hover,
.mobile .resolutionMenuButton:hover {
    background-color: transparent !important;
}

#decreaseTimeBtn {
    display: var(--backward-skip-button, flex);
    align-items: center;
    justify-content: center;
}

#increaseTimeBtn {
    display: var(--forward-skip-button, flex);
    align-items: center;
    justify-content: center;
 }

.parentVolumeDiv.initialized {
    display: var(--volume-control, flex);
    align-items: center;
    justify-content: center;
}

.parentVolumeDiv.initialized.mobile {
    display: var(--volume-control-mobile, flex);
    align-items: center;
    justify-content: center;
}

.playbackRateButtonInitial {
    display: var(--playback-rate-button, flex);
    align-items: center;
    justify-content: center;
}

.playbackRate-menu {
    position: absolute;
    right: 0;
    bottom: 50px;
    padding: 6px;
    background-color: var(--primary-color);
    flex-direction: row;
    border-radius: 2px;
}

.ccButton {
    display: none;
}

.audioMenuButtonShow {
    display: var(--audio-track-button, flex);
}

.ccButtonLength {
    display: var(--cc-button, flex);
    align-items: center !important;
justify-content: center !important;

}

.ccButton.disabled {
    display: none;
}

.pip-firefox {
    display: none;
}


.pipButton {
    display: var(--pip-button, flex);
    align-items: center;
    justify-content: center;
}

.fullScreenButton {
    display: var(--full-screen-button, flex);
    align-items: center;
    justify-content: center;
}

.timeDisplay {
    display: var(--time-display, flex);
    align-items: center;
    justify-content: center;
}

.thumbnailSeeking {
   position: absolute;
   z-index: 99;
   bottom: 60px;
   border-color: var(--primary-color);
   border-radius: 3px;
   border-style: solid;
   border-width: 2px 2px 20px 2px;
   display: none;
   opacity: 0;
   cursor: pointer;
}

.thumbnailSeeking.noThumbnail {
   border-color: transparent;
   padding: 2px 2px 2px 2px;
   background-color: #F5F5F5;
   position: absolute;
   left: 50%;
   transform: translateX(-50%); /* Center horizontally */
}

.thumbnailSeeking.chapters.noThumbnail {
   border-width: 4px;
   bottom: 100px;
}

.thumbnailSeeking.show {
   opacity: 1;
   display: flex;
}

.thumbnailSeeking.chapters.lg.noThumbnail.show .thumbnailChapterDisplay.multi-line {
    bottom: -45px;
}

.thumbnailSeeking.chapters.sm.noThumbnail.show .thumbnailChapterDisplay.multi-line {
    bottom: 25px;
    min-width: auto;
    padding: 2px;
}

.thumbnailSeeking.chapters.md.noThumbnail.show .thumbnailChapterDisplay.multi-line {
    bottom: 25px;
    min-width: auto;
    padding: 4px;
}

.thumbnailSeeking.lg.noThumbnail.show,
.thumbnailSeeking.md.noThumbnail.show,
.thumbnailSeeking.sm.noThumbnail.show {
    padding: 2px;
    border-width: 4px;
}


.thumbnailSeeking.show.lg,
.thumbnailSeeking.md.show {
    bottom: 70px;
}

.thumbnailSeeking.show.lg.chapters {
    bottom: 100px;
}

.thumbnailSeeking.show.lg.chapters.noThumbnail {
    bottom: 100px;
}

.thumbnailSeeking.show.sm.chapters.noThumbnail {
    bottom: 45px;
}

.thumbnailSeeking.show.md.chapters.noThumbnail {
    bottom: 60px;
}

.thumbnailSeeking.sm.show {
    bottom: 50px;
}

.thumbnailSeeking.chapters {
   border-width: 2px 2px 20px 2px;
   bottom: 100px;
}

.thumbnailTimeDisplay {
   font-size: 13px;
   text-align: center;
   position: absolute;
   left: 0;
   width: 100%;
   transform: translateX(0);
   bottom: -18px; /* Adjust as needed */
   color: grey;
   z-index: 9;
}

/* Additional styles for noThumbnail state */
.thumbnailSeeking.noThumbnail .thumbnailTimeDisplay {
   position: static;
   width: auto;
   left: 50%;
   transform: translateX(0);
   bottom: 10px; /* Reset bottom to default */
}

.thumbnailChapterDisplay {
    position: absolute;
    bottom: -56px; /* Adjust bottom position to ensure no contact with thumbnailSeeking */
    left: 50%;
    transform: translateX(-50%); /* Center horizontally */
    max-width: var(--thumbnail-max-width); /* Set max-width */
    color: #FFF;
    border-radius: var(--border-radius);
    font-size: 13px;
    text-align: center;
    overflow: hidden; /* Hide overflow text */
    text-overflow: ellipsis; /* Add ellipsis for overflow text */
}

.thumbnailChapterDisplay.noThumbnail {
    position: absolute;
    bottom: -41px;
}

.thumbnailChapterDisplay.single-line {
    white-space: nowrap; /* Prevent text wrapping */
    text-overflow: ellipsis; /* Add ellipsis for overflow text */
}

.thumbnailChapterDisplay.multi-line {
    display: -webkit-box; /* Use a flexbox for multi-line truncation */
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2; /* Clamp to two lines */
    line-clamp: 2; /* Fallback for non-WebKit browsers */
    max-height: calc(3.2em * 2); /* Adjust height to show up to two lines */
    min-width: 157.59px;
}

.thumbnailSeeking.chapters.md.show .thumbnailChapterDisplay.multi-line {
    min-width: 157.59px;
    font-size: 12px;
    bottom: -44px;
    background-color: var(--primary-color);
    color: #333333;
}

.thumbnailSeeking.chapters.sm.show .thumbnailTimeDisplay {
    font-size: 10px;
    bottom: -16px;
}

.thumbnailSeeking.chapters.md.show .thumbnailTimeDisplay {
    font-size: 12px;
    bottom: -16px;
}


.thumbnailSeeking.chapters.sm.show .thumbnailChapterDisplay.multi-line {
    min-width: 157.59px;
    font-size: 10px;
    bottom: -40px;
    background-color: var(--primary-color);
    color: #333333;
}

.thumbnailSeeking.chapters.sm.show {
    bottom: 5.5rem;
}

.thumbnailSeeking.chapters.md.show {
    bottom: 5.3rem;
}

.chapter-mark {
    position: absolute;
    height: 100%;
    width: 2px;
    background-color: red;
    cursor: pointer;
}

.chapter-tooltip {
    display: none;
    position: absolute;
    background-color: black;
    color: white;
    padding: 2px 5px;
    border-radius: 3px;
    white-space: nowrap;
    transform: translateX(-50%);
}

.chapter-mark:hover .chapter-tooltip {
  display: block;
}
}`;
