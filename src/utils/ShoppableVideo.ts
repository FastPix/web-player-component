import { documentObject } from "./CustomElements";
import { resizeVideoWidth } from "./ResizeVideo";

// Helper type guard
function isValidMarker(marker: any): marker is {
  seekTime: number;
  x: number;
  y: number;
  tooltipPosition: string;
  link: string;
} {
  return (
    marker &&
    typeof marker.seekTime === "number" &&
    typeof marker.x === "number" &&
    typeof marker.y === "number" &&
    typeof marker.tooltipPosition === "string" &&
    typeof marker.link === "string"
  );
}

// Helper functions to reduce cognitive complexity
function handleOpenLinkAction(context: any, prod: any): boolean {
  if (prod.onProductClick?.type !== "openLink") return false;

  if (prod.onProductClick.shouldPause) {
    context.video.pause();
  }

  const url = prod.onProductClick.params?.targetUrl;
  if (url) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  context.triggerCartIconDance();
  return true; // Indicates action was handled
}

function createHotspotElement(
  context: any,
  marker: any,
  productName: string,
  zIndex: string = "1200"
): HTMLDivElement {
  const spot = documentObject.createElement("div");
  spot.className = "hotspot";
  spot.style.position = "absolute";
  spot.style.width = "32px";
  spot.style.height = "32px";
  spot.style.cursor = "pointer";
  spot.style.zIndex = zIndex;

  // Store the original percentage values for repositioning during resize
  spot.dataset.xPercent = String(marker.x);
  spot.dataset.yPercent = String(marker.y);

  context.positionHotspot(spot, Number(marker.x), Number(marker.y));

  const dot = documentObject.createElement("div");
  dot.className = "hotspot-dot";
  spot.appendChild(dot);

  const tooltip = createHotspotTooltip(marker, productName);
  spot.appendChild(tooltip);

  spot.onmouseenter = () => (tooltip.style.opacity = "1");
  spot.onmouseleave = () => (tooltip.style.opacity = "0");

  return spot;
}

function createHotspotTooltip(
  marker: any,
  productName: string
): HTMLDivElement {
  const tooltip = documentObject.createElement("div");
  tooltip.className = "hotspot-tooltip";
  tooltip.innerText = String(productName ?? "")
    .replace(/\s+/g, " ")
    .trim();
  tooltip.style.position = "absolute";
  tooltip.style.whiteSpace = "nowrap";
  tooltip.style.background = "#222";
  tooltip.style.color = "#fff";
  tooltip.style.padding = "6px 12px";
  tooltip.style.borderRadius = "6px";
  tooltip.style.fontSize = "0.95em";
  tooltip.style.pointerEvents = "none";
  tooltip.style.opacity = "0";
  tooltip.style.transition = "opacity 0.2s";

  positionTooltip(tooltip, marker?.tooltipPosition);

  return tooltip;
}

function positionTooltip(
  tooltip: HTMLDivElement,
  position: string = "bottom"
): void {
  switch (position) {
    case "left":
      tooltip.style.right = "110%";
      tooltip.style.top = "50%";
      tooltip.style.transform = "translateY(-50%)";
      break;
    case "right":
      tooltip.style.left = "110%";
      tooltip.style.top = "50%";
      tooltip.style.transform = "translateY(-50%)";
      break;
    case "top":
      tooltip.style.left = "50%";
      tooltip.style.bottom = "110%";
      tooltip.style.transform = "translateX(-50%)";
      break;
    case "bottom":
    default:
      tooltip.style.left = "50%";
      tooltip.style.top = "110%";
      tooltip.style.transform = "translateX(-50%)";
      break;
  }
}

function setupHotspotClickHandler(spot: HTMLDivElement, marker: any): void {
  spot.onclick = (ev: MouseEvent) => {
    if (ev.target === spot || spot.contains(ev.target as Node)) {
      ev.stopPropagation();
      window.open(marker.link, "_blank", "noopener,noreferrer");
    }
  };
}

function getSeekTime(prod: any, marker: any): number | undefined {
  if (isValidMarker(marker)) {
    return marker.seekTime;
  }

  if (
    prod.onProductClick?.params?.seekTime &&
    typeof prod.onProductClick.params.seekTime === "number"
  ) {
    return prod.onProductClick.params.seekTime;
  }

  return undefined;
}

