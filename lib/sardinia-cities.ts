// Coordinates for all Sardinian cities
export const SARDINIA_CITIES: Record<string, { lat: number; lng: number }> = {
  'Cagliari': { lat: 39.2238, lng: 9.1217 },
  'Sassari': { lat: 40.7259, lng: 8.5556 },
  'Nuoro': { lat: 40.3217, lng: 9.3310 },
  'Oristano': { lat: 39.9036, lng: 8.5916 },
  'Olbia': { lat: 40.9234, lng: 9.4992 },
  'Tortolì': { lat: 39.9281, lng: 9.6580 },
  'Lanusei': { lat: 39.8775, lng: 9.5397 },
  'Iglesias': { lat: 39.3109, lng: 8.5357 },
  'Carbonia': { lat: 39.1668, lng: 8.5220 },
  'Alghero': { lat: 40.5592, lng: 8.3195 },
  'Tempio Pausania': { lat: 40.9000, lng: 9.1000 },
  'La Maddalena': { lat: 41.2133, lng: 9.4033 },
  'Siniscola': { lat: 40.5753, lng: 9.6933 },
  'Dorgali': { lat: 40.2897, lng: 9.5861 },
  'Muravera': { lat: 39.4233, lng: 9.5767 },
  'Villacidro': { lat: 39.4567, lng: 8.7433 },
  'Sanluri': { lat: 39.5567, lng: 8.9000 },
  'Macomer': { lat: 40.2667, lng: 8.7833 },
  'Bosa': { lat: 40.2967, lng: 8.4967 },
  'Castelsardo': { lat: 40.9167, lng: 8.7167 }
};

// Get coordinates for a city
export function getCityCoordinates(cityName: string): { lat: number; lng: number } | null {
  return SARDINIA_CITIES[cityName] || null;
}

// Get static map URL for a route (using Google Static Maps API)
export function getStaticMapUrl(fromCity: string, toCity: string, apiKey: string): string {
  const from = SARDINIA_CITIES[fromCity];
  const to = SARDINIA_CITIES[toCity];
  
  if (!from || !to) {
    return '';
  }

  // Calculate center point
  const centerLat = (from.lat + to.lat) / 2;
  const centerLng = (from.lng + to.lng) / 2;

  // Build markers
  const markers = `markers=color:green%7C${from.lat},${from.lng}&markers=color:red%7C${to.lat},${to.lng}`;
  
  // Build path
  const path = `path=color:0xe63946%7Cweight:4%7C${from.lat},${from.lng}%7C${to.lat},${to.lng}`;

  return `https://maps.googleapis.com/maps/api/staticmap?center=${centerLat},${centerLng}&zoom=8&size=400x200&maptype=roadmap&${markers}&${path}&key=${apiKey}&style=feature:all%7Celement:geometry%7Ccolor:0x1a1a2e&style=feature:all%7Celement:labels.text.stroke%7Ccolor:0x1a1a2e&style=feature:all%7Celement:labels.text.fill%7Ccolor:0xffffff&style=feature:water%7Ccolor:0x0f1729`;
}

// Dark theme map styles for Google Maps
export const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#e63946" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#1e2a4a" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#2d3748" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1a1a2e" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#e63946" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1a1a2e" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1e2a4a" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0f1729" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#ffffff" }],
  },
];
