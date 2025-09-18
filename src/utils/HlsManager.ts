import { Hls } from "hls.js";

import { hideError, showError } from "./ErrorElement.js";
import { hideLoader, hideMenus, showLoader } from "./DomVisibilityManager.js";
import {
  hideShowSubtitlesMenu,
  toggleAudioMenu,
  togglePlaybackRateButtons,
  toggleResolutionMenu,
} from "./ToggleController.js";
import { documentObject } from "./CustomElements.js";
import { isChromecastConnected } from "./CastHandler.js";

const configHls: Partial<Hls.HlsConfig> = {
  maxMaxBufferLength: 120, // Extend max buffer length for high-quality streams
  autoStartLoad: true,
  debug: false,
  enableWorker: false,
  startLevel: 0, // Start at a middle-level quality (adjust as appropriate)
  backBufferLength: 90,
  emeEnabled: true,
  lowLatencyMode: true,
  capLevelToPlayerSize: true, // Automatically adjusts level to player size
  abrEwmaFastLive: 2.0, // Tune ABR responsiveness for live content
  abrEwmaSlowLive: 8.0,
  abrMaxWithRealBitrate: true, // Use real bitrate for level switching
  drmSystems: {
    "com.widevine.alpha": {},
    "com.apple.fps": {},
  },
};

const hlsInstance: Hls | null = null;

function setupErrorHandling(context: any, streamType: string | null) {
  let networkErrorLogged = false;
  let isLoadingAllowed = true;
  let fatalFragLoadCheck = false;

  const retryHLSLoad = () => {
    if (navigator.onLine && isLoadingAllowed) {
      context.hls.startLoad();
    }
  };

  const handleOnline = () => {
    if (fatalFragLoadCheck) {
      showError(
        context,
        "A fatal error occurred previously while loading a fragment. Please refresh the page to try again."
      );
      fatalFragLoadCheck = false;
    } else {
      isLoadingAllowed = true;
      hideError(context);
      networkErrorLogged = false;
      retryHLSLoad();
    }
  };

  const handleOffline = () => {
    console.error("Device is offline. Unable to load content.");
    if (isChromecastConnected()) return;
    showError(
      context,
      "You are currently offline. Please connect to a network to continue watching."
    );
    isLoadingAllowed = false;
  };

  function fatalErrorHandling(context: any, details: any) {
    // Handle specific fatal key system errors
    if (details === Hls.ErrorDetails.KEY_SYSTEM_SESSION_UPDATE_FAILED) {
      showError(
        context,
        "A DRM (Digital Rights Management) error occurred. The playback session cannot continue due to a session update failure."
      );
      return;
    }

    if (details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
      showLoader(context); // Show loader if buffering stalls
      return;
    }

    if (details.startsWith("key")) {
      showError(
        context,
        "A DRM (Digital Rights Management) error occurred. Please check your drm-token or token for the stream."
      );
      return;
    }

    if (details === Hls.ErrorDetails.FRAG_LOAD_ERROR) {
      fatalFragLoadCheck = true;
      showError(
        context,
        "An error occurred while loading a fragment. Please try refreshing the page."
      );
      context.hls.destroy();
    } else if (
      details === Hls.ErrorDetails.LEVEL_LOAD_ERROR ||
      details === Hls.ErrorDetails.LEVEL_EMPTY_ERROR
    ) {
      showError(
        context,
        "An Error occurred while loading the stream. Please try refreshing the page."
      );
    } else if (details === Hls.ErrorDetails.LEVEL_LOAD_TIMEOUT) {
      context.hls.destroy();
      showError(
        context,
        "An error occurred while loading the stream. Please try refreshing the page."
      );
    } else if (
      details === Hls.ErrorDetails.AUDIO_TRACK_LOAD_TIMEOUT ||
      details === Hls.ErrorDetails.MANIFEST_PARSING_ERROR
    ) {
      showError(
        context,
        "An error occurred while loading the video. Please try refreshing the page."
      );
      context.hls.destroy();
    } else {
      showError(
        context,
        "An error occurred while loading the video. Playback session cannot continue, try refreshing the page."
      );
      context.hls.destroy();
    }
  }

  function keySystemErrorHandlingNonFatal(context: any, details: any) {
    // Handle non-fatal key system errors
    if (details.startsWith("KEY_SYSTEM")) {
      showError(
        context,
        "A DRM error occurred, but the player is attempting to recover."
      );
      context.hls.recoverMediaError(); // Attempt recovery for non-fatal key system errors
    }
  }

  function mediaErrorHandlingNonFatal(context: any, fatal: boolean, type: any) {
    // Handle media errors (buffering, stalling, etc.)
    if (type === Hls.ErrorTypes.MEDIA_ERROR) {
      if (fatal === true) {
        showError(
          context,
          "A problem occurred while buffering media. Playback cannot continue."
        );
      } else {
        setTimeout(() => retryHLSLoad(), 1000);
      }
    }

    // Handle network errors
    if (type === Hls.ErrorTypes.NETWORK_ERROR) {
      if (!navigator.onLine && !networkErrorLogged) {
        showError(
          context,
          "You are offline. Please connect to a network to continue watching."
        );
        networkErrorLogged = true;
      } else {
        retryHLSLoad();
        networkErrorLogged = false;
      }
    }
  }

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  context.hls.on(
    Hls.Events.ERROR,
    (data: { details: any; type?: any; fatal?: any }, event: any) => {
      // Check for fatal errors
      if (event.fatal) {
        console.error("Fatal Hls error DD:", event.details);

        fatalErrorHandling(context, event.details);
      } else {
        keySystemErrorHandlingNonFatal(context, event.details);
      }

      // Handle specific error cases for different stream types
      if (streamType === "on-demand") {
        handleOnDemandErrors(context, data);
      } else {
        handleLiveStreamErrors(context, data);
        mediaErrorHandlingNonFatal(context, event.fatal, event.type);
      }
    }
  );
}

