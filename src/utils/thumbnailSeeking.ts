import { updateChapterMarkers } from "./ChaptersHandlers";
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
    updateChapterMarkers(context);
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
      updateChapterMarkers(context);
    },
    { passive: true }
  ); // Marking as passive);

  context.progressBar.addEventListener("touchend", () => {
    context.thumbnail.classList.remove("show");
    seekbarPin.style.display = "none";
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

    const token = context.getAttribute("token");
    if (token) {
      spritesheetUrl += `?token=${token}`;
    }

    const response = await fetch(spritesheetUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const thumbnailJson: ThumbnailJson = await response.json();
    context.spritesheetCache[playbackId] = thumbnailJson;
    return thumbnailJson;
  } catch (error) {
    console.warn("Error fetching spritesheet JSON:", error);
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
  finalBoundary: number,
  isThumbnailPresent: boolean
): void {
  if (x <= newTileWidth / 2 + 20) {
    context.thumbnail.style.left = isThumbnailPresent ? "20px" : "40px";
    context.thumbnail.style.right = "auto";
  } else if (x >= finalBoundary - 20) {
    context.thumbnail.style.left = "auto";
    context.thumbnail.style.right = isThumbnailPresent ? "20px" : "0px";
  } else {
    context.thumbnail.style.left = `${x - newTileWidth / 2 + 20}px`;
    context.thumbnail.style.right = "auto";
  }
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

    if (context.video.seeking || context.video.readyState < 3) {
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
  const finalBoundary = rect.width - newTileWidth / 2 - 20;

  context.thumbnail.classList.add("show");
  const seekbarPin = context.controlsContainer.querySelector(".seekbarPin");
  if (seekbarPin) {
    seekbarPin.style.display = "block";
  }

  updateTimeDisplay(context, currentTime);
  updateThumbnailPosition(
    context,
    x,
    newTileWidth,
    finalBoundary,
    !!thumbnailUrl
  );
  updateArrowPosition(context, x, newTileWidth, finalBoundary);
  updateThumbnailBackground(
    context,
    currentTime,
    thumbnailJson,
    thumbnailUrl,
    dimensions
  );
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
  // Check cache in sessionStorage first
  const cacheKey = `spritesheetUrl-${playbackId}`;
  let cachedUrl = sessionStorage.getItem(cacheKey);
  let thumbnailJson;

  if (cachedUrl) {
    // Use cached URL
    let cachedSrc = { url: cachedUrl };
    // Fetch fresh
    thumbnailJson = await fetchThumbnailJson(
      context,
      playbackId,
      cachedSrc.url
    );
  } else {
    // Fetch fresh
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
      console.warn("Failed to load spritesheet image");
      attachProgressBarListeners(
        context,
        showThumbnailHandler,
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

  // Helper function to build the thumbnail URL
  const buildThumbnailUrl = (baseUrl: string) => {
    let url = `${baseUrl}/${context.playbackId}/thumbnail.jpg`;
    if (token) url += `?token=${token}`;
    if (hasThumbnailTime)
      url += `${token ? "&" : "?"}time=${context.thumbnailTimeAttribute}`;
    return url;
  };

  // Generate primary thumbnail URL
  const thumbnailUrl = buildThumbnailUrl(context.thumbnailUrlAttribute);
  const thumbnailImage = new Image();
  thumbnailImage.src = thumbnailUrl;
  thumbnailImage.onload = () => {
    context.video.poster = thumbnailUrl;
  };

  // If no poster and no thumbnailUrlAttribute, use the fallback thumbnail URL
  if (!context.hasAttribute("poster") && !context.thumbnailUrlAttribute) {
    const fallbackThumbnailUrl = buildThumbnailUrl(context.thumbnailUrlFinal);
    const fallbackThumbnailImage = new Image();
    fallbackThumbnailImage.src = fallbackThumbnailUrl;
    fallbackThumbnailImage.onload = () => {
      context.video.poster = fallbackThumbnailUrl;
    };
  }

  // Set custom poster if defined
  if (context.posterAttribute) {
    context.video.poster = context.posterAttribute;
  }
}

export { thumbnailSeeking, customizeThumbnail };
