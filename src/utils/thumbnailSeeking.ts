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
  // Full sheet dimensions, derived up-front so hover previews can size the
  // background-image before the spritesheet image finishes downloading.
  sheet_width: number;
  sheet_height: number;
  tiles: Array<{ start: number; x: number; y: number }>;
}

// The images API has two response shapes:
//   1. Legacy: tile_width / tile_height / tiles[] (explicit tile list)
//   2. Grid:   tileWidth / tileHeight / columns / rows / interval (uniform grid)
// Normalize both into the legacy shape so downstream code is schema-agnostic.
function normalizeThumbnailJson(raw: any): ThumbnailJson | null {
  if (Array.isArray(raw.tiles) && raw.tiles.length > 0) {
    const tileWidth = raw.tile_width ?? raw.tileWidth ?? 0;
    const tileHeight = raw.tile_height ?? raw.tileHeight ?? 0;
    let sheetWidth = Number(raw.sheetWidth) || 0;
    let sheetHeight = Number(raw.sheetHeight) || 0;
    if (!sheetWidth || !sheetHeight) {
      for (const t of raw.tiles) {
        if (t.x + tileWidth > sheetWidth) sheetWidth = t.x + tileWidth;
        if (t.y + tileHeight > sheetHeight) sheetHeight = t.y + tileHeight;
      }
    }
    return {
      url: typeof raw.url === "string" ? raw.url : "",
      tile_width: tileWidth,
      tile_height: tileHeight,
      sheet_width: sheetWidth,
      sheet_height: sheetHeight,
      tiles: raw.tiles,
    };
  }
  const cols = Number(raw.columns);
  const interval = Number(raw.interval);
  const tileWidth = Number(raw.tileWidth ?? raw.tile_width);
  const tileHeight = Number(raw.tileHeight ?? raw.tile_height);
  if (!cols || !interval || !tileWidth || !tileHeight) return null;
  const count = Number(raw.thumbnailCount) || cols * Number(raw.rows ?? 0);
  if (!count) return null;
  const tiles: Array<{ start: number; x: number; y: number }> = [];
  for (let i = 0; i < count; i++) {
    tiles.push({
      start: i * interval,
      x: (i % cols) * tileWidth,
      y: Math.floor(i / cols) * tileHeight,
    });
  }
  return {
    url: typeof raw.url === "string" ? raw.url : "",
    tile_width: tileWidth,
    tile_height: tileHeight,
    sheet_width: Number(raw.sheetWidth) || cols * tileWidth,
    sheet_height:
      Number(raw.sheetHeight) || Math.ceil(count / cols) * tileHeight,
    tiles,
  };
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

  const variant = context.useAdvancedSpritesheet
    ? "advanced-spritesheet"
    : "spritesheet";
  // Only advanced sheets honor the interval query parameter; the normal
  // endpoint ignores it. Treat missing/invalid as "let the API default".
  const interval =
    variant === "advanced-spritesheet" &&
    typeof context.advancedSpritesheetInterval === "number"
      ? context.advancedSpritesheetInterval
      : null;
  const cacheKey = `${playbackId}:${variant}:${interval ?? "default"}`;

  if (context.spritesheetCache?.[cacheKey]) {
    return context.spritesheetCache[cacheKey];
  }

  context.spritesheetCache ??= {};

  try {
    const params = new URLSearchParams();
    const token = context.token;
    if (token) params.set("token", token);
    if (interval != null) params.set("interval", String(interval));
    const qs = params.toString();
    const query = qs ? `?${qs}` : "";
    const spritesheetUrl = `${spritesheetSrc}/${playbackId}/${variant}.json${query}`;

    const response = await fetch(spritesheetUrl);
    if (!response.ok) {
      console.warn(
        `Failed to fetch spritesheet: HTTP ${response.status} for ${spritesheetUrl}`
      );
      return null;
    }

    const raw: any = await response.json();
    if (!raw || typeof raw !== "object") {
      console.warn(
        `Spritesheet JSON empty for ${spritesheetUrl}; skipping hover previews.`
      );
      return null;
    }
    const thumbnailJson = normalizeThumbnailJson(raw);
    if (
      !thumbnailJson ||
      !Array.isArray(thumbnailJson.tiles) ||
      thumbnailJson.tiles.length === 0
    ) {
      console.warn(
        `Spritesheet JSON missing tiles for ${spritesheetUrl}; skipping hover previews.`
      );
      return null;
    }
    // The API has been observed to return URLs with stray double slashes and
    // case mismatches (e.g. "advanced-Spritesheet.jpg") that 404. Rebuild the
    // image URL deterministically from the same endpoint we just fetched.
    // Carry the interval onto the image URL so the JPEG matches the JSON's
    // tile schedule (the API serves a different sheet per interval).
    const imageQuery = interval != null ? `?interval=${interval}` : "";
    thumbnailJson.url = `${spritesheetSrc}/${playbackId}/${variant}.jpg${imageQuery}`;
    context.spritesheetCache[cacheKey] = thumbnailJson;
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
    // Prefer sheet dimensions from the JSON so the background can be sized
    // before the image finishes downloading. Fall back to natural image size
    // only if the JSON didn't carry sheet dimensions.
    const sheetWidth =
      thumbnailJson.sheet_width || context.spritesheetImage?.width || 0;
    const sheetHeight =
      thumbnailJson.sheet_height || context.spritesheetImage?.height || 0;
    context.thumbnail.style.backgroundImage = `url(${thumbnailUrl})`;
    context.thumbnail.style.backgroundPosition = `-${
      currentTile.x * scalingFactor
    }px -${currentTile.y * scalingFactor}px`;
    context.thumbnail.style.backgroundSize = `${
      sheetWidth * scalingFactor
    }px ${sheetHeight * scalingFactor}px`;
  }
}

function findCurrentTile(thumbnailJson: ThumbnailJson, currentTime: number) {
  const tiles = thumbnailJson?.tiles;
  if (!Array.isArray(tiles) || tiles.length === 0) return null;
  for (let i = 0; i < tiles.length - 1; i++) {
    if (tiles[i].start <= currentTime && tiles[i + 1].start > currentTime) {
      return tiles[i];
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
    // Size the pill from the JSON immediately so hover renders correctly even
    // before the image bytes arrive. The browser will paint each tile region
    // as soon as the image is decoded.
    context.thumbnail.style.width = `${dimensions.width}px`;
    context.thumbnail.style.height = `${dimensions.height}px`;
  }

  const showThumbnailHandler = createThumbnailHandler(
    context,
    thumbnailJson,
    dimensions,
    thumbnailUrl
  );

  // Attach hover listeners immediately so the seekbar is interactive without
  // waiting for the (potentially multi-MB) spritesheet image to download.
  attachProgressBarListeners(
    context,
    showThumbnailHandler,
    context.controlsContainer.querySelector(".seekbarPin")
  );

  if (thumbnailUrl) {
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
  }
}

function customizeThumbnail(context: any) {
  // Set placeholder as poster if available
  if (context.placeholderAttribute) {
    context.video.poster = context.placeholderAttribute;
  }

  const token = context.thumbnailToken;
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

  // Prefer thumbnailUrlFinal: it normalizes the user-supplied spritesheet-src
  // (e.g. "images.fastpix.co") into an absolute https URL. Using the raw
  // attribute here caused the browser to treat it as a relative path.
  const resolvedBase = normalizePosterBase(context.thumbnailUrlFinal);

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
