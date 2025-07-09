import { documentObject } from "./CustomElements";
import { resizeVideoWidth } from "./ResizeVideo";
import { updateChapterMarkers } from "./ChaptersHandlers";

function handleFullScreenChange(context: any) {
  const video = context.wrapper.querySelector("video");
  const fullscreenElement =
    (document as any).fullscreenElement ??
    (document as any).webkitFullscreenElement ??
    (document as any).mozFullScreenElement ??
    (document as any).msFullscreenElement;

  if (fullscreenElement && fullscreenElement === video) {
    context.progressBar.style.height = "1.875rem";
  } else {
    context.progressBar.style.backgroundColor = "";
  }
}

function fullScreenChangeHandler(context: any) {
  function updateMarkersIfReady() {
    if (context.video.readyState >= 1) {
      updateChapterMarkers(context);
    } else {
      context.video.addEventListener(
        "loadedmetadata",
        () => updateChapterMarkers(context),
        { once: true }
      );
    }
  }

  documentObject.addEventListener("fullscreenchange", () => {
    if (document.fullscreenElement) {
      resizeVideoWidth(context);
    }
    updateMarkersIfReady();
  });

  documentObject.addEventListener("fullscreenchange", () =>
    handleFullScreenChange(context)
  );
  documentObject.addEventListener("webkitfullscreenchange", () => {
    handleFullScreenChange(context);
    updateMarkersIfReady();
  });
  documentObject.addEventListener("mozfullscreenchange", () => {
    handleFullScreenChange(context);
    updateMarkersIfReady();
  });
  documentObject.addEventListener("MSFullscreenChange", () => {
    handleFullScreenChange(context);
    updateMarkersIfReady();
  });
}

export { fullScreenChangeHandler };
