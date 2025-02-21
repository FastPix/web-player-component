import { documentObject } from "./CustomElements";

function updateChapterMarkers(context: any) {
  if (!context.initialPlayClick) {
    return;
  }

  const existingMarkers =
    context.progressBarContainer.querySelectorAll(".chapter-marker");
  existingMarkers.forEach((marker: { remove: () => any }) => marker.remove());

  const progressBarWidth = context.progressBar.getBoundingClientRect().width;
  const videoWidth = context.video.offsetWidth;
  let markerClass;

  if (videoWidth < 170 || (videoWidth >= 171 && videoWidth <= 500)) {
    markerClass = "chapter-marker-mini";
  } else if (videoWidth >= 471 && videoWidth <= 950) {
    markerClass = "chapter-marker-md";
  } else {
    markerClass = "chapter-marker-lg";
  }

  context.chapters.forEach(
    (chapter: { startTime: number; endTime: number | undefined }) => {
      const startMarker = documentObject.createElement("div");
      startMarker.className = `chapter-marker ${markerClass}`;
      const startMarkerPosition =
        (chapter.startTime / context.video.duration) * progressBarWidth;
      startMarker.style.left = `${startMarkerPosition + 20}px`;
      context.progressBarContainer.appendChild(startMarker);

      if (chapter.endTime !== undefined) {
        const endMarker = documentObject.createElement("div");
        endMarker.className = `chapter-marker-end ${markerClass}`;
        const endMarkerPosition =
          (chapter.endTime / context.video.duration) * progressBarWidth;
        endMarker.style.left = `${endMarkerPosition + 20}px`;
        context.progressBarContainer.appendChild(endMarker);
      }
    }
  );
}

function activeChapter(context: any) {
  const currentTime = context.video.currentTime;
  const activeChapter = context.chapters.find(
    (chapter: { startTime: number; endTime: any }) => {
      return (
        currentTime >= chapter.startTime &&
        currentTime < (chapter.endTime || Infinity)
      );
    }
  );

  const chapterInfo = activeChapter
    ? {
        startTime: activeChapter.startTime,
        endTime: activeChapter.endTime,
        value: activeChapter.value,
      }
    : null;

  if (
    (!context.previousChapter && chapterInfo) ||
    (context.previousChapter &&
      chapterInfo &&
      (context.previousChapter.startTime !== chapterInfo.startTime ||
        context.previousChapter.endTime !== chapterInfo.endTime ||
        context.previousChapter.value !== chapterInfo.value))
  ) {
    context.previousChapter = chapterInfo;
    context.dispatchEvent(new Event("chapterchange"));
  }

  return chapterInfo;
}

function ensureChaptersLoaded(context: any) {
  if (context.chapters.length > 0) {
    context.thumbnail.classList.add("chapters");
    context.thumbnail.appendChild(context.chapterDisplay);
  } else {
    context.thumbnail.classList.remove("chapters");
  }
}

export { activeChapter, updateChapterMarkers, ensureChaptersLoaded };
