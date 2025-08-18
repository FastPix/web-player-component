// Add the following CSS to your stylesheet:
// .playlistButtonVisible { display: inline-block; }
// .playlistButtonHidden { display: none; }
import { videoListeners } from "./utils/VideoListeners";
import { KeyBoardInputManager } from "./utils/KeyboardHandler";
import {
  playlistButtonClickHandler,
  PlaylistNextButtonClickHandler,
  PlaylistPrevButtonClickHandler,
  toggleVideoPlayback,
} from "./utils/ToggleController";
import { WindowEvents } from "./utils/WindowEvents";
import { initializeLazyLoadStream } from "./utils/LazyLoadingHandler";
import { updateChapterMarkers } from "./utils/ChaptersHandlers";
import { CaptionIcon } from "./icons/CaptionIcon/index";
import { ResolutionIcon } from "./icons/ResolutionIcon/index";
import { AudioIcon } from "./icons/AudioIcon/index";
import { PipIcon } from "./icons/PipIcon/index";
import { FastForwardIcon } from "./icons/FastForwardIcon.ts/index";
import { RewindIcon } from "./icons/RewindIcon/index";
import { PlayIcon } from "./icons/PlayPauseIcon/index";
import { VolumeHighIcon } from "./icons/VolumeIcon/index";
import { skeleton } from "./utils/InnerHtml";
import { fullScreenChangeHandler } from "./utils/FullScreenChangeHandler";
import { customizeThumbnail } from "./utils/thumbnailSeeking";
import { handleTitleContainer, hideMenus } from "./utils/DomVisibilityManager";
import { hideDefaultSubtitlesStyles } from "./utils/SubtitleHandler";
import {
  configHls,
  handleHlsQualityAndTrackSetup,
  Hls,
  hlsListeners,
} from "./utils/HlsManager";
import {
  configureForiOS,
  restoreVolumeSettings,
} from "./utils/VolumeController";
import {
  audioButtonClickHandler,
  fastForwardRewindButtonClickHandler,
  fullScreenButtonClickHandler,
  pipButtonClickHandler,
  playbackRateButtonClickHandler,
  subtileButtonClickHandler,
  VolumeButtonClickHandler,
} from "./utils/ClickHandlers";
import {
  EnterFullScreenIcon,
  ExitFullScreenIcon,
} from "./icons/FullScreenIcon/index";
import {
  DrmSetup,
  getSRC,
  receiveAttributes,
  setStreamUrl,
  updateTimeDisplay,
  videoEvents,
} from "./utils/index";
import { documentObject, windowObject } from "./utils/CustomElements";
import {
  parseAndSetDefaultPlaybackRate,
  setPlaybackRate,
} from "./utils/PlaybackRatesHandler";
import { initializeAnalytics } from "./utils/IntegrateAnlytics";
import { loadCastAPI, setupChromecast } from "./utils/CastHandler";

import { PlaylistIcon } from "./icons/PlaylistIcon/index";
import {
  initializeShoppable,
  populateSidebarProducts,
} from "./utils/ShoppableVideo";
import { resizeVideoWidth } from "./utils/ResizeVideo";
import { initPlaylistControls } from "./utils/PlaylistHandler";

// Shoppable types
type ShoppableSidebarConfig = {
  startState?: "openOnPlay" | "closed";
  autoClose?: number;
  bannerMessage?: string;
  showPostPlayOverlay?: boolean;
};

class FastPixPlayer extends windowObject.HTMLElement {
  [x: string]: any;
  _readyState: number;
  hls: Hls | null;
  video: HTMLVideoElement;
  resolutionFlagPause: boolean;
  isLoading: boolean;
  isOnline: boolean;
  userSelectedLevel: number | null;
  isBufferFlushed: boolean;
  isBuffering: boolean;
  pauseAfterLoading: boolean;
  resolutionSwitching: boolean;
  disabledAllCaptions: boolean;
  progressBarVisible: boolean;
  pausedOnCasting: boolean;
  cache: Map<string, unknown>;
  initialPlayClick: boolean;
  isInitialLoad: boolean;
  videoEnded: boolean;
  isError: boolean;
  currentSubtitleTrackIndex: number;
  chapters: any;
  _src: string | null;
  previousChapter: any;
  playlist: any[] = [];
  currentIndex: number = 0;
  retryButtonVisible: boolean;
  wrapper: HTMLElement;
  controlsContainer: HTMLElement;
  leftControls: HTMLElement;
  mobileControls: HTMLElement;
  mobileControlButtonsBlock: HTMLElement;
  timeDisplay: HTMLElement;
  subtitleMenu: HTMLDivElement;
  ccButton: HTMLButtonElement;
  playbackRateDiv?: HTMLDivElement;
  isMuted?: boolean;
  resolutionMenu: HTMLDivElement;
  audioMenu: HTMLDivElement;
  retryButton: HTMLButtonElement;
  forwardRewindControlsWrapper: HTMLElement;
  progressBarContainer: HTMLDivElement;
  thumbnail: HTMLDivElement;
  thumbnailSeekingContainer: HTMLDivElement;
  chapterDisplay: HTMLDivElement;
  progressBar: any;
  currentCastSession: any;
  castMediaDuration: number | null;
  playPauseButton: HTMLButtonElement;
  bottomRightDiv: HTMLDivElement;
  resolutionMenuButton: HTMLButtonElement;
  subtitleContainer: HTMLDivElement;
  wasPausedBeforeSwitch: boolean;
  wasManuallyPaused: boolean;
  audioMenuButton: HTMLButtonElement;
  videoOverLay: HTMLDivElement;
  pipButton: HTMLButtonElement;
  fullScreenButton: HTMLButtonElement;
  fastForwardButton: HTMLButtonElement;
  rewindBackButton: HTMLButtonElement;
  forwardSeekOffset?: number | null;
  backwardSeekOffset?: number | null;
  parentVolumeDiv: HTMLDivElement;
  volumeButton: HTMLButtonElement;
  volumeiOSButton: HTMLButtonElement;
  volumeControl: HTMLInputElement;
  primaryColor?: string | null;
  loader: any;
  bottomCenterDiv?: HTMLDivElement;
  spacer: HTMLDivElement;
  playbackRateButton?: HTMLButtonElement | null;
  castButton?: HTMLButtonElement;
  titleElement?: HTMLDivElement | null;
  debugAttribute?: boolean | null;
  thumbnailUrlAttribute?: string | null;
  playbackId?: string | null;
  token?: string | null;
  defaultStreamType?: string | null;
  streamType?: string | null;
  defaultDuration?: string | null;
  loadStartTime?: number;
  parentLiveTitleContainer?: HTMLDivElement;
  liveStreamDisplay?: HTMLButtonElement;
  mutationObserver?: MutationObserver;
  mutedAttribute?: boolean;
  hasAutoPlayAttribute?: boolean;
  bufferedRange: any;
  accentColor?: string | null;
  isiOS?: boolean;
  thumbnailUrlFinal?: string | null;
  shadowRoot!: ShadowRoot;
  prevButton!: HTMLButtonElement;
  nextButton!: HTMLButtonElement;
  private playlistPanel!: HTMLDivElement;
  private playlistButton!: HTMLButtonElement;
  cartButton!: HTMLButtonElement;
  cartSidebar!: HTMLDivElement;
  isCartOpen: boolean = false;
  showPostPlayOverlay: boolean;
  cartGotoLink?: string;
  isSidebarHovered: boolean = false;
  private _initShoppableRequested: boolean = false;

