### FastPix Player – Playlist Developer Guide

This guide explains how to build, control, and customize Playlists using FastPix Player. You’ll learn how to use the built-in playlist UI, replace it with your own panel, and integrate with playlist events for advanced behaviors.

### What You Can Build
- Load and play videos with `addPlaylist([...])`.
- Navigate with `next()` / `previous()` or jump with `selectEpisodeByPlaybackId(id)`.
- Start from a default item via `default-playback-id`.
- Hide the built-in UI and build your own menu with the `playlist-panel` slot.
- Listen to `playbackidchange` and `playlisttoggle` to sync UI, route, or send analytics.
- Inject custom navigation logic with `customNext(ctx)` / `customPrev(ctx)`.

### Core Concepts
- Playlist Item: JSON describing one video (requires `playbackId`).
- Default Playlist Panel: The built-in playlist UI inside the player.
- Custom Playlist Panel: Your own UI rendered with the `playlist-panel` slot.
- Events: Emitted by the player to reflect state changes and coordinate UI.

### API Reference (Player Methods)
- `addPlaylist(playlist: Array<Item>)`: Load a playlist (each item needs `playbackId`).
- `next()` / `previous()`: Navigate between items.
- `selectEpisodeByPlaybackId(playbackId: string)`: Jump to a specific item.
- `loadByPlaybackId(playbackId: string, options?)`: Replace current source without changing the playlist.
  - options: `{ token?, drmToken?, customDomain?, emitPlaybackChange? }`
- `destroy()`: Teardown before custom source switching (advanced use only).
- `customNext(ctx)`: Run custom code before continuing to next via `ctx.next()`.
- `customPrev(ctx)`: Run custom code before continuing to previous via `ctx.previous()`.

Playlist item shape (accepted JSON):
```typescript
interface PlaylistItem {
  playbackId: string;            // required
  title?: string;                // display label in your UI and logs
  description?: string;          // longer text for panels/tooltips
  thumbnail?: string;            // preview image for playlist items/cards
  token?: string;                // per-item signed token (secure playback)
  drmToken?: string;             // DRM-protected items (e.g., Widevine/FairPlay)
  customDomain?: string;         // override player-level domain for this item
  duration?: number | string;    // seconds or HH:MM:SS for display/UX
}
```

Optional fields (when to use)
- `title`: Human-readable label for your menu, breadcrumbs, analytics.
- `description`: Helpful for descriptive panels or accessibility hints.
- `thumbnail`: Improves discovery/UX in lists, sidebars, and grids.
- `token`: Use when only this item needs a signed URL/token.
- `drmToken`: Use for DRM-enabled items; pass per-item license token.
- `customDomain`: If one item streams from a different domain/CDN.
- `duration`: For UI display (ordering, badges) or pre-roll timing.

### Attributes
- `default-playback-id`: Pre-select starting item.
- `hide-default-playlist-panel`: Hide built-in panel; use `playlist-panel` slot.
- `loop-next`: Auto-advance behavior when current item ends.
- Common attributes: `custom-domain`, `auto-play`, `aspect-ratio`.

### Events
- `playbackidchange`: Fired when active playback changes.
  - detail: `{ playbackId, isFromPlaylist, currentIndex, totalItems, status }`
- `playlisttoggle`: Fired to open/close playlist panel (slot mode).
  - detail: `{ open, hasPlaylist, currentIndex, totalItems, playbackId }`

### Recommended Patterns (Best Practices)
- Start simple: Use the default panel when you just need a quick playlist with minimal custom UI.
- Go custom when:
  - You need brand-specific visuals or complex layouts.
  - You must coordinate with app routing, search filters, or external panels.
  - You want to manage visibility yourself (use `hide-default-playlist-panel` + `slot="playlist-panel"`).
- Keep navigation reliable:
  - In `customNext/customPrev`, always call `ctx.next()` / `ctx.previous()` after your logic.
  - Prefer `selectEpisodeByPlaybackId` for explicit jumps (e.g., clicking a card).
- Use `loadByPlaybackId` for one-off source swaps without mutating the current playlist.
- Security & licensing:
  - Use `token` for signed playback on specific items.
  - Use `drmToken` for DRM-protected items; combine with per-item `customDomain` if licenses/manifests differ.
- Resilience:
  - Listen to `playbackidchange` to keep UI selection in sync and to retry UI fetches if needed.

### Quick Start (Default Panel)
```html
<fastpix-player id="player" custom-domain="stream.fastpix.app" aspect-ratio="16/9"></fastpix-player>
<script>
  const playlist = [
    { playbackId: '4ab67846-d6c8-44bd-b170-ab8516c87105', title: 'Intro' },
    { playbackId: '7f847ed3-6688-482b-8043-67a35325fb00', title: 'Deep Dive' }
  ];

  const player = document.getElementById('player');
  player.addPlaylist(playlist);

  player.addEventListener('playbackidchange', (e) => {
    const { playbackId, currentIndex, totalItems } = e.detail || {};
    console.log('Now playing', playbackId, currentIndex, '/', totalItems);
  });

  // Optional programmatic navigation
  // player.next();
  // player.previous();

  // Advanced: destroy() – lightweight teardown before custom source switching.
  // Not needed for normal playlist navigation (handled internally).
  // player.destroy();
</script>
```

### Build Your Own Playlist Panel
Step 1: Hide Default Panel and provide a slot container
```html
<fastpix-player
  id="player"
  auto-play
  default-playback-id="4ab67846-d6c8-44bd-b170-ab8516c87105"
  hide-default-playlist-panel
  custom-domain="stream.fastpix.app"
  aspect-ratio="16/9">
  <div slot="playlist-panel" id="myPlaylistPanel" style="display:none">
    <div class="playlistMenuHeader">
      <div class="seriesName">My Series</div>
      <div class="seriesCreater">My Creator</div>
    </div>
    <div id="myPlaylistItems" class="scroll-container"></div>
  </div>
</fastpix-player>
```

