---
name: Bug Report
about: Report an issue related to the FastPix Web Player SDK
title: '[BUG] '
labels: bug
assignees: ''
---

# Bug Description
Provide a clear and concise description of the issue you encountered with the FastPix Web Player SDK.

---

# Steps to Reproduce

### 1. **SDK Setup**

Install the FastPix Web Player:

```bash
npm install @fastpix/fp-player
```

**ESM (e.g. React, Vite):**

```javascript
import '@fastpix/fp-player';
// Use <fastpix-player> in your JSX/HTML
```

**Or via script tag (CDN / IIFE):**

```html
<script src="https://cdn.jsdelivr.net/npm/@fastpix/fp-player@latest/dist/player.js"></script>
<!-- FastPixPlayer is available globally -->
```

### 2. **Example Code to Reproduce**

Provide a minimal reproducible snippet (HTML + JS or React) that shows the issue. Example:

```html
<fastpix-player
  id="player"
  playback-id="<PLAYBACK_ID>"
  stream-type="on-demand"
></fastpix-player>
```

Or with token (private/DRM):

```html
<fastpix-player
  id="player"
  playback-id="<PLAYBACK_ID>"
  stream-type="on-demand"
  token="<PLAYBACK_TOKEN>"
  drm-token="<DRM_TOKEN>"
></fastpix-player>
```

Replace with the exact code where the bug occurs.

---

# Expected Behavior
```
<!-- Describe what you expected to happen -->
```

# Actual Behavior
```
<!-- Describe what actually happened -->
```

---

# Environment

- **Player Version**: [e.g., 1.0.11]
- **Browser**: [e.g., Chrome 120, Safari 17.2, Firefox 121]
- **OS**: [e.g., macOS 14, Windows 11, iOS 17]
- **Node/npm**: [e.g., Node 20, npm 10]
- **Framework**: [e.g., React 18, Vue 3, Vanilla JS, Vite]
- **Integration**: [npm package (ESM) / script tag (CDN)]

---

# Logs / Errors / Console Output
```
Paste browser console logs, network errors, or SDK errors here
```

---

# Additional Context
Add any information that might help, such as:

- DRM playback (Widevine / FairPlay)
- Private vs public stream
- Chromecast / casting
- Shoppable video or playlists
- Custom domains or CORS

---

# Screenshots / Screen Recording
If applicable, attach screenshots or a short video demonstrating the issue.