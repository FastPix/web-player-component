# FastPix Player – Playlist Developer Guide

This guide explains how to build, control, and customize Playlists using FastPix Player. You'll learn how to use the built-in playlist UI, replace it with your own panel, and integrate with playlist events for advanced behaviors.

## What You Can Build

- Load and play videos with `addPlaylist([...])`.
- Navigate with `next()` / `previous()` or jump with `selectEpisodeByPlaybackId(id)`.
- Start from a default item via `default-playback-id`.
- Hide the built-in UI and build your own menu with the `playlist-panel` slot.
- Listen to `playbackidchange` and `playlisttoggle` to sync UI, route, or send analytics.
- Inject custom navigation logic with `customNext(ctx)` / `customPrev(ctx)`.

## Core Concepts

- **Playlist Item**: JSON describing one video (requires `playbackId`).
- **Default Playlist Panel**: The built-in playlist UI inside the player.
- **Custom Playlist Panel**: Your own UI rendered with the `playlist-panel` slot.
- **Events**: Emitted by the player to reflect state changes and coordinate UI.

## API Reference (Player Methods)

| Method | Description | Parameters |
|--------|-------------|------------|
| `addPlaylist(playlist: Array<Item>)` | Load a playlist (each item needs playbackId). | `playlist: Array<Item>` |
| `next()` | Navigate to the next item. | — |
| `previous()` | Navigate to the previous item. | — |
| `selectEpisodeByPlaybackId(playbackId: string)` | Jump to a specific item. | `playbackId: string` |
| `destroy()` | Teardown before custom source switching (advanced use only). | — |
| `customNext(ctx)` | Run custom code before continuing to next. | `ctx.next()` must be called |
| `customPrev(ctx)` | Run custom code before continuing to previous. | `ctx.previous()` must be called |

## Playlist Item Shape

```typescript
interface PlaylistItem {
  playbackId: string; // required
  title?: string;
  description?: string;
  thumbnail?: string;
  token?: string; // optional per-item token
  drmToken?: string; // optional per-item DRM token
  customDomain?: string; // optional per-item custom domain
  duration?: number | string;
}
```

## Attributes

| Attribute | Description |
|-----------|-------------|
| `default-playback-id` | Pre-select starting item. |
| `hide-default-playlist-panel` | Hide built-in panel; use `playlist-panel` slot. |
| `loop-next` | Auto-advance behavior when current item ends. |
| Common attributes: `custom-domain`, `auto-play`, `aspect-ratio`. | |

## Events

| Event | Description | Detail Object |
|-------|-------------|--------------|
| `playbackidchange` | Fired when active playback changes. | `{ playbackId, isFromPlaylist, currentIndex, totalItems, status }` |
| `playlisttoggle` | Fired to open/close playlist panel (slot mode). | `{ open, hasPlaylist, currentIndex, totalItems, playbackId }` |

## Quick Start

### Default Panel

```html
<fastpix-player id="player">
  <!-- Built-in playlist panel will show automatically -->
</fastpix-player>

<script>
  const player = document.getElementById('player');
  const episodes = [
    {
      playbackId: "episode-1-id",
      title: "Episode 1: The Beginning",
      description: "Our story starts with a mysterious event.",
      thumbnail: "https://example.com/thumb1.jpg"
    },
    {
      playbackId: "episode-2-id", 
      title: "Episode 2: The Journey Continues",
      description: "The heroes set out on their journey.",
      thumbnail: "https://example.com/thumb2.jpg"
    }
  ];

  // Load playlist
  player.addPlaylist(episodes);

  // Listen for changes
  player.addEventListener('playbackidchange', (e) => {
    console.log('Now playing:', e.detail.playbackId);
  });
</script>
```

### Custom Panel

