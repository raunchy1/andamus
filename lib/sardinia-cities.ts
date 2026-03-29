// Sardinian cities with coordinates for weather and navigation
export const SARDINIA_CITIES: Record<string, { lat: number; lng: number }> = {
  'Cagliari': { lat: 39.2238, lng: 9.1217 },
  'Sassari': { lat: 40.7259, lng: 8.5556 },
  'Nuoro': { lat: 40.3217, lng: 9.3310 },
  'Oristano': { lat: 39.9036, lng: 8.5916 },
  'Olbia': { lat: 40.9234, lng: 9.4992 },
  'Tortolì': { lat: 39.9267, lng: 9.6572 },
  'Lanusei': { lat: 39.8756, lng: 9.5414 },
  'Iglesias': { lat: 39.3094, lng: 8.5370 },
  'Carbonia': { lat: 39.1672, lng: 8.5222 },
  'Alghero': { lat: 40.5580, lng: 8.3190 },
  'Tempio Pausania': { lat: 40.6814, lng: 9.1081 },
  'La Maddalena': { lat: 41.2176, lng: 9.4051 },
  'Siniscola': { lat: 40.5719, lng: 9.6944 },
  'Dorgali': { lat: 40.2933, lng: 9.5844 },
  'Muravera': { lat: 39.4186, lng: 9.5756 },
  'Villacidro': { lat: 39.4586, lng: 8.7369 },
  'Sanluri': { lat: 39.5617, lng: 8.8975 },
  'Macomer': { lat: 40.2644, lng: 8.7753 },
  'Bosa': { lat: 40.2983, lng: 8.5011 },
  'Castelsardo': { lat: 40.9108, lng: 8.7160 },
  'Arzachena': { lat: 41.0786, lng: 9.3817 },
  'Golfo Aranci': { lat: 40.9944, lng: 9.6194 },
  'Porto Torres': { lat: 40.8347, lng: 8.4022 },
  'Sorso': { lat: 40.7989, lng: 8.5764 },
  'Ittiri': { lat: 40.5906, lng: 8.5528 },
  'Ozieri': { lat: 40.5858, lng: 9.0014 },
  'Cuglieri': { lat: 40.1867, lng: 8.5650 },
  'Buggerru': { lat: 39.3961, lng: 8.4011 },
  'Guspini': { lat: 39.5408, lng: 8.6339 },
  'Pula': { lat: 38.9908, lng: 9.0014 },
  'Quartu Sant\'Elena': { lat: 39.2422, lng: 9.1833 },
  'Sinnai': { lat: 39.3025, lng: 9.2031 },
  'San Gavino Monreale': { lat: 39.5514, lng: 8.7936 },
  'Villanovaforru': { lat: 39.6294, lng: 8.8703 },
  'Arbus': { lat: 39.5333, lng: 8.6000 },
  'Fonni': { lat: 40.1186, lng: 9.2539 },
  'Orgosolo': { lat: 40.2050, lng: 9.3542 },
  'Oliena': { lat: 40.2697, lng: 9.4033 },
  'Bitti': { lat: 40.4761, lng: 9.3811 },
  'Lula': { lat: 40.4706, lng: 9.4869 },
  'Tertenia': { lat: 39.6961, lng: 9.5808 },
  'Cardedu': { lat: 39.7900, lng: 9.6311 },
  'Bari Sardo': { lat: 39.8436, lng: 9.6436 },
  'Lotzorai': { lat: 39.9667, lng: 9.6614 },
  'Santa Maria Navarrese': { lat: 40.0511, lng: 9.6867 },
  'Baunei': { lat: 40.0306, lng: 9.8483 },
  'Talana': { lat: 40.0406, lng: 9.4956 },
  'Posada': { lat: 40.6311, lng: 9.7211 },
  'Torpe': { lat: 40.7611, lng: 9.6786 },
};

// Get coordinates for a city
export function getCityCoordinates(city: string): { lat: number; lng: number } | null {
  return SARDINIA_CITIES[city] || null;
}

