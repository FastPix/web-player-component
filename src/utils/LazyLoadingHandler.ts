function setupLazyLoading(element: HTMLElement, callback: () => void): void {
  if (!element) return;

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback();
        observer.disconnect(); // Stop observing after it triggers
      }
    });
  });

  observer.observe(element);
}

const attachShadowAndSetup = (context: any): void => {
  context.attachShadow({ mode: "open" });
  context.shadowRoot.appendChild(context.wrapper);
  context.shadowRoot.appendChild(context.customStyle);
};

async function initializeLazyLoadStream(
  context: any,
  setupStream: () => Promise<void>
) {
  if (context.hasAttribute("enable-lazy-loading")) {
    setupLazyLoading(context, () => {
      attachShadowAndSetup(context); // Attach shadow and append elements
      setupStream(); // Setup the stream
    });
  } else {
    attachShadowAndSetup(context); // Attach shadow and append elements
    setupStream(); // Setup the stream
  }
}

export { setupLazyLoading, initializeLazyLoadStream };