function handleSeekAction(context: any, prod: any): boolean {
  if (prod.onProductClick?.type !== "seek") return false;

  const marker = prod?.markers[0];
  const seekTime = getSeekTime(prod, marker);

  if (typeof seekTime !== "number" || !marker) return false;

  context.video.currentTime = seekTime;
  context.video.pause();
  context.removeAllHotspots();

  const spot = createHotspotElement(context, marker, prod.name, "1200");
  setupHotspotClickHandler(spot, marker);

  context.wrapper.appendChild(spot);
  context.isHotspotVisible = true;

  const waitSeconds = Number(prod.onProductClick?.waitTillPause);
  playAndClearHotspotAfterDelay(context, spot, waitSeconds);

  return true;
}

function handleMarkerAction(context: any, prod: any): boolean {
  if (!prod.markers?.length) return false;

  const marker = prod.markers[0];
  if (!isValidMarker(marker)) return false;

  context.video.currentTime = marker.seekTime;
  context.video.pause();
  context.removeAllHotspots();

  const spot = createHotspotElement(context, marker, prod.name, "1");
  setupHotspotClickHandler(spot, marker);

  context.wrapper.appendChild(spot);
  context.isHotspotVisible = true;

  const waitSeconds = Number(prod.onProductClick?.waitTillPause);
  playAndClearHotspotAfterDelay(context, spot, waitSeconds);

  return true;
}

function setupProductHoverOverlay(
  prodDiv: HTMLDivElement,
  prod: any,
  context: any
): void {
  if (prod.onProductHover?.type !== "overlay") return;

  const overlayDiv = documentObject.createElement("div");
  const thumbWrap = prodDiv.querySelector(".thumbWrap");

  // For sidebar products, append to the product div itself since there's no thumbWrap
  // For post-play overlay products, append to thumbWrap
  const targetElement = thumbWrap || prodDiv;
  const isPostPlay = !!thumbWrap; // If thumbWrap exists, it's a post-play overlay

  overlayDiv.className = `product-hover-overlay${isPostPlay ? " post-play" : ""}`;
  overlayDiv.style.position = "absolute";
  overlayDiv.style.background = "rgba(34,34,34,0.85)";
  overlayDiv.style.color = "#fff";
  overlayDiv.style.display = "flex";
  overlayDiv.style.alignItems = "center";
  overlayDiv.style.justifyContent = "center";
  overlayDiv.style.textAlign = "center";
  overlayDiv.style.fontSize = "1em";
  overlayDiv.style.boxSizing = "border-box";

  overlayDiv.style.zIndex = "10";
  overlayDiv.style.pointerEvents = "none";
  overlayDiv.style.opacity = "0";
  overlayDiv.style.transition = "opacity 0.2s";
  overlayDiv.innerText = prod.onProductHover.params.description || "";

  targetElement.appendChild(overlayDiv);

  prodDiv.onmouseenter = () => {
    overlayDiv.style.opacity = "1";
    context.dispatchEvent(
      new CustomEvent("productHoverPost", { detail: { product: prod } })
    );
  };

  prodDiv.onmouseleave = () => {
    overlayDiv.style.opacity = "0";
  };
}

function setupProductHoverSwap(
  prodDiv: HTMLDivElement,
  prod: any,
  context: any
): void {
  if (prod.onProductHover?.type !== "swap") return;

  const imgEl = prodDiv.querySelector("img");
  if (!imgEl) return;

  const originalSrc = String(prod.thumbnail);
  const swapSrc = String(
    prod.onProductHover?.params?.switchImage ?? prod.thumbnail
  );

  // Preload swap image for smoother UX
  try {
    const preload = new Image();
    preload.src = swapSrc;
  } catch (e) {
    console.error("Failed to preload swap image:", e);
  }

  prodDiv.onmouseenter = () => {
    if (imgEl) imgEl.src = swapSrc;
    context.dispatchEvent(
      new CustomEvent("productHover", { detail: { product: prod } })
    );
  };

  prodDiv.onmouseleave = () => {
    if (imgEl) imgEl.src = originalSrc;
  };
}