Step 2: Build items dynamically
```html
<script>
  const player = document.getElementById('player');
  const panel = document.getElementById('myPlaylistPanel');
  const items = document.getElementById('myPlaylistItems');

  const episodes = [
    { playbackId: '4ab67846-d6c8-44bd-b170-ab8516c87105', title: 'Episode 1', thumbnail: 'https://placehold.co/320x180?text=Ep+1' },
    { playbackId: '7f847ed3-6688-482b-8043-67a35325fb00', title: 'Episode 2', thumbnail: 'https://placehold.co/320x180?text=Ep+2' }
  ];

  function buildItems() {
    items.innerHTML = '';
    episodes.forEach((ep, index) => {
      const el = document.createElement('div');
      el.className = 'playlistItem';
      el.setAttribute('data-playback-id', ep.playbackId);

      const thumb = document.createElement('div');
      thumb.className = 'thumb';
      if (ep.thumbnail) thumb.style.backgroundImage = `url('${ep.thumbnail}')`;

      const info = document.createElement('div'); info.className = 'info';
      const title = document.createElement('div'); title.className = 'episodeTitle'; title.textContent = ep.title || ep.playbackId;
      const meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = `#${index + 1}`;

      info.appendChild(title);
      info.appendChild(meta);
      el.appendChild(thumb);
      el.appendChild(info);

      el.onclick = () => { player.selectEpisodeByPlaybackId(ep.playbackId); };
      items.appendChild(el);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    player.addPlaylist(episodes);
    buildItems();
  });
</script>
```

Step 3: Sync state with events
```html
<script>
  function updateSelection(activeId) {
    items.querySelectorAll('.playlistItem').forEach((el) => {
      el.classList.toggle('selected', el.getAttribute('data-playback-id') === activeId);
    });
  }

  // Player-driven toggle: show/hide the custom panel
  player.addEventListener('playlisttoggle', (e) => {
    if ((e.detail?.hasPlaylist ?? false) === false) return;
    panel.style.display = e.detail.open ? 'flex' : 'none';
  });

  // Highlight active item on change
  player.addEventListener('playbackidchange', (e) => {
    const playbackId = e.detail?.playbackId;
    if (playbackId) {
      updateSelection(playbackId);
      const activeEl = items.querySelector(`.playlistItem[data-playback-id="${playbackId}"]`);
      if (activeEl) activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
</script>
```

Step 4: Add custom navigation
```html
<script>
  // Called before continuing to next; always call ctx.next()
  player.customNext = (ctx) => {
    const idx = episodes.findIndex((ep) => ep.playbackId === ctx.playbackId) + 1;
    const next = episodes[idx];
    if (next) {
      // e.g., route, analytics, etc.
      console.log('Navigating to next', next.playbackId);
    }
    ctx.next();
  };

  // Called before continuing to previous; always call ctx.previous()
  player.customPrev = (ctx) => {
    const idx = episodes.findIndex((ep) => ep.playbackId === ctx.playbackId) - 1;
    if (idx >= 0) {
      // e.g., route, analytics, etc.
      console.log('Navigating to previous', episodes[idx].playbackId);
      ctx.previous();
    }
  };
</script>
```

### Practical Use Cases

1) Swap source in-place (no playlist change)
```html
<script>
  // Replace current source directly (e.g., user clicks promo card)
  player.loadByPlaybackId('NEW_PLAYBACK_ID', {
    token: 'optional-token',
    drmToken: 'optional-drm-token',
    customDomain: 'stream.fastpix.app',
    emitPlaybackChange: true
  });
</script>
```

2) Route on Next/Prev and then continue playback
```html
<script>
  player.customNext = (ctx) => {
    // Your router logic here, then continue
    // router.push(`/watch/${ctx.playbackId}`);
    ctx.next();
  };
  player.customPrev = (ctx) => {
    // router.back();
    ctx.previous();
  };
</script>
```

3) Analytics on playback change
```html
<script>
  player.addEventListener('playbackidchange', (e) => {
    const { playbackId, currentIndex, totalItems } = e.detail || {};
    analytics.track('Playback Changed', { playbackId, currentIndex, totalItems });
  });
</script>
```

4) External open/close controls for custom panel
```html
<script>
  function openPanel() {
    player.dispatchEvent(new CustomEvent('playlisttoggle', {
      detail: { open: true, hasPlaylist: true }, bubbles: true, composed: true
    }));
  }
  function closePanel() {
    player.dispatchEvent(new CustomEvent('playlisttoggle', {
      detail: { open: false, hasPlaylist: true }, bubbles: true, composed: true
    }));
  }
</script>
```

5) Select from external grid/list
```html
<script>
  document.querySelector('#grid').addEventListener('click', (e) => {
    const id = e.target?.getAttribute?.('data-playback-id');
    if (id) player.selectEpisodeByPlaybackId(id);
  });
</script>
```

### Troubleshooting
- Nothing plays: Ensure each playlist item has a valid `playbackId`.
- Custom panel doesn’t show: Use `hide-default-playlist-panel` and render your UI in a child with `slot="playlist-panel"`. Listen to `playlisttoggle` to toggle visibility.
- customNext/customPrev don’t work: Always call `ctx.next()` / `ctx.previous()` after your custom logic.
- Wrong item highlighted: Update the selection in the `playbackidchange` handler using the `playbackId` from `e.detail`. 