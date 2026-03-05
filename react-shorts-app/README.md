# FastPix Shorts Demo – React 19 + ESM

This `react-shorts-app` project is a **shorts-style demo** that shows how to use the web-based FastPix player in a React 19 app, using the ESM build of `@fastpix/fp-player`.

This demo is built and tested against **`@fastpix/fp-player` version `1.0.12`**.


## Prerequisites

To run or adapt this demo you should have:

- **Node.js** 18+ and **npm** 9+ installed.
- A React app (this example uses **React 19 + Vite**).
- Access to **FastPix vertical videos (9:16)** with:
  - A FastPix **playback ID** for each short.
  - Assets encoded for vertical viewing – this demo assumes a portrait/shorts layout only.

### Feed JSON format (universal)

The shorts feed is just a JSON array. You can generate or fetch it from your own backend as long as it matches this shape:

```json
[
  {
    "id": "YOUR_PLAYBACK_ID_1",
    "creator": "channel_or_creator_handle",
    "title": "Title for the short",
    "likes": "12.4K",
    "comments": "342",
    "shares": "891"
  },
  {
    "id": "YOUR_PLAYBACK_ID_2",
    "creator": "another_creator",
    "title": "Another vertical short",
    "likes": "8.7K",
    "comments": "201",
    "shares": "543"
  }
]
```

In this repo, that JSON is represented by the TypeScript array `SHORTS_FEED` in `src/shorts/types.ts`.  
**Replace every `id` with your own FastPix playback IDs** and update `creator`, `title`, and counts as needed. The code does not depend on any other fields, so this format is **universal** across apps and backends as long as you keep these keys.

All playback in the demo ultimately comes from `short.id` being passed to:

```tsx
<ShortItem playbackId={short.id} metadata={short} ... />
```

So once you wire your own JSON feed into `SHORTS_FEED` (or fetch it and pass it as props), the shorts player will work with your vertical videos.

---


## Quick start

Clone the repo and run the demo locally:

```bash
# from the root of the web-player repo
cd fastpix-web-player-react-shorts-demo/react-shorts-app

npm install
npm run dev
```

Then open `http://localhost:Your-port-number` in your browser.

Before you start, update `src/shorts/types.ts` and replace all placeholder values like `YOUR_PLAYBACK_ID_VERTICAL_VIDEO_1`, `CREATOR_NAME_1`, and `TITLE_OF_VERTICAL_VIDEO_1` with your **actual FastPix playback IDs** and metadata.

To build a production bundle:

```bash
npm run build
```

This runs `tsc -b` and `vite build`, producing a static build in `dist/`.

It focuses on **programmatic control** of the player and a **shorts feed UI**:

- Each short uses a `<fastpix-player>` web component.
- React drives **which short is active**, **mute state**, **scroll snapping**, and **UI controls**.
- The player instance exposes convenience methods (`play`, `pause`, `mute`, `unmute`) and an underlying `HTMLVideoElement` via `playerRef.current.video`.

---

## What FastPix handles vs what this app handles

At a high level:

- **FastPix (player level)** – implemented in `@fastpix/fp-player` and configured via **attributes + CSS variables**:
  - HLS/DASH playback, manifest fetching, buffering, error handling.
  - Track selection (audio, captions), DRM, thumbnails, ads/shoppable integrations.
  - **Attributes we set in code**:
    - `playback-id` – which vertical asset to play (1:1 with your feed JSON `id`).
    - `autoplay-shorts` – tuned autoplay behavior for shorts for instant playback start.
    - `muted` and `loop` – initial mute + continuous looping at the player level.
    - `disable-keyboard-controls` – let the app (not the player) own keyboard shortcuts.
    - `preload` – per‑item preload hint (`"auto"`, `"metadata"`, `"none"`).
  - **CSS variables we use in `index.css`**:
    - Hide built‑in overlays (middle controls, bottom‑right cluster, left controls) so we can draw our own UI:
      - **Middle controls** – `--middle-controls-mobile`, `--play-button-initialized`, `--mobile-play-button-initialized`.
      - **Bottom‑right controls** – `--bottom-right-controls`, `--bottom-right-controls-mobile`.
      - **Left‑bottom controls** – `--left-controls-bottom`, `--left-controls-bottom-mobile`.
    - `--seekbar-bottom` – pins the FastPix seekbar to the very bottom of the frame; the thumbnail sprites and timestamp tiles automatically follow this position.
    - `--progress-bar-invisible: 1` – makes the **visual bar** invisible but keeps the **FastPix seekbar logic fully active**, so:
      - Hover thumbnail previews and timestamp pills **still work**.
      - Click‑to‑seek on the underlying bar still works.
      - We can build our own progress stripe on top, driven by `video.currentTime`, while reusing all of FastPix’s seeking behavior under the hood.
  - Internal seekbar behavior, thumbnail seeking, and all low‑level media work remain the player’s responsibility.