```html
<fastpix-player id="player" hide-default-playlist-panel>
  <div slot="playlist-panel" id="myPlaylistPanel" hidden>
    <style>
      /* Panel container (centered overlay, OTT sizing) */
      #myPlaylistPanel {
        position: absolute;
        top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: clamp(320px, 42vw, 520px);
        max-height: min(78vh, 760px);
        background: #fff; color: #100023;
        border: 1px solid rgba(16,0,35,0.12);
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.35);
        padding: 12px 12px 8px;
        overflow: hidden;
      }

      /* Header */
      .playlistMenuHeader {
        position: sticky; top: 0;
        background: #fff;
        padding: 12px 8px 10px;
        font-weight: 700; font-size: 16px;
        border-bottom: 1px solid rgba(16,0,35,0.08);
        z-index: 1;
      }

      /* List */
      #myPlaylistItems {
        overflow: auto;
        max-height: calc(78vh - 64px);
        padding: 8px 4px 8px 8px;
      }

      /* Item */
      #myPlaylistItems .playlistItem {
        display: grid;
        grid-template-columns: 128px 1fr;
        gap: 14px;
        align-items: center;
        min-height: 76px;
        background: #fff;
        color: #100023;
        border: 1px solid rgba(16,0,35,0.12);
        border-radius: 12px;
        padding: 10px;
        margin: 10px 4px;
        cursor: pointer;
        transition: background 0.2s, border-color 0.2s, transform 0.15s;
      }

      /* Hover: accent border */
      #myPlaylistItems .playlistItem:hover {
        border-color: var(--accent-color, #5D09C7);
        transform: translateY(-1px);
      }

      /* Selected: accent background + white text */
      #myPlaylistItems .playlistItem.selected {
        background: var(--accent-color, #5D09C7);
        border-color: var(--accent-color, #5D09C7);
        color: #fff;
      }

      /* Texts */
      #myPlaylistItems .playlistItem .title {
        font-weight: 700; font-size: 15px; line-height: 1.25;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        color: inherit;
      }
      #myPlaylistItems .playlistItem .meta {
        font-size: 12px; color: rgba(16,0,35,0.7);
      }
      #myPlaylistItems .playlistItem.selected .meta { color: rgba(255,255,255,0.9); }

      /* Thumb */
      #myPlaylistItems .thumb {
        width: 128px; height: 72px;
        background-size: cover; background-position: center;
        border-radius: 10px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.18);
      }

      /* Mobile */
      @media (max-width: 600px) {
        #myPlaylistPanel { width: min(92vw, 520px); }
        #myPlaylistItems .playlistItem {
          grid-template-columns: 96px 1fr;
          min-height: 64px;
        }
        #myPlaylistItems .thumb { width: 96px; height: 54px; }
      }
    </style>
    <div class="playlistMenuHeader">Episode List</div>
    <div id="myPlaylistItems"></div>
  </div>
</fastpix-player>

<script>
  const episodes = [
    {
      playbackId: "8f7920ec-fcb4-4490-85f7-d73798b20a8a",
      title: "Episode 1: The Beginning",
      description: "Our story starts with a mysterious event that changes everything.",
      thumbnail: "https://placehold.co/320x180?text=Ep+1"
    },
    {
      playbackId: "6b4150d6-4aff-424d-8918-10d4c048892b",
      title: "Episode 2: The Journey Continues", 
      description: "The heroes set out on their journey, facing new challenges.",
      thumbnail: "https://placehold.co/320x180?text=Ep+2"
    },
    {
      playbackId: "8ed1318c-5e19-46c9-ac4b-955cdfa2f3a7",
      title: "Episode 3: The Revelation",
      description: "Secrets are revealed and the stakes are raised for everyone involved.",
      thumbnail: "https://placehold.co/320x180?text=Ep+3"
    }
  ];
  const player = document.getElementById('player');

  // Initial setup
  document.addEventListener('DOMContentLoaded', () => {
    player.addPlaylist(episodes);
  });

  // PlaybackId change event
  player.addEventListener("playbackidchange", (e) => {
    const { playbackId, status, isFromPlaylist, currentIndex, totalItems } = e.detail;
    console.log(
      `PlaybackId change - ID: ${playbackId}, Status: ${status}, From Playlist: ${isFromPlaylist}, Index: ${currentIndex}/${totalItems}`
    );

    if (status === "loading") {
      console.log("Playback-id is being loaded...");
    } else if (status === "ready") {
      console.log("Playback-id is ready to play!");
    } else if (status === "error") {
      console.error("Error loading playback-id:", e.detail.error);
    }
  });

  const myPanel = document.getElementById('myPlaylistPanel');
  const items = document.getElementById('myPlaylistItems');

  // Handle playlist panel toggle
  player.addEventListener('playlisttoggle', (e) => {
    console.log("playlisttoggle", e.detail);
    if ((e.detail?.hasPlaylist ?? false) === false) return;
    if (e.detail.open) myPanel.removeAttribute('hidden');
    else myPanel.setAttribute('hidden','');
  });

  // Update selection highlighting
  function updateSelection(activeId) {
    items.querySelectorAll('.playlistItem').forEach(d => {
      d.classList.toggle('selected', d.dataset.playbackId === activeId);
    });
  }

  // Format metadata
  function formatMeta(ep) {
    return ep.duration ? ep.duration : (ep.description || "");
  }

  // Build playlist items
  items.innerHTML = "";
  episodes.forEach(ep => {
    const el = document.createElement('div');
    el.className = 'playlistItem';
    el.dataset.playbackId = ep.playbackId;

    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    if (ep.thumbnail) thumb.style.backgroundImage = `url('${ep.thumbnail}')`;

    const info = document.createElement('div');
    info.className = 'info';

    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = ep.title || ep.playbackId;

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = formatMeta(ep);

    info.appendChild(title);
    if (meta.textContent) info.appendChild(meta);

    el.appendChild(thumb);
    el.appendChild(info);

    // Click handler for episode selection
    el.onclick = () => player.selectEpisodeByPlaybackId(ep.playbackId);
    items.appendChild(el);
  });

  // Initial selection
  const initialId = player.getAttribute('default-playback-id') || episodes[0].playbackId;
  updateSelection(initialId);

  // Update selection on player change
  player.addEventListener('playbackidchange', (e) => {
    const id = e.detail?.playbackId;
    if (id) updateSelection(id);
  });

  // Ensure selection updates after internal player loads
  player.addEventListener('canplay', () => {
    const active = player.getAttribute('playback-id') || player.playbackId;
    if (active) updateSelection(active);
  });
</script>
```

## Troubleshooting

- **Nothing plays**: Ensure each playlist item has a valid `playbackId`.
- **Custom panel doesn't show**: Use `hide-default-playlist-panel` and render your UI in a child with `slot="playlist-panel"`.
- **customNext/customPrev don't work**: Always call `ctx.next()` / `ctx.previous()` after your custom logic.
- **Wrong item highlighted**: Update the selection in the `playbackidchange` handler using the `playbackId` from `e.detail`. 