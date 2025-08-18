import { documentObject } from "./CustomElements";
import { hideAllControls, showAllControls } from "./DomVisibilityManager";

function showError(context: any, errorMessage: string): void {
  context.isError = true;
  console.log("showError", context.isError);
  // Check if an error is already displayed
  if (context.wrapper.querySelector(".errorContainer")) {
    return;
  }
  const firstFullStopIndex = errorMessage.indexOf(".");
  const errorHtml = `
        <div style="color: #F5F5F5; font-weight: bold; text-align: center; font-family: inherit;">
          ${errorMessage.substring(0, firstFullStopIndex + 1)} 
        </div>
        <div style="color: #F5F5F5; text-align: center; margin-top: 10px; font-family: inherit;">
          ${errorMessage.substring(firstFullStopIndex + 1).trim()}
        </div>
    `;

  const errorContainer = documentObject.createElement("div");
  errorContainer.classList.add("errorContainer");
  errorContainer.style.position = "absolute";
  errorContainer.style.top = "50%";
  errorContainer.style.left = "50%";
  errorContainer.style.transform = "translate(-50%, -50%)";
  errorContainer.style.zIndex = "9999";
  errorContainer.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  errorContainer.style.width = "100%";
  errorContainer.style.height = "100%";
  errorContainer.style.display = "flex";
  errorContainer.style.flexDirection = "column";
  errorContainer.style.alignItems = "center";
  errorContainer.style.justifyContent = "center";

  errorContainer.innerHTML = errorHtml;
  context.wrapper.appendChild(errorContainer);

  if (typeof hideAllControls === "function") {
    hideAllControls(context);
  }
}

function hideError(context: any): void {
  const errorDiv = context.wrapper.querySelector(".errorContainer");
  context.isError = false;
  console.log("hideError", context.isError);
  if (errorDiv) {
    context.wrapper.removeChild(errorDiv);

    if (typeof showAllControls === "function") {
      showAllControls(context);
    }
  }
}

export { hideError, showError };