// Function to handle on-demand errors
function handleOnDemandErrors(context: any, data: any) {
  if (data.fatal) {
    if (data.response && data.response.code === 404) {
      showError(
        context,
        "The video you are trying to access is not available."
      );
    } else if (data.response && data.response.code === 500) {
      showError(
        context,
        "Server error while loading the video. Please try again later."
      );
    }
  }
}

// Function to handle live stream errors
function handleLiveStreamErrors(context: any, data: any) {
  if (data.fatal) {
    if (
      data.response &&
      data.response.code === 404 &&
      data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR
    ) {
      showError(context, "No live stream is currently active on this channel.");
    } else if (data.response && data.response.code === 403) {
      showError(context, "Invalid token. Please check your access rights.");
    }
  }
}

function initializeHLS(
  context: any,
  src: string | null,
  streamType: string | null
) {
  // Ensure the URL is correct and includes the cache-busting parameter only when needed
  const url = context.enableCacheBusting ? `${src}?t=${Date.now()}` : src;

  // Load HLS source using HLS.js
  if (Hls.isSupported()) {
    if (src && typeof src === "string") {
      context.hls.attachMedia(context.video);
      context.hls.loadSource(url);
    } else {
      console.warn("Stream URL is invalid or null:", src);
    }

    // Hide loading indicator when the fragment has been loaded
    context.hls.on(Hls.Events.FRAG_LOADED, () => {
      hideLoader(context); // Hide loader UI
    });

    setupErrorHandling(context, streamType);

    context.hls.on(Hls.Events.FRAG_BUFFERED, () => {
      hideLoader(context);
    });
  } else if (context.video.canPlayType("application/vnd.apple.mpegurl")) {
    // Safari or other native HLS-supporting browsers
    context._src = url;
    context.video.src = url;
  } else {
    // Handle case where HLS is not supported in the browser
    showError(
      context,
      "HLS is not supported, and the browser does not support the HLS format."
    );
  }
}

function hlsListeners(context: any) {
  context.hls.on(Hls.Events.RECOVERED, () => {
    hideError(context);
  });

  context.hls.on(Hls.Events.MANIFEST_PARSED, () => {
    context.hls.attachMedia(context.video);
  });
}

