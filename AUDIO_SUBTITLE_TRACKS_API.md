# Audio & Subtitle Track Switching API

This document describes the API for programmatically switching audio and subtitle tracks in the FastPix Player.

---

## Table of Contents

- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [Methods](#methods)
  - [Properties](#properties)
  - [Events](#events)
  - [Attributes](#attributes)
- [TrackInfo Object](#trackinfo-object)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

---

## Quick Start

```html
<fastpix-player 
    playback-id="your-playback-id"
    default-audio-track="French"
    default-subtitle-track="English"
    >
</fastpix-player>

<script>
const player = document.querySelector('fastpix-player');

// Wait for tracks to be available
player.addEventListener('fastpixtracksready', (e) => {
    const { audioTracks, currentAudioTrackLoaded } = e.detail;
    console.log('Available audio tracks:', audioTracks);
    console.log('Current track:', currentAudioTrackLoaded);
});

// Switch to a different audio track (label only)
player.setAudioTrack('French');

// Listen for track changes
player.addEventListener('fastpixaudiochange', (e) => {
    console.log('Switched to:', e.detail.currentTrack);
});
</script>
```

---

## API Reference

### Methods

#### `getAudioTracks()`

Returns an array of available audio tracks.

```typescript
getAudioTracks(): TrackInfo[]
```

**Returns:** Array of `TrackInfo` objects

**Example:**
```javascript
const tracks = player.getAudioTracks();
// [
//   { id: 0, label: "English", language: "en", isDefault: false, isCurrent: true },
//   { id: 1, label: "French", language: "fr", isDefault: false, isCurrent: false },
//   { id: 2, label: "Hindi", language: "hi", isDefault: false, isCurrent: false }
// ]
```

---

#### `setAudioTrack(languageName)`

Switches to the specified audio track.

```typescript
setAudioTrack(languageName: string): void
```

**Parameters:**
- `languageName` (string) - Track `label` (e.g. `"French"`)

**Example:**
```javascript
// Switch by label
player.setAudioTrack('French');
```

**Note:** Dispatches `fastpixaudiochange` event after switching.

---

#### `getSubtitleTracks()`

Returns an array of available subtitle/caption tracks.

```typescript
getSubtitleTracks(): TrackInfo[]
```

**Returns:** Array of `TrackInfo` objects

**Example:**
```javascript
const subtitles = player.getSubtitleTracks();
// [
//   { id: 0, label: "English", language: "en", isDefault: false, isCurrent: true },
//   { id: 1, label: "Spanish", language: "es", isDefault: false, isCurrent: false }
// ]
```

---

#### `setSubtitleTrack(languageName)`

Switches to the specified subtitle track, or turns subtitles off.

```typescript
setSubtitleTrack(languageName: string | null): void
```

**Parameters:**
- `languageName` (string | null) - Track `label`, or `null` to turn off subtitles

**Example:**
```javascript
// Enable by label
player.setSubtitleTrack('English');

// Turn off subtitles
player.setSubtitleTrack(null);
```

**Note:** Dispatches `fastpixsubtitlechange` event after switching.

---

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `audioTracks` | `TrackInfo[]` | Array of available audio tracks |
| `subtitleTracks` | `TrackInfo[]` | Array of available subtitle tracks |
| `currentAudioTrackId` | `number \| null` | ID of the currently active audio track |
| `currentSubtitleTrackId` | `number \| null` | ID of the currently active subtitle track |

---

### Events

#### `fastpixtracksready`

Fired when tracks are loaded and available (after HLS manifest is parsed).
Because subtitle `textTracks` can attach slightly later than HLS `MANIFEST_PARSED`, the player may **re-emit** `fastpixtracksready` once subtitle tracks become available.

**Detail:**
```typescript
{
  audioTracks: TrackInfo[];        // All available audio tracks (de-duped by label)
  subtitleTracks: TrackInfo[];     // All available subtitle tracks (de-duped by label)

  // Preferred (full objects)
  currentAudioTrackLoaded: TrackInfo | null;    // Currently active audio track (object)
  currentSubtitleLoaded: TrackInfo | null;      // Currently active subtitle track (object)

  // Backward compatible (numeric ids)
  currentAudioId: number | null;
  currentSubtitleId: number | null;
}
```

**Example:**
```javascript
player.addEventListener('fastpixtracksready', (e) => {
    const { audioTracks, subtitleTracks, currentAudioTrackLoaded, currentSubtitleLoaded } = e.detail;
    
    console.log('Audio tracks:', audioTracks);
    console.log('Current audio:', currentAudioTrackLoaded);
    console.log('Subtitle tracks:', subtitleTracks);
    console.log('Current subtitle:', currentSubtitleLoaded);
});
```

---

#### `fastpixaudiochange`

Fired when the audio track is explicitly changed (menu click or `setAudioTrack`).

**Detail:**
```typescript
{
  tracks: TrackInfo[];                 // Updated audio snapshot
  currentId: number | null;            // Current underlying HLS audioTrack index
  currentTrack: TrackInfo | null;      // The newly active audio track (object)
}
```

**Example:**
```javascript
player.addEventListener('fastpixaudiochange', (e) => {
    const { currentTrack } = e.detail;
    console.log('Switched to:', currentTrack);
    // { id: 2, label: "Hindi", language: "hi", isCurrent: true, isDefault: false }
});
```

---

#### `fastpixsubtitlechange`

Fired when the subtitle track is explicitly changed (menu click / Off / `setSubtitleTrack` / `disableSubtitles`).

**Detail:**
```typescript
{
  tracks: TrackInfo[];                 // Updated subtitle snapshot
  currentId: number | null;            // Current subtitle track id (null if Off)
  currentTrack: TrackInfo | null;      // Newly active subtitle track, or null if Off
}
```

**Example:**
```javascript
player.addEventListener('fastpixsubtitlechange', (e) => {
    const { currentTrack } = e.detail;
    if (currentTrack) {
        console.log('Subtitles enabled:', currentTrack.label);
    } else {
        console.log('Subtitles turned off');
    }
});
```

---

### Attributes

#### `default-audio-track`

Sets the initial audio track **by label/name** (case-insensitive) when the player loads.

```html
<fastpix-player
  playback-id="your-playback-id"
  default-audio-track="French">
</fastpix-player>
```

If not provided (or no match), the player falls back to the manifest default track (or the first track).

#### `default-subtitle-track`

Sets the initial subtitle/caption track **by label/name** (case-insensitive) when the player loads.

```html
<fastpix-player
  playback-id="your-playback-id"
  default-subtitle-track="English">
</fastpix-player>
```

If not provided (or no match), the player follows the existing subtitle initialization behavior.

---

## TrackInfo Object

Each track is represented by a `TrackInfo` object:

```typescript
type TrackInfo = {
  id: number;           // Internal numeric id (do not use for selection)
  label: string;        // Display name (e.g., "English", "French")
  language?: string;    // Language code (e.g., "en", "fr", "hi")
  isDefault: boolean;   // Whether this track is marked as default in the manifest
  isCurrent: boolean;   // Whether this track is currently active
};
```

---

## Usage Examples

### Complete end-to-end example (HTML + JS)

This example is equivalent to the track demo: it renders **audio/subtitle buttons**, switches tracks by **label/name**, and renders a **custom subtitle overlay** per player.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Audio/Subtitle Tracks Demo</title>
    <script src="./dist/player.js"></script>
    <style>
      .player-container {
        position: relative;
        width: 100%;
        max-width: 900px;
        margin: 16px auto;
        aspect-ratio: 16/9;
      }
      .custom-subtitle {
        position: absolute;
        left: 50%;
        bottom: 10%;
        transform: translateX(-50%);
        max-width: 90%;
        padding: 6px 12px;
        background: rgba(0, 0, 0, 0.7);
        color: #fff;
        display: none;
        border-radius: 6px;
        text-align: center;
        pointer-events: none;
      }
      .track-buttons {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin: 12px 0;
      }
      .track-btn {
        padding: 8px 12px;
        border: 2px solid #ddd;
        border-radius: 8px;
        background: #fff;
        cursor: pointer;
      }
      .track-btn.active {
        background: #007bff;
        color: #fff;
        border-color: #007bff;
      }
    </style>
  </head>
  <body>
    <div class="player-container">
      <fastpix-player
        id="player"
        playback-id="YOUR_PLAYBACK_ID"
        auto-play
        loop
        muted
        preload="auto"
        default-audio-track="French"
        default-subtitle-track="English"
      ></fastpix-player>
      <div class="custom-subtitle" data-role="custom-subtitle"></div>
    </div>

    <h3>Audio Tracks</h3>
    <div id="audioButtons" class="track-buttons"></div>

    <h3>Subtitle Tracks</h3>
    <div id="subtitleButtons" class="track-buttons"></div>

    <script>
      const player = document.getElementById("player");
      const audioButtons = document.getElementById("audioButtons");
      const subtitleButtons = document.getElementById("subtitleButtons");

      const getCustomSubtitleDiv = (p) =>
        p.closest(".player-container")?.querySelector('[data-role="custom-subtitle"]') ??
        null;

      const renderButtons = (container, tracks, onSelect) => {
        container.innerHTML = "";
        (tracks || []).forEach((t) => {
          const b = document.createElement("button");
          b.className = "track-btn" + (t.isCurrent ? " active" : "");
          b.textContent = `${t.label} (${t.language || "unknown"})`;
          b.onclick = () => onSelect(t);
          container.appendChild(b);
        });
      };

      const renderSubtitleButtons = (tracks) => {
        subtitleButtons.innerHTML = "";

        // Off button
        const off = document.createElement("button");
        off.className =
          "track-btn" + (!(tracks || []).some((t) => t.isCurrent) ? " active" : "");
        off.textContent = "Off";
        off.onclick = () => player.setSubtitleTrack(null);
        subtitleButtons.appendChild(off);

        renderButtons(subtitleButtons, tracks || [], (t) => player.setSubtitleTrack(t.label));
      };

      // Tracks snapshot (may fire more than once)
      player.addEventListener("fastpixtracksready", (e) => {
        const d = /** @type {CustomEvent} */ (e).detail || {};
        renderButtons(audioButtons, d.audioTracks || player.getAudioTracks(), (t) =>
          player.setAudioTrack(t.label)
        );
        renderSubtitleButtons(d.subtitleTracks || player.getSubtitleTracks());
      });

      // Explicit changes
      player.addEventListener("fastpixaudiochange", (e) => {
        const d = /** @type {CustomEvent} */ (e).detail || {};
        renderButtons(audioButtons, d.tracks || player.getAudioTracks(), (t) =>
          player.setAudioTrack(t.label)
        );
      });
      player.addEventListener("fastpixsubtitlechange", (e) => {
        const d = /** @type {CustomEvent} */ (e).detail || {};
        renderSubtitleButtons(d.tracks || player.getSubtitleTracks());
      });

      // Custom subtitle rendering (per player)
      player.addEventListener("fastpixsubtitlecue", (e) => {
        const cue = /** @type {CustomEvent} */ (e).detail || {};
        const tracks = player.getSubtitleTracks();
        const hasActive = Array.isArray(tracks) && tracks.some((t) => t.isCurrent);

        const el = getCustomSubtitleDiv(player);
        if (!el) return;

        if (hasActive && cue.text) {
          el.textContent = cue.text;
          el.style.display = "block";
        } else {
          el.textContent = "";
          el.style.display = "none";
        }
      });
    </script>
  </body>
</html>
```

### Building a Track Selector UI

```javascript
const player = document.querySelector('fastpix-player');
const audioSelect = document.getElementById('audioSelect');

// Populate dropdown when tracks are ready
player.addEventListener('fastpixtracksready', (e) => {
    const { audioTracks, currentAudioTrackLoaded } = e.detail;
    
    audioSelect.innerHTML = audioTracks.map(track => 
        `<option value="${track.label}" ${track.isCurrent ? 'selected' : ''}>
            ${track.label} (${track.language || 'unknown'})
        </option>`
    ).join('');
});

// Handle selection change
audioSelect.addEventListener('change', (e) => {
    player.setAudioTrack(e.target.value);
});

// Update UI when track changes
player.addEventListener('fastpixaudiochange', (e) => {
    const t = e.detail.currentTrack;
    audioSelect.value = t ? t.label : '';
});
```

---

### Subtitle Toggle Button

```javascript
const player = document.querySelector('fastpix-player');
const ccButton = document.getElementById('ccButton');
let subtitlesEnabled = false;
let lastSubtitleLabel = '';

player.addEventListener('fastpixtracksready', (e) => {
    const { subtitleTracks, currentSubtitleLoaded } = e.detail;
    if (subtitleTracks.length > 0) {
        lastSubtitleLabel = subtitleTracks[0].label;
        subtitlesEnabled = currentSubtitleLoaded !== null;
        updateButton();
    }
});

ccButton.addEventListener('click', () => {
    if (subtitlesEnabled) {
        player.setSubtitleTrack(null);
    } else {
        player.setSubtitleTrack(lastSubtitleLabel);
    }
});

player.addEventListener('fastpixsubtitlechange', (e) => {
    subtitlesEnabled = e.detail.currentTrack !== null;
    if (e.detail.currentTrack) {
        lastSubtitleLabel = e.detail.currentTrack.label;
    }
    updateButton();
});

function updateButton() {
    ccButton.classList.toggle('active', subtitlesEnabled);
    ccButton.textContent = subtitlesEnabled ? 'CC ON' : 'CC OFF';
}
```

---

## Best Practices

### 1. Always wait for `fastpixtracksready`

Tracks are not available immediately. Always wait for the event before calling `getAudioTracks()` or `setAudioTrack()`.

```javascript
// ❌ Wrong - called too early
const tracks = player.getAudioTracks(); // Returns []

// ✅ Correct - wait for event
player.addEventListener('fastpixtracksready', () => {
    const tracks = player.getAudioTracks(); // Returns actual tracks
});
```

### 2. Use `language` for persistence, `label` for selection

The `id` is an internal numeric index that may differ between videos. Use `language` code for storing user preferences, and use the track `label` (languageName) when calling `setAudioTrack` / `setSubtitleTrack`.

```javascript
// ✅ Better - language code is consistent
localStorage.setItem('audioLang', 'fr');
```

### 3. Handle missing tracks gracefully

Not all videos have multiple audio tracks or subtitles.

```javascript
player.addEventListener('fastpixtracksready', (e) => {
    const { audioTracks, subtitleTracks } = e.detail;
    
    // Hide audio selector if only one track
    audioSelector.style.display = audioTracks.length > 1 ? 'block' : 'none';
    
    // Hide CC button if no subtitles
    ccButton.style.display = subtitleTracks.length > 0 ? 'block' : 'none';
});
```

### 4. Clean up event listeners

Remove event listeners when components unmount to avoid memory leaks.

```javascript
const handleTracksReady = (e) => { /* ... */ };
const handleAudioChange = (e) => { /* ... */ };

// Add listeners
player.addEventListener('fastpixtracksready', handleTracksReady);
player.addEventListener('fastpixaudiochange', handleAudioChange);

// Remove on cleanup
player.removeEventListener('fastpixtracksready', handleTracksReady);
player.removeEventListener('fastpixaudiochange', handleAudioChange);
```

---

## Browser Support

This API works in all browsers that support HLS.js and the HTMLMediaElement API:

- Chrome 51+
- Firefox 54+
- Safari 10+
- Edge 79+

---
