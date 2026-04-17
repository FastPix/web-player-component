/**
 * Adaptive quality / manual resolution: events, public helpers, and shared switch path.
 * Used by HlsManager (built-in UI + HLS listeners) and `FastPixPlayer` public API.
 */

import { showLoader } from "./DomVisibilityManager.js";

/** One rung on the HLS ladder (manifest / hls.js level index). */
export type ResolutionLevelInfo = {
  id: number;
  label: string;
  height: number;
  width: number;
  bitrate?: number;
  frameRate?: number;
};

export type PlaybackQualityState = {
  mode: "auto" | "manual";
  lockedLevel: ResolutionLevelInfo | null;
  loadedLevel: ResolutionLevelInfo | null;
};

function levelLabelDimension(level: { height: number; width: number }): number {
  return typeof level.height === "number" && level.height > level.width
    ? level.width
    : level.height;
}

function resolutionLevelInfoFromHlsLevel(
  context: any,
  levelIndex: number
): ResolutionLevelInfo | null {
  const lvl = context.hls?.levels?.[levelIndex];
  if (!lvl) return null;
  const dim = levelLabelDimension(lvl);
  const info: ResolutionLevelInfo = {
    id: levelIndex,
    label: `${dim}p`,
    height: lvl.height,
    width: lvl.width,
  };
  if (typeof lvl.bitrate === "number") info.bitrate = lvl.bitrate;
  if (typeof (lvl as any).frameRate === "number")
    info.frameRate = (lvl as any).frameRate;
  return info;
}

function getLoadedLevelIndex(hls: any): number | null {
  if (!hls) return null;
  const l = hls.loadLevel;
  if (typeof l === "number" && l >= 0) return l;
  const c = hls.currentLevel;
  if (typeof c === "number" && c >= 0) return c;
  return null;
}

function buildPlaybackQualityState(context: any): PlaybackQualityState {
  const mode = context.userSelectedLevel == null ? "auto" : "manual";
  const lockedLevel =
    context.userSelectedLevel != null
      ? resolutionLevelInfoFromHlsLevel(context, context.userSelectedLevel)
      : null;
  const loadIdx = getLoadedLevelIndex(context.hls);
  const loadedLevel =
    loadIdx != null ? resolutionLevelInfoFromHlsLevel(context, loadIdx) : null;
  return { mode, lockedLevel, loadedLevel };
}

export function getPlaybackQualityState(context: any): PlaybackQualityState {
  return buildPlaybackQualityState(context);
}

export function getFormattedQualityLevels(context: any): ResolutionLevelInfo[] {
  const ordered = context.qualityLevelsOrdered;
  if (!Array.isArray(ordered) || !context.hls?.levels) return [];
  const out: ResolutionLevelInfo[] = [];
  for (const level of ordered) {
    const idx = context.hls.levels.indexOf(level);
    if (idx < 0) continue;
    const info = resolutionLevelInfoFromHlsLevel(context, idx);
    if (info) out.push(info);
  }
  return out;
}

export function dispatchFastpixQualityFailed(
  context: any,
  reason: string,
  levelId?: number,
  raw?: unknown
) {
  try {
    context.dispatchEvent(
      new CustomEvent("fastpixqualityfailed", {
        detail: {
          reason,
          ...(levelId !== undefined ? { levelId } : {}),
          ...(raw !== undefined ? { raw } : {}),
        },
      })
    );
  } catch {
    /* ignore */
  }
}

export function dispatchFastpixQualityChange(context: any) {
  const state = buildPlaybackQualityState(context);
  const prevId = context._lastQualityEmitLoadedId;
  const previousLoadedLevel =
    typeof prevId === "number" && prevId >= 0
      ? resolutionLevelInfoFromHlsLevel(context, prevId)
      : null;
  try {
    context.dispatchEvent(
      new CustomEvent("fastpixqualitychange", {
        detail: {
          mode: state.mode,
          lockedLevel: state.lockedLevel,
          loadedLevel: state.loadedLevel,
          previousLoadedLevel,
        },
      })
    );
  } catch {
    /* ignore */
  }
  const loadIdx = getLoadedLevelIndex(context.hls);
  context._lastQualityEmitLoadedId =
    typeof loadIdx === "number" && loadIdx >= 0 ? loadIdx : null;
}

export function dispatchFastpixQualityLevelsReady(context: any) {
  try {
    const levels = getFormattedQualityLevels(context);
    context.dispatchEvent(
      new CustomEvent("fastpixqualitylevelsready", {
        detail: { levels },
      })
    );
  } catch {
    /* ignore */
  }
}

/** Map UI order index → hls.js `levels` index (handles `rendition-order` reversal). */
function uiIndexToHlsLevelIndex(context: any, uiIndex: number): number {
  const ordered = context.qualityLevelsOrdered;
  if (!Array.isArray(ordered) || !context.hls?.levels) return uiIndex;
  const level = ordered[uiIndex];
  if (!level) return uiIndex;
  const idx = context.hls.levels.indexOf(level);
  return idx >= 0 ? idx : uiIndex;
}

/** Shared manual switch path (built-in menu + public `setQualityLevel`). */
export function performManualQualitySwitch(context: any, uiIndex: number) {
  if (!context.hls?.levels) return;
  context.resolutionSwitching = true;
  context.wasPausedBeforeSwitch = context.video.paused;

  if (!context.wasPausedBeforeSwitch) {
    context.video.pause();
    showLoader(context);
  }

  context.resolutionFlagPause = true;
  context.isBufferFlushed = false;
  const hlsLevelIndex = uiIndexToHlsLevelIndex(context, uiIndex);
  context.hls.currentLevel = hlsLevelIndex;
  context.userSelectedLevel = hlsLevelIndex;
}

function setActiveQualityButton(activeButton: any, buttons: any) {
  Array.from(buttons).forEach((button: any) =>
    button.classList.remove("active")
  );
  activeButton.classList.add("active");
}

/** Enable ABR and sync built-in Auto highlight (same as built-in Auto control). */
export function applyQualityAuto(context: any) {
  if (!context.hls) return;
  showLoader(context);
  context.hls.nextLevel = -1;
  context.userSelectedLevel = null;
  if (context.autoResolutionButton && context.resolutionButtons) {
    setActiveQualityButton(context.autoResolutionButton, [
      ...context.resolutionButtons,
      context.autoResolutionButton,
    ]);
  }
  dispatchFastpixQualityChange(context);
}

/** Manual level by hls.js level index — for `<fastpix-player>` public API. */
export function setQualityLevelForContext(context: any, levelId: number) {
  if (!context.hls?.levels) return;
  const n = context.hls.levels.length;
  if (
    !Number.isFinite(levelId) ||
    levelId < 0 ||
    levelId >= n ||
    Math.floor(levelId) !== levelId
  ) {
    dispatchFastpixQualityFailed(context, "invalid levelId", levelId);
    return;
  }
  const uiIndex = Array.isArray(context.qualityLevelsOrdered)
    ? context.qualityLevelsOrdered.findIndex(
        (l: any) => context.hls.levels.indexOf(l) === levelId
      )
    : -1;
  if (uiIndex < 0) {
    dispatchFastpixQualityFailed(
      context,
      "levelId not in manifest order",
      levelId
    );
    return;
  }
  performManualQualitySwitch(context, uiIndex);
  if (context.resolutionButtons?.[uiIndex] && context.autoResolutionButton) {
    setActiveQualityButton(context.resolutionButtons[uiIndex], [
      ...context.resolutionButtons,
      context.autoResolutionButton,
    ]);
  }
  dispatchFastpixQualityChange(context);
}
