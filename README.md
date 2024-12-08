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
<fp-player playback-id="playback-id" stream-type="on-demand"/>
```

- The <fp-player> is a versatile HTML5 video player designed to seamlessly play FastPix videos, offering extensive customization options for developers to tailor the playback experience to their needs.

# Feature wise examples: 

[Click here](https://docs.fastpix.io/docs/overview-and-features) for a detailed overview.

## Playing public media:

The `playback-id` allows for easy video playback by linking directly to the media file. Playback is available as soon as the media status is "ready".

### For on-demand videos:

```html
<fp-player playback-id="playback-id" />
```

Here, the `stream-type` is set to `on-demand` by default.

## For live-stream videos:

```html
<fp-player playback-id="playback-id" stream-type="live-stream" />
```

Here, the `stream-type` is set to `live-stream` to play live streams.

## Securing your playback:

Secure your video playback with a signed playback using a `playback-id` and `token`.

- **On-Demand Videos** : Use the playback-id and token to control access to the video. The token ensures only authorized users can play the video.

```html
<fp-player 
  playback-id="your-playback-id" 
  stream-type="on-demand" 
  token="your-secure-token"
></fp-player>
```
- **Live-Stream Videos** : Similarly, for live streams, provide the playback-id and token to secure access.

```html
<fp-player 
  playback-id="your-live-playback-id"
  stream-type="live-stream" 
  token="your-secure-token">
</fp-player>
```

The token ensures authorized access, securing both on-demand and live-stream content.

## Customize Video Playback Experience

[Explore detailed guides for all features.](https://docs.fastpix.io/docs/autoplay-loop-muted-playback)

### auto-play:

The `auto-play` attribute enables the video to start playing automatically when the player is initialized. This feature requires user interaction or appropriate permissions depending on browser policies.

```html
<fp-player 
  playback-id="your-playback-id"
  stream-type="live-stream" 
  auto-play
  >
</fp-player>
```

### crossorigin:

The crossorigin attribute in <fp-player> specifies the `crossorigin` request policy (`anonymous`, `use-credential`s, or `empty`), where an empty value implies no crossoorigin requests unless explicitly supported by the resource.

```html

<!-- Example of <fp-player> with crossorigin attribute -->

<!-- 1. Anonymous: Allows cross-origin requests without credentials -->

<fp-player playback-id="playback-id" crossorigin="anonymous" />

<!-- 2. Use-credentials: Allows cross-origin requests with credentials -->

<fp-player playback-id="playback-id" crossorigin="use-credentials" />

<!-- 3. Default (empty or omitted): No cross-origin requests unless explicitly allowed -->

<fp-player playback-id="playback-id"></fp-player>
```

### default-playback-rate:

The `default-playback-rate` attribute sets the default playback speed of the video.

```html
<fp-player 
  playback-id="your-playback-id"
  stream-type="live-stream" 
  default-playback-rate=3
>
</fp-player>
```
### default-show-remaining-time:

The `default-show-remaining` attribute in <fp-player> is used to display the remaining time of the video in the format -00:30 / 00:30. When enabled, it shows the time left (negative value) alongside the total duration of the video, giving users a clear indication of how much time remains during playback.

```html
<fp-player 
  playback-id="your-playback-id"
  stream-type="live-stream" 
  default-show-remaining-time />
```

### default-stream-type:

The `default-stream-type` attribute in <fp-player> is used to specify the default stream type for playback, such as live or on-demand. This attribute allows the player to load and handle the appropriate stream type based on the video content, ensuring proper playback behavior for either live streaming or on-demand video playback.

```html
<fp-player playback-id="your-playback-id" default-stream-type="live-stream" />
```

### disable-hidden-captions:

The `disable-hidden-captions` attribute in <fp-player> is used to prevent any hidden captions from being displayed by default. When this attribute is enabled, captions or subtitles that are hidden within the video will not be shown unless explicitly enabled by the user.

```html
<fp-player playback-id="your-playback-id" disable-hidden-captions />
```

### enable-lazy-loading:

The `enable-lazy-loading` attribute enables the lazy loading feature for the <fp-player>, which loads the video content only when it becomes visible in the viewport, improving initial page load performance.

```html
<div style="margin-top: 100px;">
  <fp-player playback-id="your-playback-id" enable-lazy-loading></fp-player>
