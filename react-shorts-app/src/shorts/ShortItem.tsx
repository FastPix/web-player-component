import { useEffect, useRef, useState } from "react";
import { ActionBtn } from "./ActionButton";
import { incrementLabel } from "./utils";
import type { FastPixPlayerElement, ShortMeta } from "./types";

export type ShortItemProps = {
  playbackId: string;
  metadata: ShortMeta;
  itemIndex: number;
  preload: "none" | "metadata" | "auto";
  registerPlayer: (index: number, player: FastPixPlayerElement | null) => void;
  onToggleMute: () => void;
  isMuted: boolean;
  onRequestFullscreen: () => void;
  onScrollPrev: () => void;
  onScrollNext: () => void;
  onShare: (playbackId: string, metadata: ShortMeta) => void;
};

export const ShortItem: React.FC<ShortItemProps> = ({
  playbackId,
  metadata,
  itemIndex,
  preload,
  registerPlayer,
  onToggleMute,
  isMuted,
  onRequestFullscreen,
  onScrollPrev,
  onScrollNext,
  onShare,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<FastPixPlayerElement | null>(null);
  const [liked, setLiked] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [progress, setProgress] = useState(0); // 0–100
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [accentColor, setAccentColor] = useState("#5D09C7");

  useEffect(() => {
    const container = containerRef.current;
    if (!container || playerRef.current) return;

    const el = document.createElement(
      "fastpix-player",
    ) as FastPixPlayerElement;
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
    if (playerRef.current?.video)
      playerRef.current.video.setAttribute("playback-rate", "3");
    registerPlayer(itemIndex, el);
    return () => {
      registerPlayer(itemIndex, null);
      try {
        if (typeof el.destroy === "function") el.destroy();
      } catch {
        // ignore
      }
      if (container.contains(el)) container.removeChild(el);
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbackId, itemIndex, registerPlayer]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    player.setAttribute("preload", preload);
    if (player.video) player.video.preload = preload;
  }, [preload]);

  useEffect(() => {
    const onFullscreenChange = () => {
      const docAny = document as any;
      setIsFullscreen(
        !!document.fullscreenElement || !!docAny.webkitFullscreenElement,
      );
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener(
      "webkitfullscreenchange" as any,
      onFullscreenChange as any,
    );
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange" as any,
        onFullscreenChange as any,
      );
    };
  }, []);

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

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const read = () => {
      const fromAttr = player.getAttribute("accent-color");
      if (fromAttr) {
        setAccentColor(fromAttr);
        return;
      }
      const fromStyle = getComputedStyle(player)
        .getPropertyValue("--accent-color")
        .trim();
      if (fromStyle) setAccentColor(fromStyle);
    };
    read();
    const t = setTimeout(read, 100);
    return () => clearTimeout(t);
  }, [playbackId]);

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

  const likeCount = liked
    ? incrementLabel(metadata.likes)
    : metadata.likes;

  const topBarBtnStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: "none",
    background: "rgba(0,0,0,0.4)",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        flexShrink: 0,
        scrollSnapAlign: "start",
        scrollSnapStop: "always",
        padding: "10px 8px",
        boxSizing: "border-box",
        background: "transparent",
      }}
    >
      <div
        className="short-item"
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          background: "#000",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <div
          ref={containerRef}
          style={{ position: "absolute", inset: 0 }}
        />

        {/* Top bar (play/pause, mute, fullscreen) */}
        <div
          style={{
            position: "absolute",
            top: 24,
            left: 0,
            right: 0,
            height: 48,
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
            boxSizing: "border-box",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              pointerEvents: "auto",
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const vid = playerRef.current?.video;
                if (vid) vid.paused ? vid.play() : vid.pause();
              }}
              aria-label={isPlaying ? "Pause" : "Play"}
              style={topBarBtnStyle}
            >
              {isPlaying ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="none"
                >
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="none"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMute?.();
              }}
              aria-label={isMuted ? "Unmute" : "Mute"}
              style={topBarBtnStyle}
            >
              {isMuted ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              )}
            </button>
          </div>
          <div
            style={{ display: "flex", alignItems: "center", pointerEvents: "auto" }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRequestFullscreen?.();
              }}
              aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              style={{ ...topBarBtnStyle, justifyContent: "center", alignItems: "center" }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ transform: isFullscreen ? "rotate(180deg)" : "none" }}
              >
                {/* classic expand icon; rotated 180° for exit */}
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </button>
          </div>
        </div>

        {/* Creator + title */}
        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: 16,
            right: 72,
            zIndex: 2,
            userSelect: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, #b16cea 0%, #5d09c7 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                {metadata.creator[0].toUpperCase()}
              </div>
              <span
                style={{
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                @{metadata.creator}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFollowed((v) => !v)}
              style={{
                pointerEvents: "auto",
                padding: "6px 0",
                width: 120, // fixed width so Subscribe/Following don't shift layout
                borderRadius: 18,
                border: "none",
                background: "rgba(255,255,255,0.2)",
                color: "#fff",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                textAlign: "center",
                transition: "background 0.2s, color 0.2s, transform 0.15s",
              }}
            >
              {followed ? "Following" : "Subscribe"}
            </button>
          </div>
          <p
            style={{
              margin: 0,
              color: "rgba(255,255,255,0.9)",
              fontSize: 13,
              lineHeight: 1.4,
              textShadow: "0 1px 4px rgba(0,0,0,0.8)",
              pointerEvents: "none",
            }}
          >
            {metadata.title}
          </p>
        </div>

        {/* Progress bar */}
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

        {/* Right column: scroll arrows + actions */}
        <div
          style={{
            position: "absolute",
            right: 12,
            bottom: 32,
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: 16,
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onScrollPrev?.();
            }}
            aria-label="Previous short"
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(10px)",
              border: "1.5px solid rgba(255,255,255,0.2)",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 18 }}>↑</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onScrollNext?.();
            }}
            aria-label="Next short"
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(10px)",
              border: "1.5px solid rgba(255,255,255,0.2)",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 18 }}>↓</span>
          </button>
          <ActionBtn
            icon="♥"
            label={likeCount}
            active={liked}
            onClick={() => setLiked((v) => !v)}
          />
          <ActionBtn
            useShareIcon
            label="Share"
            onClick={() => onShare?.(playbackId, metadata)}
          />
          <ActionBtn
            icon={followed ? "✓" : "+"}
            label={followed ? "Following" : "Follow"}
            active={followed}
            onClick={() => setFollowed((v) => !v)}
          />
        </div>
      </div>
    </div>
  );
};