function setupProductClickHandler(
  prodDiv: HTMLDivElement,
  prod: any,
  context: any
): void {
  prodDiv.onclick = (e: MouseEvent) => {
    e.stopPropagation();
    context.dispatchEvent(
      new CustomEvent("productClick", { detail: { product: prod } })
    );

    cleanupOverlayAndControls(context);
    context.closeCartSidebar();

    // Handle actions in priority order
    if (handleOpenLinkAction(context, prod)) return;
    if (handleSeekAction(context, prod)) return;
    if (handleMarkerAction(context, prod)) return;
  };
}

function cleanupOverlayAndControls(context: any): void {
  const overlay = context.wrapper.querySelector(".post-play-overlay");
  if (overlay) overlay.remove();

  if (context.controlsContainer) {
    context.controlsContainer.style.display = "";
  }
}

function closeSidebar(context: any): void {
  context.cartSidebar.style.width = "0";
  context.cartSidebar.style.display = "none";
  context.isCartOpen = false;
  context.cartButton.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24"><path d="M7 18c-1.104 0-2 .896-2 2s.896 2 2 2 2-.896 2-2-.896-2-2-2zm10 0c-1.104 0-2 .896-2 2s.896 2 2 2 2-.896 2-2-.896-2-2-2zM7.334 16h9.332c.822 0 1.542-.502 1.847-1.264l3.479-8.12A1 1 0 0 0 21 5H5.21l-.94-2.342A1 1 0 0 0 3.333 2H1a1 1 0 1 0 0 2h1.333l3.6 8.982-1.35 2.44C3.52 16.14 4.477 18 6 18h12a1 1 0 1 0 0-2H7.334z"/></svg>`;
  context.triggerCartIconDance();
}

function playAndClearHotspotAfterDelay(
  context: any,
  spot: HTMLDivElement,
  seconds: number
) {
  if (seconds <= 0) return;

  context.playPauseButton.disabled = false;
  context.hotspotPauseTimeout = setTimeout(() => {
    if (context.wrapper.contains(spot)) {
      context.video.play();
      context.removeAllHotspots();
    }
  }, seconds * 1e3);
}