// Distance matrix between major cities (in km)
// Used for CO2 calculations and statistics
export const CITY_DISTANCES: Record<string, Record<string, number>> = {
  'Cagliari': {
    'Sassari': 210,
    'Nuoro': 170,
    'Oristano': 90,
    'Olbia': 270,
    'Tortolì': 150,
    'Lanusei': 135,
    'Iglesias': 55,
    'Carbonia': 65,
    'Alghero': 240,
    'Tempio Pausania': 260,
    'La Maddalena': 300,
    'Siniscola': 200,
    'Dorgali': 220,
    'Muravera': 90,
    'Sanluri': 70,
    'Macomer': 150,
    'Bosa': 180,
    'Castelsardo': 240,
    'Arzachena': 280,
    'Porto Torres': 230,
    'Pula': 30,
    'Quartu Sant\'Elena': 10,
  },
  'Sassari': {
    'Cagliari': 210,
    'Nuoro': 130,
    'Oristano': 140,
    'Olbia': 100,
    'Tortolì': 170,
    'Alghero': 35,
    'Tempio Pausania': 85,
    'La Maddalena': 125,
    'Castelsardo': 35,
    'Arzachena': 105,
    'Porto Torres': 25,
    'Sorso': 10,
    'Macomer': 80,
    'Bosa': 70,
    'Ozieri': 65,
  },
  'Nuoro': {
    'Cagliari': 170,
    'Sassari': 130,
    'Oristano': 120,
    'Olbia': 140,
    'Tortolì': 60,
    'Lanusei': 45,
    'Dorgali': 50,
    'Siniscola': 90,
    'Fonni': 35,
    'Orgosolo': 20,
    'Oliena': 15,
    'Bitti': 30,
    'Lula': 25,
    'Macomer': 55,
    'Ozieri': 70,
  },
  'Oristano': {
    'Cagliari': 90,
    'Sassari': 140,
    'Nuoro': 120,
    'Olbia': 150,
    'Bosa': 50,
    'Macomer': 50,
    'Villanovaforru': 35,
    'San Gavino Monreale': 40,
    'Sanluri': 45,
    'Cuglieri': 45,
    'Arborea': 25,
  },
  'Olbia': {
    'Cagliari': 270,
    'Sassari': 100,
    'Nuoro': 140,
    'Oristano': 150,
    'Tortolì': 95,
    'La Maddalena': 45,
    'Arzachena': 25,
    'Tempio Pausania': 40,
    'Posada': 60,
    'Siniscola': 70,
    'Golfo Aranci': 20,
    'San Teodoro': 25,
    'Budoni': 35,
  },
  'Tortolì': {
    'Cagliari': 150,
    'Sassari': 170,
    'Nuoro': 60,
    'Olbia': 95,
    'Lanusei': 15,
    'Cardedu': 35,
    'Bari Sardo': 25,
    'Lotzorai': 45,
    'Santa Maria Navarrese': 55,
    'Baunei': 75,
    'Tertenia': 20,
  },
  'Alghero': {
    'Sassari': 35,
    'Cagliari': 240,
    'Oristano': 130,
    'Bosa': 50,
    'Porto Torres': 35,
    'Castelsardo': 60,
  },
  'Iglesias': {
    'Cagliari': 55,
    'Carbonia': 25,
    'Villacidro': 30,
    'Sanluri': 55,
    'Guspini': 35,
    'Arbus': 45,
    'Buggerru': 35,
  },
  'Carbonia': {
    'Cagliari': 65,
    'Iglesias': 25,
    'Villacidro': 30,
    'Sanluri': 55,
    'Guspini': 25,
    'Arbus': 40,
    'Portoscuso': 15,
    'Carloforte': 50,
  },
  'Tempio Pausania': {
    'Sassari': 85,
    'Olbia': 40,
    'Arzachena': 35,
    'La Maddalena': 50,
    'Posada': 55,
  },
  'Dorgali': {
    'Nuoro': 50,
    'Cagliari': 220,
    'Olbia': 95,
    'Cala Gonone': 5,
    'Siniscola': 80,
    'Baunei': 45,
  },
  'Macomer': {
    'Sassari': 80,
    'Nuoro': 55,
    'Oristano': 50,
    'Bosa': 35,
    'Ozieri': 25,
    'Bitti': 45,
  },
  'Bosa': {
    'Oristano': 50,
    'Sassari': 70,
    'Alghero': 50,
    'Macomer': 35,
    'Cagliari': 180,
  },
  'Castelsardo': {
    'Sassari': 35,
    'Alghero': 60,
    'Porto Torres': 45,
    'Santa Teresa Gallura': 50,
  },
  'Arzachena': {
    'Olbia': 25,
    'Tempio Pausania': 35,
    'La Maddalena': 30,
    'Palau': 10,
  },
  'La Maddalena': {
    'Olbia': 45,
    'Arzachena': 30,
    'Palau': 20,
  },
  'Porto Torres': {
    'Sassari': 25,
    'Alghero': 35,
    'Castelsardo': 45,
    'Sorso': 15,
  },
  'Muravera': {
    'Cagliari': 90,
    'Tortolì': 55,
    'Villacidro': 40,
    'Sanluri': 70,
  },
  'Sanluri': {
    'Cagliari': 70,
    'Oristano': 45,
    'Iglesias': 55,
    'Carbonia': 55,
    'Muravera': 70,
    'Villanovaforru': 20,
  },
  'Pula': {
    'Cagliari': 30,
    'Teulada': 35,
    'Domus de Maria': 25,
    'Sant\'Antioco': 90,
  },
  'Quartu Sant\'Elena': {
    'Cagliari': 10,
    'Muravera': 85,
    'Pula': 35,
  },
};

// Get distance between two cities (returns km or null if unknown)
export function getDistanceBetweenCities(from: string, to: string): number | null {
  if (from === to) return 0;
  
  // Check direct distance
  const fromDistances = CITY_DISTANCES[from];
  if (fromDistances && fromDistances[to]) {
    return fromDistances[to];
  }
  
  // Check reverse distance
  const toDistances = CITY_DISTANCES[to];
  if (toDistances && toDistances[from]) {
    return toDistances[from];
  }
  
  // Approximate distance based on coordinates if available
  const fromCoords = SARDINIA_CITIES[from];
  const toCoords = SARDINIA_CITIES[to];
  if (fromCoords && toCoords) {
    // Haversine formula for approximate distance
    const R = 6371; // Earth's radius in km
    const dLat = (toCoords.lat - fromCoords.lat) * Math.PI / 180;
    const dLon = (toCoords.lng - fromCoords.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(fromCoords.lat * Math.PI / 180) * Math.cos(toCoords.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
  }
  
  return null;
}

// Calculate CO2 saved (kg) - average car emission is ~120g/km per passenger
export function calculateCO2Saved(distanceKm: number, passengers: number = 1): number {
  // Assuming each passenger in carpooling saves 120g per km compared to driving alone
  const emissionPerKm = 0.12; // kg per km
  return Math.round(distanceKm * emissionPerKm * passengers * 10) / 10;
}

// Dark map styles for Google Maps
export const darkMapStyles = [
  {
    featureType: "all",
    elementType: "geometry",
    stylers: [{ color: "#1a1a2e" }],
  },
  {
    featureType: "all",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#1a1a2e" }],
  },
  {
    featureType: "all",
    elementType: "labels.text.fill",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0f1729" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#2d3748" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#4a5568" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#1e2a4a" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1e2a4a" }],
  },
];
