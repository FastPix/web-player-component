function initializePlaybackRates(context: any): void {
  if (context.playbackRatesAttribute !== null) {
    const parsedPlaybackRates = context.playbackRatesAttribute
      .split(" ")
      .map((rate: string) => parseFloat(rate));

    const uniquePlaybackRates = [...new Set(parsedPlaybackRates)];
    context.playbackRates.splice(
      0,
      context.playbackRates.length,
      ...uniquePlaybackRates
    );
  } else {
    context.playbackRates = [1, 1.2, 1.5, 1.7, 2];
  }
}

function setPlaybackRate(
  context: any,
  rate: number, // Playback rate should be a number
  button: HTMLElement // The button element being clicked
): void {
  // Update the playback rate
  context.video.playbackRate = rate;

  // Reset styling for the previously clicked playback rate button, if any
  if (context.lastClickedPlaybackRateButton !== null) {
    (context.lastClickedPlaybackRateButton as HTMLElement).style.fontWeight =
      "normal";
    (context.lastClickedPlaybackRateButton as HTMLElement).classList.remove(
      "active"
    );
  }

  // Add active class to the current button
  button.classList.add("active");

  // Update the playback rate button text and title
  context.playbackRateButton.textContent = `${rate}x`;
  context.playbackRateButton.title = `${rate}x`;

  // Update the reference to the last clicked button
  context.lastClickedPlaybackRateButton = button;

  // Hide the playback rate selector
  context.playbackRateDiv.style.display = "none";
}

/**
 * Parses and sets the default playback rate if the attribute is valid.
 * @param defaultPlaybackRateAttribute - The playback rate attribute as a string.
 * @returns The parsed playback rate or null if invalid.
 */
function parseAndSetDefaultPlaybackRate(
  defaultPlaybackRateAttribute: string | null
): string | null {
  if (defaultPlaybackRateAttribute !== null) {
    const parsedRates = defaultPlaybackRateAttribute.trim().split(" ");
    if (parsedRates.length === 1 && !isNaN(parseFloat(parsedRates[0]))) {
      return parsedRates[0];
    }
  }
  return null;
}

export {
  initializePlaybackRates,
  setPlaybackRate,
  parseAndSetDefaultPlaybackRate,
};
