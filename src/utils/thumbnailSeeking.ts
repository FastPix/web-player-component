import { documentObject } from "./CustomElements";
import { formatVideoDuration } from "./index";

function clearThumbnailElements(context: any) {
  const timeDisplay = context.thumbnail.querySelector(".thumbnailTimeDisplay");
  while (context.thumbnail.firstChild) {
    context.thumbnail.removeChild(context.thumbnail.firstChild);
  }
  if (timeDisplay) {
    context.thumbnail.appendChild(timeDisplay);
  }
}

// Helper to attach mouse/touch event listeners
function attachProgressBarListeners(
  context: any,
  showThumbnail: (clientX: number) => void,
  seekbarPin: HTMLElement
) {
  context.progressBar.addEventListener("mousemove", (event: MouseEvent) => {
    showThumbnail(event.clientX);
  });
  context.progressBar.addEventListener("mousedown", (event: MouseEvent) => {
    showThumbnail(event.clientX);
  });
  context.progressBar.addEventListener("click", (event: MouseEvent) => {
    showThumbnail(event.clientX);
  });
  context.progressBar.addEventListener("mouseleave", () => {
    seekbarPin.style.display = "none";
    context.thumbnail.classList.remove("show");
  });
  context.progressBar.addEventListener(
    "touchmove",
    (event: TouchEvent) => {
      const touch = event.touches[0];
      showThumbnail(touch.clientX);
    },
    { passive: true }
  ); // Marking as passive);

  context.progressBar.addEventListener("touchend", () => {
    hideThumbnail(context);
  });
}

// Types
interface ThumbnailJson {
  url: string;
  tile_width: number;
  tile_height: number;
  tiles: Array<{ start: number; x: number; y: number }>;
}

// Cache management
async function fetchThumbnailJson(
  context: any,
  playbackId: string | null,
  spritesheetSrc: string | null
): Promise<ThumbnailJson | null> {
  if (!playbackId || !spritesheetSrc) {
    console.warn("Missing playbackId or spritesheetSrc");
    return null;
  }

  if (context.spritesheetCache?.[playbackId]) {
    return context.spritesheetCache[playbackId];
  }

  context.spritesheetCache ??= {};

  try {
    let spritesheetUrl = `${spritesheetSrc}/${playbackId}/spritesheet.json`;

    const token = context.token;
    if (token) {
      spritesheetUrl += `?token=${token}`;
    }

    const response = await fetch(spritesheetUrl);
    if (!response.ok) {
      console.warn(
        `Failed to fetch spritesheet: HTTP ${response.status} for ${spritesheetUrl}`
      );
      return null;
    }

    const thumbnailJson: ThumbnailJson = await response.json();
    context.spritesheetCache[playbackId] = thumbnailJson;
    return thumbnailJson;
  } catch (error) {
    console.error("Error fetching spritesheet:", error);
    return null;
  }
}

// DOM Setup
function setupThumbnailElements(context: any): void {
  clearThumbnailElements(context);
  context.thumbnailSeekingContainer.appendChild(context.thumbnail);
  context.controlsContainer.appendChild(context.thumbnailSeekingContainer);

  setupTimeDisplay(context);
  setupThumbnailArrow(context);
  setupSeekbarPin(context);
}

function setupTimeDisplay(context: any): void {
  const timeDisplay =
    context.thumbnail.querySelector(".thumbnailTimeDisplay") ??
    documentObject.createElement("div");
  if (!timeDisplay.classList.contains("thumbnailTimeDisplay")) {
    timeDisplay.className = "thumbnailTimeDisplay";
    timeDisplay.textContent = "00:00";
    context.thumbnail.appendChild(timeDisplay);
  }
}

function setupThumbnailArrow(context: any): void {
  const thumbnailArrow =
    context.thumbnail.querySelector(".thumbnailSeekingArrow") ??
    documentObject.createElement("div");
  if (!thumbnailArrow.classList.contains("thumbnailSeekingArrow")) {
    thumbnailArrow.className = "thumbnailSeekingArrow";
    context.thumbnail.appendChild(thumbnailArrow);
  }
}