  // Track whether a hotspot is currently visible in the player
  isHotspotVisible: boolean = false;
  // Shoppable data container (defaults to empty config and products)
  cartData: { productSidebarConfig: ShoppableSidebarConfig; products: any[] } =
    {
      productSidebarConfig: {},
      products: [],
    };
  // Pending waitTillPause timeout (so we can set/clear it reliably)
  hotspotPauseTimeout: ReturnType<typeof setTimeout> | null = null;

  updatePlaylistControlsVisibility!: () => void;
  hasAutoClosedSidebar = false;
  _lastActiveProductEl: HTMLDivElement | null = null;

  constructor() {
    super();

    this._readyState = 0;
    this.config = configHls;
    this.hls = new Hls(this.config);
    this.video = documentObject.createElement("video");
    this.resolutionFlagPause = false;
    this.isLoading = false;
    this.isOnline = navigator.onLine;
    this.userSelectedLevel = null;
    this.isBufferFlushed = false;
    this.isBuffering = false;
    this.pauseAfterLoading = false;
    this.resolutionSwitching = false;
    this.disabledAllCaptions = false;
    this.wasManuallyPaused = false;
    this.video.controls = false;
    this.progressBarVisible = false;
    this.isError = false;
    this.cache = new Map();
    this.initialPlayClick = false;
    this.defaultPlaybackRate = "1";
    this.lastClickedPlaybackRateButton = null;
    this.playbackRates = [];
    this.isInitialLoad = true;
    this.videoEnded = false;
    this.pausedOnCasting = false;
    this.currentCastSession = null;
    this.castMediaDuration = null;
    this.currentSubtitleTrackIndex = -1;
    this.chapters = [];
    this._src = null;
    this.isMuted = false;
    this.previousChapter = null;
    this.retryButtonVisible = false;
    hideDefaultSubtitlesStyles(this);
    this.showPostPlayOverlay = Boolean(
      this.cartData.productSidebarConfig?.showPostPlayOverlay ?? false
    );
    hlsListeners(this);
    this.wrapper = documentObject.createElement("div");
    this.wrapper.style.position = "relative";
    this.controlsContainer = documentObject.createElement("div");
    this.controlsContainer.className = "controlsContainer";
    this.leftControls = documentObject.createElement("div");
    this.leftControls.className = "leftControls";
    this.mobileControls = documentObject.createElement("div");
    this.mobileControls.className = "mobileControls";
    this.mobileControlButtonsBlock = documentObject.createElement("div");
    this.mobileControlButtonsBlock.className = "mobileControlsButtonsBlock";
    this.timeDisplay = documentObject.createElement("div");
    this.timeDisplay.className = "timeDisplay";
    this.subtitleMenu = documentObject.createElement("div");
    this.subtitleMenu.style.display = "none"; // Initially hide the subtitle menu
    this.ccButton = documentObject.createElement("button");
    this.ccButton.className = "ccButton";
    this.ccButton.innerHTML = CaptionIcon;

    this.castButton = documentObject.createElement("button");
    this.castButton.className = "castButton";

    subtileButtonClickHandler(this);

    this.retryButton = documentObject.createElement("button");
    this.retryButton.innerHTML = `<svg width="25%" height="25%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 6V2L7 7L12 12V8C15.31 8 18 10.69 18 14C18 17.31 15.31 20 12 20C8.69 20 6 17.31 6 14H4C4 18.42 7.58 22 12 22C16.42 22 20 18.42 20 14C20 9.58 16.42 6 12 6Z" fill="currentColor"/>
        </svg>`;
    this.retryButton.className = "retryButton";
    this.retryButton.style.position = "absolute";
    this.retryButton.style.top = "50%";
    this.retryButton.style.left = "50%";
    this.retryButton.style.transform = "translate(-50%, -50%)";
    this.retryButton.style.display = "none"; // Initially hide the retry button
    this.retryButton.style.background = "transparent";
    this.forwardRewindControlsWrapper = documentObject.createElement("div");
    this.forwardRewindControlsWrapper.className =
      "forwardRewindControlsWrapper";
    this.progressBarContainer = documentObject.createElement("div");
    this.progressBarContainer.className = "progressBarContainer";
    this.controlsContainer.appendChild(this.progressBarContainer);

    // Create a thumbnail Seeking div
    this.thumbnail = documentObject.createElement("div");
    this.thumbnail.className = "thumbnailSeeking";

    // Thumbnail seeking container
    this.thumbnailSeekingContainer = documentObject.createElement("div");
    this.thumbnailSeekingContainer.className = "thumbnailSeekingContainer";

    // create chapter Display element
    this.chapterDisplay = documentObject.createElement("div");
    this.chapterDisplay.className = "thumbnailChapterDisplay";

    // Create a seek bar
    this.progressBar = documentObject.createElement("input");
    this.progressBar.className = "progressBar";
    this.progressBar.type = "range";
    this.progressBar.min = "0";
    this.progressBar.value = "0";
    this.progressBar.step = "0.01";
    this.progressBarContainer.appendChild(this.progressBar);
    this.playPauseButton = documentObject.createElement("button");
    this.playPauseButton.style.zIndex = "1500"; // Higher than hotspot z-index (1200)
    this.playPauseButton.style.position = "absolute";
    this.playPauseButton.classList.add("initialPlayBigButton");
    this.playPauseButton.classList.add("initialplayPauseButtonStyle");
    this.bottomRightDiv = documentObject.createElement("div");
    this.bottomRightDiv.className = "bottomRightContainer";
    this.resolutionMenuButton = documentObject.createElement("button");
    this.resolutionMenuButton.innerHTML = ResolutionIcon;
    this.resolutionMenuButton.className = "resolutionMenuButton";
    this.resolutionMenuButton.style.zIndex = "2px";
    this.bottomRightDiv.appendChild(this.resolutionMenuButton);
    this.resolutionMenu = documentObject.createElement("div");
    this.resolutionMenu.classList.add("resolution-menu");
    this.resolutionMenu.style.display = "none"; // Hide the menu by default
    this.bottomRightDiv.appendChild(this.resolutionMenu);
    this.video.textTracks.addEventListener(
      "addtrack",
      (event: { track: any }) => {
        const track = event.track;
        if (track.kind === "subtitles" || track.kind === "captions") {
          track.mode = "hidden"; // Hide default subtitles

          track.addEventListener("cuechange", () => {
            if (track.activeCues && track.activeCues.length > 0) {
              const cue = track.activeCues[0];
              if (cue && this.initialPlayClick) {
                this.subtitleContainer.innerHTML = cue.text;
                this.subtitleContainer.classList.add("contained");
              } else {
                this.subtitleContainer.innerHTML = "";
                this.subtitleContainer.classList.remove("contained");
              }
            } else {
              this.subtitleContainer.innerHTML = "";
              this.subtitleContainer.classList.remove("contained");
            }
          });
        }
      }
    );

    this.wasPausedBeforeSwitch = false;
    handleHlsQualityAndTrackSetup(this);
    this.audioMenuButton = documentObject.createElement("button");
    this.audioMenuButton.innerHTML = AudioIcon;
    this.audioMenuButton.className = "audioMenuButton";
    this.audioMenuButton.id = "audioMenuButton";
    this.audioMenuButton.style.zIndex = "2px";
    this.audioMenu = documentObject.createElement("div");
    this.audioMenu.style.display = "none";
    this.audioMenu.classList.add("audio-menu");

    this.bottomRightDiv.appendChild(this.audioMenuButton);
    this.audioMenuButton.appendChild(this.audioMenu);

    audioButtonClickHandler(this);

    this.subtitleContainer = documentObject.createElement("div");
    this.subtitleContainer.id = "subtitleContainer";
    this.subtitleContainer.classList.add("subtitle-container");
    this.videoOverLay = documentObject.createElement("div");
    this.videoOverLay.className = "video-overlay";
    this.wrapper.appendChild(this.video);
    this.wrapper.appendChild(this.videoOverLay);
    this.pipButton = documentObject.createElement("button");
    this.pipButton.className = "pipButton";
    this.pipButton.innerHTML = PipIcon;
    this.fullScreenButton = documentObject.createElement("button");
    this.fullScreenButton.className = "fullScreenButton";
    this.fullScreenButton.innerHTML = EnterFullScreenIcon; //may include svg in future
    this.fastForwardButton = documentObject.createElement("button");
    this.fastForwardButton.innerHTML = FastForwardIcon;
    this.fastForwardButton.id = "increaseTimeBtn";
    this.fastForwardButton.className = "increaseTimeBtn";
    this.rewindBackButton = documentObject.createElement("button");
    this.rewindBackButton.innerHTML = RewindIcon;
    this.rewindBackButton.id = "decreaseTimeBtn";
    this.rewindBackButton.className = "decreaseTimeBtn";
    fullScreenButtonClickHandler(this);
    this.playPauseButton.innerHTML = PlayIcon;
    this.parentVolumeDiv = documentObject.createElement("div");
    this.parentVolumeDiv.className = "parentVolumeDiv";
    this.parentVolumeDiv.style.zIndex = "1";
    this.volumeButton = documentObject.createElement("button");
    this.volumeButton.className = "volumeButton";
    this.volumeButton.innerHTML = VolumeHighIcon;
    this.volumeButton.style.display = "none"; // Assuming you're using Font Awesome for icon
    this.volumeiOSButton = documentObject.createElement("button");
    this.volumeiOSButton.className = "volumeiOSButton";
    VolumeButtonClickHandler(this);
    this.volumeControl = documentObject.createElement("input");
    this.volumeControl.className = "volumeControl";
    this.volumeControl.type = "range";
    this.volumeControl.min = "0";
    this.volumeControl.max = "1";
    this.volumeControl.step = "0.2";
    this.volumeControl.value = "1";
    this.volumeControl.style.display = "none";
    if ("appearance" in this.volumeControl.style) {
      this.volumeControl.style.appearance = "none";
    }

    this.volumeControl.style.borderRadius = "0.313rem";

    //Picture-in-picture button click handler
    pipButtonClickHandler(this);

    document.addEventListener("fullscreenchange", () => {
      const isFullScreen = !!document.fullscreenElement;
      this.fullScreenButton.innerHTML = isFullScreen
        ? ExitFullScreenIcon
        : EnterFullScreenIcon;
    });

    this.loader = documentObject.createElement("div");
    this.loader.className = "spinner";
    this.loader.style.position = "absolute";
    this.loader.style.bottom = "50%";
    this.loader.style.left = "50%";
    this.loader.style.marginLeft = "-20px";
    this.loader.style.marginTop = "-20px";
    this.loader.style.display = "none";
    this.bottomCenterDiv = documentObject.createElement("div");
    this.bottomCenterDiv.className = "bottomCenterDiv";
    this.spacer = documentObject.createElement("div");
    this.spacer.className = "spacer";
    this.wrapper.className = "parent";
    this.controlsContainer.appendChild(this.leftControls);
    this.controlsContainer.appendChild(this.bottomCenterDiv);
    this.controlsContainer.appendChild(this.playPauseButton);
    this.controlsContainer.appendChild(this.bottomRightDiv);
    this.wrapper.appendChild(this.loader);
    this.wrapper.appendChild(this.controlsContainer);

    this.wrapper.appendChild(this.subtitleContainer);

    this.cartButton = documentObject.createElement("button");
    this.cartButton.className = "cartButton";
    this.cartButton.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24"><path d="M7 18c-1.104 0-2 .896-2 2s.896 2 2 2 2-.896 2-2-.896-2-2-2zm10 0c-1.104 0-2 .896-2 2s.896 2 2 2 2-.896 2-2-.896-2-2-2zM7.334 16h9.332c.822 0 1.542-.502 1.847-1.264l3.479-8.12A1 1 0 0 0 21 5H5.21l-.94-2.342A1 1 0 0 0 3.333 2H1a1 1 0 1 0 0 2h1.333l3.6 8.982-1.35 2.44C3.52 16.14 4.477 18 6 18h12a1 1 0 1 0 0-2H7.334z"/></svg>`;
    this.cartButton.style.position = "absolute";
    this.cartButton.style.top = "16px";
    this.cartButton.style.right = "16px";
    this.cartButton.style.zIndex = "1600";
    this.cartButton.style.background = "#fff";
    this.cartButton.style.borderRadius = "50%";
    this.cartButton.style.boxShadow = "0 2px 8px rgba(0,0,0,0.10)";
    this.cartButton.style.width = "40px";
    this.cartButton.style.height = "40px";
    this.cartButton.style.display = "flex";
    this.cartButton.style.alignItems = "center";
    this.cartButton.style.justifyContent = "center";
    this.cartButton.style.border = "none";
    this.cartButton.style.cursor = "pointer";
    this.cartButton.style.opacity = "0.6";
    this.cartGotoLink = this.getAttribute("product-link") || undefined;
    this.cartButton.onclick = (e) => {
      e.stopPropagation();
      if (this.getAttribute("theme") === "shoppable-shorts") {
        const goto = this.cartGotoLink || "https://www.fastpix.io";
        window.open(goto, "_blank", "noopener,noreferrer");
        return;
      }
      if (this.getAttribute("theme") === "shoppable-video-player") {
        if (this.isCartOpen) {
          this.closeCartSidebar();
        } else {
          this.openCartSidebar();
        }
      }
    };
  }
  get readyState() {
    return this._readyState;
  }

