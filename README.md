# Introduction:

This SDK simplifies HLS video playback by offering a wide range of customization options for an enhanced viewing experience. It streamlines streaming setup by utilizing playback IDs that have reached the "ready" status to generate stream URLs. These playback IDs enable seamless integration and video playback within the FastPix-player, making the entire streaming process efficient and user-friendly.

# Key Features:

- ## Playback Control:

  - The `playback-id` allows for easy video playback by linking directly to the media file. Playback is available as soon as the media status is "ready."
  
  - `auto-play`: Automatically starts playback once the video is loaded, providing a seamless user experience.

  - `loop`: Allows the video to repeat automatically after it finishes, perfect for continuous viewing scenarios.

  - **Note** : Some browsers restrict `auto-play` functionality, especially for videos with audio. To comply with these restrictions, `auto-play` often requires explicit user interaction or permission to be enabled. Ensure users are aware and can manually activate `auto-play` if needed.

- ## Security:

  - the `token` attribute is required to play private or DRM protected streams

  - **Note:** The token can be empty for public streams

- ## Inbuilt error handling:

  - The player includes inbuilt error handling that displays appropriate error messages, helping developers quickly understand and address any issues that arise during playback.

- ## Seek and Load Options:

  - **Forward-Seek** and **Backward-Seek** are customizable options that allow users to define specific time intervals for skipping forward or backward, providing a tailored navigation experience.
  - **Thumbnail Seeking** is enabled by default and allows users to preview video frames by hovering or seeking over the timeline, enhancing navigation.
  - **Preloading** options, such as `metadata`, ensure that video data is loaded in advance, reducing buffer times.

- ## Poster customization:

  - Display a preview image at a specified time using the `thumbnail-time` attribute, set a custom `poster` image to show before the video begins playing, or use a `placeholder` to display a temporary image or background while the video is loading.

- ## Auto detection of subtitles and audio tracks:

  - The player automatically detects subtitles from the manifest file and displays them during playback. This ensures that users can easily access available subtitle tracks without additional configuration.

  - Users can switch between available subtitles and audio tracks during playback, offering a personalized viewing experience. This feature allows viewers to choose their preferred language or audio option easily.

- ## Styling and color customization:

  - Customize the player’s visual elements using the `accent-color`, `primary-color`, and `secondary-color` attributes:

  - `accent-color`: Represents the branding color, ensuring the player aligns with your brand identity.

  - `primary-color`: Applies color to the icons, enhancing their visibility and style.

  - `secondary-color`: Sets the background color of the icons, providing a complementary look and feel.

These attributes enable the creation of brand-aligned themes for a cohesive user experience.

- ### Backdrop color customization: 

  - Adjust the backdrop colors of player controls to match the aesthetic of your application, enhancing visual consistency and user experience.

- ## Advanced stream control:

  - The player supports `on-demand` and `live-stream` capabilities by utilizing specified `stream-type`, enabling a versatile playback experience based on content type.

  - Define the `stream-type` and `default-stream-type` to set default stream behaviors, adapting to whether the content is live or   on-demand.

  - Customize playback with `default-playback-rate` and multiple `playback-rates` options for various speeds.

  - Manage video quality with `min-resolution`, `max-resolution`, and `resolution` options, allowing either automated or controlled playback quality adjustments.

- ## Aspect ratios:

  - In your CSS, add the `aspect-ratio` property to the FastPix Player element, specifying the desired aspect ratio based on the preference.

- ## Hide and show controls:

  Flexibly hide or show specific player controls or all controls as needed, allowing for a customized viewing interface.

- ## Fading controls:

 - Player controls fade away after a few seconds of inactivity, minimizing distractions. They can reappear with user interaction, ensuring a smooth and immersive viewing experience.

