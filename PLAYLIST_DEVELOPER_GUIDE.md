## FastPix Player - Playlist Developer Guide

For the complete and up-to-date playlist documentation (APIs, attributes, events, and examples), please refer to the Player Documentation.

Quick notes:
- Use `addPlaylist([...])` to load items (each requires `playbackId`).
- Optional: `default-playback-id`, `loop-next`, `hide-default-playlist-panel`.
- Events: `playbackidchange`, `playlisttoggle`.
  - Lightweight teardown before switching sources. Usually not required for standard navigation (handled internally), but useful if you implement custom source-switching flows.
- Advanced usage (custom panel via `slot="playlist-panel"`, `customNext`, `customPrev`) is covered in the Player Documentation. 