  get currentTime() {
    let x = this.video ? this.video.currentTime : 0;
    return x;
  }

  get buffered() {
    let buffered = this.video ? this.video.buffered : 0;
    return buffered;
  }

  get duration() {
    let duration = this.video ? this.video.duration : 0;
    return duration;
  }

  get paused() {
    return this.video ? this.video.paused : true;
  }

  get ended() {
    return this.video ? this.video.ended : false;
  }

  get volume() {
    return this.video ? this.video.volume : 1.0;
  }

  get muted() {
    return this.video ? this.video.muted : false;
  }

  get seeking() {
    return this.video ? this.video.seeking : false;
  }

  get src() {
    return this._src;
  }

  set src(value: string | null) {
    this._src = value;
    if (this.video) {
      this.video.src = (value as string) || "";
    }
  }

  get currentSrc() {
    return this.src ?? "Default src";
  }

  get networkState() {
    return this.video ? this.video.networkState : 0;
  }

  get error() {
    return this.video ? this.video.error : null;
  }

  get videoWidth() {
    const videoWidth = this.video.offsetWidth;
    return this.video ? videoWidth : 0;
  }

  get videoHeight() {
    const videoHeight = this.video.offsetHeight;
    return this.video ? videoHeight : 0;
  }

  get playbackRate() {
    return this.video ? this.video.playbackRate : 1.0;
  }

