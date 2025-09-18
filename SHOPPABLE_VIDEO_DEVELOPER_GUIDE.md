# FastPix Shoppable Video Developer Guide

## Introduction

FastPix Player provides two shoppable video themes that enable interactive product experiences within your video content:

- **`shoppable-video-player`** - Full-featured sidebar with product catalog
- **`shoppable-shorts`** - Simplified external link integration

Both themes allow you to add clickable products, interactive hotspots, and shopping functionality directly to your videos.

**Important Theme Behavior:**
- **`shoppable-video-player`**: Expects product data via `addShoppableData()` method. The `product-link` attribute is ignored.
- **`shoppable-shorts`**: Uses only the `product-link` attribute. Product data configuration is not used.

## Themes

### shoppable-video-player
**Full-featured shoppable experience with interactive product sidebar and comprehensive product catalog functionality**

**Features:**

| Feature | Description |
|---------|-------------|
| **Interactive Product Sidebar** | Expandable sidebar panel displaying all products with thumbnails, names, and descriptions |
| **Product Hover Overlays** | Text overlays appear when hovering over products in the sidebar, showing additional product information |
| **Image Swap on Hover** | Product images can switch to alternative views when hovered, useful for showing different angles or colors |
| **Clickable Hotspots** | Interactive markers appear on the video at specific times and positions, linking to products |
| **Post-Play Product Overlay** | Product carousel appears when video ends, encouraging continued engagement |
| **Auto-Open/Close Sidebar** | Sidebar automatically opens when video starts playing and can auto-close after a specified time |
| **Product Click Actions** | Products can trigger video seeking to specific times or open external purchase links |
| **Time-Based Product Activation** | Products become active/inactive based on video timeline, highlighting relevant items |

**Use cases:**
- **E-commerce Product Showcases**: Display multiple products with detailed information and purchase links
- **Fashion and Lifestyle Videos**: Show clothing items, accessories, and styling products with hover effects
- **Educational Content**: Reference books, tools, or materials mentioned in educational videos
- **Long-form Content**: Manage multiple products across extended video content with organized sidebar
- **Product Demonstrations**: Highlight specific products during demonstration videos with precise timing

### shoppable-shorts
**Simplified CTA (Call-to-Action) with external link integration for streamlined single-product experiences**

**Features:**

| Feature | Description |
|---------|-------------|
| **Single External Link Integration** | One-click integration that opens a specified URL when the cart button is clicked |
| **Cart Button Functionality** | Prominent cart/shop button appears on the player, optimized for mobile interaction |
| **Mobile-First Design** | UI elements are specifically designed for mobile devices and social media platforms |
| **Minimal UI Footprint** | Clean, unobtrusive interface that doesn't interfere with video viewing experience |
| **No Complex Configuration** | Simple setup requiring only the product-link attribute, no JavaScript configuration needed |
| **Social Media Optimized** | Designed for short-form content platforms like TikTok, Instagram Reels, and YouTube Shorts |

**Use cases:**
- **Social Media Shorts**: Quick product promotions on platforms like TikTok, Instagram, and YouTube Shorts
- **Mobile-First Content**: Videos primarily consumed on mobile devices with touch-friendly interactions
- **Single Product Promotions**: Focused campaigns highlighting one specific product or service
- **Quick Purchase Flows**: Streamlined buying experiences that minimize friction and steps
- **Simple CTA Campaigns**: Basic call-to-action videos that direct viewers to a single destination
- **Influencer Marketing**: Content creators promoting specific products with direct purchase links

## Theme Comparison

| Feature | shoppable-video-player | shoppable-shorts |
|---------|------------------------|------------------|
| **Product Catalog** | Full product sidebar with multiple items | Single external link only |
| **Configuration** | Requires `addShoppableData()` with product array | Only needs `product-link` attribute |
| **Hotspots** | Interactive markers on video timeline | Not available |
| **Hover Effects** | Product overlays and image swaps | Not available |
| **Post-Play Overlay** | Product carousel when video ends | Not available |
| **Click Actions** | Seek to time or open links | Opens external URL only |
| **Best For** | Multiple products, detailed experiences | Single product, quick CTAs |
| **Content Length** | Long-form videos | Short-form content |
| **Platform** | Web applications, detailed product showcases | Social media, mobile-first content |