function showPostPlayOverlayUI(context: any) {
  if (
    !(
      context.getAttribute &&
      context.getAttribute("theme") === "shoppable-video-player"
    )
  ) {
    return;
  }

  // Remove existing overlay if present
  const existing = context.wrapper.querySelector(".post-play-overlay");
  if (existing) existing.remove();

  // Hide controls
  if (context.controlsContainer) {
    context.controlsContainer.style.display = "none";
  }

  // Create overlay
  const overlay = documentObject.createElement("div");
  overlay.className = "post-play-overlay";
  overlay.style.position = "absolute";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "2000";
  overlay.style.backdropFilter = "blur(8px)";
  overlay.style.background = "rgba(0,0,0,0.35)";
  overlay.style.overflow = "hidden";

  // Centered row of products
  const productsRow = documentObject.createElement("div");
  productsRow.className = "post-play-products-row";
  productsRow.style.display = "flex";
  productsRow.style.flexDirection = "row";
  productsRow.style.gap = "16px";
  productsRow.style.flexWrap = "wrap";
  productsRow.style.alignItems = "center";
  productsRow.style.justifyContent = "center";
  productsRow.style.alignContent = "flex-start";
  productsRow.style.boxSizing = "border-box";
  productsRow.style.padding = "8px";
  // Leave space for the Replay button; allow scrolling if many products
  productsRow.style.maxHeight = "calc(100% - 96px)";
  productsRow.style.overflowY = "auto";

  // Responsive sizing based on player width
  const containerWidth =
    context.wrapper.clientWidth || context.wrapper.offsetWidth || 0;
  const gapPx = 16;
  let columns = 2;
  if (containerWidth > 360) columns = 3;
  if (containerWidth > 600) columns = 4;
  if (containerWidth > 1000) columns = 5;
  const cardWidth = Math.max(
    100,
    Math.floor((containerWidth - (columns - 1) * gapPx) / columns)
  );
  const thumbHeight = Math.max(80, Math.floor(cardWidth * 0.72));

  context.cartData.products.forEach((prod: any) => {
    const prodDiv = documentObject.createElement("div");
    prodDiv.className = "cartProduct";
    prodDiv.style.display = "flex";
    prodDiv.style.flexDirection = "column";
    prodDiv.style.alignItems = "center";
    prodDiv.style.justifyContent = "flex-start";
    prodDiv.style.flex = `0 1 ${cardWidth}px`;
    prodDiv.style.width = `${cardWidth}px`;
    prodDiv.style.minWidth = "0";
    prodDiv.style.boxSizing = "border-box";
    prodDiv.style.padding = "0";
    prodDiv.innerHTML = `
      <div class="thumbWrap" style="position:relative;width:100%;height:${thumbHeight}px;overflow:hidden;border-radius:8px 8px 0 0;">
        <img src="${prod.thumbnail}" class="cartProductImage" alt="${prod.name}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:8px 8px 0 0;"/>
      </div>
      <div style="margin-top:8px;font-weight:600;color:#222;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%;box-sizing:border-box;padding:0 8px 8px;font-size:14px">${prod.name}</div>
    `;

    // Apply click and hover logic
    setupProductClickHandler(prodDiv, prod, context);
    setupProductHoverOverlay(prodDiv, prod, context);
    setupProductHoverSwap(prodDiv, prod, context);

    productsRow.appendChild(prodDiv);
  });

  // Retry button
  const retryBtn = documentObject.createElement("button");
  retryBtn.innerText = "Replay";
  retryBtn.style.marginTop = "16px";
  retryBtn.style.marginBottom = "4px";
  retryBtn.style.padding = "12px 32px";
  retryBtn.style.fontSize = "1.1em";
  retryBtn.style.borderRadius = "8px";
  retryBtn.style.border = "none";
  retryBtn.style.background = "var(--accent-color)";
  retryBtn.style.color = "var(--primary-color)";
  retryBtn.style.cursor = "pointer";
  retryBtn.style.boxShadow = "0 2px 8px rgba(0,0,0,0.10)";
  retryBtn.style.transition = "background 0.2s";
  retryBtn.onmouseenter = () => {
    retryBtn.style.background = "var(--primary-color)";
    retryBtn.style.color = "var(--accent-color)";
  };
  retryBtn.onmouseleave = () => {
    retryBtn.style.background = "var(--accent-color)";
    retryBtn.style.color = "var(--primary-color)";
  };
  retryBtn.onclick = () => {
    context.hasAutoClosedSidebar = false;
    context.video.currentTime = 0;
    context.video.play();
    overlay.remove();
    // Restore controls
    if (context.controlsContainer) {
      context.controlsContainer.style.display = "";
    }
    context.dispatchEvent(new CustomEvent("replay"));
  };

  // Layout: products row and retry button below
  const contentCol = documentObject.createElement("div");
  contentCol.style.display = "flex";
  contentCol.style.flexDirection = "column";
  contentCol.style.alignItems = "center";
  contentCol.style.maxHeight = "100%";
  contentCol.style.overflow = "auto";
  contentCol.appendChild(productsRow);
  contentCol.appendChild(retryBtn);

  overlay.appendChild(contentCol);
  context.wrapper.appendChild(overlay);
}

// Helper to handle product click actions
function handleProductClick(context: any, prod: any) {
  // Handle actions in priority order
  if (handleOpenLinkAction(context, prod)) return;
  if (handleSeekAction(context, prod)) return;
  if (handleMarkerAction(context, prod)) return;
}

function createCartSidebar(context: any) {
  if (!context.cartSidebar) {
    context.cartSidebar = documentObject.createElement("div");
  }
  context.cartSidebar.className = "cartSidebar";
  context.cartSidebar.style.cssText = `
    position: absolute;
    top: 0; right: 0; height: 100%;
    width: 0; background: var(--shoppable-sidebar-background-color); box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
    z-index: 1300; overflow: hidden; transition: width 0.2s ease;backdrop-filter: blur(4px);
    display: flex; flex-direction: column; align-items: stretch;
  `;
  context.cartSidebar.innerHTML = `
    <div class="cartSidebarProducts" style="flex:1;overflow-y:auto;padding:0 16px;"></div>
  `;
  if (!context.wrapper.contains(context.cartSidebar)) {
    context.wrapper.appendChild(context.cartSidebar);
  }

  // Hover guard
  context.isSidebarHovered = false;
  context.cartSidebar.addEventListener("mouseenter", () => {
    context.isSidebarHovered = true;
  });
  context.cartSidebar.addEventListener("mouseleave", () => {
    context.isSidebarHovered = false;
  });
  context.cartGotoLink = context.getAttribute("product-link") || undefined;
}