function setupSeekbarPin(context: any): void {
  const seekbarPin =
    context.controlsContainer.querySelector(".seekbarPin") ??
    documentObject.createElement("div");
  if (!seekbarPin.classList.contains("seekbarPin")) {
    seekbarPin.className = "seekbarPin";
    context.controlsContainer.appendChild(seekbarPin);
  }
}

// Thumbnail Display Logic
function calculateThumbnailDimensions(
  context: any,
  thumbnailJson: ThumbnailJson | null
) {
  const scalingFactor = parseFloat(
    getComputedStyle(context.thumbnail).getPropertyValue("--scaling-factor")
  );
  const originalTileWidth = thumbnailJson ? thumbnailJson.tile_width : 0;
  const originalTileHeight = thumbnailJson ? thumbnailJson.tile_height : 0;

  return {
    width: originalTileWidth * scalingFactor,
    height: originalTileHeight * scalingFactor,
    scalingFactor,
  };
}

function updateThumbnailPosition(
  context: any,
  x: number,
  newTileWidth: number,
  barWidth: number,
  margin: number,
  isThumbnailPresent: boolean,
  containerRect: DOMRect
): void {
  const pillWidth = isThumbnailPresent
    ? newTileWidth
    : context.thumbnail.offsetWidth || 48;
  const leftClamp = margin + pillWidth / 2;
  const rightClamp = margin + barWidth - pillWidth / 2;
  const centerX = margin + x;

  let leftPx: number;
  if (centerX <= leftClamp) {
    leftPx = margin;
  } else if (centerX >= rightClamp) {
    leftPx = margin + barWidth - pillWidth;
  } else {
    leftPx = centerX - pillWidth / 2;
  }

  const parent = context.thumbnail.offsetParent as HTMLElement | null;
  const offset = parent
    ? containerRect.left - parent.getBoundingClientRect().left
    : 0;
  context.thumbnail.style.left = `${leftPx + offset}px`;
  context.thumbnail.style.right = "auto";
  context.thumbnail.style.transform = "translateX(0)";
}

function updateArrowPosition(
  context: any,
  x: number,
  newTileWidth: number,
  finalBoundary: number
): void {
  const thumbnailArrow = context.thumbnail.querySelector(
    ".thumbnailSeekingArrow"
  );

  if (x >= finalBoundary - 20) {
    thumbnailArrow.style.left = "auto";
    thumbnailArrow.style.right = `${newTileWidth / 2}px`;
  } else {
    // Combines both the first condition (x <= newTileWidth / 2 + 20)
    // and the else case since they had identical code
    thumbnailArrow.style.left = `${newTileWidth / 2}px`;
    thumbnailArrow.style.right = "auto";
  }
}

function updateChapterDisplay(context: any, currentTime: number): void {
  let displayChapter = "";
  for (const chapter of context.chapters) {
    if (currentTime >= chapter.startTime && currentTime <= chapter.endTime) {
      displayChapter = chapter.value ?? "";
      if (context.currentChapter !== chapter) {
        context.currentChapter = chapter;
      }
      break;
    }
  }

  context.chapterDisplay.textContent = displayChapter;
  context.chapterDisplay.classList.add("multi-line");
  context.thumbnail.appendChild(context.chapterDisplay);
}

function createThumbnailHandler(
  context: any,
  thumbnailJson: ThumbnailJson | null,
  dimensions: { width: number; height: number; scalingFactor: number },
  thumbnailUrl: string | null
) {
  return (clientX: number) => {
    const rect = context.progressBar.getBoundingClientRect();
    const x = clientX - rect.left;
    const proportion = x / rect.width;
    let currentTime = proportion * context.video.duration;

    if (isInvalidTime(currentTime, context)) {
      hideThumbnail(context);
      return;
    }

    // Only override to playback time when we have thumbnail frames (avoids wrong frame).
    // For noThumbnail (spritesheet fail) always show cursor time so only the hover timestamp appears.
    if (
      thumbnailUrl &&
      (context.video.seeking || context.video.readyState < 3)
    ) {
      currentTime = context.video.currentTime;
    }

    showThumbnail(
      context,
      currentTime,
      x,
      dimensions,
      thumbnailJson,
      thumbnailUrl
    );
    updateChapterDisplay(context, currentTime);
  };
}

