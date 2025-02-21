import { videoListeners } from "./utils/VideoListeners";
import { KeyBoardInputManager } from "./utils/KeyboardHandler";
import { toggleVideoPlayback } from "./utils/ToggleController";
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
  cache: Map<string, unknown>;
  initialPlayClick: boolean;
  isInitialLoad: boolean;
  videoEnded: boolean;
  currentSubtitleTrackIndex: number;
  chapters: any;
  _src: string | null;
  previousChapter: any;
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
  resolutionMenu: HTMLDivElement;
  audioMenu: HTMLDivElement;
  retryButton: HTMLButtonElement;
  forwardRewindControlsWrapper: HTMLElement;
  progressBarContainer: HTMLDivElement;
  thumbnail: HTMLDivElement;
  thumbnailSeekingContainer: HTMLDivElement;
  chapterDisplay: HTMLDivElement;
  progressBar: any;
  playPauseButton: HTMLButtonElement;
  bottomRightDiv: HTMLDivElement;
  resolutionMenuButton: HTMLButtonElement;
  subtitleContainer: HTMLDivElement;
  wasPausedBeforeSwitch: boolean;
  audioMenuButton: HTMLButtonElement;
  videoOverLay: HTMLDivElement;
  pipButton: HTMLButtonElement;
  fullScreenButton: HTMLButtonElement;
  fastForwardButton: HTMLButtonElement;
  rewindBackButton: HTMLButtonElement;
  forwardSeekOffset?: number | null;
  backwardSeekOffset?: number;
  parentVolumeDiv: HTMLDivElement;
  volumeButton: HTMLButtonElement;
  volumeiOSButton: HTMLButtonElement;
  volumeControl: HTMLInputElement;
  primaryColor?: string | null;
  loader: any;
  bottomCenterDiv?: HTMLDivElement;
  spacer: HTMLDivElement;
  playbackRateButton?: HTMLButtonElement | null;
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

  constructor() {
    super();

    this._readyState = 0;
    this.hls = new Hls(configHls);
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
    this.video.controls = false;
    this.progressBarVisible = false;
    this.cache = new Map();
    this.initialPlayClick = false;
    this.defaultPlaybackRate = "1";
    this.lastClickedPlaybackRateButton = null;
    this.playbackRates = [];
    this.isInitialLoad = true;
    this.videoEnded = false;
    this.currentSubtitleTrackIndex = -1;
    this.chapters = [];
    this._src = null;
    this.previousChapter = null;
    this.retryButtonVisible = false;
    hideDefaultSubtitlesStyles(this);
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
    this.playPauseButton.style.zIndex = "9";
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
    this.volumeControl.step = "0.1";
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
      if (chapter.endTime === undefined) {
        chapter.endTime =
          index < chapters.length - 1
            ? chapters[index + 1].startTime
            : this.video.duration;
      }
    });

    this.chapters = chapters;
    updateChapterMarkers(this);
  }

  activeChapter() {
    const currentTime = this.video.currentTime;
    const activeChapter = this.chapters.find(
      (chapter: { startTime: number; endTime: any }) => {
        return (
          currentTime >= chapter.startTime &&
          currentTime < (chapter.endTime || Infinity)
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

      await setStreamUrl(
        this,
        this.playbackId ?? null, // Ensure it's either a string or null
        this.token ?? null, // Ensure it's either a string or null
        playbackUrlFinal ?? undefined, // Explicitly allow undefined
        this.streamType ?? null // Ensure it's either a string or null
      );
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

    this.playPauseButton.addEventListener("click", () => {
      this.videoEnded = false;
      hideMenus(this);
      toggleVideoPlayback(
        this,
        this.playbackId,
        this.thumbnailUrlFinal,
        this.streamType
      );
    });

    const width = "100%";
    const height = "100%";
    this.loadStartTime = performance.now();

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

    // playbackRateButton click handler
    playbackRateButtonClickHandler(this);

    this.bottomRightDiv.appendChild(this.ccButton);
    this.bottomRightDiv.appendChild(this.playbackRateButton);
    this.bottomRightDiv.appendChild(this.pipButton);
    this.bottomRightDiv.appendChild(this.fullScreenButton);
    this.bottomRightDiv.appendChild(this.subtitleMenu);
    this.bottomRightDiv.appendChild(this.playbackRateDiv);

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
  }

  disconnectedCallback() {
    this.wrapper.removeChild(this.video);
    this.hls?.destroy();
  }
}

if (!windowObject.customElements.get("fastpix-player")) {
  windowObject.customElements.define("fastpix-player", FastPixPlayer);
}
