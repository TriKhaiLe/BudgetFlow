# PWA Icon Setup Instructions

To complete the PWA setup, you need to create app icons. Here are three options:

## Option 1: Use an Icon Generator (Recommended)

1. Create or obtain a 512x512px logo for BudgetFlow
2. Visit https://www.pwabuilder.com/imageGenerator
3. Upload your logo and download the generated icon package
4. Extract all icons to the `public/icons/` directory

## Option 2: Use Figma or Design Tools

Create the following icon sizes:

- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512 (standard icons)
- 192x192, 512x512 (maskable icons with safe zone padding)

Save them as:

- `public/icons/icon-{size}.png`
- `public/icons/icon-maskable-{size}.png`

## Option 3: Quick Testing Icons

For quick testing, you can use a solid color square or simple design tool like:

```bash
# Install sharp (if not already installed)
npm install sharp

# Use the icon-generator.js script (see below)
node icon-generator.js
```

## Maskable Icons Note

Maskable icons should have important content within the safe zone (center 80% of the canvas).
Background should extend to full canvas for proper display on all devices.

## Current Icon Requirements (from manifest.json)

✓ icon-72x72.png
✓ icon-96x96.png
✓ icon-128x128.png
✓ icon-144x144.png
✓ icon-152x152.png
✓ icon-192x192.png
✓ icon-384x384.png
✓ icon-512x512.png
✓ icon-maskable-192x192.png
✓ icon-maskable-512x512.png