- **This React app (application level)** – implemented in `src/App.tsx` + `src/shorts`:
  - Maintains the **shorts feed** (`SHORTS_FEED`) and renders one `ShortItem` per entry.
  - Tracks **which short is active** (`activeIndexRef`), **global mute state** (`isMuted`), and whether the user has interacted (for autoplay policy).
  - Uses refs to **call player methods** (`play()`, `pause()`, `mute()`, `unmute()`) at the right time:
    - Autoplay the active short when scroll/snapping lands on it.
    - Pause + mute all non‑active shorts so only one plays at a time.
  - Owns **all visible UI and layout**:
    - Play/pause, mute/unmute, fullscreen buttons.
    - Like/follow/share buttons, creator chip, HUD counter, vertical dot rail.
    - Custom progress stripe that mirrors `video.currentTime` but delegates seek + thumbnails to FastPix.
  - Controls **navigation and feed UX**:
    - Scroll snapping (wheel + touch) between shorts.
    - Keyboard navigation (ArrowUp / ArrowDown) via app‑level handlers.
    - Fullscreen of the **scroll container** so the shorts column behaves the same in fullscreen and windowed modes.

Use this repo as a **working reference implementation**: you can copy the patterns from:

- `src/App.tsx` – feed container, refs, and behavior (`playAt`, `handleMuteToggle`, wheel/keyboard handlers).  
- `src/shorts/ShortItem.tsx` – per‑card player mounting and card UI.  
- `src/shorts/types.ts` – universal JSON format for your shorts feed.  
- `src/index.css` – how to hide built‑in controls and restyle the player for a shorts layout.

You are encouraged to re‑use or adapt this code in your own GitHub projects.

---

## Accessing the underlying `video` element

FastPix exposes the native `HTMLVideoElement` on the custom element as a `video` property. In this demo we type it as:

```ts
interface FastPixPlayerElement extends HTMLElement {
  video?: HTMLVideoElement;
  play?: () => Promise<void> | void;
  pause?: () => void;
  mute?: () => void;
  unmute?: () => void;
  destroy?: () => void;
}
```

Inside `ShortItem` we keep a ref to the player:

```ts
const playerRef = useRef<FastPixPlayerElement | null>(null);
```

Once the element is created and mounted, we can safely access the `video` element:

```ts
useEffect(() => {
  const player = playerRef.current;
  const vid = player?.video;
  if (!vid) return;

  const onPlay = () => setIsPlaying(true);
  const onPause = () => setIsPlaying(false);

  setIsPlaying(!vid.paused);
  vid.addEventListener("play", onPlay);
  vid.addEventListener("pause", onPause);

  return () => {
    vid.removeEventListener("play", onPlay);
    vid.removeEventListener("pause", onPause);
  };
}, [playbackId]);
```

We also use `playerRef.current.video` for:

- **Progress bar**: a `requestAnimationFrame` loop reads `video.currentTime` / `video.duration`.
- **Preload behavior**: setting `video.preload` based on whether the short is active / adjacent.

This keeps **visual progress and preloading** under app control while the streaming logic stays in FastPix.

---

## Player methods: `play`, `pause`, `mute`, `unmute`

At the application level we treat each FastPix instance as a small API surface:

```ts
// In ShortsApp (App.tsx)
const playerRefsByIndex = useRef<Record<number, FastPixPlayerElement | null>>({});

const registerPlayer = useCallback((index: number, player: FastPixPlayerElement | null) => {
  if (player) playerRefsByIndex.current[index] = player;
  else delete playerRefsByIndex.current[index];
}, []);
```

`ShortItem` calls `registerPlayer(itemIndex, el)` when it mounts / unmounts.

### Centralized playback control (`playAt`)

```ts
const playAt = useCallback(
  (index: number, options: { resetTime?: boolean } = {}) => {
    const { resetTime = true } = options;

    // Pause + mute all other players
    Object.entries(playerRefsByIndex.current).forEach(([i, p]) => {
      const playerEl = p;
      if (!playerEl) return;
      if (Number(i) !== index) {
        playerEl.mute?.();
        playerEl.pause?.();
      }
    });

    const player = playerRefsByIndex.current[index];
    if (!player) return;

    // Optionally reset time when snapping to a new short
    if (resetTime && player.video) player.video.currentTime = 0;

    // Autoplay policy: before any gesture, always muted; after interaction, honor app mute state
    if (!hasUserInteractedRef.current) {
      player.mute?.();
    } else {
      isMutedRef.current ? player.mute?.() : player.unmute?.();
    }

    const playResult = player.play?.();
    if ((playResult as Promise<void> | undefined)?.catch) {
      (playResult as Promise<void>).catch(() => {
        requestAnimationFrame(() => {
          if (activeIndexRef.current === index) {
            player.play?.()?.catch?.(() => {});
          }
        });
      });
    }
  },
  [],
);
```

**What FastPix handles:**

- HLS/DASH streaming, manifests, network logic.
- Thumbnails, captions, audio tracks, quality selection.
- Keyboard shortcuts (when not disabled), volume persistence, ads/shoppable integrations, etc.

**What the app handles:**

- Which short is active (`activeIndexRef` + scroll listener / wheel / keyboard).
- Global mute state and user interaction tracking.
- When to call `play()`, `pause()`, `mute()`, `unmute()` across the playlist.
- UI layer: creator chip, subscribe, like/share/follow, HUD counters, scroll arrows.

This separation keeps **streaming and player internals** inside FastPix while React orchestrates **feed behavior and UX**.

---

## Hiding built‑in controls and using a custom seekbar

The demo hides most of the built‑in FastPix UI and renders its own Shorts-style overlays and seekbar, while still letting the **FastPix logic handle hover thumbnails and seek behavior**.

In `src/index.css`:

```css
fastpix-player {
  --middle-controls-mobile: none;
  --mobile-play-button-initialized: none;
  --bottom-right-controls-mobile: none;
  --bottom-right-controls: none;
  --left-controls-bottom: none;
  --left-controls-bottom-mobile: none;
  --seekbar-bottom: 0px;
  /* Hide progress bar visually but keep it for hover/seek so timestamp preview works */
  --progress-bar-invisible: 1;
  --play-button-initialized: none;
}
```

### Why we hide the built‑in controls

- **Shorts-style UX** – We want the player frame to look like a shorts reel:
  - Custom top bar (play/pause, mute/unmute, fullscreen).
  - Custom right rail (scroll arrows, like/share/follow).
  - Custom bottom progress stripe that matches the card’s rounded corners.
- **Branding & layout control** – App code controls spacing, border radius, and overlays consistently across the feed.

By setting the FastPix CSS variables to `none`, we **hide**:

- Middle play/pause controls.  
- Mobile overlay play buttons.  
- Bottom-right control clusters (volume, settings, etc.).  
- Left-bottom overlays.

But we **do not disable** the underlying logic – only the visuals.

### Custom seekbar powered by FastPix

In `ShortItem.tsx`, the progress bar you see at the bottom of each card is **fully app‑driven**, using the FastPix video element:

