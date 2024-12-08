import { Hls } from "hls.js";
import { documentObject } from "./CustomElements.js";

import { hideError, showError } from "./ErrorElement.js";
import { hideLoader, showLoader } from "./DomVisibilityManager.js";
import {
  hideShowSubtitlesMenu,
  toggleAudioMenu,
  togglePlaybackRateButtons,
  toggleResolutionMenu,
} from "./ToggleController.js";

const configHls: Partial<Hls.HlsConfig> = {
  maxMaxBufferLength: 30,
  autoStartLoad: true,
  debug: false,
  enableWorker: false,
  startLevel: 0,
  backBufferLength: 90,
  emeEnabled: true,
  lowLatencyMode: true,
  capLevelToPlayerSize: true,
  abrEwmaFastLive: 2.0,
  abrEwmaSlowLive: 8.0,
  abrMaxWithRealBitrate: true,
  drmSystems: {
    "com.widevine.alpha": {},
    "com.apple.fps": {
      serverCertificateUrl: "https://static.fastpix.io/fairplay.cer",
    },
  },
};

let hlsInstance: Hls | null = null;
let url: string | null;

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
    showError(
      context,
      "You are currently offline. Please connect to a network to continue watching."
    );
    isLoadingAllowed = false;
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  context.hls.on(
    Hls.Events.ERROR,
    (event: any, data: { details: any; type?: any; fatal?: any }) => {
      const { type, details, fatal } = data;

      // Check for fatal errors
      if (fatal) {
        console.error("Fatal Hls error:", details);

        // Handle specific fatal key system errors
        if (details === Hls.ErrorDetails.KEY_SYSTEM_SESSION_UPDATE_FAILED) {
          showError(
            context,
            "A DRM (Digital Rights Management) error occurred. The playback session cannot continue due to a session update failure."
          );
          return;
        }

        if (data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
          showLoader(context); // Show loader if buffering stalls
          return;
        }

        if (details.startsWith("KEY_SYSTEM")) {
          showError(
            context,
            "A DRM (Digital Rights Management) error occurred. Playback session cannot continue."
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
            "An error occurred while loading the video. Playback session cannot continue."
          );
          context.hls.destroy();
        }
      } else {
        // console.warn("Non-fatal Hls error:", details);

        // Handle non-fatal key system errors
        if (details.startsWith("KEY_SYSTEM")) {
          showError(
            context,
            "A DRM error occurred, but the player is attempting to recover."
          );
          context.hls.recoverMediaError(); // Attempt recovery for non-fatal key system errors
        }

        // Handle media errors (buffering, stalling, etc.)
        if (type === Hls.ErrorTypes.MEDIA_ERROR) {
          if (!fatal) {
            setTimeout(() => retryHLSLoad(), 1000);
          } else {
            showError(
              context,
              "A problem occurred while buffering media. Playback cannot continue."
            );
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

      // Handle specific error cases for different stream types
      if (streamType === "on-demand") {
        handleOnDemandErrors(context, data);
      } else {
        handleLiveStreamErrors(context, data);
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
  let debugAttribute: boolean = context.hasAttribute("debug");

  // Load HLS source using HLS.js
  if (Hls.isSupported()) {
    // Load HLS source using HLS.js
    if (src && typeof src === "string") {
      context.hls.attachMedia(context.video);
      context.hls.loadSource(src);
    } else {
      console.warn("Stream URL is invalid or null:", src);
    }

    context.hls.on(Hls.Events.FRAG_PARSED, (event: any, data: any) => {
      if (debugAttribute) {
        context.onFragmentParsed(data);
      }
    });

    // Hide loading indicator when the fragment has been loaded
    context.hls.on(Hls.Events.FRAG_LOADED, () => {
      hideLoader(context); // Hide loader UI
    });

    setupErrorHandling(context, streamType);

    context.hls.on(Hls.Events.FRAG_BUFFERED, () => {
      hideLoader(context);
    });
  } else if (context.video.canPlayType("application/vnd.apple.mpegurl")) {
    context.video.src = src;
    context.src = url;
  } else {
    showError(
      context,
      "HLS is not supported, and the browser does not support the HLS format."
    );
  }
}

function hlsListeners(context: any) {
  context.hls.on(Hls.Events.RECOVERED, (e: any, _: any) => {
    hideError(context);
  });

  context.hls.on(Hls.Events.MANIFEST_PARSED, () => {
    context.hls.attachMedia(context.video);
  });

  // Listen for the FRAG_PARSED event
  context.hls.on(Hls.Events.FRAG_PARSED, (event: any, data: any) => {
    if (context.debugAttribute) {
      context.onFragmentParsed(data);
    }
  });

  // Listen for the manifest_parsed event
  context.hls.on(
    Hls.Events.MANIFEST_PARSED,
    (event: any, data: { levels: any[] }) => {
      if (
        context.streamType === "on-demand" &&
        data.levels &&
        data.levels.length > 0
      ) {
        const level = data.levels.find(
          (level: { uri: any }) => level && level.uri
        );

        if (level && level.uri) {
          if (context.debugAttribute) {
            console.log("Fetching manifest for level: ", level.uri);
          }
          fetch(level.uri)
            .then((response) => response.text())
            .then((manifestText) => {
              const keyLines = manifestText
                .split("\n")
                .filter((line) => line.startsWith("#EXT-X-KEY"));

              // Parse key lines to extract key attributes
              const keyAttributes = keyLines.map((line) => {
                const keyAttributes: any = {};
                const attributes = line
                  .substring("#EXT-X-KEY:".length)
                  .split(",");

                attributes.forEach((attribute) => {
                  const [key, value] = attribute.split("=");
                  if (value) {
                    keyAttributes[key.trim()] = value.replace(/^"(.*)"$/, "$1"); // Remove quotes
                  }
                });

                return keyAttributes;
              });

              if (keyAttributes.length > 0) {
                // Log the detected DRM key formats
                const keyFormats = keyAttributes
                  .map((attr) => attr.KEYFORMAT)
                  .filter((format) => format);

                if (context.debugAttribute) {
                  console.log("Detected DRM Key Formats:", keyFormats);
                }

                // Find the first attribute with a URI starting with "skd"
                const skdAttr = keyAttributes.find(
                  (attr) => attr.URI && attr.URI.startsWith("skd")
                );

                const findWidevine = keyAttributes.find((attr) => attr);

                const detectWidevine = findWidevine.KEYFORMAT.startsWith("urn");

                if (detectWidevine) {
                  if (context.debugAttribute) {
                    console.log("widevine detected", detectWidevine);
                  }
                  context.config.drmSystems["com.widevine.alpha"].licenseUrl =
                    `https://widevine-dash.ezdrm.com/widevine-php/widevine-foreignkey.php?pX=F197C7&playbackId=${context.playbackId}&token=${context.token}`;
                }

                if (skdAttr) {
                  if (context.debugAttribute) {
                    console.log("Found skd attribute: ", skdAttr);
                  }

                  context.skdValue = skdAttr.URI.split("//")[1].split(":")[0];

                  context.config.drmSystems["com.apple.fps"].licenseUrl =
                    `https://fps.ezdrm.com/api/licenses/auth?pX=A74B73&assetid=${context.skdValue}&playbackId=${context.playbackId}&token=${context.token}`;
                }
              }
            })
            .catch((err) => console.error("err", err));
        }
      }
    }
  );

  context.hls.on(Hls.Events.MEDIA_ATTACHED, () => {
    if (context.debugAttribute) {
      console.log("Media attached, starting to load...");
    }
  });

  context.hls.on(Hls.Events.FRAG_LOADED, () => {
    const loadEndTime = performance.now();
    const totalLoadTime = (loadEndTime - context.loadStartTime) / 1000; // Convert to seconds
    if (context.debugAttribute) {
      console.log(`Total load time: ${totalLoadTime.toFixed(2)} seconds`);
    }
  });
}

function handleHlsQualityAndTrackSetup(context: any) {
  context.hls.on(
    Hls.Events.MANIFEST_PARSED,
    (_: any, data: { levels: any; audioTracks: any; subtitleTracks: any }) => {
      let levelsRetrieved = data.levels; // Available video quality levels
      const audioTracks = data.audioTracks; // Available audio tracks
      const subtitleTracks = data.subtitleTracks; // Available subtitle tracks

      // Check for rendition order attribute
      const renditionOrderAttr = context.hasAttribute("rendition-order")
        ? context.getAttribute("rendition-order")
        : null;
      let levels;

      if (renditionOrderAttr !== null && renditionOrderAttr === "desc") {
        levels = levelsRetrieved.reverse();
      } else {
        levels = levelsRetrieved;
      }

      let levelsArray = levelsRetrieved.map(
        (item: { height: any }) => item.height
      );

      // Remove buttons if there are no video levels (audio-only stream)
      if (levelsArray[0] === 0) {
        context.bottomRightDiv.removeChild(context.resolutionMenuButton);
        context.bottomRightDiv.removeChild(context.pipButton);
      }

      // Display audio menu button if more than one audio track is available
      context.audioMenuButton.style.display =
        audioTracks.length > 1
          ? context.audioMenuButton.classList.add("audioMenuButtonShow")
          : context.audioMenuButton.classList.remove("audioMenuButtonShow");

      // Display closed caption button if subtitle tracks are available
      context.ccButton.style.display =
        subtitleTracks.length > 0
          ? context.ccButton.classList.add("ccButtonLength")
          : context.ccButton.classList.remove("ccButtonLength");

      // Create buttons for each audio track
      const audioButtons: any[] = [];
      audioTracks.forEach((track: { name: any }, index: number) => {
        const audioButton = documentObject.createElement("button");
        audioButton.className = "audioSelectorButtons";
        audioButton.textContent = track.name;
        audioButton.title = track.name;

        // Set the first audio track as active by default
        if (index === 0) {
          audioButton.classList.add("active");
          try {
            context.hls.audioTrack = index; // Set the selected audio track
          } catch (error) {
            console.error("Error switching audio track:", error);
          }
        }

        // Event listener for selecting audio track
        audioButton.addEventListener(
          "click",
          (event: { stopPropagation: () => void }) => {
            context.hls.audioTrack = index; // Set the selected audio track
            audioButton.classList.add("active");
            audioButtons.forEach((button) => {
              if (button !== audioButton) {
                button.classList.remove("active");
              }
            });
            toggleAudioMenu(context); // Hide audio track selection menu
            event.stopPropagation();
          }
        );

        audioButtons.push(audioButton);
        context.audioMenu.appendChild(audioButton);
      });

      // Event listener for resolution menu button click
      context.resolutionMenuButton.addEventListener("click", () => {
        // Close other menus if open
        if (context.playbackRateDiv.style.display !== "none") {
          togglePlaybackRateButtons(context);
        }
        if (context.audioMenu.style.display !== "none") {
          toggleAudioMenu(context);
        }
        if (context.subtitleMenu.style.display !== "none") {
          hideShowSubtitlesMenu(context);
        }
        toggleResolutionMenu(context); // Toggle display of resolution menu
      });

      // Button for auto resolution selection
      context.autoResolutionButton = documentObject.createElement("button");
      context.autoResolutionButton.className = "qualitySelectorButtons";
      context.autoResolutionButton.textContent = "Auto";
      context.autoResolutionButton.classList.add("active");
      context.autoResolutionButton.addEventListener("click", () => {
        showLoader(context); // Show loading indicator when switching to auto

        context.hls.nextLevel = -1; // Set HLS to auto-select resolution
        context.userSelectedLevel = null; // Clear user-selected resolution
        context.autoResolutionButton.classList.add("active");
        resolutionButtons.forEach((button) => {
          if (button !== context.autoResolutionButton) {
            button.classList.remove("active");
          }
        });
        toggleResolutionMenu(context); // Hide resolution menu
      });

      context.resolutionMenu.appendChild(context.autoResolutionButton);

      // Buttons for each available resolution level
      const resolutionButtons: any[] = [];
      levels.forEach((level: { height: any }, index: any) => {
        const resolutionButton = documentObject.createElement("button");
        resolutionButton.className = "qualitySelectorButtons";
        resolutionButton.textContent = `${level.height}p`;
        resolutionButton.title = `${level.height}p`;

        // Event listener for selecting a specific resolution level
        resolutionButton.addEventListener("click", () => {
          context.resolutionSwitching = true; // Set flag for resolution switch

          // Track the paused state before switching resolution
          context.wasPausedBeforeSwitch = context.video.paused;

          if (!context.wasPausedBeforeSwitch) {
            context.video.pause(); // Pause only if the video was playing
            // if (context.hasAttribute("debug")) {
            console.log(
              `Video paused for resolution switch to ${level.height}p`
            );
            showLoader(context); // Show loading indicator immediately

            // }
          }

          context.resolutionFlagPause = true; // Flag to manage state
          context.isBufferFlushed = false; // Reset flag on new resolution switch

          // Smooth level switching logic
          context.hls.currentLevel = index; // Switch to selected quality level
          context.userSelectedLevel = index;

          resolutionButton.classList.add("active");
          context.autoResolutionButton.classList.remove("active");
          resolutionButtons.forEach((button) => {
            if (button !== resolutionButton) {
              button.classList.remove("active");
            }
          });

          // Trigger buffer flushing for smooth transition
          // context.hls.trigger(Hls.Events.BUFFER_FLUSHING, {
          //   startOffset: 0,
          //   endOffset: Number.POSITIVE_INFINITY,
          // });

          // Hide resolution menu
          toggleResolutionMenu(context); // Hide resolution menu
        });

        resolutionButtons.push(resolutionButton);
        context.resolutionMenu.appendChild(resolutionButton);
      });

      // Handle buffer flushed only once
      context.hls.on(Hls.Events.BUFFER_FLUSHED, () => {
        if (!context.isBufferFlushed && context.initialPlayClick) {
          context.video.currentTime = context.video.currentTime; // Prevent desync

          if (!context.wasPausedBeforeSwitch) {
            // Play only if the video was playing before the switch
            context.video
              .play()
              .then(() => {
                context.isBufferFlushed = true; // Ensure this is handled once per switch
                hideLoader(context); // Hide loader after video successfully resumes

                // Reset resolutionSwitching flag after successful resume
                if (context.resolutionSwitching) {
                  context.resolutionSwitching = false;
                }
              })
              .catch((error: any) => {
                console.error("Playback error:", error);
                hideLoader(context); // Hide loader on error to ensure it doesn't get stuck
              });
          } else {
            // If the video was paused before switching, just hide the loader
            hideLoader(context);
          }
        }
      });

      // context.hls.on(Hls.Events.LEVEL_SWITCHING, (event, data) => {
      //   const newLevel = data.level; // Index of the new quality level
      //   console.log(`Switching to level: ${newLevel}`);

      //   // Show loader to indicate the resolution switch
      //   showLoader(context);
      //   context.resolutionSwitching = true;
      // });

      // context.hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
      //   const newLevel = data.level; // Index of the currently playing quality level
      //   console.log(`Switched to level: ${newLevel}`);

      //   // Hide loader after the resolution switch
      //   hideLoader(context);
      //   context.resolutionSwitching = false;
      // });
    }
  );
}

export {
  hlsInstance,
  Hls,
  initializeHLS,
  hlsListeners,
  handleHlsQualityAndTrackSetup,
  configHls,
};