function bindCartButtonToggle(context: any) {
  context.cartButton.onclick = (e: any) => {
    e.stopPropagation();
    const theme = context.getAttribute ? context.getAttribute("theme") : null;
    if (theme === "shoppable-shorts") {
      const goto = context.cartGotoLink || "https://www.fastpix.io";
      window.open(goto, "_blank", "noopener,noreferrer");
      return;
    }
    if (theme === "shoppable-video-player") {
      if (context.isCartOpen) {
        context.closeCartSidebar();
      } else {
        context.openCartSidebar();
      }
    }
  };
}

function populateSidebarProducts(context: any) {
  const productsDiv = context.cartSidebar?.querySelector(
    ".cartSidebarProducts"
  ) as HTMLDivElement | null;
  if (!productsDiv) return;
  productsDiv.innerHTML = "";

  context.cartData.products.forEach((prod: any) => {
    const prodDiv = documentObject.createElement("div");
    prodDiv.className = "cartProduct";
    prodDiv.style.cssText = `
      display:flex;
      padding: 10px;
      margin-bottom:16px;
      cursor:pointer;
      align-items:center;
      justify-content:center;
      position: relative;
    `;
    prodDiv.innerHTML = `
      <img src="${prod.thumbnail}" class="cartProductImage" alt="${prod.name}" style="width:100%;height:auto;object-fit:cover;border-radius:8px;"/>
    `;

    // Store optional time range for highlighting
    if (typeof prod.startTime === "number") {
      (prodDiv as any).dataset.startTime = String(prod.startTime);
    }
    if (typeof prod.endTime === "number") {
      (prodDiv as any).dataset.endTime = String(prod.endTime);
    }

    // Setup hover and click handlers
    setupProductHoverOverlay(prodDiv, prod, context);
    setupProductHoverSwap(prodDiv, prod, context);
    setupProductClickHandler(prodDiv, prod, context);

    productsDiv.appendChild(prodDiv);
  });
}

function wireAutoOpenClose(context: any) {
  if (
    context.cartData.productSidebarConfig?.startState === "openOnPlay" &&
    context.getAttribute("theme") === "shoppable-video-player"
  ) {
    context.video.addEventListener("play", () => {
      if (!context.hasAutoClosedSidebar) context.openCartSidebar();
    });
  }

  if (
    typeof context.cartData.productSidebarConfig?.autoClose === "number" &&
    context.getAttribute("theme") === "shoppable-video-player"
  ) {
    context.video.addEventListener("timeupdate", () => {
      if (
        context.isCartOpen &&
        !context.hasAutoClosedSidebar &&
        context.video.currentTime >=
          (context.cartData.productSidebarConfig.autoClose ??
            Number.POSITIVE_INFINITY) &&
        !context.isSidebarHovered
      ) {
        context.closeCartSidebar();
        context.hasAutoClosedSidebar = true;
      }
      // Also update highlights during playback
      updateSidebarProductHighlights(context);
    });
  }
}

function bindEndedOverlay(context: any) {
  context.video.addEventListener("ended", () => {
    if (context.showPostPlayOverlay) showPostPlayOverlayUI(context);
  });
}