  get controls() {
    return this.video ? this.video.controls : false;
  }

  get poster() {
    return this.video ? this.video.poster : "";
  }

  get autoplay() {
    const autoPlay = this.hasAttribute("auto-play");
    return this.video ? autoPlay : false;
  }

  get loop() {
    const loop = this.hasAttribute("loop");
    return this.video ? loop : false;
  }

  addChapters(chapters: any[]) {
    chapters.sort(
      (a: { startTime: number }, b: { startTime: number }) =>
        a.startTime - b.startTime
    );

    chapters.forEach((chapter: { endTime: undefined }, index: number) => {
      chapter.endTime ??=
        index < chapters.length - 1
          ? chapters[index + 1].startTime
          : this.video.duration;
    });

    this.chapters = chapters;
    updateChapterMarkers(this);
  }

  /**
   * Public API: Receive shoppable video data (like addChapters but for products).
   * This merges config with existing defaults and replaces products when provided.
   * It updates internal flags, repopulates the sidebar if it exists, and emits an event.
   */
  public addShoppableData(shoppable: {
    productSidebarConfig?: ShoppableSidebarConfig | null;
    products?: any[] | null;
  }) {
    if (!shoppable || typeof shoppable !== "object") {
      console.warn("addShoppableData: invalid payload");
      return;
    }

    // Merge config without overriding unspecified keys
    const nextConfig: ShoppableSidebarConfig = {
      ...(this.cartData?.productSidebarConfig ?? {}),
      ...(shoppable.productSidebarConfig ?? {}),
    };

    // Replace products only if provided
    const nextProducts = Array.isArray(shoppable.products)
      ? shoppable.products
      : (this.cartData?.products ?? []);

    this.cartData = {
      productSidebarConfig: nextConfig,
      products: nextProducts,
    } as { productSidebarConfig: ShoppableSidebarConfig; products: any[] };

    // Update flags driven by config
    this.showPostPlayOverlay = Boolean(
      this.cartData.productSidebarConfig?.showPostPlayOverlay
    );

    // Initialize shoppable UI if appropriate and not yet initialized
    const theme = this.getAttribute ? this.getAttribute("theme") : null;
    if (
      (theme === "shoppable-video-player" || theme === "shoppable-shorts") &&
      !this._initShoppableRequested
    ) {
      initializeShoppable(this);
    }

    // Refresh UI (non-destructive): repopulate products list if sidebar exists
    if (this.cartSidebar) {
      populateSidebarProducts(this);
    }

    // Notify listeners (analytics/integrators)
    this.dispatchEvent(
      new CustomEvent("shoppabledatachange", { detail: this.cartData })
    );
  }

