import { NextIcon } from "../icons/NextIcon/index";
import { PrevButtonIcon } from "../icons/PreviousIcon/index";

function initPlaylistControls(context: any) {
  // Create prev/next buttons
  context.prevButton = context.prevButton || document.createElement("button");
  context.prevButton.innerHTML = PrevButtonIcon;
  context.prevButton.className =
    context.prevButton.className || "playlistPrevButton playlistButtonHidden";

  context.nextButton = context.nextButton || document.createElement("button");
  context.nextButton.innerHTML = NextIcon;
  context.nextButton.className =
    context.nextButton.className || "playlistNextButton playlistButtonHidden";

  if (!context.leftControls.contains(context.prevButton)) {
    context.leftControls.appendChild(context.prevButton);
  }
  if (!context.leftControls.contains(context.nextButton)) {
    context.leftControls.appendChild(context.nextButton);
  }

  context.updatePlaylistControlsVisibility = () => {
    const hasPlaylist =
      Array.isArray(context.playlist) && context.playlist.length > 0;

    // CSS variables from theme or config
    const prevButtonValue = getComputedStyle(context.leftControls)
      .getPropertyValue("--previous-episode-button")
      .trim();

    const nextButtonValue = getComputedStyle(context.leftControls)
      .getPropertyValue("--next-episode-button")
      .trim();

    const shouldDisablePrev = prevButtonValue === "none";
    const shouldDisableNext = nextButtonValue === "none";

    // Playlist-based logic
    if (hasPlaylist) {
      context.controlsContainer.classList.add("hasPlaylist");
      context.prevButton.classList.remove("playlistButtonHidden");
      context.prevButton.classList.add("playlistButtonVisible");

      context.nextButton.classList.remove("playlistButtonHidden");
      context.nextButton.classList.add("playlistButtonVisible");
    } else {
      context.controlsContainer.classList.remove("hasPlaylist");
      context.prevButton.classList.remove("playlistButtonVisible");
      context.prevButton.classList.add("playlistButtonHidden");

      context.nextButton.classList.remove("playlistButtonVisible");
      context.nextButton.classList.add("playlistButtonHidden");
    }

    // Add unique CSS-disabled classes
    context.playPauseButton.classList.toggle(
      "playlistPrevButtonDisabledByCSS",
      shouldDisablePrev
    );
    context.nextButton.classList.toggle(
      "playlistNextButtonDisabledByCSS",
      shouldDisableNext
    );
  };

  // Initial call
  context.updatePlaylistControlsVisibility();
}

export { initPlaylistControls };
