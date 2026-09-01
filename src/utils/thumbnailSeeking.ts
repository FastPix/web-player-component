import { documentObject } from "./CustomElements";
import { formatVideoDuration } from "./index";

function clearThumbnailElements(context: any) {
  const timeDisplay = context.thumbnail.querySelector(".thumbnailTimeDisplay");
  while (context.thumbnail.firstChild) {
    context.thumbnail.firstChild.remove();
  }
  if (timeDisplay) {
    context.thumbnail.appendChild(timeDisplay);
  }
}

// Helper to attach mouse/touch event listeners.
// Attached exactly once per player: thumbnailSeeking() runs again on every
// `canplay` (via showInitialControls), and the spritesheet failure path used to
// attach a second set. Two handlers on one mousemove fight over the pill —
// one paints the frame, the other renders timestamp-only — which is what made
// the preview flicker in and out while hovering or clicking the seekbar.
function attachProgressBarListeners(
  context: any,
  showThumbnail: (clientX: number) => void
) {
  if (context.thumbnailListenersAttached) return;
  context.thumbnailListenersAttached = true;

  // Resolved per event: setupSeekbarPin() may create the pin after this runs.
  const seekbarPin = (): HTMLElement | null =>
    context.controlsContainer.querySelector(".seekbarPin");

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
    const pin = seekbarPin();
    if (pin) pin.style.display = "none";
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
// Sheet already ships explicit tile coordinates; derive missing sheet dimensions
// from the tile bounds.
function normalizeExplicitTiles(raw: any): ThumbnailJson {
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

// Sheet describes a regular grid (columns/interval); synthesize the tile list.
function normalizeGridTiles(raw: any): ThumbnailJson | null {
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

function normalizeThumbnailJson(raw: any): ThumbnailJson | null {
  if (Array.isArray(raw.tiles) && raw.tiles.length > 0) {
    return normalizeExplicitTiles(raw);
  }
  return normalizeGridTiles(raw);
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
    // The image needs the same credentials as the JSON: on private playback an
    // untokenized sheet URL 401s, the <img> errors, and the preview silently
    // degrades to a bare timestamp.
    const imageParams = new URLSearchParams();
    if (token) imageParams.set("token", token);
    if (interval != null) imageParams.set("interval", String(interval));
    const imageQs = imageParams.toString();
    const imageQuery = imageQs ? `?${imageQs}` : "";
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
  // thumbnailSeeking() re-runs on every `canplay`, including the one after a
  // seek. Rebuilding the pill then tore its children down and re-appended the
  // container mid-hover; keep it if it is already mounted.
  const alreadyMounted =
    context.thumbnailSeekingContainer.parentElement ===
      context.controlsContainer &&
    context.thumbnail.parentElement === context.thumbnailSeekingContainer;

  if (!alreadyMounted) {
    clearThumbnailElements(context);
    context.thumbnailSeekingContainer.appendChild(context.thumbnail);
    context.controlsContainer.appendChild(context.thumbnailSeekingContainer);
  }

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
  const scalingFactor = Number.parseFloat(
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

// Reads context.thumbnailPreview on every event rather than closing over the
// spritesheet, so a sheet that fails or finishes generating later just updates
// that one object — no second listener, no conflicting handlers.
function createThumbnailHandler(context: any) {
  return (clientX: number) => {
    const preview = context.thumbnailPreview;
    if (!preview) return;

    const duration = context.video.duration;
    if (!Number.isFinite(duration) || duration <= 0) {
      hideThumbnail(context);
      return;
    }

    const rect = context.progressBar.getBoundingClientRect();
    const x = clientX - rect.left;
    const proportion = x / rect.width;
    // Clamp instead of bailing out: at the very end of the bar the proportion
    // rounds just past 1, and hiding the pill there made the preview vanish
    // exactly when the pointer reached the end of the seekbar.
    const currentTime = Math.min(Math.max(proportion * duration, 0), duration);

    // Always preview the hovered time. The frames come from the spritesheet,
    // not the decoded video, so there is no reason to snap to video.currentTime
    // while the player is seeking — doing that made the frame jump away from
    // the cursor for a moment after every click on the seekbar.
    showThumbnail(
      context,
      currentTime,
      x,
      preview.dimensions,
      preview.json,
      preview.url
    );
    updateChapterDisplay(context, currentTime);
  };
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
  // The loop stops one short, so the final tile never matched and the tail of
  // the seekbar kept showing whichever frame was drawn last.
  const lastTile = tiles[tiles.length - 1];
  return currentTime >= lastTile.start ? lastTile : null;
}

// The advanced spritesheet is generated on demand: until it is ready the image
// endpoint answers 202 with a JSON body ("generation is in progress"), which an
// <img> reports as a load error. Poll a few times so the preview upgrades
// itself once the sheet lands, instead of degrading permanently on first try.
const SPRITESHEET_RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 15000];

// Sheets already proven loadable. thumbnailSeeking() re-runs on every `canplay`,
// and without this the preview would drop back to timestamp-only on each run
// until the image resolved again — a visible flicker mid-hover.
const readySpritesheets = new Set<string>();

function isCurrentPreview(context: any, generation: number): boolean {
  return context.thumbnailPreviewGeneration === generation;
}

function useTimestampOnlyPreview(context: any): void {
  context.thumbnail.classList.add("noThumbnail");
  context.thumbnail.style.width = "";
  context.thumbnail.style.height = "";
  context.thumbnail.style.backgroundImage = "";
  if (context.thumbnailPreview) {
    context.thumbnailPreview.url = null;
  }
  if (context.progressBar) {
    context.progressBar.setAttribute("title", "");
  }
}

function useFramePreview(
  context: any,
  image: HTMLImageElement,
  url: string
): void {
  const preview = context.thumbnailPreview;
  if (!preview) return;
  readySpritesheets.add(url);
  context.spritesheetImage = image;
  context.thumbnail.classList.remove("noThumbnail");
  preview.url = url;
  context.thumbnail.style.width = `${preview.dimensions.width}px`;
  context.thumbnail.style.height = `${preview.dimensions.height}px`;
}

async function loadSpritesheetImage(
  context: any,
  url: string,
  generation: number,
  attempt: number = 0
): Promise<void> {
  if (!isCurrentPreview(context, generation)) return;

  let status: number;
  try {
    const response = await fetch(url);
    status = response.status;
  } catch (error) {
    console.debug("[thumbnailSeeking] Spritesheet request failed:", error);
    if (isCurrentPreview(context, generation)) useTimestampOnlyPreview(context);
    return;
  }

  if (!isCurrentPreview(context, generation)) return;

  // Still rendering server-side: show the timestamp now, retry for the frames.
  if (status === 202) {
    useTimestampOnlyPreview(context);
    const delay = SPRITESHEET_RETRY_DELAYS_MS[attempt];
    if (delay == null) return;
    setTimeout(() => {
      loadSpritesheetImage(context, url, generation, attempt + 1);
    }, delay);
    return;
  }

  if (status < 200 || status >= 300) {
    console.debug(
      `[thumbnailSeeking] Spritesheet unavailable (HTTP ${status}); using timestamp-only preview.`
    );
    useTimestampOnlyPreview(context);
    return;
  }

  // Sheets are served public/max-age, so this decode reuses the fetch above.
  const image = new Image();
  image.onload = () => {
    if (isCurrentPreview(context, generation)) {
      useFramePreview(context, image, url);
    }
  };
  image.onerror = () => {
    if (isCurrentPreview(context, generation)) useTimestampOnlyPreview(context);
  };
  image.src = url;
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

  // Single source of truth for the hover preview. thumbnailSeeking() runs again
  // on every `canplay`, so the listeners must read this rather than close over
  // one particular spritesheet.
  context.thumbnailPreviewGeneration =
    (context.thumbnailPreviewGeneration ?? 0) + 1;
  const generation = context.thumbnailPreviewGeneration;
  context.thumbnailPreview = {
    json: thumbnailJson,
    dimensions,
    // Frames are enabled only after the sheet has actually loaded once.
    url:
      thumbnailUrl && readySpritesheets.has(thumbnailUrl) ? thumbnailUrl : null,
  };

  // Only promise frames once the sheet is known to load. Sizing the pill up
  // front looked right on a public asset, but on private playback (401) or
  // while an advanced sheet is still generating (202) it drew an empty frame
  // that then collapsed to a timestamp — the preview "appearing and going".
  if (context.thumbnailPreview.url) {
    context.thumbnail.classList.remove("noThumbnail");
    context.thumbnail.style.width = `${dimensions.width}px`;
    context.thumbnail.style.height = `${dimensions.height}px`;
  } else {
    useTimestampOnlyPreview(context);
  }

  // Attach hover listeners immediately so the seekbar is interactive without
  // waiting for the (potentially multi-MB) spritesheet image to download.
  attachProgressBarListeners(context, createThumbnailHandler(context));

  if (thumbnailUrl) {
    loadSpritesheetImage(context, thumbnailUrl, generation);
  }
}

function stripTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value[end - 1] === "/") end--;
  return value.slice(0, end);
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
    return stripTrailingSlashes(s);
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
      thumbnailImage.onerror = () => {
        console.warn(
          `[fastpix-player] poster image failed to load: ${thumbnailUrl}`
        );
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