function initializeShoppable(context: any) {
  if (context._initShoppableRequested) return;
  context._initShoppableRequested = true;

  const theme = context.getAttribute ? context.getAttribute("theme") : null;
  if (theme !== "shoppable-video-player" && theme !== "shoppable-shorts") {
    return;
  }

  // Ensure cart button is added to DOM and visible
  if (!context.wrapper.contains(context.cartButton)) {
    context.wrapper.appendChild(context.cartButton);
  }

  // Make sure cart button is visible and properly styled
  if (context.cartButton) {
    context.cartButton.style.display = "flex";
    context.cartButton.style.position = "absolute";
    context.cartButton.style.top = "16px";
    context.cartButton.style.right = "16px";
    context.cartButton.style.zIndex = "1600";
    context.cartButton.style.background = "#fff";
    context.cartButton.style.borderRadius = "50%";
    context.cartButton.style.boxShadow = "0 2px 8px rgba(0,0,0,0.10)";
    context.cartButton.style.width = "40px";
    context.cartButton.style.height = "40px";
    context.cartButton.style.alignItems = "center";
    context.cartButton.style.justifyContent = "center";
    context.cartButton.style.border = "none";
    context.cartButton.style.cursor = "pointer";
    context.cartButton.style.opacity = "0.6";

    // For shoppable-shorts, ensure cart button is always visible
    if (theme === "shoppable-shorts") {
      context.cartButton.style.visibility = "visible";
      context.cartButton.style.opacity = "1";
    }
  }

  if (theme === "shoppable-video-player") {
    createCartSidebar(context);
    bindCartButtonToggle(context);
    populateSidebarProducts(context);
    wireAutoOpenClose(context);
    bindEndedOverlay(context);
    // Keep highlights in sync even if no autoClose configured
    context.video.addEventListener("timeupdate", () => {
      updateSidebarProductHighlights(context);
    });
  } else if (theme === "shoppable-shorts") {
    bindCartButtonToggle(context);
  }
}

// Highlight products in the sidebar when currentTime is within their start/end range
function updateSidebarProductHighlights(context: any) {
  const container = context.cartSidebar?.querySelector(
    ".cartSidebarProducts"
  ) as HTMLElement | null;
  if (!container) return;

  const now = context.video?.currentTime ?? 0;
  let newlyActive: HTMLDivElement | null = null;

  Array.from(
    container.querySelectorAll<HTMLDivElement>(".cartProduct")
  ).forEach((el) => {
    const start = Number((el as any).dataset?.startTime ?? NaN);
    const end = Number((el as any).dataset?.endTime ?? NaN);
    const isActive =
      !Number.isNaN(start) && !Number.isNaN(end) && now >= start && now <= end;

    const imgEl = el.querySelector("img") as HTMLImageElement;

    if (isActive) {
      if (imgEl) {
        imgEl.style.boxShadow = "0 0 12px var(--accent-color)";
        imgEl.style.border = "2px solid var(--accent-color)";
        imgEl.style.borderRadius = "8px";
      }
      newlyActive ??= el;
    } else if (imgEl) {
      imgEl.style.boxShadow = "";
      imgEl.style.border = "";
    }
  });

  if (newlyActive && context._lastActiveProductEl !== newlyActive) {
    try {
      (newlyActive as HTMLElement).scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    } catch (e) {
      console.error("Failed to scroll into view:", e);
    }
    context._lastActiveProductEl = newlyActive;
  }
}