## Quick Start

### shoppable-video-player Setup

#### 1. Basic Setup
```html
<fastpix-player 
  theme="shoppable-video-player"
  playback-id="your-playback-id">
</fastpix-player>
```

#### 2. Add Product Data
```javascript
const player = document.querySelector('fastpix-player');

const cartData = {
  productSidebarConfig: {
    startState: "closed",        // "closed" or "openOnPlay"
    autoClose: 4,               // Auto-close after 4 seconds
    showPostPlayOverlay: true   // Show overlay when video ends
  },
  products: [
    {
      id: 1,                    // Unique product ID
      name: "Product Name",     // Product display name
      thumbnail: "https://example.com/product.jpg",  // Product image URL
      description: "Product description",  // Optional description
      startTime: 0,             // When product becomes active (seconds)
      endTime: 5,               // When product becomes inactive (seconds)
      
      // Click action configuration
      onProductClick: {
        type: "seek",           // "seek" or "openLink"
        waitTillPause: 6,       // Wait 6 seconds then play
        params: {
          seekTime: 5           // Seek to 5 seconds
        }
      },
      
      // Hover action configuration
      onProductHover: {
        type: "overlay",        // "overlay" or "swap"
        params: {
          description: "Product description appears on hover"
        }
      },
      
      // Hotspot markers (optional)
      markers: [
        {
          x: 175,               // X position as percentage (0-100)
          y: 60,                // Y position as percentage (0-100)
          tooltipPosition: "left",  // "top", "bottom", "left", "right"
          link: "https://store.com/product"  // URL when hotspot clicked
        }
      ]
    }
  ]
};

player.addShoppableData(cartData);
```

### shoppable-shorts Setup

#### 1. Basic Setup
```html
<fastpix-player 
  theme="shoppable-shorts"
  product-link="https://your-store.com"
  playback-id="your-playback-id">
</fastpix-player>
```

**Note:** For `shoppable-shorts`, only the `product-link` attribute is required. No additional JavaScript configuration needed.

## Mandatory Requirements

**For shoppable-video-player theme:**
- Set `theme="shoppable-video-player"`
- Use `addShoppableData(config)` method
- **Note**: `product-link` attribute is ignored for this theme

**For shoppable-shorts theme:**
- Set `theme="shoppable-shorts"`
- Add `product-link="https://your-store.com"`
- **Note**: This theme does not use product data configuration

## JSON Structure Explained

### Complete Structure
```javascript
{
  productSidebarConfig: {
    startState: "closed",        // Sidebar initial state
    autoClose: 4,               // Auto-close timer (seconds)
    showPostPlayOverlay: true   // Show overlay when video ends
  },
  products: [
    {
      id: 1,                    // Product ID (number or string)
      name: "Product Name",     // Product display name
      thumbnail: "image-url",   // Product image URL
      description: "Description", // Optional description
      startTime: 0,             // Product active start time (seconds)
      endTime: 5,               // Product active end time (seconds)
      
      onProductClick: {         // Click action (optional)
        type: "seek",           // Action type
        waitTillPause: 6,       // Wait time before playing
        params: {               // Action parameters
          seekTime: 5           // Target time for seek
        }
      },
      
      onProductHover: {         // Hover action (optional)
        type: "overlay",        // Action type
        params: {               // Action parameters
          description: "Text to show on hover"
        }
      },
      
      markers: [                // Hotspot markers (optional)
        {
          x: 175,               // X position (0-100%)
          y: 60,                // Y position (0-100%)
          tooltipPosition: "left", // Tooltip position
          link: "url"           // Link when clicked
        }
      ]
    }
  ]
}
```

### Product Configuration

#### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | Number/String | Unique product identifier used internally for tracking and event handling |
| `name` | String | Product display name shown in the sidebar and tooltips |
| `thumbnail` | String | Product image URL displayed in the sidebar and hover overlays |

#### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `description` | String | Additional product information displayed in hover overlays and tooltips |
| `startTime` | Number | Video timestamp (in seconds) when the product becomes active and highlighted |
| `endTime` | Number | Video timestamp (in seconds) when the product becomes inactive and dimmed |
| `onProductClick` | Object | Configuration for what happens when the product is clicked in the sidebar |
| `onProductHover` | Object | Configuration for hover effects when mouse is over the product |
| `markers` | Array | Array of hotspot objects that appear on the video at specific times and positions |

## Product Actions Reference

### Product Click Actions

| Action Type | Description | Parameters | Default Values |
|-------------|-------------|------------|----------------|
| `"openLink"` | Opens an external URL in a new tab when product is clicked | `targetUrl` (string) - URL to open<br>`shouldPause` (boolean) - Whether to pause video | `shouldPause: false` |
| `"seek"` | Seeks the video to a specific time when product is clicked | `seekTime` (number) - Time in seconds to seek to<br>`waitTillPause` (number) - Seconds to wait before playing | `waitTillPause: 0` |

### Product Hover Actions

| Action Type | Description | Parameters | Default Values |
|-------------|-------------|------------|----------------|
| `"overlay"` | Shows a text overlay on the product image when hovered | `description` (string) - Text to display in overlay | None (description is required) |
| `"swap"` | Switches the product image to a different image when hovered | `switchImage` (string) - URL of the alternative image | None (switchImage is required) |

### Action Configuration Examples

#### Click Actions
```javascript
// Open external link with video pause
onProductClick: {
  type: "openLink",
  params: {
    targetUrl: "https://store.com/product",
    shouldPause: true
  }
}

// Seek to specific time with wait
onProductClick: {
  type: "seek",
  params: {
    seekTime: 45,
    waitTillPause: 10
  }
}
```

#### Hover Actions
```javascript
// Show text overlay on hover
onProductHover: {
  type: "overlay",
  params: {
    description: "Premium product with excellent quality"
  }
}

// Switch image on hover
onProductHover: {
  type: "swap",
  params: {
    switchImage: "https://example.com/product-alt-view.jpg"
  }
}
```

### Hotspots
```javascript
markers: [
  {
    seekTime: 15,           // Appear at 15 seconds
    x: 25,                  // 25% from left
    y: 30,                  // 30% from top
    tooltipPosition: "bottom",
    link: "https://store.com/product"
  }
]
```

## Configuration Reference

### Sidebar Configuration

| Property | Type | Description | Default Value | Options |
|----------|------|-------------|---------------|---------|
| `startState` | String | Initial state of the sidebar when video loads | `"openOnPlay"` | `"closed"`, `"openOnPlay"` |
| `autoClose` | Number | Auto-close sidebar after specified seconds | `undefined` (no auto-close) | Any positive number |
| `showPostPlayOverlay` | Boolean | Show product overlay when video ends | `false` | `true`, `false` |

### Product Object Configuration

| Property | Type | Required | Description | Default Value |
|----------|------|----------|-------------|---------------|
| `id` | Number/String | Yes | Unique product identifier | None |
| `name` | String | Yes | Product display name | None |
| `thumbnail` | String | Yes | Product image URL | None |
| `description` | String | No | Product description text | `undefined` |
| `startTime` | Number | No | When product becomes active (seconds) | `undefined` |
| `endTime` | Number | No | When product becomes inactive (seconds) | `undefined` |
| `onProductClick` | Object | No | Click action configuration | `undefined` |
| `onProductHover` | Object | No | Hover action configuration | `undefined` |
| `markers` | Array | No | Hotspot markers array | `undefined` |

### Hotspot Marker Configuration

