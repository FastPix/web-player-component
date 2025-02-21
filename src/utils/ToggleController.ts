import { EnterFullScreenIcon } from "../icons/FullScreenIcon/index";
import { PauseIcon, PlayIcon } from "../icons/PlayPauseIcon/index";
import { documentObject } from "./CustomElements";
import { showError } from "./ErrorElement";
import { changeSubtitleTrack, disableAllSubtitles } from "./SubtitleHandler";
import {
  hideInitControls,
  hideLoader,
  showInitialControls,
  showLoader,
} from "./DomVisibilityManager";

interface Track {
  mode: string;
  kind: string;
  label: string;
  language: string;
}

interface Context {
  subtitleContainer?: HTMLElement | null;
}

function refreshSubtitleState(
  context: Context,
  subtitleTracks:
    | ArrayLike<Track | null | undefined>
    | { [s: string]: Track | null | undefined }
) {
  const tracksArray: Track[] = Object.values(subtitleTracks).filter(
    (track): track is Track => {
      return (
        track !== null &&
        typeof track === "object" &&
        "mode" in track &&
        "kind" in track &&
        "label" in track &&
        "language" in track
      );
    }
  );

  // Clear subtitle container if it exists
  if (context.subtitleContainer) {
    context.subtitleContainer.innerHTML = "";
    context.subtitleContainer.classList.remove("contained");
  }

  // Update track elements
  tracksArray.forEach((track, index) => {
    const trackElement = document.getElementById(`track-${index}`);
    if (trackElement) {
      if (track.mode === "showing") {
        trackElement.classList.add("active");
      } else {
        trackElement.classList.remove("active");
      }
    }
  });
}

function toggleSubtitleWithKeyC(context: any) {
  const tracksArray: any[] = Array.from(context.video.textTracks);
  const currentTrackIndex = context.currentSubtitleTrackIndex;
  if (currentTrackIndex === -1) {
    console.warn("No subtitle track is currently showing.");
    return;
  }

  const currentTrack: any = tracksArray[currentTrackIndex];

  if (currentTrack.mode === "showing") {
    currentTrack.mode = "disabled";
  } else {
    currentTrack.mode = "showing";
  }
  refreshSubtitleState(context, tracksArray);
}

function toggleFullScreen(context: any) {
  const element = context.wrapper;

  if (document.fullscreenElement) {
    document.exitFullscreen();
    context.fullScreenButton.innerHTML = EnterFullScreenIcon;
    element.classList.remove("fullscreen");
  } else {
    element.requestFullscreen().catch((err: any) => {
      showError(context, "Error attempting to enable full-screen mode:");
    });
    context.fullScreenButton.innerHTML = EnterFullScreenIcon;
    element.classList.add("fullscreen");
  }
}

// Function to toggle the audio menu
function toggleAudioMenu(context: any) {
  if (context.audioMenu.style.display === "none") {
    context.audioMenu.style.display = "flex";
  } else {
    context.audioMenu.style.display = "none";
  }
}

function toggleResolutionMenu(context: any) {
  if (context.resolutionMenu.style.display === "none") {
    context.resolutionMenu.style.display = "flex";
  } else {
    context.resolutionMenu.style.display = "none";
  }
}

// Function to toggle visibility of playback rate buttons
function togglePlaybackRateButtons(context: any) {
  if (context.playbackRateDiv.style.display === "none") {
    context.playbackRateDiv.style.display = "flex";
  } else {
    context.playbackRateDiv.style.display = "none";
  }
}