- ## Keyboard accessibility shortcuts:

  - **Play/Pause**: Press **`K`** or **`Spacebar`** to toggle play and pause.
  - **Mute/Unmute**: Press **`M`** to toggle mute.
  - **Seek Forward**: Press the **Right Arrow** to jump forward by a preset seek offset (e.g., 5 or 10 seconds).
  - **Seek Backward**: Press the **Left Arrow** to jump backward by the preset offset.
  - **Volume Up**: Press the **Up Arrow** to increase volume incrementally.
  - **Volume Down**: Press the **Down Arrow** to decrease volume.
  - **Fullscreen**: Press **`F`** to enter or exit fullscreen mode.
  - **Captions**: Press **`C`** to toggle captions on and off.

- ## Volume management:

  - The **no-volume-pref** attribute disables volume storage in local storage, ensuring user preferences are not retained between sessions.
  - The **muted** attribute allows the video to start without sound, enhancing the initial viewing experience in specific contexts.

- ## Responsiveness:

  - This SDK is designed to be responsive, adapting to various screen sizes and devices. This ensures an optimal viewing experience across desktops, tablets, and smartphones.

- ## Cross-origin resource sharing (CORS):

  - The `cross-origin` attribute enables proper handling of cross-origin requests, allowing resources to be fetched securely across different origins and enhancing security when accessing media files.

- ## Event listeners:

  - The player allows developers to listen to various video events through script-side support. You can easily track events like play, pause, seek, and error, enabling customized behavior based on user interaction and player state.

- ## Network-Adaptive Pause and Resume:

  - The player can pause and resume based on network connectivity, offering a smooth experience even when connection changes occur.

- ## Lazy loading and monitoring:

  - The `enable-lazy-loading` option optimizes resource usage by loading video data only when necessary.

- ## Chapters:

  - Add chapters to the video, allowing users to easily navigate to specific sections of the content. This feature enhances user engagement and makes it simpler for viewers to find relevant information.

- ## Title display:

  - The `title` attribute allows you to set a title for the video, enhancing context and providing additional information to viewers.

# Prerequisites:

## Getting started with FastPix:

To get started with the FastPix Player SDK we need some prerequisites, follow these steps:

