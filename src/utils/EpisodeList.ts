import { documentObject } from "./CustomElements";
import { hideLoader, showLoader } from "./DomVisibilityManager";
import { showError } from "./ErrorElement";
import {
  configHls,
  handleHlsQualityAndTrackSetup,
  Hls,
  hlsListeners,
} from "./HlsManager";
import { formatVideoDuration, getSRC, setStreamUrl } from "./index";
import { toggleEpisodeList } from "./ToggleController";

function renderEpisodeList(context: any) {
  if (context.episodeListContainer && context.episodes) {
    context.episodeListContainer.innerHTML = "";

    const title = documentObject.createElement("h3");
    title.textContent = "Episodes";
    title.className = "episodeListTitle";
    context.episodeListContainer.appendChild(title);

    context.episodes.forEach((episode: any, index: number) => {
      const episodeItem = createEpisodeItem(episode, index, context);
      if (context.episodeListContainer) {
        context.episodeListContainer.appendChild(episodeItem);
      }
    });
  }
}

function createEpisodeItem(episode: any, index: number, context: any) {
  const episodeItem = documentObject.createElement("div");
  episodeItem.className = "episodeItem";

  if (index === context.currentEpisodeIndex) {
    episodeItem.classList.add("currentEpisode");
  }

  const thumbnail = documentObject.createElement("img");
  thumbnail.src = episode.thumbnail;
  thumbnail.alt = episode.title || `Episode ${index + 1}`;
  thumbnail.className = "episodeThumbnail";

  const episodeInfo = documentObject.createElement("div");
  episodeInfo.className = "episodeInfo";

  const episodeTitle = documentObject.createElement("div");
  episodeTitle.className = "episodeTitle";
  episodeTitle.textContent = episode.title || `Episode ${index + 1}`;

  const episodeDuration = documentObject.createElement("div");
  episodeDuration.className = "episodeDuration";
  episodeDuration.textContent = formatVideoDuration(episode.duration);

  episodeInfo.appendChild(episodeTitle);
  episodeInfo.appendChild(episodeDuration);

  episodeItem.appendChild(thumbnail);
  episodeItem.appendChild(episodeInfo);

  // Add click event to navigate to episode
  episodeItem.addEventListener("click", () => {
    // Call custom function if provided
    if (
      context.customFunction &&
      typeof context.customFunction === "function"
    ) {
      try {
        console.warn("episode change", episode);
        localStorage.setItem("epidose change", JSON.stringify(episode));
        context.customFunction({
          episodeId: episode.id,
          action: "select",
          episode: episode,
        });
      } catch (error) {
        console.error("Error in custom function:", error);
      }
    }

    if (context.episodeListPanel && context.episodeListToggleButton) {
      // Use the existing toggle method to close the panel
      if (context.isEpisodeListVisible) {
        toggleEpisodeList(context);
      }
    } else {
      console.error("Failed to close episode list panel - elements not found");
    }

    // Perform default navigation
    const playbackId = episode["playback-id"] || episode.id;
    navigateToEpisode(episode.id, playbackId, context);
  });

  return episodeItem;
}

// Episode navigation methods
function navigateToEpisode(
  episodeId: string,
  playbackId: string,
  context: any
) {
  if (context.episodeType === "episodic" && context.episodes) {
    // Call custom function if provided
    if (
      context.customFunction &&
      typeof context.customFunction === "function"
    ) {
      try {
        const episode = context.episodes.find((ep: any) => ep.id === episodeId);
        if (episode) {
          context.customFunction({
            episodeId: episodeId,
            action: "select",
            episode: episode,
          });
        }
      } catch (error) {
        console.error("Error in custom function:", error);
      }
    }
    localStorage.setItem("playbackId", JSON.stringify(playbackId));
    // Change playback-id and reinitialize stream
    changePlaybackId(playbackId, context);
  }
}