function toggleVideoPlayback(
  context: any,
  playbackId: string | null,
  thumbnailUrlFinal: string | null,
  streamType: string | null
): void {
  context.wrapper.classList.add("initialized");
  context.playPauseButton.classList.add("initialized");
  context.bottomRightDiv.classList.add("initialized");
  context.titleElement.classList.add("initialized");
  context.leftControls.classList.add("initialized");
  context.progressBar.classList.add("initialized");
  context.parentVolumeDiv.classList.add("initialized");

  if (!context.isLoading) {
    if (context.video.paused) {
      if (!context.initialPlayClick || context.video.autoplay) {
        showLoader(context);
        hideInitControls(context);
      }

      if (context.video.readyState >= 3) {
        context.video
          .play()
          .then(() => {
            hideLoader(context); // Hide loader once video is ready
            context.initialPlayClick = true; // Set initialPlayClick to true
            showInitialControls(
              context,
              context.video.offsetWidth,
              playbackId,
              thumbnailUrlFinal,
              streamType
            );
          })
          .catch((error: { message: any }) => {
            console.error("Error playing video:", error.message, error);
            hideLoader(context); // Hide loader on error
          });
      } else {
        context.video.addEventListener(
          "canplay",
          () => {
            context.video
              .play()
              .then(() => {
                hideLoader(context); // Hide loader once video is ready
                context.initialPlayClick = true; // Set initialPlayClick to true
                showInitialControls(
                  context,
                  context.video.offsetWidth,
                  playbackId,
                  thumbnailUrlFinal,
                  streamType
                );
              })
              .catch((error: { message: any }) => {
                console.error(
                  "Error playing video after canplay:",
                  error.message,
                  error
                );
                hideLoader(context); // Hide loader on error
              });
          },
          { once: true }
        );
      }

      context.playPauseButton.innerHTML = PauseIcon;
    } else {
      context.video.pause();
      context.playPauseButton.innerHTML = PlayIcon;
    }
  }

  context.video.addEventListener("canplay", () => {
    context.isLoading = false;
    hideLoader(context);
    if (context.initialPlayClick) {
      showInitialControls(
        context,
        context.video.offsetWidth,
        playbackId,
        context.thumbnailUrlFinal,
        streamType
      );
    }
  });
}

function toggleSubtitlesMenu(context: any) {
  if (context.subtitleMenu.style.display === "flex") {
    context.subtitleMenu.style.display = "none";
    return;
  }

  if (!context.video?.textTracks) {
    console.error("Video or textTracks is not available.");
    return;
  }

  while (context.subtitleMenu.firstChild) {
    context.subtitleMenu.removeChild(context.subtitleMenu.firstChild);
  }

  const hideSubtitlesButton = documentObject.createElement("button");
  hideSubtitlesButton.textContent = "Off";
  hideSubtitlesButton.className = "offSubtitles";
  hideSubtitlesButton.addEventListener("click", () => {
    disableAllSubtitles(context);
    context.subtitleMenu.style.display = "none"; // Close the subtitle menu
  });
  context.subtitleMenu.appendChild(hideSubtitlesButton);

  // Convert textTracks to an array
  const tracksArray = Array.from(context.video.textTracks);

  // Check if any track is currently showing
  let anyTrackShowing = tracksArray.some(
    (track: any) => track.mode === "showing"
  );

  // Iterate over each text track and use the track index
  for (let index = 0; index < tracksArray.length; index++) {
    const track: any = tracksArray[index];
    const menuItem = documentObject.createElement("button");
    menuItem.className = "subtitleSelectorButtons";
    menuItem.textContent = track.label || `Language ${index + 1}`;

    menuItem.addEventListener("click", () => {
      changeSubtitleTrack(context, index); // Pass the track index
    });

    if (track.mode === "showing") {
      menuItem.classList.add("active");
      context.currentSubtitleTrackIndex = index;
    }

    context.subtitleMenu.appendChild(menuItem);
  }

  // Handle "Off" button active state
  if (!anyTrackShowing) {
    hideSubtitlesButton.classList.add("active");
  }

  context.subtitleMenu.style.display = "flex";
  context.subtitleMenu.className = "subtitle-menu";
  context.subtitleMenu.style.flexDirection = "column";
  context.subtitleMenu.style.color = "#000";
}

function hideShowSubtitlesMenu(context: any) {
  if (context.subtitleMenu.style.display === "none") {
    context.subtitleMenu.style.display = "flex";
  } else {
    context.subtitleMenu.style.display = "none";
  }
}

export {
  toggleSubtitleWithKeyC,
  toggleFullScreen,
  toggleAudioMenu,
  toggleResolutionMenu,
  togglePlaybackRateButtons,
  toggleVideoPlayback,
  toggleSubtitlesMenu,
  hideShowSubtitlesMenu,
};