</div>
```

- **Note**: Ensure sufficient margin (margin-top) is applied to place the player outside the initial viewport for lazy loading to work effectively.

### loop:

The `loop` attribute allows the video to restart automatically from the beginning once it ends, creating a seamless playback experience.

```html
<fp-player 
  playback-id="your-playback-id"
  stream-type="live-stream" 
  loop
  >
</fp-player>
```

### muted:

The `muted` attribute sets the initial volume of the video to 0, ensuring playback starts without sound. This is particularly useful for `auto-play` functionality, as many browsers require videos to be muted to play automatically.

```html
<fp-player 
  playback-id="your-playback-id"
  stream-type="live-stream" 
  muted
  >
</fp-player>
```

### no-volume-pref:

The `no-volume-pref` attribute disables saving volume preferences in local storage, ensuring volume resets to default on each session.

```html
<fp-player 
  playback-id="your-playback-id"
  stream-type="live-stream" 
  no-volume-pref
  >
</fp-player>
```

### playback-rates:

The `playback-rates` attribute defines a list of available playback speed options for the user to select.

```html
<fp-player 
  playback-id="your-playback-id"
  stream-type="live-stream" 
  playback-rates="3 5 2 1"
  >
</fp-player>
```

### preload:

The preload attribute in the <fp-player> element specifies how the player should preload the media content. It can take the following values:

- `auto`: The player will preload the entire media file to ensure immediate playback without buffering.

- `metadata`: Only the metadata (e.g., duration, dimensions) of the media file will be preloaded, without fetching the entire content.

- `none`: The player will not preload the media and will only load the content when playback is initiated by the user.

```html
<fp-player preload="auto" playback-id="your-playback-id" ></fp-player>
```

### start-time:

The `start-time` attribute allows specifying the initial playback position in seconds when the video starts.

```html
<fp-player 
  playback-id="your-playback-id"
  stream-type="live-stream" 
  start-time=5
  >
</fp-player>
```

### title:

The `title` attribute in <fp-player> displays the provided text at the top left corner of the player, offering a brief description or title of the video content. This can be useful for displaying the video's name or additional context directly on the player interface.

```html
<fp-player 
  playback-id="your-playback-id"
  stream-type="live-stream" 
  title="Your video title"
  >
</fp-player>
```

### targert-live-window:

The `target-live-window` attribute works only when the stream-type is set to live-stream, controlling the duration of the visible segment and displaying only the most recent content.

```html
<fp-player 
  playback-id="your-playback-id"
  stream-type="live-stream" 
  title="Your video title"
  target-live-window
  >
</fp-player>
```

## Resolution Settings:

  Here are the resolution settings for the min-resolution, max-resolution, resolution, and rendition-order attributes:

- `min-resolution`: Specifies the minimum resolution for video playback, preventing lower-quality video selections.

```html
<fp-player playback-id="playback-id" min-resolution="1440p" />
```
- `max-resolution`: Sets the maximum resolution for video playback, restricting higher-quality video selections.

```html
<fp-player playback-id="playback-id" max-resolution="1440p" />
```

- `resolution`: Defines the preferred resolution for video playback, with potential adjustments based on conditions.

```html
<fp-player playback-id="playback-id" resolution="1440p" />
```
`rendition-order`: Specifies the priority order for video resolutions in adaptive streaming, which can be set to either `asc`(ascending) or `desc` (descending), with the default being `asc`.

```html
<fp-player
  playback-id="playback-id"
  resolution="1440p"
  rendition-order="desc"