| Property | Type | Required | Description | Default Value |
|----------|------|----------|-------------|---------------|
| `x` | Number | Yes | X position as percentage (0-100) | None |
| `y` | Number | Yes | Y position as percentage (0-100) | None |
| `tooltipPosition` | String | Yes | Tooltip position relative to hotspot | None |
| `link` | String | Yes | URL to navigate when hotspot clicked | None |

### Tooltip Position Options

| Position | Description |
|----------|-------------|
| `"top"` | Tooltip appears above the hotspot |
| `"bottom"` | Tooltip appears below the hotspot |
| `"left"` | Tooltip appears to the left of the hotspot |
| `"right"` | Tooltip appears to the right of the hotspot |

### Configuration Examples

#### Sidebar Configuration
```javascript
productSidebarConfig: {
  startState: "openOnPlay",  // Sidebar opens when video starts playing
  autoClose: 30,             // Auto-close after 30 seconds
  showPostPlayOverlay: true  // Show overlay when video ends
}
```

#### Complete Product Configuration
```javascript
{
  id: 1,
  name: "Product Name",
  thumbnail: "https://example.com/product.jpg",
  description: "Product description",
  startTime: 10,
  endTime: 25,
  onProductClick: {
    type: "openLink",
    params: {
      targetUrl: "https://store.com/product",
      shouldPause: true
    }
  },
  onProductHover: {
    type: "overlay",
    params: {
      description: "Product description on hover"
    }
  },
  markers: [
    {
      x: 25,
      y: 30,
      tooltipPosition: "bottom",
      link: "https://store.com/product"
    }
  ]
}
```

## CSS Customization

```css
fastpix-player {
  --shoppable-sidebar-width: 30%;
  --shoppable-sidebar-background-color: rgba(255, 255, 255, 0.75);
  --accent-color: #ff6b35;
}
```

## Events

### Available Events

| Event | Description | Event Detail |
|-------|-------------|--------------|
| `productHover` | Triggered when user hovers over a product in the sidebar | `e.detail.product` - Product object with id, name, thumbnail, etc. |
| `productClick` | Triggered when user clicks on a product in the sidebar | `e.detail.product` - Product object with id, name, thumbnail, etc. |
| `productBarMax` | Triggered when the product sidebar is opened/expanded | No event detail - sidebar state change |
| `productBarMin` | Triggered when the product sidebar is closed/minimized | No event detail - sidebar state change |
| `productHoverPost` | Triggered when user hovers over a product in the post-play overlay | `e.detail.product` - Product object with id, name, thumbnail, etc. |
| `productClickPost` | Triggered when user clicks on a product in the post-play overlay | `e.detail.product` - Product object with id, name, thumbnail, etc. |
| `replay` | Triggered when the video is replayed/restarted | No event detail - video replay action |

### Event Usage Examples

```javascript
// Product interaction events (with product data)
player.addEventListener('productHover', (e) => {
  console.log('Product hovered:', e.detail.product.name);
  // Track analytics: product hover in sidebar
});

player.addEventListener('productClick', (e) => {
  console.log('Product clicked:', e.detail.product.id);
  // Track analytics: product click in sidebar
});

// Sidebar state events (no event detail)
player.addEventListener('productBarMax', () => {
  console.log('Sidebar opened');
  // Track analytics: sidebar opened
});

player.addEventListener('productBarMin', () => {
  console.log('Sidebar closed');
  // Track analytics: sidebar closed
});

// Post-play overlay events (with product data)
player.addEventListener('productHoverPost', (e) => {
  console.log('Post-play hover:', e.detail.product.name);
  // Track analytics: product hover in post-play overlay
});

player.addEventListener('productClickPost', (e) => {
  console.log('Post-play click:', e.detail.product.id);
  // Track analytics: product click in post-play overlay
});

// Video replay event (no event detail)
player.addEventListener('replay', () => {
  console.log('Video replayed');
  // Track analytics: video replay
});
```

## Complete Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.jsdelivr.net/npm/@fastpix/fp-player@latest/dist/player.js"></script> 
  <title>FastPix Player</title>
  <style>
    #player-playlist {
      --shoppable-sidebar-width: 30%;
    }
  </style>
