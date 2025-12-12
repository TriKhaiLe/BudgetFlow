/**
 * Final PWA Icon Generator - Diagonal Flow Design
 * Generates all required PWA icon sizes
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconDir = path.join(__dirname, 'public', 'icons');

if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const maskableSizes = [192, 512];

// Diagonal Flow Design
const createIconSVG = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fa709a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#fee140;stop-opacity:1" />
    </linearGradient>
    <radialGradient id="glow">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.9" />
      <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0" />
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)" rx="${size * 0.22}"/>
  
  <!-- Diagonal flowing waves across -->
  <path d="M 0 ${size * 0.29} Q ${size * 0.25} ${size * 0.23}, ${size * 0.5} ${size * 0.27} T ${size} ${size * 0.25} L ${size} 0 L 0 0 Z" fill="#ffffff" opacity="0.1"/>
  <path d="M 0 ${size * 0.39} Q ${size * 0.25} ${size * 0.33}, ${size * 0.5} ${size * 0.37} T ${size} ${size * 0.35}" stroke="#ffffff" stroke-width="${size * 0.016}" fill="none" opacity="0.2" stroke-linecap="round"/>
  <path d="M 0 ${size * 0.47} Q ${size * 0.25} ${size * 0.41}, ${size * 0.5} ${size * 0.45} T ${size} ${size * 0.43}" stroke="#ffffff" stroke-width="${size * 0.012}" fill="none" opacity="0.15" stroke-linecap="round"/>
  
  <path d="M 0 ${size} Q ${size * 0.25} ${size * 0.77}, ${size * 0.5} ${size * 0.8} T ${size} ${size * 0.78} L ${size} ${size} Z" fill="#ffffff" opacity="0.1"/>
  
  <!-- Circle and dollar -->
  <circle cx="${size * 0.5}" cy="${size * 0.55}" r="${size * 0.31}" fill="url(#glow)"/>
  <circle cx="${size * 0.5}" cy="${size * 0.55}" r="${size * 0.24}" fill="none" stroke="#ffffff" stroke-width="${size * 0.023}" opacity="0.7"/>
  <circle cx="${size * 0.5}" cy="${size * 0.55}" r="${size * 0.21}" fill="#ffffff" opacity="0.35"/>
  <text x="${size * 0.5}" y="${size * 0.64}" font-family="Arial, sans-serif" font-size="${size * 0.25}" font-weight="900" fill="#ffffff" text-anchor="middle" dominant-baseline="central">$</text>
</svg>
`;

// Maskable version with safe zone
const createMaskableSVG = (size) => {
  const safeZone = size * 0.8;
  const padding = (size - safeZone) / 2;
  const innerSize = safeZone;
  
  return `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgm" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fa709a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#fee140;stop-opacity:1" />
    </linearGradient>
    <radialGradient id="glowm">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.9" />
      <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0" />
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bgm)"/>
  
  <!-- Waves adjusted for safe zone -->
  <path d="M ${padding} ${padding + innerSize * 0.29} Q ${padding + innerSize * 0.25} ${padding + innerSize * 0.23}, ${padding + innerSize * 0.5} ${padding + innerSize * 0.27} T ${padding + innerSize} ${padding + innerSize * 0.25} L ${padding + innerSize} ${padding} L ${padding} ${padding} Z" fill="#ffffff" opacity="0.1"/>
  <path d="M ${padding} ${padding + innerSize * 0.39} Q ${padding + innerSize * 0.25} ${padding + innerSize * 0.33}, ${padding + innerSize * 0.5} ${padding + innerSize * 0.37} T ${padding + innerSize} ${padding + innerSize * 0.35}" stroke="#ffffff" stroke-width="${innerSize * 0.016}" fill="none" opacity="0.2" stroke-linecap="round"/>
  
  <path d="M ${padding} ${size - padding} Q ${padding + innerSize * 0.25} ${size - padding - innerSize * 0.23}, ${padding + innerSize * 0.5} ${size - padding - innerSize * 0.2} T ${padding + innerSize} ${size - padding - innerSize * 0.22} L ${padding + innerSize} ${size - padding} Z" fill="#ffffff" opacity="0.1"/>
  
  <!-- Circle and dollar in safe zone -->
  <circle cx="${size * 0.5}" cy="${size * 0.5}" r="${innerSize * 0.28}" fill="url(#glowm)"/>
  <circle cx="${size * 0.5}" cy="${size * 0.5}" r="${innerSize * 0.22}" fill="none" stroke="#ffffff" stroke-width="${innerSize * 0.023}" opacity="0.7"/>
  <circle cx="${size * 0.5}" cy="${size * 0.5}" r="${innerSize * 0.19}" fill="#ffffff" opacity="0.35"/>
  <text x="${size * 0.5}" y="${size * 0.5}" font-family="Arial, sans-serif" font-size="${innerSize * 0.25}" font-weight="900" fill="#ffffff" text-anchor="middle" dominant-baseline="central">$</text>
</svg>
`;
};

async function generateAllIcons() {
  console.log('🎨 Generating PWA icons with Diagonal Flow design...\n');

  // Generate standard icons
  for (const size of sizes) {
    const svgBuffer = Buffer.from(createIconSVG(size));
    const outputPath = path.join(iconDir, `icon-${size}x${size}.png`);
    
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`✓ Created icon-${size}x${size}.png`);
  }

  console.log('');

  // Generate maskable icons
  for (const size of maskableSizes) {
    const svgBuffer = Buffer.from(createMaskableSVG(size));
    const outputPath = path.join(iconDir, `icon-maskable-${size}x${size}.png`);
    
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`✓ Created icon-maskable-${size}x${size}.png`);
  }

  console.log('\n✅ All PWA icons generated successfully!');
  console.log('📁 Location: public/icons/');
  console.log('🎨 Design: Circular Dollar with Diagonal Flow waves');
  console.log('🚀 Ready for production! Build and test your PWA.');
}

generateAllIcons().catch(console.error);
