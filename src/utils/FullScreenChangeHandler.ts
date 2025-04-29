import { documentObject } from "./CustomElements";
import { resizeVideoWidth } from "./ResizeVideo";

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
  documentObject.addEventListener("fullscreenchange", () => {
    if (document.fullscreenElement) {
      resizeVideoWidth(context);
    }
  });

  documentObject.addEventListener("fullscreenchange", () =>
    handleFullScreenChange(context)
  );
  documentObject.addEventListener("webkitfullscreenchange", () =>
    handleFullScreenChange(context)
  );
  documentObject.addEventListener("mozfullscreenchange", () =>
    handleFullScreenChange(context)
  );
  documentObject.addEventListener("MSFullscreenChange", () =>
    handleFullScreenChange(context)
  );
}

export { fullScreenChangeHandler };