// New method to change playback-id and reinitialize stream
async function changePlaybackId(newPlaybackId: string, context: any) {
  try {
    const wasPaused = context.video.paused;
    const currentVolume = context.video.volume;
    const wasMuted = context.video.muted;

    // pauseing video
    context.video.pause();
    showLoader(context);

    // destory player
    if (context.hls) {
      context.hls.destroy();
      context.hls = new Hls(configHls);
    }

    // clearing source video
    context.video.src = "";
    context.video.load();

    // update playback-id
    context.playbackId = newPlaybackId;
    context.setAttribute("playback-id", newPlaybackId);

    // get custom domain
    const customDomain = context.getAttribute("custom-domain");
    let playbackUrlFinal: string | null = null;

    if (
      context.streamType === "on-demand" ||
      context.streamType === "live-stream"
    ) {
      playbackUrlFinal = customDomain
        ? `https://stream.${customDomain}`
        : "https://stream.fastpix.io";
    }

    // updating stream with new playback-id
    await setStreamUrl(
      context,
      context.playbackId ?? null,
      context.token ?? null,
      playbackUrlFinal ?? undefined,
      context.streamType ?? null
    );

    // update sourcee
    context._src = getSRC();

    // reinitilize HLS listeners and setup
    hlsListeners(context);
    handleHlsQualityAndTrackSetup(context);

    // restore playback state
    context.video.volume = currentVolume;
    context.video.muted = wasMuted;

    // Update current episode index based on new playback-id
    if (context.episodes) {
      context.currentEpisodeIndex = context.episodes.findIndex(
        (episode: any) =>
          episode["playback-id"] === newPlaybackId ||
          episode.id === newPlaybackId
      );
    }

    // Update episode controls
    context.updateEpisodeControls();

    // Hide loader
    hideLoader(context);

    // Auto-play the video after episode change
    // For loop-next, always auto-play regardless of previous state
    // For other cases, only auto-play if it wasn't manually paused
    const shouldAutoPlay = context.loopPlaylistTillEnd || !wasPaused;

    if (shouldAutoPlay) {
      // Wait for video to be ready before playing
      context.video.muted = false; // for autoplay test
      context.video.addEventListener(
        "canplay",
        () => {
          context.video.play().catch((err: any) => {
            console.error("Autoplay failed:", err);
          });
        },
        { once: true }
      );
    }
  } catch (error) {
    console.error("Error changing playback-id:", error);
    hideLoader(context);
    showError(
      context,
      "Failed to load the selected episode. Please try again."
    );
  }
}

function navigateToPreviousEpisode(context: any) {
  if (
    context.episodeType === "episodic" &&
    context.episodes &&
    context.currentEpisodeIndex !== undefined
  ) {
    const prevIndex = context.currentEpisodeIndex - 1;
    if (prevIndex >= 0) {
      const prevEpisode = context.episodes[prevIndex];
      localStorage.setItem("prevItem", JSON.stringify(prevEpisode));
      console.warn("prevEpisode", prevEpisode);
      // Call custom function if provided
      if (
        context.customFunction &&
        typeof context.customFunction === "function"
      ) {
        try {
          context.customFunction({
            episodeId: prevEpisode.id,
            action: "prev",
            episode: prevEpisode,
          });
        } catch (error) {
          console.error("Error in custom function:", error);
        }
      }

      // Change playback-id and reinitialize stream
      const playbackId = prevEpisode["playback-id"] || prevEpisode.id;
      if (playbackId) {
        changePlaybackId(playbackId, context);
      }
    }
  }
}

function navigateToNextEpisode(context: any) {
  if (
    context.episodeType === "episodic" &&
    context.episodes &&
    context.currentEpisodeIndex !== undefined
  ) {
    const nextIndex = context.currentEpisodeIndex + 1; // Fixed: was +2, should be +1
    localStorage.setItem("nextIndex", JSON.stringify(nextIndex));
    localStorage.setItem(
      "currentEpisode",
      JSON.stringify(context.currentEpisodeIndex)
    );
    if (nextIndex < context.episodes.length) {
      const nextEpisode = context.episodes[nextIndex];
      localStorage.setItem("nextItem", JSON.stringify(nextEpisode));
      console.warn("nextEpisode", nextEpisode);
      // Call custom function if provided
      if (
        context.customFunction &&
        typeof context.customFunction === "function"
      ) {
        try {
          context.customFunction({
            episodeId: nextEpisode.id,
            action: "next",
            episode: nextEpisode,
          });
        } catch (error) {
          console.error("Error in custom function:", error);
        }
      }

      // Change playback-id and reinitialize stream
      const playbackId = nextEpisode["playback-id"] || nextEpisode.id;
      if (playbackId) {
        changePlaybackId(playbackId, context);
      }
    }
  }
}

function updateEpisodeControls(context: any) {
  if (
    context.episodeType === "episodic" &&
    context.episodes &&
    context.currentEpisodeIndex !== undefined
  ) {
    // Show episode controls
    context.episodeControlsContainer!.style.display = "inline-flex";
    context.episodeControlsContainer!.style.alignItems = "center";
    context.episodeControlsContainer!.style.gap = "8px";
    context.episodeControlsContainer!.style.marginLeft = "12px";

    // Update button states based on current episode index
    const isFirstEpisode = context.currentEpisodeIndex === 0;
    const isLastEpisode =
      context.currentEpisodeIndex === context.episodes.length - 1;

    // Disable prev button if it's the first episode
    context.prevEpisodeButton!.disabled = isFirstEpisode;
    // Disable next button if it's the last episode
    context.nextEpisodeButton!.disabled = isLastEpisode;

    // Update button styles based on disabled state
    context.prevEpisodeButton!.style.opacity = isFirstEpisode ? "0.5" : "1";
    context.nextEpisodeButton!.style.opacity = isLastEpisode ? "0.5" : "1";
  } else {
    // Hide episode controls for standalone content
    context.episodeControlsContainer!.style.display = "none";
  }
}

export {
  renderEpisodeList,
  createEpisodeItem,
  navigateToNextEpisode,
  updateEpisodeControls,
  navigateToEpisode,
  navigateToPreviousEpisode,
};
