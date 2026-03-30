#!/usr/bin/env node

/**
 * Generate accurate Sardinia SVG from real geographic data
 * Uses known coordinates for Sardinia's coastline
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// City coordinates (longitude, latitude)
const cities = {
  Cagliari: { lon: 9.1217, lat: 39.2238 },
  Sassari: { lon: 8.5556, lat: 40.7259 },
  Olbia: { lon: 9.4992, lat: 40.9234 },
  Nuoro: { lon: 9.3310, lat: 40.3217 },
  Oristano: { lon: 8.5916, lat: 39.9036 },
  Tortoli: { lon: 9.6580, lat: 39.9281 }
};

// Real Sardinia coastline coordinates (approximate key points)
// Traced from actual geographic map
const sardiniaCoastline = [
  // North coast (going clockwise from northwest)
  { lon: 8.15, lat: 41.23 },   // Capo Falcone area
  { lon: 8.35, lat: 41.18 },
  { lon: 8.55, lat: 41.12 },
  { lon: 8.85, lat: 41.15 },
  { lon: 9.15, lat: 41.18 },
  { lon: 9.45, lat: 41.15 },
  { lon: 9.65, lat: 41.10 },   // Near Olbia
  { lon: 9.75, lat: 41.05 },
  
  // Northeast / East coast
  { lon: 9.80, lat: 40.85 },
  { lon: 9.78, lat: 40.60 },
  { lon: 9.75, lat: 40.40 },
  { lon: 9.72, lat: 40.25 },
  { lon: 9.70, lat: 40.10 },
  { lon: 9.68, lat: 39.95 },
  { lon: 9.65, lat: 39.80 },
  
  // Southeast
  { lon: 9.60, lat: 39.55 },
  { lon: 9.50, lat: 39.30 },
  { lon: 9.40, lat: 39.10 },
  { lon: 9.25, lat: 39.00 },   // Southeast tip area
  
  // South coast
  { lon: 9.00, lat: 38.90 },
  { lon: 8.75, lat: 38.85 },
  { lon: 8.50, lat: 38.90 },   // Southwest area
  { lon: 8.35, lat: 39.00 },
  
  // West coast
  { lon: 8.20, lat: 39.20 },
  { lon: 8.10, lat: 39.50 },
  { lon: 8.05, lat: 39.80 },
  { lon: 8.08, lat: 40.10 },
  { lon: 8.15, lat: 40.40 },
  { lon: 8.20, lat: 40.70 },
  { lon: 8.18, lat: 40.95 },
  { lon: 8.15, lat: 41.15 },
  { lon: 8.15, lat: 41.23 }    // Back to start
];

// Convert geographic coordinates to SVG coordinates
function geoToSVG(lon, lat, bounds) {
  const { minLon, maxLon, minLat, maxLat, width, height } = bounds;
  
  const x = ((lon - minLon) / (maxLon - minLon)) * width;
  const y = height - ((lat - minLat) / (maxLat - minLat)) * height;
  
  return { x: Math.round(x), y: Math.round(y) };
}

// Generate smooth SVG path from coastline points
function generatePath(points, bounds) {
  if (points.length === 0) return '';
  
  // Start
  const start = geoToSVG(points[0].lon, points[0].lat, bounds);
  let d = `M ${start.x},${start.y} `;
  
  // Create smooth curve through points using cubic bezier
  for (let i = 1; i < points.length; i++) {
    const curr = geoToSVG(points[i].lon, points[i].lat, bounds);
    
    if (i === 1) {
      d += `L ${curr.x},${curr.y} `;
    } else {
      // Use quadratic bezier for smoother curves
      const prev = geoToSVG(points[i-1].lon, points[i-1].lat, bounds);
      const cpX = (prev.x + curr.x) / 2;
      const cpY = (prev.y + curr.y) / 2;
      d += `Q ${prev.x},${prev.y} ${curr.x},${curr.y} `;
    }
  }
  
  d += 'Z';
  return d;
}

// Calculate bounds from all coordinates
function calculateBounds(points, cities) {
  const allPoints = [...points, ...Object.values(cities)];
  const lons = allPoints.map(p => p.lon);
  const lats = allPoints.map(p => p.lat);
  
  return {
    minLon: Math.min(...lons) - 0.2,
    maxLon: Math.max(...lons) + 0.2,
    minLat: Math.min(...lats) - 0.2,
    maxLat: Math.max(...lats) + 0.2,
    width: 400,
    height: 520
  };
}

// Main function
function main() {
  console.log('Generating accurate Sardinia SVG...\n');
  
  const bounds = calculateBounds(sardiniaCoastline, cities);
  console.log('Geographic bounds:');
  console.log(`  Longitude: ${bounds.minLon.toFixed(2)} to ${bounds.maxLon.toFixed(2)}`);
  console.log(`  Latitude: ${bounds.minLat.toFixed(2)} to ${bounds.maxLat.toFixed(2)}`);
  console.log(`  ViewBox: ${bounds.width}x${bounds.height}\n`);
  
  // Generate coastline path
  const pathD = generatePath(sardiniaCoastline, bounds);
  
  // Calculate city positions
  const cityPositions = {};
  for (const [name, coords] of Object.entries(cities)) {
    cityPositions[name] = geoToSVG(coords.lon, coords.lat, bounds);
  }
  
  console.log('City SVG positions:');
  for (const [name, pos] of Object.entries(cityPositions)) {
    console.log(`  ${name}: x=${pos.x}, y=${pos.y}`);
  }
  
  // Generate SVG content
  let svg = `<svg viewBox="0 0 ${bounds.width} ${bounds.height}" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">\n`;
  svg += `  {/* Real Sardinia coastline - geographic coordinates */}\n`;
  svg += `  <path\n`;
  svg += `    d="${pathD}"\n`;
  svg += `    fill="#1a1a1a"\n`;
  svg += `    stroke="#333"\n`;
  svg += `    strokeWidth="1.5"\n`;
  svg += `  />\n\n`;
  
  // Add city dots and labels
  svg += `  {/* City markers */}\n`;
  for (const [name, pos] of Object.entries(cityPositions)) {
    // Adjust label position based on city
    let labelOffsetX = 8;
    let labelOffsetY = 4;
    
    if (name === 'Sassari') { labelOffsetX = -60; labelOffsetY = 4; }
    if (name === 'Oristano') { labelOffsetX = -65; labelOffsetY = 4; }
    if (name === 'Nuoro') { labelOffsetX = 8; labelOffsetY = -8; }
    
    svg += `  <circle cx="${pos.x}" cy="${pos.y}" r="5" fill="white" />\n`;
    svg += `  <text x="${pos.x + labelOffsetX}" y="${pos.y + labelOffsetY}" fill="white" fontSize="11" fontWeight="500">${name}</text>\n`;
  }
  
  // Add route lines
  svg += `\n  {/* Animated route lines */}\n`;
  const routes = [
    ['Cagliari', 'Nuoro'],
    ['Cagliari', 'Sassari'],
    ['Nuoro', 'Sassari'],
    ['Nuoro', 'Olbia'],
    ['Tortoli', 'Cagliari'],
    ['Tortoli', 'Nuoro']
  ];
  
  let delay = 0;
  for (const [from, to] of routes) {
    const fromPos = cityPositions[from];
    const toPos = cityPositions[to];
    const dist = Math.round(Math.sqrt(
      Math.pow(toPos.x - fromPos.x, 2) + 
      Math.pow(toPos.y - fromPos.y, 2)
    ));
    
    svg += `  <line x1="${fromPos.x}" y1="${fromPos.y}" x2="${toPos.x}" y2="${toPos.y}" stroke="#e63946" strokeWidth="2" strokeOpacity="0.8" strokeDasharray="${dist}" strokeDashoffset="${dist}" className="animate-draw-line" style={{ animationDelay: '${delay}s' }} />\n`;
    delay += 0.5;
  }
  
  svg += `</svg>`;
  
  // Save SVG file
  const outputDir = path.join(__dirname);
  const svgPath = path.join(outputDir, 'sardinia-map.svg');
  fs.writeFileSync(svgPath, svg);
  
  // Save the path data for React component
  const pathDataPath = path.join(outputDir, 'sardinia-path.txt');
  fs.writeFileSync(pathDataPath, pathD);
  
  // Save city positions
  const citiesPath = path.join(outputDir, 'sardinia-cities.json');
  fs.writeFileSync(citiesPath, JSON.stringify(cityPositions, null, 2));
  
  console.log(`\n✅ Generated files:`);
  console.log(`  ${svgPath}`);
  console.log(`  ${pathDataPath}`);
  console.log(`  ${citiesPath}`);
  
  console.log('\n=== SVG PATH ===');
  console.log(pathD);
  
  console.log('\n=== COMPLETE SVG ===');
  console.log(svg);
  
  // Also output React component format
  console.log('\n=== REACT COMPONENT SNIPPET ===');
  console.log(`{/* SVG Map of Sardinia - Real Geographic Coordinates */}`);
  console.log(`<div className="relative mx-auto max-w-[450px] mb-8">`);
  console.log(`  <svg viewBox="0 0 ${bounds.width} ${bounds.height}" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">`);
  console.log(`    <path`);
  console.log(`      d="${pathD}"`);
  console.log(`      fill="#1a1a1a"`);
  console.log(`      stroke="#333"`);
  console.log(`      strokeWidth="1.5"`);
  console.log(`    />`);
  
  for (const [name, pos] of Object.entries(cityPositions)) {
    let labelOffsetX = 8;
    let labelOffsetY = 4;
    if (name === 'Sassari') { labelOffsetX = -60; labelOffsetY = 4; }
    if (name === 'Oristano') { labelOffsetX = -65; labelOffsetY = 4; }
    if (name === 'Nuoro') { labelOffsetX = 8; labelOffsetY = -8; }
    console.log(`    <circle cx="${pos.x}" cy="${pos.y}" r="5" fill="white" />`);
    console.log(`    <text x="${pos.x + labelOffsetX}" y="${pos.y + labelOffsetY}" fill="white" fontSize="11" fontWeight="500">${name}</text>`);
  }
  
  delay = 0;
  for (const [from, to] of routes) {
    const fromPos = cityPositions[from];
    const toPos = cityPositions[to];
    const dist = Math.round(Math.sqrt(
      Math.pow(toPos.x - fromPos.x, 2) + 
      Math.pow(toPos.y - fromPos.y, 2)
    ));
    console.log(`    <line x1="${fromPos.x}" y1="${fromPos.y}" x2="${toPos.x}" y2="${toPos.y}" stroke="#e63946" strokeWidth="2" strokeOpacity="0.8" strokeDasharray="${dist}" strokeDashoffset="${dist}" className="animate-draw-line" style={{ animationDelay: '${delay}s' }} />`);
    delay += 0.5;
  }
  
  console.log(`  </svg>`);
  console.log(`</div>`);
}

main();