/>
```

## Image Customizations:

Image customization allows you to adjust the appearance of media elements such as thumbnails, posters, and spritesheets in the player.

### poster:

The `poster` attribute specifies an image to display as a preview before the video starts playing.

- You can change or override the default `poster` attribute in the <fp-player> element whenever needed by setting a new image URL. For example:

```html
<fp-player playback-id="playback-id" poster="https://example.com/new-poster-image.jpg" />
```

- To remove the poster in <fp-player>, set the poster attribute to an empty string (poster="").

```html
<fp-player playback-id="playback-id" poster=""></fp-player>
```

### placeholder:

The `placeholder` attribute in <fp-player> is used to specify a fallback image that is displayed before the video starts playing, serving as a preview or loading image.

```html
<fp-player playback-id="playback-id" placeholder="loading-image.jpg"></fp-player>
```
### thumbnail-time:

The `thumbnail-time` attribute in <fp-player> allows you to specify a particular time (in seconds) within the video to capture a frame for the thumbnail. This enables setting a custom thumbnail image from a specific moment in the video, rather than using a default thumbnail.

```html
<fp-player playback-id="playback-id" thumbnail-time={8}></fp-player>
```

## Keyboard Navigation and Accessibility:
Customize keyboard shortcuts with `hot-keys` for efficient video control and use `disable-keyboard-controls` to disable keyboard interactions for enhanced accessibility or specific use cases.

- `hot-keys`: The `hot-keys` attribute specifies custom keyboard shortcuts (e.g., KeyK, KeyC), but when set, control for these specific keys will be disabled within the <fp-player>.

```html
<fp-player playback-id="your-playback-id" hot-keys="KeyK KeyC" ></fp-player> 
```
The available keys are - `KeyK`, `KeyC`, `KeyF`, `KeyM`, `ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`, `Space`;

- `disable-keyboard-controls`: The `disable-keyboard-controls` attribute disables all keyboard interactions for video playback within the <fp-player>, preventing any keyboard shortcuts from being used.

```html
<fp-player playback-id="your-playback-id" hot-keys="KeyK KeyC" ></fp-player> 
```

## Adding Chapters to Player and Event Listening:

### Chapters and Event Listeners:

The `chapters` feature lets you divide your video into sections, making navigation easier for users. Each chapter has a startTime, optional endTime, and a title. This is useful for allowing users to jump to specific parts of a video quickly.

Below is a simple example of how to add chapters to the <fp-player> and listen for events like `timeupdate` and c`hapterchange`:

```html
<script>
  document.addEventListener('DOMContentLoaded', () => {
    const fpPlayerElement = document.querySelector('fp-player');

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
    const fpPlayerElement = document.querySelector('fp-player');

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
- **Adding Chapters**: The chapters are added to the player with the `addChapters method`, which should be supported by the <fp-player> element.
- **Handling Events**: The code handles `chapterchange` and error events to track chapter changes and errors during playback.
- **Without convertOpenAIChapters** : You manually format and add the chapters.
- **With convertOpenAIChapters**: You automatically convert OpenAI's chapter data into the proper format for the player.

This simplifies adding chapters to the player, especially when dealing with large sets of data from external sources.

## Styling and Customization:

The `fp-player` provides extensive options to customize the player's appearance and behavior through CSS variables. These options allow you to tailor the look and feel of the player to match your application's branding and user experience preferences. Customize elements such as buttons, controls, and visual themes for complete flexibility in your video player integration.

[Explore detailed guides for all features.](https://docs.fastpix.io/docs/color-attributes)

## Color customizations:

Customize the visibility of `fp-player` theme colors with `accent-color`, `primary-color`, and `secondary-color` to align with your branding and theme. These attributes are optional and can be tailored based on your preferences.

For Example: 

```html
<fp-player 
  playback-id="your-live-playback-id"
  accent-color="red"
  primary-color="#F5F5F5"
  secondary-color="transparent">
</fp-player>
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
fp-player {
  --volume-control: none;
  --cc-button: none;
  --title: none;
}
```

##### To Hide all the controls:

```css
fp-player {
  --controls: none;
}
```

##### Hide Control sections:

```css
fp-player {
   --left-controls-bottom-mobile: none;
    --bottom-right-controls-mobile: none;
    
    --bottom-right-controls: none;
    --left-controls-bottom: none;
}
```

#### Aspect ratio:

You can set the aspect ratio of the player using the `--aspect-ratio` CSS variable, allowing you to maintain the desired width-to-height ratio for the video player.

```css
fp-player {
  aspect-ratio: 21/9;
}
```

#### Backdrop color customization:

The `--backdrop-color` CSS variable allows you to customize the background color of the player controls, enabling you to match the player’s appearance with your application's theme and design.

```css
fp-player {
  --backdrop-color: rgba(0, 0, 0, 0.6); /* Semi-transparent dark background */
}
```


Each of these features is designed to enhance both flexibility and user experience, providing complete control over video playback, appearance, and user interactions in FastPix-player.