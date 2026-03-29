/* eslint-disable @typescript-eslint/no-require-imports */
const sharp = require('sharp');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const publicDir = path.join(__dirname, '..', 'public');

// Generate icon PNGs
async function generateIcons() {
  for (const size of sizes) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1a1a2e"/>
            <stop offset="100%" style="stop-color:#0f0f1a"/>
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="20" fill="url(#bg)"/>
        <rect x="20" y="35" width="60" height="30" rx="8" fill="#e63946"/>
        <circle cx="30" cy="68" r="8" fill="#1a1a2e"/>
        <circle cx="70" cy="68" r="8" fill="#1a1a2e"/>
        <circle cx="30" cy="68" r="4" fill="#e63946"/>
        <circle cx="70" cy="68" r="4" fill="#e63946"/>
        <rect x="28" y="42" width="44" height="16" rx="4" fill="#1a1a2e" opacity="0.3"/>
      </svg>
    `;

    await sharp(Buffer.from(svg))
      .png()
      .toFile(path.join(publicDir, `icon-${size}x${size}.png`));
    
    console.log(`Generated icon-${size}x${size}.png`);
  }
}

// Generate OG image
async function generateOGImage() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1a1a2e"/>
          <stop offset="100%" style="stop-color:#0f0f1a"/>
        </linearGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#e63946"/>
          <stop offset="100%" style="stop-color:#c92a37"/>
        </linearGradient>
      </defs>
      
      <rect width="1200" height="630" fill="url(#bg)"/>
      
      <circle cx="1000" cy="100" r="200" fill="#e63946" opacity="0.05"/>
      <circle cx="150" cy="500" r="150" fill="#e63946" opacity="0.08"/>
      
      <g transform="translate(600, 280)">
        <rect x="-60" y="-50" width="120" height="80" rx="20" fill="url(#accent)"/>
        <circle cx="-35" cy="45" r="15" fill="#1a1a2e"/>
        <circle cx="35" cy="45" r="15" fill="#1a1a2e"/>
        <circle cx="-35" cy="45" r="8" fill="#e63946"/>
        <circle cx="35" cy="45" r="8" fill="#e63946"/>
        <rect x="-45" y="-30" width="90" height="40" rx="5" fill="#1a1a2e" opacity="0.3"/>
      </g>
      
      <text x="600" y="420" text-anchor="middle" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="#ffffff">Andamus</text>
      
      <text x="600" y="480" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" fill="#ffffff" opacity="0.8">Carpooling gratuito in Sardegna</text>
      
      <path d="M 200 500 Q 250 480 300 500 Q 350 520 320 560 Q 280 590 220 580 Q 180 560 200 500" fill="#e63946" opacity="0.3"/>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(publicDir, 'og-image.png'));
  
  console.log('Generated og-image.png');
}

// Generate screenshot placeholders
async function generateScreenshots() {
  // Mobile screenshot
  const mobileSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 375 812" width="375" height="812">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1a1a2e"/>
          <stop offset="100%" style="stop-color:#0f0f1a"/>
        </linearGradient>
      </defs>
      <rect width="375" height="812" fill="url(#bg)"/>
      <rect x="20" y="60" width="335" height="100" rx="16" fill="#e63946" opacity="0.9"/>
      <rect x="20" y="180" width="335" height="80" rx="12" fill="white" opacity="0.1"/>
      <rect x="20" y="280" width="335" height="80" rx="12" fill="white" opacity="0.1"/>
      <rect x="20" y="380" width="335" height="80" rx="12" fill="white" opacity="0.1"/>
      <text x="187" y="120" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#ffffff">Andamus</text>
      <text x="187" y="750" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#ffffff" opacity="0.6">Carpooling in Sardegna</text>
    </svg>
  `;

  await sharp(Buffer.from(mobileSvg))
    .png()
    .resize(750, 1334)
    .toFile(path.join(publicDir, 'screenshot-mobile.png'));
  
  console.log('Generated screenshot-mobile.png');

  // Desktop screenshot
  const desktopSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1a1a2e"/>
          <stop offset="100%" style="stop-color:#0f0f1a"/>
        </linearGradient>
      </defs>
      <rect width="1280" height="720" fill="url(#bg)"/>
      <rect x="50" y="80" width="1180" height="80" rx="16" fill="#e63946" opacity="0.9"/>
      <rect x="50" y="200" width="580" height="200" rx="12" fill="white" opacity="0.1"/>
      <rect x="650" y="200" width="580" height="200" rx="12" fill="white" opacity="0.1"/>
      <rect x="50" y="420" width="1180" height="150" rx="12" fill="white" opacity="0.05"/>
      <text x="640" y="130" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#ffffff">Andamus - Carpooling in Sardegna</text>
    </svg>
  `;

  await sharp(Buffer.from(desktopSvg))
    .png()
    .toFile(path.join(publicDir, 'screenshot-home.png'));
  
  console.log('Generated screenshot-home.png');
}

async function main() {
  try {
    await generateIcons();
    await generateOGImage();
    await generateScreenshots();
    console.log('\nAll images generated successfully!');
  } catch (error) {
    console.error('Error generating images:', error);
    process.exit(1);
  }
}

main();
