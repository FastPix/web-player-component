import fastpixMetrix from "@fastpix/video-data-core";
import { Context } from "./index";

// Hls Class Type (Third-Party Library)
type HlsClass = new () => HlsInstance;

// Type for Video Element
type VideoElement = HTMLVideoElement;

interface AttributeMapping {
  [attribute: string]: string;
}

interface ExtractedData {
  workspace_id?: string;
  video_title?: string;
  viewer_id?: string;
  video_id?: string;
  experiment_name?: string;
  player_name?: string;
  player_version?: string;
  video_duration?: string;
  video_stream_type?: string;
  view_session_id?: string;
  page_context?: string;
  sub_property_id?: string;
  video_content_type?: string;
  video_drm_type?: string;
  video_encoding_variant?: string;
  video_language_code?: string;
  video_producer?: string;
  video_variant_name?: string;
  video_cdn?: string;
  cdn?: string;
  video_variant_id?: string;
  video_series?: string;
  custom_1?: string;
  custom_2?: string;
  custom_3?: string;
  custom_4?: string;
  custom_5?: string;
  custom_6?: string;
  custom_7?: string;
  custom_8?: string;
  custom_9?: string;
  custom_10?: string;
  fastpix_playback_id?: string;
  browser_name?: string;
  browser?: string;
  browser_version?: string;
  os_name?: string;
  player_poster?: string;
  os_version?: string;
  page_url?: string;
  player_autoplay_on?: string;
  player_height?: string;
  player_instance_id?: string;
  player_language_code?: string;
  video_poster_url?: string;
  player_init_time?: string;
  player_preload_on?: string;
  player_remote_played?: string;
  player_software_name?: string;
  player_software_version?: string;
  video_source_height?: string;
  video_source_width?: string;
  player_width?: string;
  player_is_fullscreen?: string;
  viewer_connection_type?: string;
  device_manufacturer?: string;
  device_category?: string;
  device_name?: string;
  device_model?: string;
  device_type?: string;
}

// Type for HLS Instance
interface HlsInstance {
  on(event: string, callback: (...args: any[]) => void): void;
  loadSource(source: string): void;
  attachMedia(media: HTMLMediaElement): void;
}

// Type for Tracker Configuration
interface TrackerConfig {
  hlsjs: HlsInstance | null;
  Hls: HlsClass | null;
  disableCookies: boolean;
  beaconCollectionDomain?: string;
  data: Record<string, string | undefined>;
  configDomain: string;
}

// Analytics Interface
interface DataAnalytix {
  tracker(video: HTMLVideoElement, config: TrackerConfig): void;
}

const extractAttributes = (context: Context): ExtractedData => {
  const attributesMapping: AttributeMapping = {
    "metadata-workspace-key": "workspace_id",
    "metadata-video-title": "video_title",
    "metadata-viewer-user-id": "viewer_id",
    "metadata-video-id": "video_id",
    "metadata-experiment-name": "experiment_name",
    "metadata-player-name": "player_name",
    "metadata-player-version": "player_version",
    "metadata-video-duration": "video_duration",
    "metadata-view-session-id": "view_session_id",
    "metadata-page-context": "page_context",
    "metadata-sub-property-id": "sub_property_id",
    "metadata-video-content-type": "video_content_type",
    "metadata-player-poster": "player_poster",
    "metadata-video-drm-type": "video_drm_type",
    "metadata-video-encoding-variant": "video_encoding_variant",
    "metadata-video-language-code": "video_language_code",
    "metadata-video-producer": "video_producer",
    "metadata-video-variant-name": "video_variant_name",
    "metadata-video-cdn": "video_cdn",
    "metadata-cdn": "cdn",
    "metadata-beacon-domain": "beacon_domain",
    "metadata-video-variant-id": "video_variant_id",
    "metadata-video-series": "video_series",
    "metadata-video-poster-url": "video_poster_url",
    "metadata-player-softer-name": "player_software_name",
    "metadata-player-software-version": "player_software_version",
    "metadata-custom-1": "custom_1",
    "metadata-custom-2": "custom_2",
    "metadata-custom-3": "custom_3",
    "metadata-custom-4": "custom_4",
    "metadata-custom-5": "custom_5",
    "metadata-custom-6": "custom_6",
    "metadata-custom-7": "custom_7",
    "metadata-custom-8": "custom_8",
    "metadata-custom-9": "custom_9",
    "metadata-custom-10": "custom_10",
    "metadata-browser-name": "browser_name",
    "metadata-os-name": "os_name",
    "metadata-os-version": "os_version",
    "metadata-player-init-time": "player_init_time",
  };

  const trackingData: ExtractedData = {};

  Object.entries(attributesMapping).forEach(([attribute, key]) => {
    const value = context.getAttribute(attribute);
    if (value !== null) {
      trackingData[key] = value;
    }
  });

  // Ensure "stream-type" is taken directly from context["stream-type"]
  if (context.streamType) {
    trackingData.video_stream_type = context.streamType;
  }

  return trackingData;
};

export function initializeAnalytics(
  context: any,
  video: VideoElement,
  hls: HlsInstance | null,
  Hls: HlsClass | null
): void {
  let data: ExtractedData = extractAttributes(context);
  data = {
    ...data,
    player_software_name: "fastpix-player-data-monitoring",
    player_software_version: "1.0.8",
  };
  const debug = context.hasAttribute("enable-debug");
  const disableCookies = context.hasAttribute("disable-cookies");
  const respectDoNotTrack = context.hasAttribute("respect-do-not-track");
  const disabledDataMonitoring = context.hasAttribute(
    "disable-data-monitoring"
  );
  const workspaceKey = context.getAttribute("metadata-workspace-key");
  const shouldTrack = !disabledDataMonitoring && !!workspaceKey;
  const configDomain = context.getAttribute("config-domain") || "metrix.ws";

  if (shouldTrack) {
    fastpixMetrix.tracker(video, {
      debug,
      hlsjs: hls,
      Hls,
      disableCookies,
      data,
      respectDoNotTrack,
      configDomain,
    });
  }
}
