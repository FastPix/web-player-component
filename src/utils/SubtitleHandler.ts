import { documentObject } from "./CustomElements";

interface Track {
  kind: "subtitles" | "captions";
  mode: "disabled" | "hidden" | "showing";
  label: string;
  language: string;
  default?: boolean;
}

interface Context {
  video: HTMLVideoElement;
  subtitleContainer?: HTMLElement;
  subtitleMenu: HTMLElement;
  wrapper: HTMLElement;
  currentSubtitleTrackIndex: number;
}

function preloadSubtitles(context: Context): void {
  const tracksArray = Array.from(context.video.textTracks);
  tracksArray.forEach((track: any) => {
    if (track.kind === "subtitles" || track.kind === "captions") {
      track.mode = "hidden";
    }
  });
}

function hideDefaultSubtitles(context: Context): void {
  const tracks = context.video.textTracks;
  for (let i = 0; i < tracks.length; i++) {
    tracks[i].mode = "hidden";
  }

  const style = documentObject.createElement("style");
  style.textContent = `
    /* Hide cues in all browsers */
    video::cue {
      display: none !important;
    }

    /* WebKit-based browsers (Chrome, Safari) */
    video::-webkit-media-text-track-display {
      display: none !important;
      background: none !important;
      color: red !important;
      text-shadow: none !important;
      box-shadow: none !important;
      border: none !important;
      outline: none !important;
    }

    /* Firefox */
    video::cue {
      background: none !important;
      color: red !important;
      text-shadow: none !important;
      box-shadow: none !important;
      border: none !important;
      outline: none !important;
  }`;

  document.head.appendChild(style);
}

function initializeSubtitles(
  context: Context,
  tracksArray: string | any[]
): void {
  if (tracksArray.length > 0) {
    tracksArray[0].mode = "showing";
    tracksArray[0].default = true;
    context.currentSubtitleTrackIndex = 0;
  }
}

function moveSubtitlesUp(context: Context): void {
  context.wrapper.classList.add("subtitles-up");
}

function moveSubtitlesDown(context: Context): void {
  context.wrapper.classList.remove("subtitles-up");
}

function disableAllSubtitles(context: Context): void {
  const tracksArray = Array.from(context.video.textTracks);

  for (let i = 0; i < tracksArray.length; i++) {
    const track: any = tracksArray[i];
    track.mode = "disabled";
  }

  // Clear the subtitle container
  if (context.subtitleContainer) {
    context.subtitleContainer.innerHTML = "";
  }
}

function changeSubtitleTrack(context: Context, trackIndex: number): void {
  context.subtitleMenu.style.display = "none";
  const tracksArray = Array.from(context.video.textTracks);

  for (let i = 0; i < tracksArray.length; i++) {
    const track: any = tracksArray[i];
    if (i === trackIndex) {
      track.mode = "showing";
      context.currentSubtitleTrackIndex = trackIndex;
    } else {
      track.mode = "disabled";
    }
  }
}

export {
  preloadSubtitles,
  changeSubtitleTrack,
  disableAllSubtitles,
  initializeSubtitles,
  moveSubtitlesUp,
  moveSubtitlesDown,
  hideDefaultSubtitles,
};