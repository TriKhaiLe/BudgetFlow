/**
 * Circular Dollar Variations Generator
 * Creates multiple variations of the circular-dollar design with waves
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconDir = path.join(__dirname, 'public', 'icons', 'designs');

if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

const size = 512;

// Variation 1: Original Circular Dollar
const variation1 = () => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fa709a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#fee140;stop-opacity:1" />
    </linearGradient>
    <radialGradient id="glow1">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0" />
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg1)" rx="112"/>
  <circle cx="256" cy="256" r="180" fill="url(#glow1)"/>
  <circle cx="256" cy="256" r="140" fill="none" stroke="#ffffff" stroke-width="12" opacity="0.6"/>
  <circle cx="256" cy="256" r="120" fill="#ffffff" opacity="0.3"/>
  <text x="256" y="310" font-family="Arial" font-size="140" font-weight="900" fill="#ffffff" text-anchor="middle">$</text>
</svg>
`;

// Variation 2: Circular Dollar with Bottom Waves
const variation2 = () => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fa709a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#fee140;stop-opacity:1" />
    </linearGradient>
    <radialGradient id="glow2">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0" />
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg2)" rx="112"/>
  
  <!-- Flowing waves at bottom -->
  <path d="M 0 ${size} Q 85 ${size-120}, 170 ${size-100} T 340 ${size-100} T ${size} ${size-80} L ${size} ${size} Z" fill="#ffffff" opacity="0.15"/>
  <path d="M 0 ${size} Q 85 ${size-80}, 170 ${size-60} T 340 ${size-60} T ${size} ${size-50} L ${size} ${size} Z" fill="#ffffff" opacity="0.2"/>
  <path d="M 0 ${size} Q 85 ${size-40}, 170 ${size-30} T 340 ${size-30} T ${size} ${size-25} L ${size} ${size} Z" fill="#ffffff" opacity="0.25"/>
  
  <!-- Circle and dollar -->
  <circle cx="256" cy="200" r="150" fill="url(#glow2)"/>
  <circle cx="256" cy="200" r="110" fill="none" stroke="#ffffff" stroke-width="12" opacity="0.6"/>
  <circle cx="256" cy="200" r="90" fill="#ffffff" opacity="0.3"/>
  <text x="256" y="245" font-family="Arial" font-size="120" font-weight="900" fill="#ffffff" text-anchor="middle">$</text>
</svg>
`;

// Variation 3: Circular Dollar with Orbital Waves
const variation3 = () => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fa709a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#fee140;stop-opacity:1" />
    </linearGradient>
    <radialGradient id="glow3">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.9" />
      <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0" />
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg3)" rx="112"/>
  
  <!-- Circular flowing waves around center -->
  <circle cx="256" cy="256" r="200" fill="none" stroke="#ffffff" stroke-width="8" opacity="0.2" stroke-dasharray="20,15"/>
  <circle cx="256" cy="256" r="220" fill="none" stroke="#ffffff" stroke-width="6" opacity="0.15" stroke-dasharray="15,20"/>
  
  <!-- Main circle -->
  <circle cx="256" cy="256" r="160" fill="url(#glow3)"/>
  <circle cx="256" cy="256" r="130" fill="none" stroke="#ffffff" stroke-width="12" opacity="0.7"/>
  <circle cx="256" cy="256" r="110" fill="#ffffff" opacity="0.35"/>
  <text x="256" y="305" font-family="Arial" font-size="130" font-weight="900" fill="#ffffff" text-anchor="middle">$</text>
</svg>
`;

// Variation 4: Circular Dollar with Flowing Wave Background
const variation4 = () => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg4" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fa709a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#fee140;stop-opacity:1" />
    </linearGradient>
    <radialGradient id="glow4">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.9" />
      <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0" />
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg4)" rx="112"/>
  
  <!-- Diagonal flowing waves across -->
  <path d="M 0 150 Q 128 120, 256 140 T ${size} 130 L ${size} 0 L 0 0 Z" fill="#ffffff" opacity="0.1"/>
  <path d="M 0 200 Q 128 170, 256 190 T ${size} 180" stroke="#ffffff" stroke-width="8" fill="none" opacity="0.2" stroke-linecap="round"/>
  <path d="M 0 240 Q 128 210, 256 230 T ${size} 220" stroke="#ffffff" stroke-width="6" fill="none" opacity="0.15" stroke-linecap="round"/>
  
  <path d="M 0 ${size} Q 128 ${size-120}, 256 ${size-100} T ${size} ${size-110} L ${size} ${size} Z" fill="#ffffff" opacity="0.1"/>
  
  <!-- Circle and dollar -->
  <circle cx="256" cy="280" r="160" fill="url(#glow4)"/>
  <circle cx="256" cy="280" r="125" fill="none" stroke="#ffffff" stroke-width="12" opacity="0.7"/>
  <circle cx="256" cy="280" r="105" fill="#ffffff" opacity="0.35"/>
  <text x="256" y="330" font-family="Arial" font-size="130" font-weight="900" fill="#ffffff" text-anchor="middle">$</text>
</svg>
`;

// Variation 5: Circular Dollar with Liquid Waves Inside
const variation5 = () => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg5" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fa709a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#fee140;stop-opacity:1" />
    </linearGradient>
    <radialGradient id="glow5">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0" />
    </radialGradient>
    <clipPath id="circle-clip">
      <circle cx="256" cy="256" r="130"/>
    </clipPath>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg5)" rx="112"/>
  
  <!-- Outer glow -->
  <circle cx="256" cy="256" r="180" fill="url(#glow5)"/>
  <circle cx="256" cy="256" r="145" fill="none" stroke="#ffffff" stroke-width="12" opacity="0.6"/>
  
  <!-- Inner circle with waves -->
  <circle cx="256" cy="256" r="130" fill="#ffffff" opacity="0.25"/>
  
  <!-- Liquid waves inside circle -->
  <g clip-path="url(#circle-clip)">
    <path d="M 126 280 Q 170 270, 214 280 T 302 280 T 386 280 L 386 386 L 126 386 Z" fill="#ffffff" opacity="0.2"/>
    <path d="M 126 310 Q 170 295, 214 310 T 302 310 T 386 310 L 386 386 L 126 386 Z" fill="#ffffff" opacity="0.25"/>
  </g>
  
  <text x="256" y="275" font-family="Arial" font-size="140" font-weight="900" fill="#ffffff" text-anchor="middle">$</text>
</svg>
`;

// Variation 6: Minimalist with Smooth Waves
const variation6 = () => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg6" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fa709a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#fee140;stop-opacity:1" />
    </linearGradient>
    <radialGradient id="glow6">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.85" />
      <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0" />
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg6)" rx="112"/>
  
  <!-- Smooth abstract waves -->
  <path d="M 0 180 Q 128 150, 256 170 T ${size} 160" stroke="#ffffff" stroke-width="10" fill="none" opacity="0.25" stroke-linecap="round"/>
  <path d="M 0 210 Q 128 180, 256 200 T ${size} 190" stroke="#ffffff" stroke-width="8" fill="none" opacity="0.2" stroke-linecap="round"/>
  
  <path d="M 0 ${size-160} Q 128 ${size-190}, 256 ${size-170} T ${size} ${size-180}" stroke="#ffffff" stroke-width="10" fill="none" opacity="0.25" stroke-linecap="round"/>
  <path d="M 0 ${size-130} Q 128 ${size-160}, 256 ${size-140} T ${size} ${size-150}" stroke="#ffffff" stroke-width="8" fill="none" opacity="0.2" stroke-linecap="round"/>
  
  <!-- Central circle -->
  <circle cx="256" cy="256" r="170" fill="url(#glow6)"/>
  <circle cx="256" cy="256" r="125" fill="#ffffff" opacity="0.35"/>
  <text x="256" y="305" font-family="Arial" font-size="135" font-weight="900" fill="#ffffff" text-anchor="middle">$</text>
</svg>
`;

// Variation 7: Bold with Dynamic Waves
const variation7 = () => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg7" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ff6b9d;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ffc371;stop-opacity:1" />
    </linearGradient>
    <radialGradient id="glow7">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.9" />
      <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0" />
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg7)" rx="112"/>
  
  <!-- Dynamic flow waves through center -->
  <path d="M 0 256 Q 85 220, 170 256 T 340 256 T ${size} 256" stroke="#ffffff" stroke-width="30" fill="none" opacity="0.15" stroke-linecap="round"/>
  <path d="M 0 256 Q 85 230, 170 256 T 340 256 T ${size} 256" stroke="#ffffff" stroke-width="18" fill="none" opacity="0.2" stroke-linecap="round"/>
  <path d="M 0 256 Q 85 240, 170 256 T 340 256 T ${size} 256" stroke="#ffffff" stroke-width="10" fill="none" opacity="0.25" stroke-linecap="round"/>
  
  <!-- Bold circle -->
  <circle cx="256" cy="256" r="175" fill="url(#glow7)"/>
  <circle cx="256" cy="256" r="135" fill="none" stroke="#ffffff" stroke-width="14" opacity="0.7"/>
  <circle cx="256" cy="256" r="115" fill="#ffffff" opacity="0.4"/>
  <text x="256" y="310" font-family="Arial" font-size="140" font-weight="900" fill="#ffffff" text-anchor="middle">$</text>
</svg>
`;

// Variation 8: Elegant with Subtle Flow Lines
const variation8 = () => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg8" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f093fb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f5576c;stop-opacity:1" />
    </linearGradient>
    <radialGradient id="glow8">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.85" />
      <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0" />
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg8)" rx="112"/>
  
  <!-- Elegant curved flow lines -->
  <path d="M 50 150 Q 150 120, 250 140 Q 350 160, 462 130" stroke="#ffffff" stroke-width="6" fill="none" opacity="0.2" stroke-linecap="round"/>
  <path d="M 30 200 Q 140 165, 256 185 Q 372 205, 482 175" stroke="#ffffff" stroke-width="5" fill="none" opacity="0.18" stroke-linecap="round"/>
  
  <path d="M 30 ${size-200} Q 140 ${size-165}, 256 ${size-185} Q 372 ${size-205}, 482 ${size-175}" stroke="#ffffff" stroke-width="5" fill="none" opacity="0.18" stroke-linecap="round"/>
  <path d="M 50 ${size-150} Q 150 ${size-120}, 250 ${size-140} Q 350 ${size-160}, 462 ${size-130}" stroke="#ffffff" stroke-width="6" fill="none" opacity="0.2" stroke-linecap="round"/>
  
  <!-- Refined circle -->
  <circle cx="256" cy="256" r="165" fill="url(#glow8)"/>
  <circle cx="256" cy="256" r="128" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.5"/>
  <circle cx="256" cy="256" r="120" fill="none" stroke="#ffffff" stroke-width="12" opacity="0.6"/>
  <circle cx="256" cy="256" r="100" fill="#ffffff" opacity="0.3"/>
  <text x="256" y="305" font-family="Arial" font-size="125" font-weight="900" fill="#ffffff" text-anchor="middle">$</text>
</svg>
`;

const variations = [
  { name: 'circular-dollar-v1-original', svg: variation1, desc: 'Original - Pink/yellow with glowing circle' },
  { name: 'circular-dollar-v2-bottom-waves', svg: variation2, desc: 'Bottom waves - Flowing waves at base' },
  { name: 'circular-dollar-v3-orbital', svg: variation3, desc: 'Orbital - Dashed circular waves around center' },
  { name: 'circular-dollar-v4-diagonal-flow', svg: variation4, desc: 'Diagonal flow - Waves across top and bottom' },
  { name: 'circular-dollar-v5-liquid', svg: variation5, desc: 'Liquid waves - Wave fill inside circle' },
  { name: 'circular-dollar-v6-smooth-abstract', svg: variation6, desc: 'Smooth abstract - Minimalist flowing lines (BEST FLOW)' },
  { name: 'circular-dollar-v7-dynamic-bold', svg: variation7, desc: 'Dynamic bold - Strong wave through center' },
  { name: 'circular-dollar-v8-elegant-flow', svg: variation8, desc: 'Elegant flow - Subtle curved lines (pink/coral)' },
];

async function generateVariations() {
  console.log('🎨 Generating Circular Dollar variations with waves at 512x512...\n');

  for (const variation of variations) {
    const svgBuffer = Buffer.from(variation.svg());
    const outputPath = path.join(iconDir, `${variation.name}.png`);
    
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`✓ ${variation.name}.png`);
    console.log(`  ${variation.desc}\n`);
  }

  console.log('✅ All Circular Dollar variations created!');
  console.log(`📁 Location: public/icons/designs/\n`);
  console.log('💡 These all incorporate abstract waves to match "Flow" in BudgetFlow!');
  console.log('👀 Pick your favorite and I\'ll generate all PWA sizes.');
}

generateVariations().catch(console.error);
