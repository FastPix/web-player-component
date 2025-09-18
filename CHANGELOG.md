# Changelog

All notable changes to this project will be documented in this file.

## [1.0.8] - 2025-09-18

### New & Improved: Playlist
- Added playlist APIs: `addPlaylist(playlist)`, `next()`, `previous()`, `selectEpisodeByPlaybackId(playbackId)`
- Supported attributes: `default-playback-id`, `hide-default-playlist-panel`, `loop-next`
- Events: `playbackidchange`, `playlisttoggle`
- Custom navigation hooks: `customNext(handler)`, `customPrev(handler)`; call `i.next()`/`i.previous()` inside your handlers
- Default playlist panel can be hidden to build a fully custom panel via `slot="playlist-panel"`
- Introduced `destroy()` for lightweight teardown before custom source-switching flows

### iOS Volume Behavior
- When iOS-specific volume button is active, standard slider/button are hidden

### Menu Bugs fixed
- Fixed playlist panel toggle inconsistencies (open/close state and pointer events)
- Ensured external custom panel shows/hides reliably with `playlisttoggle`
- Resolved menu overlap by closing rate/audio/subtitle/resolution menus when opening playlist panel

## [1.0.7] - 2025-09-04

- Fixed "OpenOnPlay" and "autoClose" issue for shoppable-video-player theme

## [1.0.6] - 2025-08-19

 - Removed unnecessary console logs

## [1.0.5] - 2025-08-18

### New Feature: Shoppable Video Support

- **Shoppable Video Player Theme**: Introduced `shoppable-video-player` theme with full-featured product sidebar, interactive hotspots, and comprehensive product catalog functionality
- **Shoppable Shorts Theme**: Added `shoppable-shorts` theme for simplified external link integration optimized for social media and mobile-first content
- **Product Integration**: Support for product data configuration with hover effects, click actions, and time-based product activation
- **Interactive Hotspots**: Clickable markers on video timeline that link to specific products
- **Post-Play Overlay**: Product carousel that appears when video ends to encourage continued engagement
- **Responsive Design**: Cart button and sidebar adapt to different screen sizes with theme-specific visibility rules
- **Developer Documentation**: Comprehensive developer guide with configuration examples, troubleshooting section, and best practices

## [1.0.4] - 2025-07-09

### DRM Support & Chapters updation

- DRM support included
- Chapters feature updated

## [1.0.3] - 2025-05-05

### Bug Fix

- Fixed the spritesheet issue.

## [1.0.2] - 2025-04-29

### Beta Feature: Chromecast Integration

- **Initial Chromecast Support (Beta)**: Added foundational support for Google Chromecast. This includes:
  - Chromecast session detection and management.
  - Remote playback toggling with fallback to local player.
  - Volume and mute sync between player and Chromecast.
  - Session cleanup on load and playback resume logic.

## [1.0.1]

### Enhancements & Bug Fixes:

- **PIP Control Removed in Firefox Mobile**: Fixed an issue where the Picture-in-Picture (PIP) control was displayed on Firefox mobile browsers when it shouldn't be.
- **Subtitle Menu UI Fixes**:
  - Fixed an issue where the subtitle menu was cropped, and scrolling was unavailable for videos with over 10 subtitles.
  - Ensured that if multiple subtitles exist, the list is scrollable and properly displayed in the UI.
- **Subtitle Overlay Fix**: Resolved an issue where, after turning off subtitles, the background overlay remained visible instead of disappearing.
- **Data Metrics Integration**: Added **Quality of Experience (QoE) scoring** in the FastPix dashboard, allowing users to monitor streaming quality.
- **Enable Cache Busting (Beta)**: Introduced an experimental **cache-busting** feature to ensure that when tracks are added dynamically, the player checks for an updated manifest.

## [1.0.0]

### Initial Release:

- **Playback**: Introduced basic video playback functionality.
- **Signed Playback**: Enabled secure signed playback options.
- **Stream Types**: Added support for various stream types.
- **Responsiveness**: Ensured responsive design for different devices.
- **Error Handling**: Implemented robust error handling mechanisms.
- **Customizability**: Provided extensive customization options for users.
- **Keyboard Accessibility Controls**: Added keyboard shortcuts for better accessibility.
- **Lazy Loading**: Implemented lazy loading for improved performance.
- **Chapters**: Enabled chapter functionality for video navigation.
- **Script Support for Video Events:**: Added support for listening to video events via scripts.
- **Poster customizations**: Allowed customization of video posters.
- **Thumbnail Customization**: Enabled custom thumbnails for videos.
- **Forward and Rewind Playback Customizations:**: Provided options for customizable forward and rewind playback.
- **Playback Rates**: Allowed adjustment of playback rates.
- **Styling Options**: Added various styling options for UI elements.
- **Volume Management**: Implemented advanced volume control features.
- **Subtitle Switching**: Enabled switching between available subtitles.
- **Audio Track Switching:**: Allowed switching between different audio tracks.
- **Thumbnail Hover Previews**: Introduced thumbnail previews on hover.
- **Customizing Time Display**: Allowed customization of time display formats.
- **Start Time**: Implemented functionality to set a specific start time for playback.
- **Placeholder**: Added placeholder support for loading states.
- **offline/online control**: Provided control mechanisms for offline/online scenarios.
- **Title Display**: Implemented title display options for videos.
- **Overriding Default Behaviors**: Allowed users to override default player behaviors.