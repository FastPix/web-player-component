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
  let resizeDebounce: ReturnType<typeof setTimeout> | undefined;
  const runResizeLayout = () => {
    resizeVideoWidth(context);
    if (context.video.readyState >= 1) {
      updateChapterMarkers(context);
    } else {
      context.video.addEventListener(
        "loadedmetadata",
        () => updateChapterMarkers(context),
        { once: true }
      );
    }

    if (context.video.offsetWidth >= 471 && context.initialPlayClick) {
      context.playPauseButton.style.position = "absolute";
    }
  };

  window.addEventListener("resize", () => {
    clearTimeout(resizeDebounce);
    resizeDebounce = setTimeout(() => {
      resizeDebounce = undefined;
      // Defer heavy layout (resizeVideoWidth) so DevTools does not attribute it
      // to the setTimeout handler (>~50ms triggers [Violation]).
      requestAnimationFrame(runResizeLayout);
    }, 120);
  });

  window.addEventListener("load", () => {
    requestAnimationFrame(() => {
      resizeVideoWidth(context);
      updateChapterMarkers(context);
      resumePlaybackOnLoadOnActiveSession(context);
    });
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