1. **Log in to the FastPix Dashboard**: Navigate to the [FastPix-Dashboard](https://dashboard.fastpix.io) and log in with your credentials.
2. **Create Media**: Start by creating a media using a pull or push method. You can also use our APIs instead for [Push media](https://docs.fastpix.io/docs/upload-videos-directly) or [Pull media](https://docs.fastpix.io/docs/upload-videos-from-url).
3. **Retrieve Media Details**: After creation, access the media details by navigating to the "View Media" page.
4. **Get Playback ID**: From the media details, obtain the playback ID.
5. **Play Video**: Use the playback ID in the FastPix-player to play the video seamlessly.

[Explore our detailed guide](https://docs.fastpix.io/docs/get-started-in-5-minutes) to upload videos and getting a playback ID using FastPix APIs

# Installation:

To get started with the SDK, first install the FastPix Player SDK for Web, you can use npm or your favourite node package manager 😉:

```shell
npm install @fastpix/player
```

# Basic Usage:

## Usage

```html
<fastpix-player playback-id="playback-id" stream-type="on-demand"/>
```

- The <fastpix-player> is a versatile HTML5 video player designed to seamlessly play FastPix videos, offering extensive customization options for developers to tailor the playback experience to their needs.

# Feature wise examples: 

[Click here](https://docs.fastpix.io/docs/overview-and-features) for a detailed overview.

## Playing public media:

The `playback-id` allows for easy video playback by linking directly to the media file. Playback is available as soon as the media status is "ready".

### For on-demand videos:

```html
<fastpix-player playback-id="playback-id" />
```

Here, the `stream-type` is set to `on-demand` by default.

## For live-stream videos:

```html
<fastpix-player playback-id="playback-id" stream-type="live-stream" />
```

Here, the `stream-type` is set to `live-stream` to play live streams.

## Securing your playback:

Secure your video playback with a signed playback using a `playback-id` and `token`.

- **On-Demand Videos** : Use the playback-id and token to control access to the video. The token ensures only authorized users can play the video.

```html
<fastpix-player 
  playback-id="your-playback-id" 
  stream-type="on-demand" 
  token="your-secure-token"
></fastpix-player>
```
- **Live-Stream Videos** : Similarly, for live streams, provide the playback-id and token to secure access.

```html
<fastpix-player 
  playback-id="your-live-playback-id"
  stream-type="live-stream" 
  token="your-secure-token">
</fastpix-player>
```

The token ensures authorized access, securing both on-demand and live-stream content.

## Data Integration:
Data integration involves combining data from different sources to provide a unified view.

### Data Integration Overview

In this implementation, various video and user-related attributes are extracted and mapped for analytics tracking. These attributes help monitor and analyze video playback behavior, user interaction, and other metrics.

**Important Note:**

- To enable data integration, ensure the `metadata-workspace-key` attribute is present.

- **Disable data monitoring:**

  To disable data tracking after providing all required attributes, use the `disable-data-monitoring` attribute.

```html
<fastpix-player 
  playback-id="your-live-playback-id"
  stream-type="live-stream" 
  metadata-workspace-key="metadata workspace key"  
  metadata-video-title="video title"
  metadata-viewer-user-id="user id"
  metadata-video-id="video-id"
  disable-data-monitoring
  >
</fastpix-player>
```

- **Enabling Debugging for Data Monitoring Setup:** 

To facilitate debugging of the data monitoring setup, use the `enable-debug` attribute.

```html
<fastpix-player 
  playback-id="your-live-playback-id"
  stream-type="live-stream" 
  metadata-video-title="video title"
  metadata-viewer-user-id="user id"
  metadata-video-id="video-id"
  enable-debug
  >
</fastpix-player>
```

- **Respecting 'Do Not Track' Preferences:** 

To honor users' privacy preferences regarding the 'Do Not Track' setting, set the `respect-do-not-track` attribute to `true`.


```html
<fastpix-player 
  playback-id="your-live-playback-id"
  stream-type="live-stream" 
  metadata-video-title="video title"
  metadata-viewer-user-id="user id"
  metadata-video-id="video-id"
  respect-do-not-track
  >
</fastpix-player>
```

 
- **Disabling Cookies During Data Monitoring:** 

  If you prefer to monitor data without utilizing cookies, include the `disable-cookies` attribute.

```html
<fastpix-player 
  playback-id="your-live-playback-id"
  stream-type="live-stream" 
  metadata-workspace-key="metadata workspace key"  
  metadata-video-title="video title"
  metadata-viewer-user-id="user id"
  metadata-video-id="video-id"
  disable-cookies
  >
</fastpix-player>
```

### Attribute Mapping Breakdown

| **Context Attribute**                | **Extracted Data Attribute**  | **Description**                                                                 |
|--------------------------------------|-------------------------------|---------------------------------------------------------------------------------|
| `metadata-workspace-id`              | `workspace_id`                | Unique identifier for the workspace.                                            |
| `metadata-video-title`               | `video_title`                 | Title of the video being played.                                                |
| `metadata-viewer-user-id`            | `viewer_id`                   | Identifier for the viewer watching the video.                                   |
| `metadata-video-id`                 | `video_id`                    | Unique ID of the video.                                                         |
| `metadata-experiment-name`          | `experiment_name`             | Name of any ongoing experiment related to the video.                            |
| `metadata-player-name`              | `player_name`                 | Name of the video player being used.                                            |
| `metadata-player-version`           | `player_version`              | Version of the video player.                                                    |
| `metadata-video-duration`           | `video_duration`              | Duration of the video in seconds.                                               |
| `metadata-view-session-id`          | `view_session_id`             | Session ID for the video viewing.                                               |
| `metadata-page-context`             | `page_context`                | Context of the page where the video is embedded.                               |
| `metadata-sub-property-id`          | `sub_property_id`             | ID for any specific sub-property of the video.                                  |
| `metadata-video-content-type`       | `video_content_type`          | Type of video content (e.g., live or on-demand).                               |
| `metadata-video-drm-type`           | `video_drm_type`              | Type of DRM (Digital Rights Management) used for the video.                    |
| `metadata-video-encoding-variant`   | `video_encoding_variant`      | Encoding variant of the video, like resolution or bitrate.                     |
| `metadata-video-language-code`      | `video_language_code`         | Language code of the video's audio (e.g., "en" for English).                    |
| `metadata-video-producer`           | `video_producer`              | Producer or creator of the video content.                                       |
| `metadata-video-variant-name`       | `video_variant_name`          | Name of the specific video variant (e.g., resolution).                          |
| `metadata-video-cdn`                | `video_cdn`                   | CDN used to deliver the video content.                                          |
| `metadata-cdn`                       | `cdn`                         | Content Delivery Network used in the video delivery.                            |
| `metadata-video-variant-id`         | `video_variant_id`            | Unique ID for the video variant.                                               |
| `metadata-video-series`             | `video_series`                | Series name or ID if the video is part of a series.                             |
| `metadata-custom-1` to `metadata-custom-10` | `custom_1` to `custom_10` | Custom metadata attributes for additional information.                         |
| `metadata-browser-name`             | `browser_name`                | Name of the browser used to watch the video.                                    |
| `metadata-os-name`                  | `os_name`                     | Operating system used to view the video (e.g., Windows, macOS).                 |
| `metadata-os-version`               | `os_version`                  | Version of the operating system.                                               |
| `metadata-player-init-time`         | `player_init_time`            | Time taken to initialize the video player.                                      |
| `stream-type`                        | `video_stream_type`           | Type of stream (e.g., live or VOD).                                            |

### Explanation of Attributes

- **Workspace and Video Identification**: These attributes (`workspace_id`, `video_id`, `video_title`) help in identifying the video and its associated workspace for tracking purposes.
- **Viewer and Session Tracking**: The `viewer_id`, `view_session_id` attributes track the user and session specifics for personalized analytics.
- **Video and Player Details**: Attributes such as `player_name`, `player_version`, `video_duration`, and `video_language_code` provide detailed information about the video playback and the player environment.
- **Custom Information**: Custom metadata fields allow for flexibility in tracking additional properties.
- **Browser and OS Information**: Attributes like `browser_name` and `os_name` offer insights into the viewer's device environment.

For more detailed information, please refer to the [FastPix User Passable Metadata Documentation](https://docs.fastpix.io/docs/user-passable-metadata).

## Customize Video Playback Experience

[Explore detailed guides for all features.](https://docs.fastpix.io/docs/autoplay-loop-muted-playback)

## Enabling Cache Busting (Beta)

To utilize the experimental cache-busting feature, include the `enable-cache-busting` attribute in your player. This ensures that when tracks are added dynamically, the player checks for an updated manifest.

```html
<fastpix-player 
  playback-id="your-playback-id" 
  stream-type="on-demand" 
  enable-cache-busting
></fastpix-player>
```
**Note**: This feature is currently in beta and may be deprecated in future releases.

For comprehensive documentation and advanced usage, visit the FastPix Player Documentation[https://docs.fastpix.io/docs/overview-and-features].

Enhance your web applications with FastPix Player's seamless streaming and extensive customization options.

### auto-play:

The `auto-play` attribute enables the video to start playing automatically when the player is initialized. This feature requires user interaction or appropriate permissions depending on browser policies.

```html
<fastpix-player 
  playback-id="your-playback-id"
  stream-type="live-stream" 
  auto-play
  >
</fastpix-player>
```

### crossorigin:

The crossorigin attribute in <fastpix-player> specifies the `crossorigin` request policy (`anonymous`, `use-credential`s, or `empty`), where an empty value implies no crossoorigin requests unless explicitly supported by the resource.

```html

<!-- Example of <fastpix-player> with crossorigin attribute -->

<!-- 1. Anonymous: Allows cross-origin requests without credentials -->

<fastpix-player playback-id="playback-id" crossorigin="anonymous" />

<!-- 2. Use-credentials: Allows cross-origin requests with credentials -->

<fastpix-player playback-id="playback-id" crossorigin="use-credentials" />

<!-- 3. Default (empty or omitted): No cross-origin requests unless explicitly allowed -->

<fastpix-player playback-id="playback-id"></fastpix-player>
```

### default-playback-rate:

The `default-playback-rate` attribute sets the default playback speed of the video.

```html
<fastpix-player 
  playback-id="your-playback-id"
  stream-type="live-stream" 
  default-playback-rate=3
>
</fastpix-player>
```
### default-show-remaining-time:

The `default-show-remaining` attribute in <fastpix-player> is used to display the remaining time of the video in the format -00:30 / 00:30. When enabled, it shows the time left (negative value) alongside the total duration of the video, giving users a clear indication of how much time remains during playback.

```html
<fastpix-player 
  playback-id="your-playback-id"
  stream-type="live-stream" 
  default-show-remaining-time />
```

### default-stream-type:

The `default-stream-type` attribute in <fastpix-player> is used to specify the default stream type for playback, such as live or on-demand. This attribute allows the player to load and handle the appropriate stream type based on the video content, ensuring proper playback behavior for either live streaming or on-demand video playback.

```html
<fastpix-player playback-id="your-playback-id" default-stream-type="live-stream" />
```

### disable-hidden-captions:

The `disable-hidden-captions` attribute in <fastpix-player> is used to prevent any hidden captions from being displayed by default. When this attribute is enabled, captions or subtitles that are hidden within the video will not be shown unless explicitly enabled by the user.

```html
<fastpix-player playback-id="your-playback-id" disable-hidden-captions />
```

### enable-lazy-loading:

The `enable-lazy-loading` attribute enables the lazy loading feature for the <fastpix-player>, which loads the video content only when it becomes visible in the viewport, improving initial page load performance.

```html
<div style="margin-top: 100px;">
  <fastpix-player playback-id="your-playback-id" enable-lazy-loading></fastpix-player>
</div>
```

- **Note**: Ensure sufficient margin (margin-top) is applied to place the player outside the initial viewport for lazy loading to work effectively.

### loop:

The `loop` attribute allows the video to restart automatically from the beginning once it ends, creating a seamless playback experience.

```html
<fastpix-player 
  playback-id="your-playback-id"
  stream-type="live-stream" 
  loop
  >
</fastpix-player>
```

### muted:

The `muted` attribute sets the initial volume of the video to 0, ensuring playback starts without sound. This is particularly useful for `auto-play` functionality, as many browsers require videos to be muted to play automatically.

```html
<fastpix-player 
  playback-id="your-playback-id"
  stream-type="live-stream" 
  muted
  >
</fastpix-player>
```

### no-volume-pref:

The `no-volume-pref` attribute disables saving volume preferences in local storage, ensuring volume resets to default on each session.

```html
<fastpix-player 
  playback-id="your-playback-id"
  stream-type="live-stream" 
  no-volume-pref
  >
</fastpix-player>
```

### playback-rates:

The `playback-rates` attribute defines a list of available playback speed options for the user to select.

```html
<fastpix-player 
  playback-id="your-playback-id"
  stream-type="live-stream" 
  playback-rates="3 5 2 1"
  >
</fastpix-player>
```

### preload:

The preload attribute in the <fastpix-player> element specifies how the player should preload the media content. It can take the following values:

- `auto`: The player will preload the entire media file to ensure immediate playback without buffering.

- `metadata`: Only the metadata (e.g., duration, dimensions) of the media file will be preloaded, without fetching the entire content.

- `none`: The player will not preload the media and will only load the content when playback is initiated by the user.

```html
<fastpix-player preload="auto" playback-id="your-playback-id" ></fastpix-player>
```

### start-time:

The `start-time` attribute allows specifying the initial playback position in seconds when the video starts.

```html
<fastpix-player 
  playback-id="your-playback-id"
  stream-type="live-stream" 
  start-time=5
  >
</fastpix-player>
```

### title:

The `title` attribute in <fastpix-player> displays the provided text at the top left corner of the player, offering a brief description or title of the video content. This can be useful for displaying the video's name or additional context directly on the player interface.

```html
<fastpix-player 
  playback-id="your-playback-id"
  stream-type="live-stream" 
  title="Your video title"
  >
</fastpix-player>
```

### targert-live-window:

The `target-live-window` attribute works only when the stream-type is set to live-stream, controlling the duration of the visible segment and displaying only the most recent content.

```html
<fastpix-player 
  playback-id="your-playback-id"
  stream-type="live-stream" 
  title="Your video title"
  target-live-window
  >
</fastpix-player>
```

## Resolution Settings:

  Here are the resolution settings for the min-resolution, max-resolution, resolution, and rendition-order attributes:

- `min-resolution`: Specifies the minimum resolution for video playback, preventing lower-quality video selections.

```html
<fastpix-player playback-id="playback-id" min-resolution="1440p" />
```
- `max-resolution`: Sets the maximum resolution for video playback, restricting higher-quality video selections.

```html
<fastpix-player playback-id="playback-id" max-resolution="1440p" />
```

- `resolution`: Defines the preferred resolution for video playback, with potential adjustments based on conditions.

```html
<fastpix-player playback-id="playback-id" resolution="1440p" />
```
`rendition-order`: Specifies the priority order for video resolutions in adaptive streaming, which can be set to either `asc`(ascending) or `desc` (descending), with the default being `asc`.

```html
<fastpix-player
  playback-id="playback-id"
  resolution="1440p"
  rendition-order="desc"
/>
```

## Image Customizations:

Image customization allows you to adjust the appearance of media elements such as thumbnails, posters, and spritesheets in the player.

### poster:

The `poster` attribute specifies an image to display as a preview before the video starts playing.

- You can change or override the default `poster` attribute in the <fastpix-player> element whenever needed by setting a new image URL. For example:

```html
<fastpix-player playback-id="playback-id" poster="https://example.com/new-poster-image.jpg" />
```

- To remove the poster in <fastpix-player>, set the poster attribute to an empty string (poster="").

```html
<fastpix-player playback-id="playback-id" poster=""></fastpix-player>
```

### placeholder:

The `placeholder` attribute in <fastpix-player> is used to specify a fallback image that is displayed before the video starts playing, serving as a preview or loading image.

```html
<fastpix-player playback-id="playback-id" placeholder="loading-image.jpg"></fastpix-player>
```
### thumbnail-time:

The `thumbnail-time` attribute in <fastpix-player> allows you to specify a particular time (in seconds) within the video to capture a frame for the thumbnail. This enables setting a custom thumbnail image from a specific moment in the video, rather than using a default thumbnail.

```html
<fastpix-player playback-id="playback-id" thumbnail-time={8}></fastpix-player>
```

## Keyboard Navigation and Accessibility:
Customize keyboard shortcuts with `hot-keys` for efficient video control and use `disable-keyboard-controls` to disable keyboard interactions for enhanced accessibility or specific use cases.

- `hot-keys`: The `hot-keys` attribute specifies custom keyboard shortcuts (e.g., KeyK, KeyC), but when set, control for these specific keys will be disabled within the <fastpix-player>.

```html
<fastpix-player playback-id="your-playback-id" hot-keys="KeyK KeyC" ></fastpix-player> 
```
The available keys are - `KeyK`, `KeyC`, `KeyF`, `KeyM`, `ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`, `Space`;

- `disable-keyboard-controls`: The `disable-keyboard-controls` attribute disables all keyboard interactions for video playback within the <fastpix-player>, preventing any keyboard shortcuts from being used.

```html
<fastpix-player playback-id="your-playback-id" hot-keys="KeyK KeyC" ></fastpix-player> 
```

## Adding Chapters to Player and Event Listening:

### Chapters and Event Listeners:

The `chapters` feature lets you divide your video into sections, making navigation easier for users. Each chapter has a startTime, optional endTime, and a title. This is useful for allowing users to jump to specific parts of a video quickly.

Below is a simple example of how to add chapters to the <fastpix-player> and listen for events like `timeupdate` and c`hapterchange`:

```html
<script>
  document.addEventListener('DOMContentLoaded', () => {
    const fpPlayerElement = document.querySelector('fastpix-player');

    fpPlayerElement.addEventListener('timeupdate', (event) => {
      const currentTime = fpPlayerElement.currentTime;
      console.log('Current Time:', currentTime);
    });

    const chapters = [
      { startTime: 0, endTime: 2, value: 'chapter-1' },
      {
        startTime: 4,
        value: 'Chapter 2'
      },
      {
        startTime: 5,
        endTime: 6,
        value: 'Chapter 3'
      },
    ];

    function addChaptersToPlayer() {
      if (fpPlayerElement && typeof fpPlayerElement.addChapters === 'function') {
        fpPlayerElement.addChapters(chapters);
      } else {
        console.error('addChapters method not found on fpPlayerElement');
      }
    }

    console.log("Source URL:", fpPlayerElement.currentSrc);
    console.log("readyState:", fpPlayerElement.readyState);
    console.log("buffered:", fpPlayerElement.buffered);

    // Wait until the player has loaded some data to associate chapters
    if (fpPlayerElement && fpPlayerElement.readyState >= 1) {
      addChaptersToPlayer();
    } else {
      if (fpPlayerElement) {
        fpPlayerElement.addEventListener('loadedmetadata', addChaptersToPlayer, { once: true });
      } else {
        console.error('fpPlayerElement not found');
      }
    }

    if (fpPlayerElement) {
      fpPlayerElement.addEventListener('chapterchange', () => {
        console.log('Chapter change event detected');
        console.log("Active Chapter:", fpPlayerElement.activeChapter());
        console.log("Chapters:", fpPlayerElement.chapters);
      });

      fpPlayerElement.addEventListener('error', () => {
        console.log('Error detected');
        console.log("Active Chapter:", fpPlayerElement.activeChapter());
      });
    } else {
      console.error('fpPlayerElement not found');
    }
  });
</script>
```

With `convertOpenAIChapters` Method:

If your chapters are generated by OpenAI, you can use the `convertOpenAIChapters` method to easily format them for the player:

```html
<script>
  document.addEventListener('DOMContentLoaded', () => {
    const fpPlayerElement = document.querySelector('fastpix-player');

    // Assuming OpenAI returns chapter data
    const openAIchapters = [
      { startTime: 0, value: 'Chapter 1' },
      { startTime: 4, value: 'Chapter 2' },
      { startTime: 5, value: 'Chapter 3' },
    ];

    // Convert OpenAI chapters to the right format
    const chapters = convertOpenAIChapters(openAIchapters);

    function addChaptersToPlayer() {
      if (fpPlayerElement && typeof fpPlayerElement.addChapters === 'function') {
        fpPlayerElement.addChapters(chapters);
      } else {
        console.error('addChapters method not found');
      }
    }

    if (fpPlayerElement && fpPlayerElement.readyState >= 1) {
      addChaptersToPlayer();
    } else {
      fpPlayerElement.addEventListener('loadedmetadata', addChaptersToPlayer);
    }
  });
</script>
```

- **Key Steps in the Code :**

- **Chapter Definition**: Chapters are defined in an array, with each chapter having a `startTime`, `endTime`, and `value`.
- **Event Listeners**: The code listens for `timeupdate` to monitor playback, and `loadedmetadata` to ensure the player is ready before adding chapters.
- **Adding Chapters**: The chapters are added to the player with the `addChapters method`, which should be supported by the <fastpix-player> element.
- **Handling Events**: The code handles `chapterchange` and error events to track chapter changes and errors during playback.
- **Without convertOpenAIChapters** : You manually format and add the chapters.
- **With convertOpenAIChapters**: You automatically convert OpenAI's chapter data into the proper format for the player.

This simplifies adding chapters to the player, especially when dealing with large sets of data from external sources.

## Styling and Customization:

The `fastpix-player` provides extensive options to customize the player's appearance and behavior through CSS variables. These options allow you to tailor the look and feel of the player to match your application's branding and user experience preferences. Customize elements such as buttons, controls, and visual themes for complete flexibility in your video player integration.

[Explore detailed guides for all features.](https://docs.fastpix.io/docs/color-attributes)

## Color customizations:

Customize the visibility of `fastpix-player` theme colors with `accent-color`, `primary-color`, and `secondary-color` to align with your branding and theme. These attributes are optional and can be tailored based on your preferences.

For Example: 

```html
<fastpix-player 
  playback-id="your-live-playback-id"
  accent-color="red"
  primary-color="#F5F5F5"
  secondary-color="transparent">
</fastpix-player>
```

### Customizations using CSS variables:

The options mentioned below help customize the visibility of different UI controls, enabling you to create a minimalistic or fully-featured player interface according to your needs.

#### Description:

- `--controls` : Controls the visibility of all the controls in the player.

- `--time-display` : Controls the visibility of the time display on the player.

- `--volume-control`: Toggles the visibility of the volume control on desktop.

- `--title` : Hides or shows the video title.

- `--play-button-initialized` : Hides or shows the play button after the player is initialized.

- `--forward-skip-button` : Controls the visibility of the forward skip button.

- `--audio-track-button`: Controls the visibility of the audio track button.

- `--cc-button`: Hides or shows the subtitle button.

- `--backward-skip-button` : Controls the visibility of the backward skip button.

- `--resolution-selector` : Hides or shows the resolution selector for video quality control.

- `--playback-rate-button` : Hides or shows the playback rate button for adjusting video speed.

- `--progress-bar` : Toggles the visibility of the progress bar.

- `--pip-button` : Controls the visibility of the Picture-in-Picture button.

- `--full-screen-button` : Toggles the visibility of the fullscreen button.

- `--volume-control-mobile` : Controls the visibility of the volume control on mobile devices.

- `--initial-play-button` : Hides or shows the initial play button before the video starts playing.

- `--middle-controls-mobile` : Toggles the visibility of the mobile middle controls.

- `-loading-indicator`: Controls the visibility of the loading indicator.

- `--left-controls-bottom-mobile` : Controls the visibility of the bottom-left controls on mobile devices.

- `--bottom-right-controls-mobile` : Controls the visibility of the bottom-right controls on mobile devices.

- `--bottom-right-controls`: Controls the visibility of the bottom-right controls on desktop devices.

- `--left-controls-bottom`: Controls the visibility of the bottom-left controls on desktop devices.

#### Hide/show specific controls:

```css
fastpix-player {
  --volume-control: none;
  --cc-button: none;
  --title: none;
}
```

##### To Hide all the controls:

```css
fastpix-player {
  --controls: none;
}
```

##### Hide Control sections:

```css
fastpix-player {
   --left-controls-bottom-mobile: none;
    --bottom-right-controls-mobile: none;
    
    --bottom-right-controls: none;
    --left-controls-bottom: none;
}
```

#### Aspect ratio:

You can set the aspect ratio of the player using the `aspect-ratio` CSS variable, allowing you to maintain the desired width-to-height ratio for the video player.

```css
fastpix-player {
  aspect-ratio: 21/9;
}
```

#### Backdrop color customization:

The `--backdrop-color` CSS variable allows you to customize the background color of the player controls, enabling you to match the player’s appearance with your application's theme and design.

```css
fastpix-player {
  --backdrop-color: rgba(0, 0, 0, 0.6); /* Semi-transparent dark background */
}
```


Each of these features is designed to enhance both flexibility and user experience, providing complete control over video playback, appearance, and user interactions in FastPix-player.