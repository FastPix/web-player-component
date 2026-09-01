import type * as React from "react";

// Attributes arrive as HTML strings; boolean flags and numeric offsets also
// accept their natural JS type since React stringifies them onto the element.
type BoolLike = boolean | string;
type NumLike = number | string;

interface FastPixPlayerAttributes extends React.HTMLAttributes<HTMLElement> {
  // Playback source
  "playback-id"?: string;
  "default-playback-id"?: string;
  token?: string;
  "drm-token"?: string;
  "stream-type"?: "on-demand" | "live-stream";
  "default-stream-type"?: "on-demand" | "live-stream";
  "custom-domain"?: string;
  "config-domain"?: string;
  "enable-cache-busting"?: BoolLike;

  // Playback behavior
  "auto-play"?: BoolLike;
  "autoplay-shorts"?: BoolLike;
  loop?: BoolLike;
  "loop-next"?: BoolLike;
  muted?: BoolLike;
  preload?: "none" | "metadata" | "auto";
  "start-time"?: NumLike;
  "default-duration"?: NumLike;
  "playback-rates"?: string;
  "forward-seek-offset"?: NumLike;
  "backward-seek-offset"?: NumLike;
  "target-live-window"?: NumLike;
  "hot-keys"?: string;
  "disable-keyboard-controls"?: BoolLike;
  "disable-video-click"?: BoolLike;
  "no-volume-pref"?: BoolLike;
  "enable-lazy-loading"?: BoolLike;
  crossorigin?: string;

  // Quality / renditions
  resolution?: string;
  "min-resolution"?: string;
  "max-resolution"?: string;
  "rendition-order"?: string;

  // UI & theming
  theme?: "shoppable-video-player" | "shoppable-shorts" | (string & {});
  "accent-color"?: string;
  "primary-color"?: string;
  "secondary-color"?: string;
  "hide-controls"?: BoolLike;
  "default-show-remaining-time"?: BoolLike;
  poster?: string;
  placeholder?: string;
  "thumbnail-time"?: NumLike;
  "thumbnail-token"?: string;
  "spritesheet-src"?: string;
  "advanced-spritesheet-interval"?: NumLike;

  // Subtitles
  "hide-native-subtitles"?: BoolLike;
  "disable-hidden-captions"?: BoolLike;

  // Chapters / episodes / shoppable
  "skip-intro-start"?: NumLike;
  "skip-intro-end"?: NumLike;
  "next-episode-button-overlay"?: BoolLike;
  "product-link"?: string;

  // Analytics (full mapping in IntegrateAnlytics.ts attributesMapping,
  // e.g. metadata-video-title, metadata-viewer-user-id, metadata-custom-1..10)
  "metadata-workspace-key"?: string;
  [key: `metadata-${string}`]: string | undefined;
  debug?: BoolLike;
  "enable-debug"?: BoolLike;
  "disable-cookies"?: BoolLike;
  "respect-do-not-track"?: BoolLike;
}

type FastPixPlayerIntrinsicElement = React.DetailedHTMLProps<
  FastPixPlayerAttributes,
  HTMLElement
>;

declare global {
  interface HTMLVideoElement {
    fp?: {
      destroy: () => void;
      [key: string]: unknown;
    };
  }

  // Pre-React-19: JSX.IntrinsicElements lives on the global ambient JSX namespace.
  namespace JSX {
    interface IntrinsicElements {
      "fastpix-player": FastPixPlayerIntrinsicElement;
    }
  }
}

// React 19+: @types/react moved JSX.IntrinsicElements into a namespace inside
// the "react" module itself, so the global augmentation above is no longer read.
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "fastpix-player": FastPixPlayerIntrinsicElement;
    }
  }
}

export {};
