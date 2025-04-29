# Changelog

All notable changes to this project will be documented in this file.

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
