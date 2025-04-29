import { documentObject } from "./CustomElements";
import { Context } from "./index";

function preloadSubtitles(context: Context): void {
  const tracksArray = Array.from(context.video.textTracks);
  tracksArray.forEach((track: any) => {
    if (track.kind === "subtitles" || track.kind === "captions") {
      track.mode = "hidden";
    }
  });
}

function hideDefaultSubtitlesStyles(context: any): void {
  const tracks = Array.from<TextTrack>(context.video.textTracks);
  for (const track of tracks) {
    track.mode = "hidden";
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
    localStorage.setItem("subtitleLang", tracksArray[0].language);
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

  for (const track of tracksArray) {
    track.mode = "disabled";
  }

  // Clear the subtitle container
  if (context.subtitleContainer) {
    context.subtitleContainer.innerHTML = "";
    context.subtitleContainer.classList.remove("contained");
  }

  localStorage.removeItem("subtitleLang");
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

function restoreSubtitleFromStorage(context: Context) {
  const savedLang = localStorage.getItem("subtitleLang");
  const tracks = Array.from(context.video.textTracks);

  if (savedLang) {
    const indexToShow = tracks.findIndex((t: any) => t.language === savedLang);
    if (indexToShow !== -1) {
      changeSubtitleTrack(context, indexToShow);
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
  hideDefaultSubtitlesStyles,
};
