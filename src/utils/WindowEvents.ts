import { updateChapterMarkers } from "./ChaptersHandlers";
import { resizeVideoWidth } from "./ResizeVideo";

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
    updateChapterMarkers(context);

    if (context.video.offsetWidth >= 471 && context.initialPlayClick) {
      context.playPauseButton.style.position = "absolute";
    }
  });

  window.addEventListener("load", () => {
    resizeVideoWidth(context);
    updateChapterMarkers(context);
  });

  window.addEventListener("DOMContentLoaded", () => {
    const savedVolume: string | any =
      localStorage.getItem("savedVolume") || "0.6";
    const volumeButtonIcon: string | any =
      localStorage.getItem("savedVolumeIcon") || "";

    context.volumeControl.value = savedVolume;
    context.video.volume = savedVolume;
    if (volumeButtonIcon) {
      context.volumeButton.innerHTML = volumeButtonIcon;
    }
  });
}

export { WindowEvents };
