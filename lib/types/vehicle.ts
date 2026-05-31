// Vehicle Identity System — Type Definitions
// Andamus carpooling platform

export type FuelType = "petrol" | "diesel" | "hybrid" | "electric" | "lpg" | "other";
export type TransmissionType = "manual" | "automatic" | "semi-automatic";
export type VehicleFeature =
  | "ac"
  | "usb"
  | "phone_charger"
  | "bluetooth"
  | "large_trunk"
  | "pet_friendly"
  | "non_smoker"
  | "music_friendly"
  | "quiet_ride"
  | "wheelchair_accessible"
  | "child_seat"
  | "electric"
  | "luxury"
  | "student_friendly"
  | "women_friendly";

export type ModerationStatus = "pending" | "approved" | "rejected";

export interface VehicleMake {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  logo_url: string | null;
  is_popular: boolean;
  sort_order: number;
  created_at: string;
}

export interface VehicleModel {
  id: string;
  make_id: string;
  name: string;
  slug: string;
  body_type: string | null;
  is_popular: boolean;
  sort_order: number;
  created_at: string;
}

export interface VehicleImage {
  id: string;
  vehicle_id: string;
  owner_id: string;
  storage_path: string;
  url: string;
  thumbnail_url: string | null;
  order_index: number;
  is_primary: boolean;
  moderation_status: ModerationStatus;
  created_at: string;
}

export interface Vehicle {
  id: string;
  owner_id: string;
  make_id: string | null;
  model_id: string | null;
  make_name: string;
  model_name: string;
  generation: string | null;
  year: number;
  color: string | null;
  color_hex: string | null;
  fuel_type: FuelType | null;
  transmission: TransmissionType | null;
  seats_total: number;
  seats_available: number;
  license_plate_masked: string | null;
  description: string | null;
  features: VehicleFeature[];
  verified: boolean;
  active: boolean;
  primary_vehicle: boolean;
  rides_count: number;
  created_at: string;
  updated_at: string;
  // Joined relations
  images?: VehicleImage[];
  make?: VehicleMake | null;
  model?: VehicleModel | null;
}

export interface VehicleWithImages extends Vehicle {
  images: VehicleImage[];
}

// Input types for create/update
export interface CreateVehicleInput {
  make_id?: string | null;
  model_id?: string | null;
  make_name: string;
  model_name: string;
  generation?: string | null;
  year: number;
  color?: string | null;
  color_hex?: string | null;
  fuel_type?: FuelType | null;
  transmission?: TransmissionType | null;
  seats_total?: number;
  seats_available?: number;
  license_plate_masked?: string | null;
  description?: string | null;
  features?: VehicleFeature[];
  active?: boolean;
  primary_vehicle?: boolean;
}

export interface UpdateVehicleInput extends Partial<CreateVehicleInput> {
  id: string;
}

// Vehicle completion/trust score
export interface VehicleCompletionScore {
  total: number; // 0-100
  breakdown: {
    hasVehicle: number;      // +20
    hasPhotos: number;       // +20
    hasDescription: number;  // +10
    hasFeatures: number;     // +10
    hasMultiplePhotos: number; // +20
    hasBeenUsed: number;     // +20
  };
  suggestions: string[];
}

// Vehicle feature metadata
export interface VehicleFeatureInfo {
  key: VehicleFeature;
  labelIt: string;
  labelEn: string;
  labelDe: string;
  icon: string; // emoji
}

