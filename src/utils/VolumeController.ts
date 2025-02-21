import {
  VolumeHighIcon,
  volumeMediumIcon,
  VolumeMutedIcon,
} from "../icons/VolumeIcon/index";
import {
  hideAllControls,
  hideMenus,
  showAllControls,
} from "./DomVisibilityManager";

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
  // Update button icon based on mute state
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
  } else if (volume === 0) {
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
    const savedVolume = localStorage.getItem("savedVolume");

    // Sync iOS mute state with saved volume from localStorage
    if (savedVolume === "0") {
      context.video.muted = true;
      updateVolumeButtonIconiOS(context);
    }

    // Set event listener for iOS volume button
    context.volumeiOSButton.addEventListener("click", () => {
      toggleMuteUnmute(context, noVolumePrefAttribute);
      hideMenus(context);
    });
  }
}

// Adjust volume
function adjustVolume(
  context: {
    video: HTMLVideoElement;
    volumeControl: HTMLInputElement;
    volumeButton: HTMLElement;
  } & Record<string, any>, // To accommodate additional properties like updateVolumeControlBackground
  delta: number,
  noVolumePref: boolean
): void {
  const newVolume = Math.min(1, Math.max(0, context.video.volume + delta));
  context.video.volume = newVolume;

  if (context.video.muted && newVolume > 0) {
    context.video.muted = false;
  }

  context.volumeControl.value = newVolume.toString();
  updateVolumeControlBackground(context);
  updateVolumeButtonIcon(context);

  if (!noVolumePref) {
    localStorage.setItem("savedVolumeIcon", context.volumeButton.innerHTML);
    localStorage.setItem("savedVolume", newVolume.toString());
  } else {
    localStorage.removeItem("savedVolumeIcon");
    localStorage.removeItem("savedVolume");
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

function toggleMuteUnmute(context: any, noVolumePrefAttribute: boolean) {
  // Save the current volume icon in localStorage if applicable
  if (!noVolumePrefAttribute) {
    localStorage.setItem("savedVolumeIcon", context.volumeButton.innerHTML);
  } else {
    localStorage.removeItem("savedVolumeIcon");
  }

  // Retrieve saved volume from local storage
  const savedVolume = localStorage.getItem("savedVolume");

  // Check if the volume is 0 or the video is muted
  if (context.video.muted || savedVolume === "0") {
    // If video is muted or volume is 0 in localStorage, unmute and set volume to 1
    context.video.muted = false;
    context.volumeButton.innerHTML = VolumeMutedIcon;

    // Set volume to 1
    context.volumeControl.value = "1";
    context.video.volume = 1;
  } else {
    // If video is not muted, mute it
    context.video.muted = true;
    context.volumeButton.innerHTML = VolumeHighIcon;

    // Set volume-control-value and volume to 0 for muted state
    context.volumeControl.value = "0";
    context.video.volume = 0;
  }

  // Update UI elements
  updateVolumeControlBackground(context);
  updateVolumeButtonIcon(context);
  updateVolumeButtonIconiOS(context);

  // Handle localStorage based on mute state
  if (!noVolumePrefAttribute) {
    localStorage.setItem(
      "savedVolume",
      context.video.muted ? "0" : context.video.volume.toString()
    );
    localStorage.setItem("savedVolumeIcon", context.volumeButton.innerHTML);
  } else {
    localStorage.removeItem("savedVolume");
    localStorage.removeItem("savedVolumeIcon");
  }
}

export {
  configureForiOS,
  updateVolumeControlBackground,
  updateVolumeButtonIcon,
  saveVolumeToLocalStorage,
  restoreVolumeSettings,
  updateVolumeButtonIconiOS,
  adjustVolume,
  toggleMuteUnmute,
};
