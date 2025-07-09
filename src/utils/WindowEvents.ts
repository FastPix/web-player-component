import { updateChapterMarkers } from "./ChaptersHandlers";
import { resizeVideoWidth } from "./ResizeVideo";
import { resumePlaybackOnLoadOnActiveSession } from "./VideoListeners";

interface VideoPlayerContext {
  video: HTMLVideoElement;
  initialPlayClick: boolean;
  playPauseButton: HTMLButtonElement;
  volumeControl: HTMLInputElement;
  volumeButton: HTMLButtonElement;
}

function WindowEvents(context: VideoPlayerContext) {
  window.addEventListener("resize", () => {
    resizeVideoWidth(context);
    if (context.video.readyState >= 1) {
      updateChapterMarkers(context);
    } else {
      // Wait for metadata to be loaded before updating markers
      context.video.addEventListener(
        "loadedmetadata",
        () => updateChapterMarkers(context),
        { once: true }
      );
    }

    if (context.video.offsetWidth >= 471 && context.initialPlayClick) {
      context.playPauseButton.style.position = "absolute";
    }
  });

  window.addEventListener("load", () => {
    resizeVideoWidth(context);
    updateChapterMarkers(context);
    resumePlaybackOnLoadOnActiveSession(context);
  });

  window.addEventListener("DOMContentLoaded", () => {
    const savedVolume: number = parseFloat(
      localStorage.getItem("savedVolume") ?? "0.6"
    );
    const volumeButtonIcon: string =
      localStorage.getItem("savedVolumeIcon") ?? "";

    context.volumeControl.value = savedVolume.toString(); // If volumeControl expects a string
    context.video.volume = savedVolume; // Assigning as a number

    if (volumeButtonIcon) {
      context.volumeButton.innerHTML = volumeButtonIcon;
    }
  });
}

export { WindowEvents };