</head>
<body>
  <h3>FastPix Player - Shoppable player & Navigation Demo</h3>

  <fastpix-player 
    id="player-playlist" 
    theme="shoppable-video-player" 
    playback-id="919ec265-f409-4dd8-ac3d-366181e12e7a" 
    custom-domain="stream.fastpix.app" 
    min-resolution="480p" 
    max-resolution="720p">
  </fastpix-player>

  <script>
    // Wait until the custom element is defined
    customElements.whenDefined('fastpix-player').then(() => {
      const player = document.getElementById('player-playlist');

      const cartData = {
        productSidebarConfig: {
          startState: "openOnPlay",
          autoClose: 4,
          showPostPlayOverlay: true,
        },
        products: [
          {
            id: 1,
            thumbnail: "https://in.zohocommercecdn.com/product-images/JNW+Shajahan+Sofa+Set+Single+Rosewood+1.jpg/431189000086560983/600x600?storefront_domain=www.jfa.in",
            name: "chair",
            description: "Description 1",
            startTime: 0,
            endTime: 5,
            markers: [
              {
                x: 175,
                y: 60,
                tooltipPosition: "left",
                link: "https://www.jfa.in/products/JNW-Shajahan-Sofa-Set-Single-Rosewood-Dx-Premium-Wooden-Sofa-Set/431189000029424510",
              },
            ],
            onProductClick: {
              type: "seek",
              waitTillPause: 6,
              params: {
                seekTime: 5,
              },
            },
            onProductHover: {
              type: "overlay",
              params: {
                description: "see this product in the video",
              },
            },
          },
          {
            id: 2,
            thumbnail: "https://in.zohocommercecdn.com/product-images/FDI+Treviso+Sofa+3+Seater+1.jpg/431189000087278412/600x600?storefront_domain=www.jfa.in",
            name: "Treviso Sofa",
            description: "Description 1",
            startTime: 6,
            endTime: 10,
            markers: [
              {
                x: 60,
                y: 50,
                tooltipPosition: "left",
                link: "https://www.jfa.in/products/aa55d60413/431189000071080281",
              },
            ],
            onProductClick: {
              type: "seek",
              waitTillPause: 3,
              params: {
                seekTime: 7,
              },
            },
            onProductHover: {
              type: "overlay",
              params: {
                description: "see this product in the video",
              },
            },
          },
          {
            id: 3,
            thumbnail: "https://in.zohocommercecdn.com/product-images/1400x1400-Photoroom+%281%29.jpg/431189000076435150/600x600?storefront_domain=www.jfa.in",
            name: "Product 2",
            description: "Description 2",
            startTime: 11,
            endTime: 18,
            onProductClick: {
              type: "openLink",
              shouldPause: true,
              params: {
                targetUrl: "https://www.jfa.in/products/guru-ct-01-computer-table-30x18x30-walnut-computer-study-table/431189000070278273",
              },
            },
            onProductHover: {
              type: "overlay",
              params: {
                description: "Click to view the product",
              },
            },
          },
          {
            id: 4,
            thumbnail: "https://in.zohocommercecdn.com/product-images/AMM+Topaz+Plastic+Chair+W+Metal+Leg+and+Seat+Cushion+YellowOffice+Chair+3.jpg/431189000087691668/300x300?storefront_domain=www.jfa.in",
            name: "AMM Topaz Plastic Chair",
            description: "Description 3",
            markers: [
              {
                x: 50,
                y: 50,
                tooltipPosition: "top",
                link: "https://www.jfa.in/products/JNW-DT-Heart-Jali-Dining-Table-60X36-Walnut-Dining-Table/431189000029421080",
              },
            ],
            onProductClick: {
              type: "seek",
              waitTillPause: 30,
              params: {
                seekTime: 32,
              },
            },
            onProductHover: {
              type: "swap",
              params: {
                switchImage: "https://in.zohocommercecdn.com/product-images/AMM+Topaz+Plastic+Chair+W+Metal+Leg+and+Seat+Cushion+YellowOffice+Chair+1.jpg/431189000087691662/600x600?storefront_domain=www.jfa.in",
              },
            },
          },
        ],
      };

      // Provide your shoppable JSON
      player.addShoppableData(cartData);

      // Optional: listen to events
      player.addEventListener('productHover', (e) => console.log('hover:', e.detail.product));
      player.addEventListener('productClick', (e) => console.log('click:', e.detail.product));
      player.addEventListener('productBarMax', () => console.log('bar opened'));
      player.addEventListener('productBarMin', () => console.log('bar closed'));
      player.addEventListener('productHoverPost', (e) => console.log('overlay hover:', e.detail.product));
      player.addEventListener('productClickPost', (e) => console.log('overlay click:', e.detail.product));
      player.addEventListener('replay', () => console.log('replay'));
    });
  </script>
