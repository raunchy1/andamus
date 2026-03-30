import fs from 'fs'

// Read all Sardegna provinces
const data = JSON.parse(fs.readFileSync('scripts/sardegna-all.json', 'utf8'))

// Collect all coordinates from all provinces
let allCoords = []

for (const feature of data.features) {
  const geom = feature.geometry
  if (geom.type === 'MultiPolygon') {
    // MultiPolygon has coordinates[polygon][ring][point]
    for (const polygon of geom.coordinates) {
      for (const ring of polygon) {
        allCoords = allCoords.concat(ring)
      }
    }
  } else if (geom.type === 'Polygon') {
    // Polygon has coordinates[ring][point]
    for (const ring of geom.coordinates) {
      allCoords = allCoords.concat(ring)
    }
  }
}

console.log('Total coordinate points from all provinces:', allCoords.length)

// Calculate bounds from all points
const lons = allCoords.map(c => c[0])
const lats = allCoords.map(c => c[1])
const minLon = Math.min(...lons)
const maxLon = Math.max(...lons)
const minLat = Math.min(...lats)
const maxLat = Math.max(...lats)

console.log('Combined bounds:')
console.log('  Lon:', minLon.toFixed(4), 'to', maxLon.toFixed(4))
console.log('  Lat:', minLat.toFixed(4), 'to', maxLat.toFixed(4))

// ViewBox dimensions
const vbWidth = 500
const vbHeight = 650

// Convert geo to SVG with padding
const padding = 0.05 // 5% padding
const lonRange = maxLon - minLon
const latRange = maxLat - minLat

const pMinLon = minLon - lonRange * padding
const pMaxLon = maxLon + lonRange * padding
const pMinLat = minLat - latRange * padding
const pMaxLat = maxLat + latRange * padding

const pLonRange = pMaxLon - pMinLon
const pLatRange = pMaxLat - pMinLat

function geoToSVG(lon, lat) {
  const x = ((lon - pMinLon) / pLonRange) * vbWidth
  const y = vbHeight - ((lat - pMinLat) / pLatRange) * vbHeight // Flip Y
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }
}

// Generate SVG path for all provinces
function generatePathFromFeature(feature) {
  const geom = feature.geometry
  let d = ''
  
  if (geom.type === 'MultiPolygon') {
    for (const polygon of geom.coordinates) {
      for (const ring of polygon) {
        d += generatePathFromRing(ring)
      }
    }
  } else if (geom.type === 'Polygon') {
    for (const ring of geom.coordinates) {
      d += generatePathFromRing(ring)
    }
  }
  
  return d
}

function generatePathFromRing(ring) {
  // Sample points to reduce complexity
  const sampleRate = 3 // Take every 3rd point
  const sampled = ring.filter((_, i) => i % sampleRate === 0)
  
  if (sampled.length === 0) return ''
  
  const start = geoToSVG(sampled[0][0], sampled[0][1])
  let d = `M${start.x},${start.y}`
  
  for (let i = 1; i < sampled.length; i++) {
    const p = geoToSVG(sampled[i][0], sampled[i][1])
    d += `L${p.x},${p.y}`
  }
  
  d += 'Z '
  return d
}

// Build path for all provinces
let fullPathD = ''
for (const feature of data.features) {
  fullPathD += generatePathFromFeature(feature)
}

console.log('\n=== SVG PATH (first 500 chars) ===')
console.log(fullPathD.substring(0, 500) + '...')

// Calculate city positions
const cities = {
  Cagliari: { lon: 9.1217, lat: 39.2238 },
  Sassari: { lon: 8.5556, lat: 40.7259 },
  Olbia: { lon: 9.4992, lat: 40.9234 },
  Nuoro: { lon: 9.3310, lat: 40.3217 },
  Oristano: { lon: 8.5916, lat: 39.9036 },
  Tortoli: { lon: 9.6580, lat: 39.9281 }
}

console.log('\n=== CITY POSITIONS ===')
const cityPositions = {}
for (const [name, coord] of Object.entries(cities)) {
  const pos = geoToSVG(coord.lon, coord.lat)
  cityPositions[name] = pos
  console.log(`${name}: cx="${pos.x}" cy="${pos.y}"`)
}

// Generate complete SVG
let svg = `<svg viewBox="0 0 ${vbWidth} ${vbHeight}" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">\n`
svg += `  <path d="${fullPathD}" fill="#1a1a1a" stroke="#333" strokeWidth="1.5" />\n\n`
svg += `  {/* City markers */}\n`

for (const [name, pos] of Object.entries(cityPositions)) {
  // Adjust label position based on city location
  let labelOffsetX = 8
  let labelOffsetY = 4
  
  if (name === 'Sassari') { labelOffsetX = -55; labelOffsetY = 4; }
  else if (name === 'Oristano') { labelOffsetX = -60; labelOffsetY = 4; }
  else if (name === 'Nuoro') { labelOffsetX = 8; labelOffsetY = -10; }
  else if (name === 'Olbia') { labelOffsetX = 8; labelOffsetY = -10; }
  else if (name === 'Tortoli') { labelOffsetX = 8; labelOffsetY = 12; }
  
  svg += `  <circle cx="${pos.x}" cy="${pos.y}" r="5" fill="white" />\n`
  svg += `  <text x="${pos.x + labelOffsetX}" y="${pos.y + labelOffsetY}" fill="white" fontSize="11" fontWeight="500">${name}</text>\n`
}

// Add route lines
svg += `\n  {/* Animated route lines */}\n`
const routes = [
  ['Cagliari', 'Nuoro'],
  ['Cagliari', 'Sassari'],
  ['Nuoro', 'Sassari'],
  ['Nuoro', 'Olbia'],
  ['Tortoli', 'Cagliari'],
  ['Tortoli', 'Nuoro']
]

let delay = 0
for (const [from, to] of routes) {
  const fromPos = cityPositions[from]
  const toPos = cityPositions[to]
  const dist = Math.round(Math.sqrt(
    Math.pow(toPos.x - fromPos.x, 2) + 
    Math.pow(toPos.y - fromPos.y, 2)
  ))
  
  svg += `  <line x1="${fromPos.x}" y1="${fromPos.y}" x2="${toPos.x}" y2="${toPos.y}" stroke="#e63946" strokeWidth="2" strokeOpacity="0.8" strokeDasharray="${dist}" strokeDashoffset="${dist}" className="animate-draw-line" style={{ animationDelay: '${delay}s' }} />\n`
  delay += 0.5
}

svg += `</svg>`

console.log('\n=== COMPLETE SVG (saved to file) ===')

// Save files
fs.writeFileSync('scripts/sardinia-final.svg', svg)
fs.writeFileSync('scripts/sardinia-final-path.txt', fullPathD)
fs.writeFileSync('scripts/sardinia-cities-final.json', JSON.stringify(cityPositions, null, 2))

console.log('Saved to:')
console.log('  - scripts/sardinia-final.svg')
console.log('  - scripts/sardinia-final-path.txt')
console.log('  - scripts/sardinia-cities-final.json')

// Output for copy-paste
console.log('\n=== REACT COMPONENT ===')
console.log(svg)