function parseKeyAttributes(manifestText: string) {
  const keyLines = manifestText
    .split("\n")
    .filter((line) => line.startsWith("#EXT-X-KEY"));
  return keyLines.map((line) => extractKeyAttributes(line));
}

function extractKeyAttributes(line: string) {
  const keyAttributes: any = {};
  const attributes = line.substring("#EXT-X-KEY:".length).split(",");
  attributes.forEach((attribute) => {
    const [key, value] = attribute.split("=");
    if (value) {
      keyAttributes[key.trim()] = value.replace(/^"(.*)"$/, "$1"); // Remove quotes
    }
  });
  return keyAttributes;
}

function handleHlsQualityAndTrackSetup(context: any) {
  context.hls.on(
    Hls.Events.MANIFEST_PARSED,
    (_: any, data: { levels: any; audioTracks: any; subtitleTracks: any }) => {
      let levelsRetrieved = data.levels;
      const audioTracks = data.audioTracks;
      const subtitleTracks = data.subtitleTracks;

      const renditionOrderAttr = context.getAttribute("rendition-order");
      const levels =
        renditionOrderAttr === "desc"
          ? [...levelsRetrieved].reverse()
          : levelsRetrieved;
      setupResolutionUI(context, levels);
      setupAudioTracks(context, audioTracks);
      setupSubtitleButton(context, subtitleTracks);
      setupResolutionMenuButton(context);
    }
  );

  context.hls.on(Hls.Events.BUFFER_FLUSHED, () => handleBufferFlushed(context));
}

function setupResolutionUI(context: any, levels: any) {
  // Clear previous resolution buttons to avoid duplicates
  if (context.resolutionMenu) {
    while (context.resolutionMenu.firstChild) {
      context.resolutionMenu.removeChild(context.resolutionMenu.firstChild);
    }
  }
  context.resolutionButtons = [];

  let levelsArray = levels.map((item: { height: any }) => item.height);

  if (levelsArray[0] === 0) {
    context.bottomRightDiv.removeChild(context.resolutionMenuButton);
    context.bottomRightDiv.removeChild(context.pipButton);
    return;
  }

  context.autoResolutionButton = createResolutionButton("Auto", () => {
    showLoader(context);
    context.hls.nextLevel = -1; // Enable automatic level selection
    context.userSelectedLevel = null; // No specific level selected
    setActiveButton(context.autoResolutionButton, [
      ...context.resolutionButtons,
      context.autoResolutionButton,
    ]);
    toggleResolutionMenu(context);
  });

  context.resolutionMenu.appendChild(context.autoResolutionButton);
  context.resolutionButtons = levels.map(
    (level: { height: any }, index: any) => {
      const resolutionButton = createResolutionButton(`${level.height}p`, () =>
        handleResolutionSwitch(context, index, level.height)
      );
      context.resolutionMenu.appendChild(resolutionButton);
      return resolutionButton;
    }
  );

  setActiveButton(context.autoResolutionButton, [
    ...context.resolutionButtons,
    context.autoResolutionButton,
  ]);
}

function createResolutionButton(label: string, onClick: () => void) {
  const button = documentObject.createElement("button");
  button.className = "qualitySelectorButtons";
  button.textContent = label;
  button.title = label;
  button.addEventListener("click", onClick);
  return button;
}

function handleResolutionSwitch(context: any, index: number, height: any) {
  context.resolutionSwitching = true;
  context.wasPausedBeforeSwitch = context.video.paused;

  if (!context.wasPausedBeforeSwitch) {
    context.video.pause(); // Pause video during resolution switch
    showLoader(context);
  }

  context.resolutionFlagPause = true;
  context.isBufferFlushed = false;
  context.hls.currentLevel = index; // Set to the selected resolution level
  context.userSelectedLevel = index; // Update user-selected level

  setActiveButton(context.resolutionButtons[index], [
    ...context.resolutionButtons,
    context.autoResolutionButton,
  ]);

  toggleResolutionMenu(context);
}