function shoppableTheme(context: any) {
  if (
    context.getAttribute &&
    (context.getAttribute("theme") === "shoppable-video-player" ||
      context.getAttribute("theme") === "shoppable-shorts")
  ) {
    context.wrapper.appendChild(context.cartButton);

    if (context.getAttribute("theme") === "shoppable-video-player") {
      context.cartSidebar = documentObject.createElement("div");
      context.cartSidebar.className = "cartSidebar";
      context.cartSidebar.style.cssText = `
        position: absolute;
        top: 0; right: 0; height: 100%;
        width: 0; background: var(--shoppable-sidebar-background-color); box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
        z-index: 1300; overflow: hidden; transition: width 0.2s ease;backdrop-filter: blur(4px);
        display: flex; flex-direction: column; align-items: stretch;
      `;
      context.cartSidebar.innerHTML = `
        <div class="cartSidebarProducts"></div>
      `;
      context.wrapper.appendChild(context.cartSidebar);

      // Prevent sidebar from closing when hovered
      context.isSidebarHovered = false;
      context.cartSidebar.addEventListener("mouseenter", () => {
        context.isSidebarHovered = true;
      });
      context.cartSidebar.addEventListener("mouseleave", () => {
        context.isSidebarHovered = false;
      });

      context.cartGotoLink = context.getAttribute("product-link") || undefined;

      // Cart Button Click Handler
      context.cartButton.onclick = (e: any) => {
        e.stopPropagation();
        if (context.getAttribute("theme") === "shoppable-shorts") {
          const goto = context.cartGotoLink || "https://www.fastpix.io";
          window.open(goto, "_blank", "noopener,noreferrer");
          return;
        }
        if (context.getAttribute("theme") === "shoppable-video-player") {
          context.isCartOpen = !context.isCartOpen;
          if (context.isCartOpen) {
            context.cartSidebar.style.display = "flex";
            const _ = context.cartSidebar.offsetWidth;
            context.cartSidebar.style.width = "var(--shoppable-sidebar-width)";
            context.cartButton.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24"><path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.89 4.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z"/></svg>`;
            context.progressBar.classList.add("cartSidebarOpen-progress-bar");
            context.bottomRightDiv.classList.add(
              "cartSidebarOpen-bottom-right-div"
            );
            context.dispatchEvent(
              new CustomEvent("productBarMax", { detail: { opened: true } })
            );
            resizeVideoWidth(context);
          } else if (!context.isSidebarHovered) {
            context.cartSidebar.style.width = "0";
            context.cartSidebar.style.display = "none";
            context.cartButton.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24"><path d="M7 18c-1.104 0-2 .896-2 2s.896 2 2 2 2-.896 2-2-.896-2-2-2zm10 0c-1.104 0-2 .896-2 2s.896 2 2 2 2-.896 2-2-.896-2-2-2zM7.334 16h9.332c.822 0 1.542-.502 1.847-1.264l3.479-8.12A1 1 0 0 0 21 5H5.21l-.94-2.342A1 1 0 0 0 3.333 2H1a1 1 0 1 0 0 2h1.333l3.6 8.982-1.35 2.44C3.52 16.14 4.477 18 6 18h12a1 1 0 1 0 0-2H7.334z"/></svg>`;
            context.progressBar.classList.remove(
              "cartSidebarOpen-progress-bar"
            );
            context.bottomRightDiv.classList.remove(
              "cartSidebarOpen-bottom-right-div"
            );
            context.dispatchEvent(
              new CustomEvent("productBarMin", { detail: { opened: false } })
            );
            resizeVideoWidth(context);
          }
        }
      };

      // Populate products
      const productsDiv = context.cartSidebar.querySelector(
        ".cartSidebarProducts"
      );
      if (productsDiv) {
        context.cartData.products.forEach((prod: any) => {
          const prodDiv = documentObject.createElement("div");
          prodDiv.className = "cartProduct";
          prodDiv.style.position = "relative";
          prodDiv.innerHTML = `
              <img src="${prod.thumbnail}" class="cartProductImage" style="width:100%;height:auto;object-fit:cover;border-radius:8px;"/>
            `;

          // Setup hover and click handlers
          setupProductHoverOverlay(prodDiv, prod, context);
          setupProductHoverSwap(prodDiv, prod, context);
          setupProductClickHandler(prodDiv, prod, context);

          productsDiv.appendChild(prodDiv);
        });
      }

      // Auto-open/close logic
      if (
        (context.cartData.productSidebarConfig?.startState ?? "") ===
          "openOnPlay" &&
        context.getAttribute("theme") === "shoppable-video-player"
      ) {
        context.video.addEventListener("play", () => {
          if (!context.hasAutoClosedSidebar) context.openCartSidebar();
        });
      }

      if (
        typeof context.cartData.productSidebarConfig?.autoClose === "number" &&
        context.getAttribute("theme") === "shoppable-video-player"
      ) {
        context.video.addEventListener("timeupdate", () => {
          if (
            context.isCartOpen &&
            !context.hasAutoClosedSidebar &&
            context.video.currentTime >=
              (context.cartData.productSidebarConfig.autoClose ??
                Number.POSITIVE_INFINITY) &&
            !context.isSidebarHovered
          ) {
            context.closeCartSidebar();
            context.hasAutoClosedSidebar = true;
          }
        });
      }

      // Listen for video ended event
      context.video.addEventListener("ended", () => {
        if (context.showPostPlayOverlay) {
          showPostPlayOverlayUI(context);
        }
      });
    }
  }
}

export {
  isValidMarker,
  shoppableTheme,
  showPostPlayOverlayUI,
  updateSidebarProductHighlights,
  initializeShoppable,
  bindEndedOverlay,
  wireAutoOpenClose,
  populateSidebarProducts,
  bindCartButtonToggle,
  createCartSidebar,
  playAndClearHotspotAfterDelay,
  handleProductClick,
};
