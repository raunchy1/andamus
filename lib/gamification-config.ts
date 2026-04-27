// Pure configuration & helpers (safe for client + server)

export const POINTS = {
  FIRST_RIDE: 50,
  RIDE_PUBLISHED: 10,
  BOOKING_CONFIRMED: 15,
  FIVE_STAR_REVIEW: 20,
  IDENTITY_VERIFIED: 30,
};

export const LEVELS = [
  { min: 0, max: 99, key: "traveler", name: "Viaggiatore", emoji: "🚗" },
  { min: 100, max: 299, key: "explorer", name: "Esploratore", emoji: "🗺️" },
  { min: 300, max: 599, key: "sardodoc", name: "Sardo DOC", emoji: "🦁" },
  { min: 600, max: 999, key: "roadking", name: "Re della Strada", emoji: "👑" },
  { min: 1000, max: Infinity, key: "sardlegend", name: "Leggenda Sarda", emoji: "⭐" },
];

export const BADGES = {
  FIRST_RIDE: {
    type: "first_ride",
    name: "Prima Corsa",
    description: "Hai pubblicato la tua prima corsa",
    icon: "🚗",
    color: "bg-blue-500",
  },
  WELCOME: {
    type: "welcome",
    name: "Benvenuto",
    description: "Profilo completato",
    icon: "👋",
    color: "bg-green-500",
  },
  VERIFIED: {
    type: "verified",
    name: "Verificato",
    description: "Identità verificata",
    icon: "✅",
    color: "bg-purple-500",
  },
  FIVE_STARS: {
    type: "five_stars",
    name: "5 Stelle",
    description: "Hai ricevuto la tua prima recensione 5 stelle",
    icon: "⭐",
    color: "bg-yellow-500",
  },
  HABITUE: {
    type: "habitue",
    name: "Habitué",
    description: "10 corse pubblicate",
    icon: "🎯",
    color: "bg-orange-500",
  },
  AMBASSADOR: {
    type: "ambassador",
    name: "Ambasciatore",
    description: "50 corse pubblicate",
    icon: "🏆",
    color: "bg-red-500",
  },
};

export interface Badge {
  id?: string;
  user_id?: string;
  type?: string;
  earned_at?: string;
}

export function getLevelInfo(points: number): {
  current: typeof LEVELS[0];
  next: typeof LEVELS[0] | null;
  progress: number;
} {
  const current = LEVELS.find((l) => points >= l.min && points <= l.max) || LEVELS[0];
  const currentIndex = LEVELS.findIndex((l) => l.name === current.name);
  const next = currentIndex < LEVELS.length - 1 ? LEVELS[currentIndex + 1] : null;

  let progress = 100;
  if (next) {
    const range = next.min - current.min;
    const earned = points - current.min;
    progress = Math.min(100, Math.max(0, (earned / range) * 100));
  }

  return { current, next, progress };
}

export function getBadgeDetails(badgeType: string) {
  return (
    Object.values(BADGES).find((b) => b.type === badgeType) || {
      type: badgeType,
      name: badgeType,
      description: "",
      icon: "🏅",
      color: "bg-gray-500",
    }
  );
}