  activeChapter() {
    const currentTime = this.video.currentTime;
    const activeChapter = this.chapters.find(
      (chapter: { startTime: number; endTime: any }) => {
        return (
          currentTime >= chapter.startTime &&
          currentTime < (chapter.endTime ?? Infinity)
        );
      }
    );

    const chapterInfo = activeChapter
      ? {
          startTime: activeChapter.startTime,
          endTime: activeChapter.endTime,
          value: activeChapter.value,
        }
      : null;

    if (
      (!this.previousChapter && chapterInfo) ||
      (this.previousChapter &&
        chapterInfo &&
        (this.previousChapter.startTime !== chapterInfo.startTime ||
          this.previousChapter.endTime !== chapterInfo.endTime ||
          this.previousChapter.value !== chapterInfo.value))
    ) {
      this.previousChapter = chapterInfo;
      this.dispatchEvent(new Event("chapterchange"));
    }

    return chapterInfo;
  }

  convertChaptersToPlayerFormat(chaptersObj: any): [] {
    // Helper to convert HH:MM:SS to seconds
    function timeToSeconds(timeStr: string): number {
      const [h, m, s] = timeStr.split(":").map(Number);
      return h * 3600 + m * 60 + s;
    }

    return chaptersObj.chapters.map((chapter: any) => {
      const startTime = timeToSeconds(chapter.startTime);
      const endTime = chapter.endTime
        ? timeToSeconds(chapter.endTime)
        : undefined;
      return {
        startTime,
        endTime,
        value: chapter.title,
        summary: chapter.summary,
      };
    });
  }

  convertOpenAIChapters(openAIChapters: any[]) {
    return openAIChapters.map((chapter: { start: string; title: any }) => {
      const timeParts = chapter.start.split(":");
      const startTime =
        parseInt(timeParts[0]) * 3600 +
        parseInt(timeParts[1]) * 60 +
        parseInt(timeParts[2]);
      return {
        startTime: startTime,
        value: chapter.title,
      };
    });
  }

  /**
   * Add a playlist JSON array (each item must have playbackId)
   */
  addPlaylist(playlistJson: any[]) {
    if (!Array.isArray(playlistJson)) return console.warn("Invalid playlist");
    this.playlist = playlistJson;
    this.currentIndex = 0;
    if (typeof this.updatePlaylistControlsVisibility === "function") {
      this.updatePlaylistControlsVisibility();
    }
    // ✅ Use setProperty to hide or reset playPauseButton visibility
    if (this.playPauseButton) {
      if (this.playlist.length > 0) {
        this.playPauseButton.style.setProperty("display", "flex");
      } else {
        this.playPauseButton.style.setProperty(
          "display",
          "var(--initial-play-button, flex)"
        );
      }
    }
    const current = this.playlist[this.currentIndex];
    if (current?.playbackId) {
      this.loadByPlaybackId(current.playbackId);
    }
  }

  /**
   * Go to the next video in the playlist
   */
  next() {
    if (this.currentIndex < this.playlist.length - 1) {
      this.currentIndex++;
      const nextItem = this.playlist[this.currentIndex];
      if (nextItem?.playbackId) {
        this.loadByPlaybackId(nextItem.playbackId);
      }
    } else {
      console.info("End of playlist");
    }
    this.hasAutoClosedSidebar = false;
  }