```tsx
// Progress state
const [progress, setProgress] = useState(0);

useEffect(() => {
  const player = playerRef.current;
  const vid = player?.video;
  if (!vid) return;

  const paint = () => {
    const duration = vid.duration;
    if (duration > 0 && isFinite(duration)) {
      setProgress((vid.currentTime / duration) * 100);
    } else {
      setProgress(0);
    }
  };

  let rafId: number | null = null;
  const loop = () => {
    paint();
    rafId = requestAnimationFrame(loop);
  };

  const startRAF = () => {
    if (rafId == null) rafId = requestAnimationFrame(loop);
  };
  const stopRAF = () => {
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    paint();
  };

  paint();
  vid.addEventListener("play", startRAF);
  vid.addEventListener("playing", startRAF);
  vid.addEventListener("pause", stopRAF);
  vid.addEventListener("ended", stopRAF);
  vid.addEventListener("seeking", paint);
  vid.addEventListener("seeked", paint);

  return () => {
    if (rafId != null) cancelAnimationFrame(rafId);
    vid.removeEventListener("play", startRAF);
    vid.removeEventListener("playing", startRAF);
    vid.removeEventListener("pause", stopRAF);
    vid.removeEventListener("ended", stopRAF);
    vid.removeEventListener("seeking", paint);
    vid.removeEventListener("seeked", paint);
  };
}, []);

// Render
<div
  style={{
    position: "absolute",
    bottom: 0,
    left: 20,
    right: 20,
    height: 3,
    zIndex: 3,
    background: "rgba(255,255,255,0.2)",
    pointerEvents: "none",
    borderRadius: "0 0 16px 16px",
  }}
>
  <div
    style={{
      height: "100%",
      width: `${progress}%`,
      background: accentColor,
      borderRadius: "inherit",
      transition: "none",
    }}
  />
</div>
```

This bar is **read‑only** – it reflects FastPix’s playback state, but all **click‑to‑seek and thumbnail preview** responsibility stays inside the FastPix player.

Because we use:

- `--progress-bar-invisible: 1` – the built‑in progress bar is visually hidden, but:
  - Hover thumbnails, timestamp preview, and click‑to‑seek continue to work on the underlying FastPix bar.
- Our own progress stripe is layered **on top**, giving full visual control without re‑implementing seeking logic.

In other words:

- **FastPix** still handles:
  - Computing seek positions, updating internal range, showing thumbnails.
- **Your React app**:
  - Renders a custom progress bar synced to `video.currentTime`.
  - Owns the visual design of the seekbar, while leveraging FastPix’s tried-and-tested seeking behavior underneath.

---

## Example: wiring buttons to `play`, `pause`, `mute`, `unmute`

Below is a **minimal pattern** (derived from the real `App.tsx`) that shows how to wire UI buttons to FastPix methods.

### 1. Track players and active index

```ts
const [activeIndex, setActiveIndex] = useState(0);

const playerRefsByIndex = useRef<Record<number, FastPixPlayerElement | null>>({});
const activeIndexRef = useRef(0);
const isMutedRef = useRef(true);
const hasUserInteractedRef = useRef(false);

activeIndexRef.current = activeIndex;
isMutedRef.current = isMuted;

const registerPlayer = useCallback(
  (index: number, player: FastPixPlayerElement | null) => {
    if (player) playerRefsByIndex.current[index] = player;
    else delete playerRefsByIndex.current[index];
  },
  [],
);
```

`ShortItem` calls `registerPlayer(itemIndex, el)` when its `fastpix-player` mounts.

### 2. Central `playAt` and a mute toggle handler

```ts
const playAt = useCallback(
  (index: number, options: { resetTime?: boolean } = {}) => {
    const { resetTime = true } = options;

    // Pause + mute everyone else
    Object.entries(playerRefsByIndex.current).forEach(([i, p]) => {
      const playerEl = p;
      if (!playerEl) return;
      if (Number(i) !== index) {
        playerEl.mute?.();
        playerEl.pause?.();
      }
    });

    const player = playerRefsByIndex.current[index];
    if (!player) return;

    if (resetTime && player.video) {
      player.video.currentTime = 0;
    }

    // Autoplay policy vs user mute preference
    if (!hasUserInteractedRef.current) {
      player.mute?.();
    } else {
      isMutedRef.current ? player.mute?.() : player.unmute?.();
    }

    const playResult = player.play?.();
    if ((playResult as Promise<void> | undefined)?.catch) {
      (playResult as Promise<void>).catch(() => {
        requestAnimationFrame(() => {
          if (activeIndexRef.current === index) {
            player.play?.()?.catch?.(() => {});
          }
        });
      });
    }
  },
  [],
);

const handleMuteToggle = useCallback(() => {
  const player = playerRefsByIndex.current[activeIndexRef.current];
  if (!player) return;

  if (isMuted) {
    hasUserInteractedRef.current = true;
    player.unmute?.();
    setIsMuted(false);
  } else {
    player.mute?.();
    setIsMuted(true);
  }
}, [isMuted]);
```

