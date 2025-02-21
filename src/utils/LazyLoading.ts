type LazyLoadContext = {
  attachShadow: (options: ShadowRootInit) => ShadowRoot;
  shadowRoot: ShadowRoot | null;
  wrapper: HTMLElement;
  customStyle: HTMLElement;
  setupStream: () => Promise<void>;
};

function initializeLazyLoading(
  context: LazyLoadContext,
  observer: IntersectionObserver
): void {
  observer.observe(context as unknown as Element);
}

function handleLazyLoadingIntersection(
  context: LazyLoadContext,
  entries: IntersectionObserverEntry[],
  observer: IntersectionObserver
): void {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      createShadowDOM(context);
      observer.unobserve(context as unknown as Element); // Type assertion if necessary
      context.setupStream();
    }
  });
}

function createShadowDOM(context: LazyLoadContext): void {
  if (!context.shadowRoot) {
    const shadow = context.attachShadow({ mode: "open" });
    shadow.appendChild(context.wrapper);
    shadow.appendChild(context.customStyle);
  }
}

export {
  initializeLazyLoading,
  handleLazyLoadingIntersection,
  createShadowDOM,
};