function isInvalidTime(currentTime: number, context: any): boolean {
  return (
    isNaN(currentTime) ||
    currentTime < 0 ||
    currentTime > context.video.duration
  );
}

function hideThumbnail(context: any): void {
  context.thumbnail.classList.remove("show");
  const seekbarPin = context.controlsContainer.querySelector(".seekbarPin");
  if (seekbarPin) {
    seekbarPin.style.display = "none";
  }
}

function showThumbnail(
  context: any,
  currentTime: number,
  x: number,
  dimensions: { width: number; height: number; scalingFactor: number },
  thumbnailJson: ThumbnailJson | null,
  thumbnailUrl: string | null
): void {
  const { width: newTileWidth } = dimensions;
  const rect = context.progressBar.getBoundingClientRect();
  const containerRect = context.controlsContainer.getBoundingClientRect();
  const barWidth = rect.width;
  const margin = rect.left - containerRect.left;
  const finalBoundary = barWidth - newTileWidth / 2 - margin;

  context.thumbnail.classList.add("show");

  updateTimeDisplay(context, currentTime);
  updateThumbnailPosition(
    context,
    x,
    newTileWidth,
    barWidth,
    margin,
    !!thumbnailUrl,
    containerRect
  );
  updateArrowPosition(context, x, newTileWidth, finalBoundary);
  updateThumbnailBackground(
    context,
    currentTime,
    thumbnailJson,
    thumbnailUrl,
    dimensions
  );

  const seekbarPin = context.controlsContainer.querySelector(".seekbarPin");
  if (seekbarPin) {
    seekbarPin.style.display = "block";
    seekbarPin.style.position = "fixed";
    seekbarPin.style.left = `${rect.left + x}px`;
    seekbarPin.style.top = `${rect.top + rect.height / 2}px`;
    seekbarPin.style.transform = "translate(-50%, -50%)";
  }
}

function updateTimeDisplay(context: any, currentTime: number): void {
  const timeDisplay = context.thumbnail.querySelector(".thumbnailTimeDisplay");
  let displayCurrentTime;

  if (currentTime <= 0) {
    displayCurrentTime = "00:00";
  } else if (currentTime >= context.video.duration) {
    displayCurrentTime = formatVideoDuration(context.video.duration);
  } else {
    displayCurrentTime = formatVideoDuration(currentTime);
  }

  if (timeDisplay.innerHTML !== displayCurrentTime) {
    timeDisplay.innerHTML = displayCurrentTime;
  }
}

function updateThumbnailBackground(
  context: any,
  currentTime: number,
  thumbnailJson: ThumbnailJson | null,
  thumbnailUrl: string | null,
  dimensions: { width: number; height: number; scalingFactor: number }
): void {
  if (!thumbnailJson || !thumbnailUrl) return;

  const currentTile = findCurrentTile(thumbnailJson, currentTime);
  if (currentTile) {
    const { scalingFactor } = dimensions;
    context.thumbnail.style.backgroundImage = `url(${thumbnailUrl})`;
    context.thumbnail.style.backgroundPosition = `-${
      currentTile.x * scalingFactor
    }px -${currentTile.y * scalingFactor}px`;
    context.thumbnail.style.backgroundSize = `${
      context.spritesheetImage.width * scalingFactor
    }px ${context.spritesheetImage.height * scalingFactor}px`;
  }
}

function findCurrentTile(thumbnailJson: ThumbnailJson, currentTime: number) {
  for (let i = 0; i < thumbnailJson.tiles.length - 1; i++) {
    if (
      thumbnailJson.tiles[i].start <= currentTime &&
      thumbnailJson.tiles[i + 1].start > currentTime
    ) {
      return thumbnailJson.tiles[i];
    }
  }
  return null;
}