### 3. Hooking up actual buttons

In the **ShortItem** overlay we use the underlying `video` element for play/pause:

```tsx
// Inside ShortItem.tsx
<button
  type="button"
  onClick={(e) => {
    e.stopPropagation();
    const vid = playerRef.current?.video;
    if (vid) vid.paused ? vid.play() : vid.pause();
  }}
  aria-label={isPlaying ? "Pause" : "Play"}
>
  {isPlaying ? "Pause" : "Play"}
</button>
```

In the **ShortsApp** container we wire a mute/unmute button to `handleMuteToggle`:

```tsx
// In the top HUD (App.tsx)
<button
  type="button"
  onClick={handleMuteToggle}
>
  {isMuted ? "Tap to unmute" : "Mute"}
</button>
```

You can also expose explicit **Play / Pause** buttons for the current short by using `playAt` and the active player:

```tsx
const handlePlayClick = () => {
  playAt(activeIndexRef.current, { resetTime: false });
};

const handlePauseClick = () => {
  const player = playerRefsByIndex.current[activeIndexRef.current];
  player?.pause?.();
};

// Example buttons:
<button type="button" onClick={handlePlayClick}>Play current</button>
<button type="button" onClick={handlePauseClick}>Pause current</button>
```

This is the exact pattern the demo uses: **central refs + helpers in `App.tsx`**, and **small buttons in the UI** that call `play()`, `pause()`, `mute()`, and `unmute()` on the right FastPix instance.

---

## Why `document.createElement("fastpix-player")` instead of JSX?

In `ShortItem` we mount the player like this:

```ts
useEffect(() => {
  const container = containerRef.current;
  if (!container || playerRef.current) return;

  const el = document.createElement("fastpix-player") as FastPixPlayerElement;
  el.setAttribute("playback-id", playbackId);
  el.setAttribute("autoplay-shorts", "");
  el.setAttribute("muted", "");
  el.setAttribute("loop", "");
  el.setAttribute("disable-keyboard-controls", "");
  el.setAttribute("preload", preload);
  el.style.width = "100%";
  el.style.height = "100%";
  el.style.objectFit = "cover";
  container.appendChild(el);
  playerRef.current = el;
  registerPlayer(itemIndex, el);

  return () => {
    registerPlayer(itemIndex, null);
    try { if (typeof el.destroy === "function") el.destroy(); } catch {}
    if (container.contains(el)) container.removeChild(el);
    playerRef.current = null;
  };
}, [playbackId, itemIndex, registerPlayer]);
```

Instead of:

```tsx
// We intentionally DO NOT do this today:
// <fastpix-player playback-id={...} autoplay-shorts muted loop />
```

### Reasons (React 19 + current web component)

- **Lifecycle control for a shorts feed**  
  With programmatic `document.createElement`, we have full control over **when a player is created and destroyed**. In a shorts UX this is important to:
  - Avoid keeping too many `<fastpix-player>` instances alive at once.
  - Explicitly clean up (calling `destroy()` if available) when a card unmounts.

- **Attribute-only API today**  
  The current web player is designed as a **framework-agnostic custom element**:
  - All configuration is via attributes (`playback-id`, `autoplay-shorts`, `muted`, `loop`, etc.).
  - React 19 can render it as JSX, but:
    - Attribute updates and ref timing can be trickier in complex virtualized lists.
    - We want deterministic mounting/teardown tied to our `useEffect`, especially for autoplay + shorts snapping behavior.

