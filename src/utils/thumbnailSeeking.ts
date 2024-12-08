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

async function thumbnailSeeking(
  context: any,
  playbackId: string,
  spritesheetSrc: string
) {
  let isThumbnailPresent = false;
  if (!context.spritesheetCache) {
    context.spritesheetCache = {};
  }
  let thumbnailJson = null;
  if (!context.spritesheetCache[playbackId]) {
    try {
      let spritesheetUrl = `${spritesheetSrc}/${playbackId}/spritesheet.json`;
      if (context.getAttribute("token") !== null) {
        spritesheetUrl += `?token=${context.getAttribute("token")}`;
      }
      const response = await fetch(spritesheetUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      thumbnailJson = await response.json();
      context.spritesheetCache[playbackId] = thumbnailJson;
    } catch (error) {
      console.warn("Error fetching spritesheet JSON:", error);
    }
  } else {
    thumbnailJson = context.spritesheetCache[playbackId];
  }
  const thumbnailUrl = thumbnailJson ? thumbnailJson.url : null;
  if (thumbnailUrl === null) {
    context.thumbnail.classList.add("noThumbnail");
    isThumbnailPresent = false;
  } else {
    context.thumbnail.classList.remove("noThumbnail");
    isThumbnailPresent = true;
  }
  clearThumbnailElements(context);
  context.thumbnailSeekingContainer.appendChild(context.thumbnail);
  context.controlsContainer.appendChild(context.thumbnailSeekingContainer);
  const timeDisplay =
    context.thumbnail.querySelector(".thumbnailTimeDisplay") ||
    documentObject.createElement("div");
  if (!timeDisplay.classList.contains("thumbnailTimeDisplay")) {
    timeDisplay.className = "thumbnailTimeDisplay";
    timeDisplay.textContent = "00:00";
    context.thumbnail.appendChild(timeDisplay);
  }
  const thumbnailArrow =
    context.thumbnail.querySelector(".thumbnailSeekingArrow") ||
    documentObject.createElement("div");
  if (!thumbnailArrow.classList.contains("thumbnailSeekingArrow")) {
    thumbnailArrow.className = "thumbnailSeekingArrow";
    context.thumbnail.appendChild(thumbnailArrow);
  }
  const seekbarPin =
    context.controlsContainer.querySelector(".seekbarPin") ||
    documentObject.createElement("div");
  if (!seekbarPin.classList.contains("seekbarPin")) {
    seekbarPin.className = "seekbarPin";
    context.controlsContainer.appendChild(seekbarPin);
  }
  const spritesheetImage = new Image();
  if (thumbnailUrl) {
    spritesheetImage.src = thumbnailUrl;
  }
  const scalingFactor = parseFloat(
    getComputedStyle(context.thumbnail).getPropertyValue("--scaling-factor")
  );
  const originalTileWidth = thumbnailJson ? thumbnailJson.tile_width : 0;
  const originalTileHeight = thumbnailJson ? thumbnailJson.tile_height : 0;
  const newTileWidth = originalTileWidth * scalingFactor;
  const newTileHeight = originalTileHeight * scalingFactor;
  const showThumbnail = (clientX: number) => {
    const rect = context.progressBar.getBoundingClientRect();
    const x = clientX - rect.left;
    const proportion = x / rect.width;
    let currentTime = proportion * context.video.duration;
    if (
      isNaN(currentTime) ||
      currentTime < 0 ||
      currentTime > context.video.duration
    ) {
      context.thumbnail.classList.remove("show");
      seekbarPin.style.display = "none";
      return;
    }
    if (context.video.seeking || context.video.readyState < 3) {
      currentTime = context.video.currentTime;
    }
    context.thumbnail.classList.add("show");
    seekbarPin.style.display = "block";
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

    let currentTile = null;
    if (thumbnailJson) {
      for (let i = 0; i < thumbnailJson.tiles.length - 1; i++) {
        if (
          thumbnailJson.tiles[i].start <= currentTime &&
          thumbnailJson.tiles[i + 1].start > currentTime
        ) {
          currentTile = thumbnailJson.tiles[i];
          break;
        }
      }
    }
    const finalBoundary = rect.width - newTileWidth / 2 - 20;
    if (x <= newTileWidth / 2 + 20) {
      if (isThumbnailPresent) {
        context.thumbnail.style.left = "20px";
        context.thumbnail.style.right = "auto";
      } else {
        context.thumbnail.style.left = "40px";
        context.thumbnail.style.right = "auto";
      }
    } else if (x >= finalBoundary - 20) {
      if (isThumbnailPresent) {
        context.thumbnail.style.left = "auto";
        context.thumbnail.style.right = "20px";
      } else {
        context.thumbnail.style.left = "auto";
        context.thumbnail.style.right = "0px";
      }
    } else {
      context.thumbnail.style.left = `${x - newTileWidth / 2 + 20}px`;
      context.thumbnail.style.right = "auto";
    }
    if (x <= newTileWidth / 2 + 20) {
      thumbnailArrow.style.left = `${newTileWidth / 2}px`;
      thumbnailArrow.style.right = "auto";
    } else if (x >= finalBoundary - 20) {
      thumbnailArrow.style.left = "auto";
      thumbnailArrow.style.right = `${newTileWidth / 2}px`;
    } else {
      thumbnailArrow.style.left = `${newTileWidth / 2}px`;
      thumbnailArrow.style.right = "auto";
    }

    // Display the appropriate chapter text
    let displayChapter = "";
    for (const chapter of context.chapters) {
      if (currentTime >= chapter.startTime && currentTime <= chapter.endTime) {
        displayChapter = chapter.value || "";
        if (context.currentChapter !== chapter) {
          context.currentChapter = chapter;
          // this.dispatchEvent(new Event('chapterchange'));
        }
        break;
      }
    }
    context.chapterDisplay.textContent = displayChapter;

    context.chapterDisplay.classList.add("multi-line");

    context.thumbnail.appendChild(context.chapterDisplay);

    if (currentTile) {
      context.thumbnail.style.backgroundImage = `url(${thumbnailUrl})`;
      context.thumbnail.style.backgroundPosition = `-${
        currentTile.x * scalingFactor
      }px -${currentTile.y * scalingFactor}px`;
      context.thumbnail.style.backgroundSize = `${
        spritesheetImage.width * scalingFactor
      }px ${spritesheetImage.height * scalingFactor}px`;
    }
  };
  if (thumbnailUrl) {
    spritesheetImage.onload = () => {
      context.thumbnail.style.width = `${newTileWidth}px`;
      context.thumbnail.style.height = `${newTileHeight}px`;
      attachProgressBarListeners(context, showThumbnail, seekbarPin);
    };
    spritesheetImage.onerror = () => {
      console.warn("Failed to load spritesheet image");
      context.attachProgressBarListeners(showThumbnail, seekbarPin);
    };
  } else {
    attachProgressBarListeners(context, showThumbnail, seekbarPin);
  }
}

function customizeThumbnail(context: any) {
  // Set placeholder as poster if available
  if (context.placeholderAttribute) {
    context.video.poster = context.placeholderAttribute;
  }

  // Initialize the thumbnail URL based on token and thumbnail-time attributes
  let thumbnailUrl;
  const token = context.getAttribute("token");
  const hasThumbnailTime = context.hasAttribute("thumbnail-time");

  // Build thumbnail URL with or without the token and thumbnail-time
  if (token !== null) {
    thumbnailUrl = hasThumbnailTime
      ? `${context.thumbnailUrlAttribute}/${context.playbackId}/thumbnail.jpg?token=${token}&time=${context.thumbnailTimeAttribute}`
      : `${context.thumbnailUrlAttribute}/${context.playbackId}/thumbnail.jpg?token=${token}`;
  } else {
    thumbnailUrl = hasThumbnailTime
      ? `${context.thumbnailUrlAttribute}/${context.playbackId}/thumbnail.jpg?time=${context.thumbnailTimeAttribute}`
      : `${context.thumbnailUrlAttribute}/${context.playbackId}/thumbnail.jpg`;
  }

  // Load the thumbnail image and set it as poster once loaded
  const thumbnailImage = new Image();
  thumbnailImage.src = thumbnailUrl;
  thumbnailImage.onload = () => {
    context.video.poster = thumbnailUrl;
  };

  // If no poster and no thumbnailUrlAttribute, use the final thumbnail URL
  if (!context.hasAttribute("poster") && !context.thumbnailUrlAttribute) {
    let fallbackThumbnailUrl;

    if (token !== null) {
      fallbackThumbnailUrl = hasThumbnailTime
        ? `${context.thumbnailUrlFinal}/${context.playbackId}/thumbnail.jpg?token=${token}&time=${context.thumbnailTimeAttribute}`
        : `${context.thumbnailUrlFinal}/${context.playbackId}/thumbnail.jpg?token=${token}`;
    } else {
      fallbackThumbnailUrl = hasThumbnailTime
        ? `${context.thumbnailUrlFinal}/${context.playbackId}/thumbnail.jpg?time=${context.thumbnailTimeAttribute}`
        : `${context.thumbnailUrlFinal}/${context.playbackId}/thumbnail.jpg`;
    }

    // Load the fallback thumbnail image if needed
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