function setupAudioTracks(context: any, audioTracks: any) {
  context.audioMenu.innerHTML = "";
  const audioButtons = audioTracks.map((track: { name: any }, index: number) =>
    createAudioButton(context, track.name, index)
  );

  context.audioMenu.append(...audioButtons);

  // Prefer manifest default flag; else a track named "default"; else index 0
  let defaultIndex = -1;
  if (Array.isArray(audioTracks) && audioTracks.length > 0) {
    defaultIndex = audioTracks.findIndex((t: any) => t?.default === true);
    if (defaultIndex === -1)
      defaultIndex = audioTracks.findIndex(
        (t: any) => (t?.name ?? "").toString().toLowerCase() === "default"
      );
    if (defaultIndex === -1) defaultIndex = 0;
  }

  if (audioButtons[defaultIndex]) {
    setActiveButton(audioButtons[defaultIndex], context.audioMenu.children);
    try {
      context.hls.audioTrack = defaultIndex;
      // Ensure it's applied after internal state settles
      setTimeout(() => {
        try {
          if (context.hls?.audioTrack !== defaultIndex)
            context.hls.audioTrack = defaultIndex;
        } catch {}
      }, 0);
    } catch (error) {
      console.error("Error setting default audio track:", error);
    }
  }

  context.audioMenuButton.style.display =
    audioTracks.length > 1
      ? context.audioMenuButton.classList.add("audioMenuButtonShow")
      : context.audioMenuButton.classList.remove("audioMenuButtonShow");
}

function createAudioButton(context: any, name: string, index: number) {
  const button = documentObject.createElement("button");
  button.className = "audioSelectorButtons";
  const displayName =
    (name ?? "").toString().toLowerCase() === "default"
      ? "Default"
      : (name ?? "").toString();
  button.textContent = displayName;
  button.title = displayName;

  if (index === 0) {
    button.classList.add("active");
    try {
      context.hls.audioTrack = index;
    } catch (error) {
      console.error("Error switching audio track:", error);
    }
  }

  button.addEventListener("click", (event) => {
    context.hls.audioTrack = index;
    setActiveButton(button, context.audioMenu.children);
    toggleAudioMenu(context);
    event.stopPropagation();
  });

  return button;
}

function setupSubtitleButton(context: any, subtitleTracks: any) {
  context.ccButton.style.display =
    subtitleTracks.length > 0
      ? context.ccButton.classList.add("ccButtonLength")
      : context.ccButton.classList.remove("ccButtonLength");
}

function setupResolutionMenuButton(context: any) {
  // Remove any previous click listeners to avoid duplicates
  const newButton = context.resolutionMenuButton;
  const oldButton = newButton.cloneNode(true);
  newButton.parentNode.replaceChild(oldButton, newButton);
  context.resolutionMenuButton = oldButton;

  context.resolutionMenuButton.addEventListener("click", () => {
    // True toggle: if resolution menu is open, close and return
    const isOpen =
      context.resolutionMenu && context.resolutionMenu.style.display !== "none";
    if (isOpen) {
      context.resolutionMenu.style.display = "none";
      return;
    }
    // Otherwise, close other menus then open resolution
    hideMenus(context);
    toggleResolutionMenu(context);
  });
}

function handleBufferFlushed(context: any) {
  if (!context.isBufferFlushed && context.initialPlayClick) {
    // Optional: force seeking to prevent desync
    const currentTime = context.video.currentTime;
    context.video.currentTime = currentTime + 0.001; // Small offset for accuracy

    if (!context.wasPausedBeforeSwitch) {
      context.video
        .play()
        .then(() => {
          context.isBufferFlushed = true;
          hideLoader(context);
          context.resolutionSwitching = false;
        })
        .catch((error: any) => {
          console.error("Playback error:", error);
          hideLoader(context);
        });
    } else {
      hideLoader(context);
    }
  }
}

function setActiveButton(activeButton: any, buttons: any) {
  Array.from(buttons).forEach((button: any) =>
    button.classList.remove("active")
  );
  activeButton.classList.add("active");
}

export {
  hlsInstance,
  Hls,
  initializeHLS,
  hlsListeners,
  handleHlsQualityAndTrackSetup,
  configHls,
};
