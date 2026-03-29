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