export const VEHICLE_FEATURES: VehicleFeatureInfo[] = [
  { key: "ac", labelIt: "Aria Condizionata", labelEn: "Air Conditioning", labelDe: "Klimaanlage", icon: "❄️" },
  { key: "usb", labelIt: "USB", labelEn: "USB", labelDe: "USB", icon: "🔌" },
  { key: "phone_charger", labelIt: "Caricatore Phone", labelEn: "Phone Charger", labelDe: "Handyladegerät", icon: "📱" },
  { key: "bluetooth", labelIt: "Bluetooth", labelEn: "Bluetooth", labelDe: "Bluetooth", icon: "🎵" },
  { key: "large_trunk", labelIt: "Bagagliaio Grande", labelEn: "Large Trunk", labelDe: "Großer Kofferraum", icon: "🧳" },
  { key: "pet_friendly", labelIt: "Pet Friendly", labelEn: "Pet Friendly", labelDe: "Tierfreundlich", icon: "🐾" },
  { key: "non_smoker", labelIt: "Non Fumatori", labelEn: "Non-Smoker", labelDe: "Nichtraucher", icon: "🚭" },
  { key: "music_friendly", labelIt: "Musica OK", labelEn: "Music Friendly", labelDe: "Musikfreundlich", icon: "🎶" },
  { key: "quiet_ride", labelIt: "Viaggio Silenzioso", labelEn: "Quiet Ride", labelDe: "Ruhige Fahrt", icon: "🤫" },
  { key: "wheelchair_accessible", labelIt: "Accessibile Sedia a Rotelle", labelEn: "Wheelchair Accessible", labelDe: "Rollstuhlgerecht", icon: "♿" },
  { key: "child_seat", labelIt: "Seggiolino Bimbo", labelEn: "Child Seat", labelDe: "Kindersitz", icon: "👶" },
  { key: "electric", labelIt: "Veicolo Elettrico", labelEn: "Electric Vehicle", labelDe: "Elektrofahrzeug", icon: "⚡" },
  { key: "luxury", labelIt: "Veicolo Luxury", labelEn: "Luxury Vehicle", labelDe: "Luxusfahrzeug", icon: "💎" },
  { key: "student_friendly", labelIt: "Ideale Studenti", labelEn: "Student Friendly", labelDe: "Studierendenfreundlich", icon: "🎓" },
  { key: "women_friendly", labelIt: "Solo Donne", labelEn: "Women Friendly", labelDe: "Frauenfreundlich", icon: "👩" },
];

export const FUEL_TYPE_LABELS: Record<FuelType, { it: string; en: string; de: string }> = {
  petrol: { it: "Benzina", en: "Petrol", de: "Benzin" },
  diesel: { it: "Diesel", en: "Diesel", de: "Diesel" },
  hybrid: { it: "Ibrido", en: "Hybrid", de: "Hybrid" },
  electric: { it: "Elettrico", en: "Electric", de: "Elektrisch" },
  lpg: { it: "GPL", en: "LPG", de: "Flüssiggas" },
  other: { it: "Altro", en: "Other", de: "Sonstige" },
};

export const TRANSMISSION_LABELS: Record<TransmissionType, { it: string; en: string; de: string }> = {
  manual: { it: "Manuale", en: "Manual", de: "Manuell" },
  automatic: { it: "Automatico", en: "Automatic", de: "Automatik" },
  "semi-automatic": { it: "Semi-Automatico", en: "Semi-Automatic", de: "Halbautomatik" },
};

export const COLOR_SWATCHES = [
  { name: "Bianco", nameEn: "White", hex: "#FFFFFF" },
  { name: "Nero", nameEn: "Black", hex: "#1a1a1a" },
  { name: "Grigio", nameEn: "Gray", hex: "#808080" },
  { name: "Argento", nameEn: "Silver", hex: "#C0C0C0" },
  { name: "Blu", nameEn: "Blue", hex: "#1e3a8a" },
  { name: "Rosso", nameEn: "Red", hex: "#dc2626" },
  { name: "Verde", nameEn: "Green", hex: "#15803d" },
  { name: "Giallo", nameEn: "Yellow", hex: "#eab308" },
  { name: "Arancione", nameEn: "Orange", hex: "#ea580c" },
  { name: "Marrone", nameEn: "Brown", hex: "#92400e" },
  { name: "Beige", nameEn: "Beige", hex: "#d4b896" },
  { name: "Viola", nameEn: "Purple", hex: "#7c3aed" },
  { name: "Rosa", nameEn: "Pink", hex: "#ec4899" },
];

// Compute vehicle trust/completion score
export function computeVehicleScore(vehicle: Partial<VehicleWithImages>): VehicleCompletionScore {
  const breakdown = {
    hasVehicle: vehicle.make_name ? 20 : 0,
    hasPhotos: (vehicle.images?.length ?? 0) >= 1 ? 20 : 0,
    hasDescription: vehicle.description ? 10 : 0,
    hasFeatures: (vehicle.features?.length ?? 0) >= 1 ? 10 : 0,
    hasMultiplePhotos: (vehicle.images?.length ?? 0) >= 3 ? 20 : 0,
    hasBeenUsed: (vehicle.rides_count ?? 0) >= 1 ? 20 : 0,
  };

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);

  const suggestions: string[] = [];
  if (!breakdown.hasPhotos) suggestions.push("Aggiungi almeno una foto del veicolo (+20 punti)");
  if (!breakdown.hasDescription) suggestions.push("Scrivi una descrizione del veicolo (+10 punti)");
  if (!breakdown.hasFeatures) suggestions.push("Aggiungi i comfort del veicolo (+10 punti)");
  if (!breakdown.hasMultiplePhotos && breakdown.hasPhotos) suggestions.push("Aggiungi 3+ foto per massimizzare la fiducia (+20 punti)");

  return { total, breakdown, suggestions };
}
