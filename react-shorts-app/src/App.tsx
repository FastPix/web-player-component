import type React from "react";
import { useRef, useEffect, useState, useCallback } from "react";
import "@fastpix/fp-player";
import {
  SHORTS_FEED,
  type FastPixPlayerElement,
  type ShortMeta,
} from "./shorts/types";
import { ShortItem } from "./shorts/ShortItem";

const WHEEL_IDLE_MS     = 160;

// ── ShortsApp ─────────────────────────────────────────────────────────────────
export default function ShortsApp() {
  const [activeIndex, setActiveIndex]             = useState(0);
  const [isMuted, setIsMuted]                     = useState(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const hasUserInteractedRef = useRef<boolean>(false);
  const activeIndexRef = useRef<number>(0);
  const isMutedRef = useRef<boolean>(true);
  const playerRefsByIndex = useRef<Record<number, FastPixPlayerElement | null>>(
    {},
  );

  // Wheel
  const cancelAnimation = useRef<(() => void) | null>(null);
  const hasFiredThisGesture = useRef<boolean>(false);
  const wheelIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Touch — we only watch scroll events to update activeIndex for playback.
  // We never block or intercept touch. CSS scroll-snap does all the snapping.
  const scrollDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  activeIndexRef.current = activeIndex;
  isMutedRef.current      = isMuted;

  const markInteracted = useCallback(() => {
    if (hasUserInteractedRef.current) return;
    hasUserInteractedRef.current = true;
  }, []);

  const registerPlayer = useCallback(
    (index: number, player: FastPixPlayerElement | null) => {
      if (player) playerRefsByIndex.current[index] = player;
      else delete playerRefsByIndex.current[index];
    },
    [],
  );

  const playAt = useCallback(
    (index: number, options: { resetTime?: boolean } = {}) => {
      const { resetTime = true } = options;
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
    if (resetTime && player.video) player.video.currentTime = 0;
    // Before any user gesture: keep muted (autoplay policy). After: use user's current mute preference (persists across swipes).
      if (!hasUserInteractedRef.current) {
        player.mute?.();
      } else {
        isMutedRef.current ? player.mute?.() : player.unmute?.();
      }
      const playResult = player.play?.();
      if ((playResult as Promise<void> | undefined)?.catch) {
        (playResult as Promise<void>).catch(() => {
          requestAnimationFrame(() => {
            if (activeIndexRef.current === index)
              player.play?.()?.catch?.(() => {});
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
      markInteracted();
      player.unmute?.();
      setIsMuted(false);
    } else {
      player.mute?.();
      setIsMuted(true);
    }
  }, [markInteracted, isMuted]);

  // Fullscreen the scroll container so scrolling works in fullscreen and progress bar stays visible.
  const handleRequestFullscreen = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    try {
      const docAny = document as any;
      const isFullscreen =
        document.fullscreenElement ?? docAny.webkitFullscreenElement;
      if (isFullscreen) {
        (document.exitFullscreen || docAny.webkitExitFullscreen)?.call(document);
      } else {
        (el.requestFullscreen || (el as any).webkitRequestFullscreen)?.call(el);
      }
    } catch (err) {
      console.warn("Fullscreen not supported", err);
    }
  }, []);

  // Mute preference persists across swipes; we do not reset isMuted when activeIndex changes.

  // ── Wheel snap ────────────────────────────────────────────────────────────────
  // Wheel uses programmatic scrollTo (smooth) — one snap per gesture.
  // CSS scroll-snap handles the final alignment.
  const wheelSnapTo = useCallback((index: number) => {
    const i  = Math.max(0, Math.min(index, SHORTS_FEED.length - 1));
    const el = scrollRef.current;
    if (!el) return;

    cancelAnimation.current?.();

    const from = el.scrollTop;
    const to   = i * window.innerHeight;

    activeIndexRef.current = i;
    setActiveIndex(i);
    playAt(i);

    if (from === to) return;

    // Use native scrollTo with smooth behavior — browser handles easing,
    // CSS snap guarantees exact landing, no overflowY toggle needed.
    el.scrollTo({ top: to, behavior: "smooth" });
  }, [playAt]);

  const handleScrollPrev = useCallback(() => {
    wheelSnapTo(activeIndexRef.current - 1);
  }, [wheelSnapTo]);
  const handleScrollNext = useCallback(() => {
    wheelSnapTo(activeIndexRef.current + 1);
  }, [wheelSnapTo]);

  // Share: build link to this short, use Web Share API or copy to clipboard
  const handleShare = useCallback(
    (playbackId: string, metadata: ShortMeta) => {
    const url = `${window.location.origin}${window.location.pathname}${window.location.search}#short/${playbackId}`;
    const title = metadata?.title ? `${metadata.title} | @${metadata?.creator ?? ""}` : "Short";
    const text = metadata?.title ?? title;
      if (typeof navigator.share === "function") {
        navigator
          .share({ title, text, url })
          .catch(() => {
            navigator.clipboard?.writeText(url).catch(() => {});
          });
      } else {
        navigator.clipboard?.writeText(url).catch(() => {});
      }
    },
    [],
  );

  // ── Scroll listener — detects where CSS snap landed ──────────────────────────
  // This is how we know which video to play after a touch swipe snaps.
  // Debounced so it only fires once scroll settles.
  const handleScroll = useCallback(() => {
    if (scrollDebounce.current) clearTimeout(scrollDebounce.current);
    scrollDebounce.current = setTimeout(() => {
      const el = scrollRef.current;
      if (!el) return;
      const i = Math.round(el.scrollTop / window.innerHeight);
      const clamped = Math.max(0, Math.min(i, SHORTS_FEED.length - 1));
      if (clamped === activeIndexRef.current) return;
      activeIndexRef.current = clamped;
      setActiveIndex(clamped);
      playAt(clamped);
    }, 80); // 80ms after scroll stops = snap has settled
  }, [playAt]);

  // ── Wheel: one gesture = one video ───────────────────────────────────────────
  const handleWheel = useCallback((e: WheelEvent) => {
    // e.preventDefault();

    if (wheelIdleTimer.current) clearTimeout(wheelIdleTimer.current);
    wheelIdleTimer.current = setTimeout(() => {
      hasFiredThisGesture.current = false;
    }, WHEEL_IDLE_MS);

    if (hasFiredThisGesture.current) return;
    if (e.deltaY === 0) return;

    hasFiredThisGesture.current = true;
    wheelSnapTo(activeIndexRef.current + (e.deltaY > 0 ? 1 : -1));
  }, [wheelSnapTo]);

  // ── Keyboard ──────────────────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    wheelSnapTo(activeIndexRef.current + (e.key === "ArrowDown" ? 1 : -1));
  }, [wheelSnapTo]);

  const handleContainerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target.closest?.("fastpix-player")) return;
      playAt(activeIndexRef.current, { resetTime: false });
    },
    [playAt],
  );

  // ── Effects ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fn = () => {
      const el = scrollRef.current;
      if (el) el.scrollTop = activeIndexRef.current * window.innerHeight;
    };
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => () => {
    cancelAnimation.current?.();
    if (wheelIdleTimer.current) clearTimeout(wheelIdleTimer.current);
    if (scrollDebounce.current) clearTimeout(scrollDebounce.current);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100dvh", display: "flex", justifyContent: "center", overflow: "hidden", background: "#000" }}>
      <style precedence="default" href="shorts-styles">{`
        .shorts-scroll::-webkit-scrollbar { display: none; }
        .shorts-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .shorts-scroll:fullscreen,
        .shorts-scroll:-webkit-full-screen {
          width: 100vw;
          height: 100dvh;
          background: #000;
        }
        .short-item fastpix-player {
          --aspect-ratio: 9/16;
          --player-border-radius: 16px;
        }
      `}</style>

      <div style={{ position: "relative", width: "min(100vw, 56.25vh)", height: "100dvh" }}>
      <div
        ref={scrollRef}
          className="shorts-scroll"
          onClick={handleContainerClick}
        style={{
            width: "100%",
            height: "100%",
            overflowY: "scroll",
          overflowX: "hidden",
            // CSS scroll-snap — handles ALL touch snapping natively.
            // scrollSnapStop: "always" on each item prevents skip-through.
          scrollSnapType: "y mandatory",
            // No scrollBehavior here — we set it per-operation (smooth for wheel,
            // instant for init). Touch uses native physics automatically.
        }}
      >
          <div style={{ height: `${SHORTS_FEED.length * 100}vh` }}>
            {SHORTS_FEED.map((short, i) => (
        <ShortItem
                key={short.id}
                playbackId={short.id}
                metadata={short}
                itemIndex={i}
                preload={
                  i === activeIndex ? "auto"
                  : i === activeIndex + 1 || i === activeIndex - 1 ? "metadata"
                  : "none"
                }
                registerPlayer={registerPlayer}
                onToggleMute={handleMuteToggle}
                isMuted={isMuted}
                onRequestFullscreen={handleRequestFullscreen}
                onScrollPrev={handleScrollPrev}
                onScrollNext={handleScrollNext}
                onShare={handleShare}
        />
      ))}
          </div>
        </div>

        {/* Mute button and controls live on the video overlay (same placement in fullscreen and not) */}
      </div>

      {/* Top HUD */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 10,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 20px",
        background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)",
          pointerEvents: "none",
      }}>
        {/* Logo / brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img
            src="https://dashboard.fastpix.io/images/fastpix.png"
            alt="FastPix"
            style={{ height: 24, width: "auto", objectFit: "contain" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, pointerEvents: "auto" }}>
          {/* Counter pill */}
          <div style={{
            padding: "4px 10px", borderRadius: 20,
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}>
            <span style={{ color: "#fff", fontSize: 12, fontWeight: 600, letterSpacing: "0.04em" }}>
              {activeIndex + 1} <span style={{ opacity: 0.5 }}>/ {SHORTS_FEED.length}</span>
          </span>
          </div>
        </div>
      </div>

      {/* Vertical dot rail (right side, centered) */}
      <div style={{
        position: "fixed", right: 20, top: "50%", transform: "translateY(-50%)",
        display: "flex", flexDirection: "column", gap: 6,
        pointerEvents: "none", zIndex: 10,
      }}>
        {SHORTS_FEED.map((_, i) => (
          <div key={i} style={{
            width: i === activeIndex ? 4 : 4,
            height: i === activeIndex ? 24 : 8,
            borderRadius: 4,
            background: i === activeIndex ? "#b16cea" : "rgba(255,255,255,0.35)",
            transition: "height 0.25s ease, background 0.25s ease",
          }} />
        ))}
      </div>
    </div>
  );
}