- **Interop safety while React-based version is in progress**  
  We’re actively working on a **React-based version** of the FastPix player, which will expose a first-class `<FastPixPlayer />` component with idiomatic props, hooks, and React 19 semantics.

  Until that is released, using `document.createElement("fastpix-player")`:

  - Keeps the integration **explicit and predictable**.
  - Avoids subtle issues around how React reconciles custom elements across rapid feed changes.
  - Matches what you would do in any non-React environment (plain JS, Next.js with custom layout effects, etc.).

When the React-native wrapper is available, this demo can be simplified to:

```tsx
<FastPixPlayer
  playbackId={short.id}
  autoplayShorts
  muted
  loop
  disableKeyboardControls
  onReady={(player) => registerPlayer(itemIndex, player)}
/>;
```

For now, this example is a **reference implementation** for using the **web component version** of FastPix in a React 19 shorts experience. It shows:

- How to **control the player via refs and methods**.
- How to **read the underlying `video` element** when needed.
- How to **keep feed-level logic inside React** while delegating playback to FastPix.

---

## Custom buttons, fullscreen, and likes – how the UI works

This demo deliberately **replaces most of the built‑in player chrome** with React components so you can see how to wire your own UI on top of FastPix.

At a high level:

- **Play / Pause** (per short)  
  - Implemented in `ShortItem.tsx` by reading the underlying `video` element:

    ```tsx
    const vid = playerRef.current?.video;
    if (vid) vid.paused ? vid.play() : vid.pause();
    ```

  - We also mirror that state into `isPlaying` (via `play`/`pause` listeners) to render the right icon.

- **Mute / Unmute** (feed‑level)  
  - Implemented in `ShortsApp` (App.tsx) via `handleMuteToggle`:

    ```ts
    const player = playerRefsByIndex.current[activeIndexRef.current];
    if (!player) return;

    if (isMuted) {
      hasUserInteractedRef.current = true;
      player.unmute?.();
      setIsMuted(false);
    } else {
      player.mute?.();
      setIsMuted(true);
    }
    ```

  - We keep a **single mute flag for the whole feed** and let `playAt` apply that flag whenever the active short changes.

- **Fullscreen**  
  - We fullscreen the **scroll container**, not the individual player:

    ```ts
    const el = scrollRef.current;
    // ...
    (el.requestFullscreen || (el as any).webkitRequestFullscreen)?.call(el);
    ```

  - This keeps scroll snapping and the custom overlays working the same way in fullscreen and windowed modes.

- **Like / Follow / Share**  
  - All handled in React state only (no special FastPix APIs required):
    - `liked` / `followed` booleans for each `ShortItem`.
    - `incrementLabel()` helper for compact like counts (`"12.4K"` → `"12.5K"`).
    - `handleShare()` builds a URL for the current `playbackId` and:
      - Uses `navigator.share(...)` when available.
      - Falls back to `navigator.clipboard.writeText(...)`.

The important idea: **FastPix provides playback and metadata; the app owns all UI state and interactions**. You are free to rearrange or re‑style the controls without touching any streaming logic.

Feel free to copy/paste or adapt any of the source under `my-react-app/src` into your own projects. This demo is meant to be a **working cookbook**, not just a black‑box example.

---

## Why we use `disable-keyboard-controls` in this app

By default, FastPix captures many keyboard keys (space, arrows, etc.) to control the player. That is great for standalone players, but in a **shorts feed** it can interfere with app‑level navigation.

In `ShortItem.tsx` we set:

```ts
el.setAttribute("disable-keyboard-controls", "");
```

This tells the player to **ignore keyboard input**, so the app can own it instead. We then implement our own handlers in `ShortsApp`:

```ts
const handleKeyDown = useCallback((e: KeyboardEvent) => {
  if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
  e.preventDefault();
  wheelSnapTo(activeIndexRef.current + (e.key === "ArrowDown" ? 1 : -1));
}, [wheelSnapTo]);

useEffect(() => {
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [handleKeyDown]);
```

With this setup:

- **Arrow keys** move to the next/previous short (just like many social apps).  
- FastPix does **not** attempt to change volume/seek in response to those keys.  
- You can extend the same pattern for other keys (e.g. `L` for like, `M` for mute, etc.) entirely at the app level.

This makes keyboard behavior **predictable and app‑specific**, while still letting FastPix handle all media playback under the hood.

