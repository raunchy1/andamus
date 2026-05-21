// Input sanitization patterns (pure utilities — safe to import from client or server)
const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /<object[^>]*>.*?<\/object>/gi,
  /<embed[^>]*>.*?<\/embed>/gi,
];

// No /g flag — stateful regex with /g causes false negatives on repeated calls
const SQL_INJECTION_PATTERNS = [
  /(--|#|\/\*|\*\/)/,
  /(\b(OR|AND)\b\s*\d+\s*=\s*\d+)/i,
  /(\b(DROP\s+TABLE|DELETE\s+FROM|INSERT\s+INTO|EXEC\s*\()\b)/i,
];

/** Sanitize user input to prevent XSS */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== "string") return "";

  let sanitized = input.trim();

  XSS_PATTERNS.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, "");
  });

  sanitized = sanitized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");

  return sanitized;
}

/** Check for SQL injection attempts */
export function detectSQLInjection(input: string): boolean {
  if (!input || typeof input !== "string") return false;
  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidCity(city: string): boolean {
  if (!city || typeof city !== "string") return false;
  const cityRegex = /^[a-zA-ZàèéìòùÀÈÉÌÒÙ\s'-]{2,50}$/;
  return cityRegex.test(city.trim());
}

export function isValidPrice(price: number): boolean {
  return typeof price === "number" && price >= 0 && price <= 1000;
}

export function isValidSeats(seats: number): boolean {
  return typeof seats === "number" && seats >= 1 && seats <= 8;
}

export function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false;

  const date = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  return date >= now && date <= oneYearFromNow;
}

export function isValidTime(timeStr: string): boolean {
  if (!timeStr) return false;
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeStr);
}

export function isValidRating(rating: number): boolean {
  return typeof rating === "number" && rating >= 1 && rating <= 5;
}

export function isValidComment(comment: string): boolean {
  if (!comment) return true;
  return comment.length <= 1000;
}

/**
 * Detect suspicious patterns that may indicate spam or abuse.
 * Returns an array of detected violation reasons (empty if clean).
 */
export function detectSuspiciousPatterns(data: {
  from_city: string;
  to_city: string;
  notes?: string;
  price: number;
}): string[] {
  const violations: string[] = [];
  const text = `${data.from_city} ${data.to_city} ${data.notes || ""}`.toLowerCase();

  // Repeated characters (e.g., "aaaaaa", "!!!!!!!!")
  if (/(.)(\1{5,})/.test(text)) {
    violations.push("repeated_chars");
  }

  // Excessive capitalization
  const words = text.split(/\s+/).filter((w) => w.length > 2);
  const allCapsWords = words.filter((w) => /^[A-Z]{3,}$/.test(w));
  if (words.length > 0 && allCapsWords.length / words.length > 0.5) {
    violations.push("excessive_caps");
  }

  // Suspiciously low price for long distance (heuristic)
  if (data.price < 1 && data.price > 0) {
    violations.push("suspicious_price");
  }

  // Common spam keywords in Italian/English
  const spamKeywords = [
    "spam", "scam", "truffa", "soldi", "cash", "pagamento esterno",
    "whatsapp", "telegram", "contatto diretto", "paga qui",
  ];
  if (spamKeywords.some((k) => text.includes(k))) {
    violations.push("spam_keywords");
  }

  return violations;
}

export function sanitizeRideData(data: {
  from_city: string;
  to_city: string;
  date: string;
  time: string;
  price: number;
  seats: number;
  description?: string;
}): {
  valid: boolean;
  errors: string[];
  sanitized?: typeof data;
} {
  const errors: string[] = [];

  if (!isValidCity(data.from_city)) {
    errors.push("Città di partenza non valida");
  }
  if (!isValidCity(data.to_city)) {
    errors.push("Città di arrivo non valida");
  }
  if (data.from_city.toLowerCase().trim() === data.to_city.toLowerCase().trim()) {
    errors.push("La città di partenza e arrivo devono essere diverse");
  }

  if (!isValidDate(data.date)) {
    errors.push("Data non valida. Deve essere oggi o nel futuro, entro 1 anno.");
  }

  if (!isValidTime(data.time)) {
    errors.push("Orario non valido");
  }

  if (!isValidPrice(data.price)) {
    errors.push("Prezzo non valido (max 1000€)");
  }

  if (!isValidSeats(data.seats)) {
    errors.push("Numero di posti non valido (1-8)");
  }

  const fieldsToCheck = [data.from_city, data.to_city, data.description || ""];
  if (fieldsToCheck.some((field) => detectSQLInjection(field))) {
    errors.push("Input non valido rilevato");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    sanitized: {
      from_city: sanitizeInput(data.from_city),
      to_city: sanitizeInput(data.to_city),
      date: data.date,
      time: data.time,
      price: Math.round(data.price),
      seats: Math.round(data.seats),
      description: data.description ? sanitizeInput(data.description) : undefined,
    },
  };
}