// Main function
async function thumbnailSeeking(
  context: any,
  playbackId: string | null,
  spritesheetSrc: string
): Promise<void> {
  // Cache key includes spritesheetSrc so changing spritesheet-src in the page uses the new URL
  const cacheKey = `spritesheetUrl-${playbackId}-${spritesheetSrc}`;
  let cachedUrl = sessionStorage.getItem(cacheKey);
  let thumbnailJson;

  if (cachedUrl) {
    thumbnailJson = await fetchThumbnailJson(context, playbackId, cachedUrl);
  } else {
    thumbnailJson = await fetchThumbnailJson(
      context,
      playbackId,
      spritesheetSrc
    );
    if (thumbnailJson?.url) {
      sessionStorage.setItem(cacheKey, spritesheetSrc);
    }
  }

  const thumbnailUrl = thumbnailJson?.url ?? null;

  if (thumbnailUrl === null) {
    context.thumbnail.classList.add("noThumbnail");
    if (context.progressBar) {
      context.progressBar.setAttribute("title", "");
    }
  } else {
    context.thumbnail.classList.remove("noThumbnail");
  }

  setupThumbnailElements(context);
  const dimensions = calculateThumbnailDimensions(context, thumbnailJson);

  const spritesheetImage = new Image();
  if (thumbnailUrl) {
    spritesheetImage.src = thumbnailUrl;
    context.spritesheetImage = spritesheetImage;
  }

  const showThumbnailHandler = createThumbnailHandler(
    context,
    thumbnailJson,
    dimensions,
    thumbnailUrl
  );

  if (thumbnailUrl) {
    spritesheetImage.onload = () => {
      context.thumbnail.style.width = `${dimensions.width}px`;
      context.thumbnail.style.height = `${dimensions.height}px`;
      attachProgressBarListeners(
        context,
        showThumbnailHandler,
        context.controlsContainer.querySelector(".seekbarPin")
      );
    };
    spritesheetImage.onerror = () => {
      console.debug(
        "[thumbnailSeeking] Spritesheet image failed; using timestamp-only preview on hover."
      );
      context.thumbnail.classList.add("noThumbnail");
      context.thumbnail.style.width = "";
      context.thumbnail.style.height = "";
      if (context.progressBar) {
        context.progressBar.setAttribute("title", "");
      }
      const fallbackHandler = createThumbnailHandler(
        context,
        thumbnailJson,
        dimensions,
        null
      );
      attachProgressBarListeners(
        context,
        fallbackHandler,
        context.controlsContainer.querySelector(".seekbarPin")
      );
    };
  } else {
    attachProgressBarListeners(
      context,
      showThumbnailHandler,
      context.controlsContainer.querySelector(".seekbarPin")
    );
  }
}

function customizeThumbnail(context: any) {
  // Set placeholder as poster if available
  if (context.placeholderAttribute) {
    context.video.poster = context.placeholderAttribute;
  }

  const token = context.getAttribute("token");
  const hasThumbnailTime = context.hasAttribute("thumbnail-time");
  const playbackId = context.playbackId as string | null | undefined;

  const normalizePosterBase = (raw: string | null | undefined): string => {
    if (raw == null) return "";
    const s = String(raw).trim();
    if (!s || s.toLowerCase() === "null") return "";
    return s.replace(/\/+$/, "");
  };

  // spritesheet-src missing → getAttribute is null; String coercions produced "null/pid/thumbnail.jpg"
  // (relative to demo origin → /demo/null/...). Prefer thumbnailUrlFinal from receiveAttributes.
  const buildThumbnailUrl = (baseUrl: string): string => {
    const base = normalizePosterBase(baseUrl);
    if (!base || !playbackId) return "";
    let url = `${base}/${playbackId}/thumbnail.jpg`;
    if (token) url += `?token=${token}`;
    if (hasThumbnailTime)
      url += `${token ? "&" : "?"}time=${context.thumbnailTimeAttribute}`;
    return url;
  };

  const resolvedBase =
    normalizePosterBase(context.thumbnailUrlAttribute) ||
    normalizePosterBase(context.thumbnailUrlFinal);

  if (resolvedBase && playbackId && !context.posterAttribute) {
    const thumbnailUrl = buildThumbnailUrl(resolvedBase);
    if (thumbnailUrl) {
      const thumbnailImage = new Image();
      thumbnailImage.onload = () => {
        if (!context.posterAttribute) {
          context.video.poster = thumbnailUrl;
        }
      };
      thumbnailImage.src = thumbnailUrl;
    }
  }

  // Set custom poster if defined
  if (context.posterAttribute) {
    context.video.poster = context.posterAttribute;
  }
}

export { thumbnailSeeking, customizeThumbnail };