</body>
</html>
```

## Notes

- **Precedence**: If both `markers` and `onProductClick` are used, `onProductClick` takes precedence
- **Responsive**: FastPix Player automatically handles responsiveness
- **Analytics**: Use event listeners to track user interactions with your analytics solution

## Troubleshooting

### Cart Button Not Displaying

If the cart button is not appearing, check these common issues:

#### 1. Theme Not Set Correctly
```html
<!-- CORRECT -->
<fastpix-player theme="shoppable-video-player" ...>

<!-- INCORRECT -->
<fastpix-player theme="default" ...>
```

#### 2. Player Not Initialized
Make sure the player is fully loaded before adding shoppable data:

```javascript
// Wait for player to be ready
customElements.whenDefined('fastpix-player').then(() => {
  const player = document.getElementById('my-player');
  
  // Wait for player to be fully initialized
  player.addEventListener('loadedmetadata', () => {
    // Now add shoppable data
    player.addShoppableData(cartData);
  });
});
```

#### 3. Missing Product Data
For `shoppable-video-player`, you must call `addShoppableData()`:

```javascript
// REQUIRED for shoppable-video-player
player.addShoppableData({
  productSidebarConfig: { ... },
  products: [ ... ]
});
```

**Note**: The `product-link` attribute is ignored for `shoppable-video-player` theme. Only `shoppable-shorts` theme uses the `product-link` attribute.

#### 4. CSS Conflicts
Ensure no CSS is hiding the cart button:

```css
/* Check if cart button is hidden */
.cartButton {
  display: none; /* This would hide the button */
}

/* Check for other potential conflicts */
.cartButton {
  visibility: hidden; /* This would hide the button */
  opacity: 0; /* This would make the button invisible */
  z-index: -1; /* This would put the button behind other elements */
}

/* Check for responsive hiding */
@media (max-width: 150px) {
  .cartButton {
    display: none; /* This hides cart button on very small screens */
  }
}
```

**Common CSS Issues:**
- **CSS Variable syntax**: Ensure CSS variables use double dashes (e.g., `--shoppable-sidebar-width`, not `-shoppable-sidebar-width`)
- **Theme-specific behavior**: `shoppable-shorts` cart button is always visible regardless of screen size

#### 5. Force Show Cart Button (Debug)
If the cart button still doesn't appear, you can force it to show:

```javascript
// Debug method to force show cart button
const player = document.getElementById('my-player');
player.showCartButton();

// For shoppable-shorts specifically
if (player.getAttribute('theme') === 'shoppable-shorts') {
  player.ensureShoppableShortsCartButton();
}
```

### Debug Steps

1. **Check Console**: Look for JavaScript errors
2. **Verify Theme**: Ensure `theme="shoppable-video-player"` or `theme="shoppable-shorts"` is set. When using `shoppable-video-player`, the correct method to pass configuration must be used `player.addShoppableData(cartData)`;
3. **Check Network**: Ensure player.js is loading correctly
4. **Inspect Element**: Check if cart button exists in DOM but is hidden
5. **Force Show**: Use `player.showCartButton()` or `player.ensureShoppableShortsCartButton()` to debug visibility issues
 