  /**
   * Go to the previous video in the playlist
   */
  previous() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      const prevItem = this.playlist[this.currentIndex];
      if (prevItem?.playbackId) {
        this.loadByPlaybackId(prevItem.playbackId);
      }
    } else {
      console.info("Start of playlist");
    }
    this.hasAutoClosedSidebar = false;
  }

  /**
   * Load video by new playbackId (without reloading page)
   */
  async loadByPlaybackId(playbackId: string) {
    this.playbackId = playbackId;

    const customDomain = this.getAttribute("custom-domain");
    let playbackUrlFinal: string | null = null;
    const isSupportedStream =
      this.streamType === "on-demand" || this.streamType === "live-stream";
    if (isSupportedStream) {
      playbackUrlFinal = customDomain
        ? `https://${customDomain}`
        : "https://stream.fastpix.io";
    }

    if (this.drmToken) {
      DrmSetup(this);
    }

    await setStreamUrl(
      this,
      playbackId,
      this.token ?? null,
      playbackUrlFinal ?? undefined,
      this.streamType ?? null
    );

    this._src = getSRC();

    this.video.src = this._src ?? "";
    this.video.load();
    this.video.addEventListener(
      "canplay",
      () => {
        toggleVideoPlayback(
          this,
          this.playbackId ?? "",
          this.thumbnailUrlFinal ?? "",
          this.streamType ?? ""
        );
      },
      { once: true }
    );

    // After load
    this.dispatchEvent(
      new CustomEvent("playbackidchange", {
        detail: { playbackId },
      })
    );
  }

  /**
   * Select and load an episode by playbackId (for external use)
   */
  public selectEpisodeByPlaybackId(playbackId: string) {
    const index = this.playlist.findIndex(
      (item) => item.playbackId === playbackId
    );
    if (index !== -1) {
      this.currentIndex = index; // 🧠 update the internal pointer
      this.loadByPlaybackId(playbackId);
    } else {
      console.warn("PlaybackId not found in current playlist");
    }
    this.hasAutoClosedSidebar = false;
  }

  handleVideoEvent(event: { type: string }) {
    this.dispatchEvent(
      new CustomEvent(event.type, {
        detail: event,
        bubbles: true,
        composed: true,
      })
    );
  }

  onFragmentParsed(data: { frag: { sn: any; level: any } }) {
    if (data.frag && this.debugAttribute) {
      console.log(
        `Parsed fragment details: ${data.frag.sn}, level: ${data.frag.level}`
      );
    }
  }

  connectedCallback() {
    const customDomain = this.getAttribute("custom-domain");

    receiveAttributes(this);

    // style
    this.customStyle = documentObject.createElement("style");
    this.customStyle.innerHTML = skeleton;

    updateTimeDisplay(this);

    fastForwardRewindButtonClickHandler(this);

    // setup playback stream
    const setupStream = async () => {
      let playbackUrlFinal: string | null = null; // Ensuring proper type
      if (
        this.streamType === "on-demand" ||
        this.streamType === "live-stream"
      ) {
        playbackUrlFinal = customDomain
          ? `https://${customDomain}`
          : "https://stream.fastpix.io";
      }

      let isDrm = false;

      if (this.drmToken) {
        isDrm = true;
      }

      if (isDrm) {
        DrmSetup(this);
      }

      await setStreamUrl(
        this,
        this.playbackId ?? null, // Ensure it's either a string or null
        this.token ?? null, // Ensure it's either a string or null
        playbackUrlFinal ?? undefined, // Explicitly allow undefined
        this.streamType ?? null // Ensure it's either a string or null
      );
      this._src = getSRC();
      const isSafari = /^((?!chrome|android).)*safari/i.test(
        navigator.userAgent
      );
      if (!isSafari) {
        loadCastAPI();
        if (this.castButton?.innerHTML?.trim()) {
          setupChromecast(this.castButton, this.video, this._src ?? "", this); // Initialize Chromecast functionality
        }
      }
    };

    // initialize stream based on lazy loading enabled
    initializeLazyLoadStream(this, setupStream);

    // Iterate through each event in the `videoEvents` array
    videoEvents.forEach((event: any) => {
      // Add an event listener to the video element for the current event
      // Bind `this` to ensure that the `handleVideoEvent` method retains
      // the correct context of the class instance when the event is triggered
      this.video.addEventListener(event, this.handleVideoEvent.bind(this));
    });

    videoListeners(this);
    hlsListeners(this);
    updateTimeDisplay(this);
    WindowEvents(this);
    configureForiOS(this);
    fullScreenChangeHandler(this);

    this.playPauseButton.addEventListener("click", (e) => {
      e.stopImmediatePropagation(); // Prevent other handlers from blocking
      this.videoEnded = false;
      hideMenus(this);
      toggleVideoPlayback(
        this,
        this.playbackId ?? "",
        this.thumbnailUrlFinal ?? "",
        this.streamType ?? ""
      );
    });

    // Add a global click handler to ensure play/pause button always works
    this.wrapper.addEventListener(
      "click",
      (e) => {
        // If clicking on play/pause button, ensure it takes priority
        if (
          e.target === this.playPauseButton ||
          this.playPauseButton.contains(e.target as Node)
        ) {
          e.stopImmediatePropagation();
          this.videoEnded = false;
          hideMenus(this);
          toggleVideoPlayback(
            this,
            this.playbackId ?? "",
            this.thumbnailUrlFinal ?? "",
            this.streamType ?? ""
          );
        }
      },
      true
    ); // Use capture phase to handle before other handlers

    const width = "100%";
    const height = "100%";
    this.loadStartTime = performance.now();

    if (this.hasAttribute("autoplay-shorts")) {
      this.video.load();
      this.video.addEventListener(
        "canplay",
        () => {
          toggleVideoPlayback(
            this,
            this.playbackId ?? "",
            this.thumbnailUrlFinal ?? "",
            this.streamType ?? ""
          );
        },
        { once: true }
      );
    }

    if (this.playbackRatesAttribute !== null) {
      const parsedPlaybackRates = this.playbackRatesAttribute
        .split(" ")
        .map((rate: string) => parseFloat(rate));

      const uniquePlaybackRates = [...new Set(parsedPlaybackRates)];
      this.playbackRates.splice(
        0,
        this.playbackRates.length,
        ...uniquePlaybackRates
      );
    } else {
      this.playbackRates = [1, 1.2, 1.5, 1.7, 2];
    }

    this.playbackRateDiv = documentObject.createElement("div");
    this.playbackRateDiv.className = "playbackRate-menu";
    this.playbackRateDiv.style.display = "none";

    const defaultRate = parseAndSetDefaultPlaybackRate(
      this.defaultPlaybackRateAttribute
    );
    if (defaultRate) {
      this.defaultPlaybackRate = defaultRate;
    }

    this.playbackRates.forEach((rate: any) => {
      const button = documentObject.createElement("button");
      button.style.padding = "5px 6px";
      button.textContent = `${rate}x`;
      button.title = `${rate}x`;
      button.className = "playbackRateButton";
      button.addEventListener("click", () => {
        setPlaybackRate(this, rate, button);
      });

      this.playbackRateDiv?.appendChild(button);
    });

    this.playbackRateButton = documentObject.createElement("button");
    this.playbackRateButton.textContent = `${this.defaultPlaybackRate}x`;
    this.playbackRateButton.className = "playbackRateButtonInitial";

    this.playlistButton = documentObject.createElement("button");
    this.playlistButton.innerHTML = PlaylistIcon;
    this.playlistButton.className = "playlistButton";

    // player.ts or inside connectedCallback/render
    this.playlistPanel = document.createElement("div");
    this.playlistPanel.className = "playlist-panel";
    this.playlistPanel.style.maxHeight = "400px";
    this.playlistPanel.style.display = "none"; // Initially hidden

    // Create the header
    const header = document.createElement("div");
    header.className = "playlist-header";
    header.textContent = "Episode List";

    // Create the scrollable wrapper for playlist items
    this.playlistItems = document.createElement("div");
    this.playlistItems.className = "playlist-items-wrapper";

    // Append header and scrollable list to panel
    this.playlistPanel.appendChild(header);

    // Add your styles (example in CSS section below)
    this.playlistButton?.appendChild(this.playlistPanel); // or this.appendChild if not shadow DOM

    // playbackRateButton click handler
    playbackRateButtonClickHandler(this);

    this.bottomRightDiv.appendChild(this.playlistButton);
    this.bottomRightDiv.appendChild(this.ccButton);
    this.bottomRightDiv.appendChild(this.playbackRateButton);
    if (this.castButton?.innerHTML?.trim()) {
      this.bottomRightDiv.appendChild(this.castButton);
    }
    this.bottomRightDiv.appendChild(this.pipButton);
    this.bottomRightDiv.appendChild(this.fullScreenButton);
    this.bottomRightDiv.appendChild(this.subtitleMenu);
    this.bottomRightDiv.appendChild(this.playbackRateDiv);

    playlistButtonClickHandler(this);

    // start-time attribute
    const startTime = parseFloat(this.startTimeAttribute) || 0;
    this.video.currentTime = startTime;

    this.wrapper.style.width = width;
    this.wrapper.style.height = height;
    this.wrapper.style.position = "relative";
    this.video.style.display = "flex";
    this.video.style.alignItems = "center";
    this.video.style.justifyContent = "center";

    // customize thumbnail, poster and placeholder
    customizeThumbnail(this);

    // Create a parent container for the title and live tag
    this.parentLiveTitleContainer = documentObject.createElement("div");
    this.parentLiveTitleContainer.className = "parentTextContainer";
    this.titleElement = documentObject.createElement("div");
    this.liveStreamDisplay = documentObject.createElement("button");

    // handle parent live title container
    handleTitleContainer(this);

    this.controlsContainer.appendChild(this.parentLiveTitleContainer);

    // data
    initializeAnalytics(this, this.video, this.hls, Hls);

    if (this.loopAttribute === "true") {
      this.video.loop = true;
    } else {
      this.video.loop = false;
    }

    this.bufferedRange = documentObject.createElement("div");
    this.bufferedRange.style.position = "absolute";
    this.bufferedRange.style.top = "0";
    this.bufferedRange.style.left = "0";
    this.bufferedRange.style.height = "100%";
    this.bufferedRange.style.width = "0";

    this.progressBar.appendChild(this.bufferedRange);
    this.parentVolumeDiv.appendChild(this.volumeButton);
    this.parentVolumeDiv.appendChild(this.volumeControl);

    // user interactions
    KeyBoardInputManager(this);

    // restore volume settings
    restoreVolumeSettings(this);
    // initialize playlist controls via helper (uses context instead of this)
    initPlaylistControls(this);
    PlaylistNextButtonClickHandler(this);
    PlaylistPrevButtonClickHandler(this);

    // Initialize shoppable UI if theme is set
    const theme = this.getAttribute ? this.getAttribute("theme") : null;
    if (theme === "shoppable-video-player" || theme === "shoppable-shorts") {
      initializeShoppable(this);

      // Ensure cart button is visible for shoppable-shorts
      if (theme === "shoppable-shorts") {
        setTimeout(() => {
          this.ensureShoppableShortsCartButton();
        }, 100);
      }
    }
  }

  disconnectedCallback() {
    this.wrapper.removeChild(this.video);
    this.hls?.destroy();
  }

  static get observedAttributes() {
    return ["theme"];
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null
  ) {
    if (
      name === "theme" &&
      newValue &&
      (newValue === "shoppable-video-player" || newValue === "shoppable-shorts")
    ) {
      // Re-initialize shoppable when theme changes
      this._initShoppableRequested = false;
      initializeShoppable(this);
    }
  }

  // Helper methods
  openCartSidebar = () => {
    // Close any open menus before opening the cart sidebar
    try {
      if (
        this.playbackRateDiv &&
        this.playbackRateDiv.style?.display !== "none"
      ) {
        this.playbackRateDiv.style.display = "none";
      }
      if (
        this.resolutionMenu &&
        this.resolutionMenu.style?.display !== "none"
      ) {
        this.resolutionMenu.style.display = "none";
      }
      if (this.subtitleMenu && this.subtitleMenu.style?.display !== "none") {
        this.subtitleMenu.style.display = "none";
      }
      if (this.audioMenu && this.audioMenu.style?.display !== "none") {
        this.audioMenu.style.display = "none";
      }
    } catch (e) {
      console.error("Failed to open cart sidebar:", e);
    }
    if (!this.cartSidebar) return;
    this.cartSidebar.style.display = "flex";
    const _ = this.cartSidebar.offsetWidth;
    this.cartSidebar.style.width = "var(--shoppable-sidebar-width)";
    this.isCartOpen = true;
    this.cartButton.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24"><path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.89 4.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z"/></svg>`;
    this.progressBar.classList.add("cartSidebarOpen-progress-bar");
    this.bottomRightDiv.classList.add("cartSidebarOpen-bottom-right-div");
    this.dispatchEvent(
      new CustomEvent("productBarMax", { detail: { opened: true } })
    );
    resizeVideoWidth(this); // re-apply visibility
  };

  closeCartSidebar = () => {
    this.cartSidebar.style.width = "0";
    this.cartSidebar.style.display = "none";
    this.isCartOpen = false;
    this.cartButton.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24"><path d="M7 18c-1.104 0-2 .896-2 2s.896 2 2 2 2-.896 2-2-.896-2-2-2zm10 0c-1.104 0-2 .896-2 2s.896 2 2 2 2-.896 2-2-.896-2-2-2zM7.334 16h9.332c.822 0 1.542-.502 1.847-1.264l3.479-8.12A1 1 0 0 0 21 5H5.21l-.94-2.342A1 1 0 0 0 3.333 2H1a1 1 0 1 0 0 2h1.333l3.6 8.982-1.35 2.44C3.52 16.14 4.477 18 6 18h12a1 1 0 1 0 0-2H7.334z"/></svg>`;
    this.progressBar.classList.remove("cartSidebarOpen-progress-bar");
    this.bottomRightDiv.classList.remove("cartSidebarOpen-bottom-right-div");

    // Clear the right property when sidebar is closed
    if (this.bottomRightDiv) {
      this.bottomRightDiv.style.right = "";
    }

    this.dispatchEvent(
      new CustomEvent("productBarMin", { detail: { opened: false } })
    );
    resizeVideoWidth(this); // restore time/volume
  };

  // Debug method to force show cart button
  showCartButton = () => {
    if (this.cartButton) {
      this.cartButton.style.display = "flex";
      this.cartButton.style.visibility = "visible";
      this.cartButton.style.opacity = "1";
    }
  };

  // Method to ensure cart button is visible for shoppable-shorts
  ensureShoppableShortsCartButton = () => {
    const theme = this.getAttribute ? this.getAttribute("theme") : null;
    if (theme === "shoppable-shorts" && this.cartButton) {
      this.cartButton.style.display = "flex";
      this.cartButton.style.visibility = "visible";
      this.cartButton.style.opacity = "1";
      this.cartButton.style.position = "absolute";
      this.cartButton.style.top = "16px";
      this.cartButton.style.right = "16px";
      this.cartButton.style.zIndex = "1600";
    }
  };

  // Ensure hotspot never exceeds player bounds even if marker >100% or <0%
  positionHotspot(
    spot: HTMLDivElement,
    xPercent: number,
    yPercent: number,
    container?: HTMLElement
  ) {
    const ref = container ?? this.wrapper;
    const wrapperWidth = ref?.clientWidth || ref?.offsetWidth || 0;
    const wrapperHeight = ref?.clientHeight || ref?.offsetHeight || 0;
    const spotWidth = 32;
    const spotHeight = 32;

    // Clamp incoming percentages to [0, 100]
    const safeX = Math.min(Math.max(Number(xPercent) || 0, 0), 100);
    const safeY = Math.min(Math.max(Number(yPercent) || 0, 0), 100);

    // If we can't measure, clamp percent and use %
    if (!wrapperWidth || !wrapperHeight) {
      spot.style.left = `${safeX}%`;
      spot.style.top = `${safeY}%`;
      return;
    }

    // Calculate the center position of the hotspot
    const centerX = (safeX / 100) * wrapperWidth;
    const centerY = (safeY / 100) * wrapperHeight;

    // Calculate the top-left position by subtracting half the spot dimensions
    const left = centerX - spotWidth / 2;
    const top = centerY - spotHeight / 2;

    // Clamp to ensure the hotspot stays within bounds
    const clampedLeft = Math.max(
      0,
      Math.min(wrapperWidth - spotWidth, Math.round(left))
    );
    const clampedTop = Math.max(
      0,
      Math.min(wrapperHeight - spotHeight, Math.round(top))
    );

    spot.style.left = `${clampedLeft}px`;
    spot.style.top = `${clampedTop}px`;
  }

  // Helpers to reduce nesting
  private removeAllHotspots(): void {
    try {
      this.wrapper?.querySelectorAll(".hotspot").forEach((el) => el.remove());
      this.isHotspotVisible = false;
    } catch (e) {
      console.error("Failed to remove all hotspots:", e);
    }
  }

  private buildHotspot(
    marker: any,
    productName: string,
    zIndex: string = "1200"
  ): HTMLDivElement {
    const spot = documentObject.createElement("div");
    spot.className = "hotspot";
    spot.style.position = "absolute";
    spot.style.width = "32px";
    spot.style.height = "32px";
    spot.style.cursor = "pointer";
    spot.style.zIndex = zIndex;

    // Store the original percentage values for repositioning during resize
    spot.dataset.xPercent = String(marker.x);
    spot.dataset.yPercent = String(marker.y);

    this.positionHotspot(spot, Number(marker.x), Number(marker.y));
    const dot = documentObject.createElement("div");
    dot.className = "hotspot-dot";
    spot.appendChild(dot);
    const tooltip = documentObject.createElement("div");
    tooltip.className = "hotspot-tooltip";
    tooltip.innerText = String(productName ?? "")
      .replace(/\s+/g, " ")
      .trim();
    tooltip.style.position = "absolute";
    tooltip.style.whiteSpace = "nowrap";
    tooltip.style.background = "#222";
    tooltip.style.color = "#fff";
    tooltip.style.padding = "6px 12px";
    tooltip.style.borderRadius = "6px";
    tooltip.style.fontSize = "0.95em";
    tooltip.style.pointerEvents = "none";
    tooltip.style.opacity = "0";
    tooltip.style.transition = "opacity 0.2s";
    switch (marker?.tooltipPosition) {
      case "left":
        tooltip.style.right = "110%";
        tooltip.style.top = "50%";
        tooltip.style.transform = "translateY(-50%)";
        break;
      case "right":
        tooltip.style.left = "110%";
        tooltip.style.top = "50%";
        tooltip.style.transform = "translateY(-50%)";
        break;
      case "top":
        tooltip.style.left = "50%";
        tooltip.style.bottom = "110%";
        tooltip.style.transform = "translateX(-50%)";
        break;
      case "bottom":
      default:
        tooltip.style.left = "50%";
        tooltip.style.top = "110%";
        tooltip.style.transform = "translateX(-50%)";
        break;
    }
    spot.appendChild(tooltip);
    spot.onmouseenter = () => (tooltip.style.opacity = "1");
    spot.onmouseleave = () => (tooltip.style.opacity = "0");
    return spot;
  }
}

if (!windowObject.customElements.get("fastpix-player")) {
  windowObject.customElements.define("fastpix-player", FastPixPlayer);
}
