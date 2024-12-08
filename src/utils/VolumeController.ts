import {
  VolumeHighIcon,
  volumeMediumIcon,
  VolumeMutedIcon,
} from "../icons/VolumeIcon/index";
import { hideAllControls, showAllControls } from "./DomVisibilityManager";

interface VideoPlayerContext {
  volumeControl: HTMLInputElement;
  volumeButton: HTMLButtonElement | any;
  volumeiOSButton: HTMLButtonElement;
  primaryColor: string;
  isiOS: boolean;
  fullScreenButton: HTMLButtonElement;
  video: {
    [x: string]: any;
    removeAttribute: any;
    setAttribute(arg0: string, arg1: string): unknown;
    webkitDisplayingFullscreen: any;
  };
  hasAttribute(attr: string): boolean;
  getAttribute(attr: string): string | null;
}

function updateVolumeControlBackground(context: any) {
  context.primaryColor = context.getAttribute("primary-color") || "#F5F5F5";
  const volume: any = context.volumeControl.value;
  const gradient = `linear-gradient(to right, ${context.primaryColor} 0%, ${
    context.primaryColor
  } ${(volume * 100).toFixed(2)}%, rgba(255, 255, 255, 0.1) ${(
    volume * 100
  ).toFixed(2)}%, rgba(255, 255, 255, 0.1) 100%)`;
  context.volumeControl.style.background = gradient;
}

function updateVolumeButtonIconiOS(context: any) {
  if (context.video.muted) {
    context.volumeiOSButton.innerHTML = VolumeMutedIcon;
  } else {
    context.volumeiOSButton.innerHTML = VolumeHighIcon;
  }
}

function updateVolumeButtonIcon(context: any) {
  const volume = parseFloat(context.volumeControl.value);
  const noVolumePrefAttribute = context.hasAttribute("no-volume-pref");

  if (!noVolumePrefAttribute) {
    localStorage.setItem("savedVolumeIcon", context.volumeButton.innerHTML);
  } else {
    localStorage.removeItem("savedVolumeIcon");
  }

  if (context.video.muted) {
    // Update icon for muted state
    context.volumeButton.innerHTML = VolumeMutedIcon;
  } else {
    if (volume === 0) {
      // Update icon for unmuted state with volume at 0
      context.volumeButton.innerHTML = VolumeMutedIcon;
    } else if (volume >= 0.1 && volume <= 0.6) {
      // Update icon for unmuted state with volume between 0.1 and 0.6
      context.volumeButton.innerHTML = volumeMediumIcon;
    } else {
      // Update icon for unmuted state with volume greater than 0.6
      context.volumeButton.innerHTML = VolumeHighIcon;
    }
  }
}

function volumeiOSControl(context: VideoPlayerContext, noVolumePref: boolean) {
  context.video.muted = !context.video.muted;
  updateVolumeButtonIconiOS(context);

  if (!noVolumePref) {
    localStorage.setItem("savedMuteState", context.video.muted.toString());
  } else {
    localStorage.removeItem("savedMuteState");
  }
}

function configureForiOS(context: any) {
  context.isiOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  if (context.isiOS) {
    context.video.setAttribute("playsinline", "");
    context.video.removeAttribute("controls");
    showAllControls(context);
    context.fullScreenButton.addEventListener("click", () => {
      if (context.video.webkitDisplayingFullscreen) {
        context.video.setAttribute("controls", "true");
        hideAllControls(context);
      } else {
        context.video.removeAttribute("controls");
        showAllControls(context);
      }

      // Enter or exit full screen
      if (context.video.webkitEnterFullscreen) {
        context.video.webkitEnterFullscreen();
      }
    });

    const noVolumePrefAttribute = context.hasAttribute("no-volume-pref");
    const savedMuteState = localStorage.getItem("savedMuteState");

    if (savedMuteState === "true") {
      context.video.muted = true;
      updateVolumeButtonIcon(context);
    }

    context.volumeiOSButton.addEventListener("click", () => {
      volumeiOSControl(context, noVolumePrefAttribute);
    });
  }
}

function saveVolumeToLocalStorage(context: any) {
  const volume: any = context.volumeControl.value;
  if (volume === 0) {
    context.volumeButton.innerHTML = VolumeMutedIcon;
  } else if (volume >= 0.1 && volume <= 0.6) {
    context.volumeButton.innerHTML = volumeMediumIcon;
  } else {
    context.volumeButton.innerHTML = VolumeHighIcon;
  }
  localStorage.setItem("savedVolume", volume);
  localStorage.setItem("savedVolumeIcon", context.volumeButton.innerHTML);
}

function restoreVolumeSettings(context: any) {
  const savedVolume: any = localStorage.getItem("savedVolume");

  if (savedVolume !== null) {
    context.primaryColor = context.getAttribute("primary-color") || "#F5F5F5";
    context.video.volume = parseFloat(savedVolume);
    context.volumeControl.value = savedVolume;
    const gradient = `linear-gradient(to right, ${context.primaryColor} 0%, ${
      context.primaryColor
    } ${(savedVolume * 100).toFixed(2)}%, rgba(255, 255, 255, 0.1) ${(
      savedVolume * 100
    ).toFixed(2)}%, rgba(255, 255, 255, 0.1) 100%)`;
    context.volumeControl.style.background = gradient;
  }
}

export {
  configureForiOS,
  updateVolumeControlBackground,
  updateVolumeButtonIcon,
  saveVolumeToLocalStorage,
  restoreVolumeSettings,
};
