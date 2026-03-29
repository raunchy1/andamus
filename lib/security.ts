import { createClient } from "@/lib/supabase/client";

// Rate limiting for ride creation
interface RateLimitEntry {
  count: number;
  timestamp: number;
}

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  ride_creation: { max: 10, windowMs: 24 * 60 * 60 * 1000 }, // 10 rides per day
  booking_creation: { max: 20, windowMs: 24 * 60 * 60 * 1000 }, // 20 bookings per day
  review_creation: { max: 10, windowMs: 24 * 60 * 60 * 1000 }, // 10 reviews per day
};

// In-memory rate limit store (per user)
const rateLimitStore: Record<string, RateLimitEntry> = {};

/**
 * Check rate limit for a specific action
 */
export async function checkRateLimit(
  userId: string,
  action: keyof typeof RATE_LIMITS
): Promise<{ allowed: boolean; remaining: number; resetAt?: Date }> {
  const limit = RATE_LIMITS[action];
  const key = `${userId}:${action}`;
  const now = Date.now();

  const entry = rateLimitStore[key];

  if (!entry || now - entry.timestamp > limit.windowMs) {
    // Reset if window expired
    rateLimitStore[key] = { count: 1, timestamp: now };
    return {
      allowed: true,
      remaining: limit.max - 1,
      resetAt: new Date(now + limit.windowMs),
    };
  }

  if (entry.count >= limit.max) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(entry.timestamp + limit.windowMs),
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: limit.max - entry.count,
    resetAt: new Date(entry.timestamp + limit.windowMs),
  };
}

// Input sanitization patterns
const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /<object[^>]*>.*?<\/object>/gi,
  /<embed[^>]*>.*?<\/embed>/gi,
];

const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|TABLE)\b)/gi,
  /(--|#|\/\*|\*\/)/g,
  /(\b(OR|AND)\b\s*\d+\s*=\s*\d+)/gi,
];

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== "string") return "";

  let sanitized = input.trim();

  // Remove XSS patterns
  XSS_PATTERNS.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, "");
  });

  // HTML escape
  sanitized = sanitized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");

  return sanitized;
}

/**
 * Check for SQL injection attempts
 */
export function detectSQLInjection(input: string): boolean {
  if (!input || typeof input !== "string") return false;

  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Sardinian city name
 */
export function isValidCity(city: string): boolean {
  if (!city || typeof city !== "string") return false;
  // City should be at least 2 characters and contain only letters, spaces, and hyphens
  const cityRegex = /^[a-zA-ZàèéìòùÀÈÉÌÒÙ\s'-]{2,50}$/;
  return cityRegex.test(city.trim());
}

/**
 * Validate price (should be 0 or positive number)
 */
export function isValidPrice(price: number): boolean {
  return typeof price === "number" && price >= 0 && price <= 1000;
}

/**
 * Validate seats (1-8)
 */
export function isValidSeats(seats: number): boolean {
  return typeof seats === "number" && seats >= 1 && seats <= 8;
}

/**
 * Validate date (should be today or in the future, within 1 year)
 */
export function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false;

  const date = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  return date >= now && date <= oneYearFromNow;
}

/**
 * Validate time format (HH:MM)
 */
export function isValidTime(timeStr: string): boolean {
  if (!timeStr) return false;

  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeStr);
}

/**
 * Validate review rating (1-5)
 */
export function isValidRating(rating: number): boolean {
  return typeof rating === "number" && rating >= 1 && rating <= 5;
}

/**
 * Validate review comment length
 */
export function isValidComment(comment: string): boolean {
  if (!comment) return true; // Comment is optional
  return comment.length <= 1000;
}

/**
 * Sanitize ride data before submission
 */
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

  // Validate cities
  if (!isValidCity(data.from_city)) {
    errors.push("Città di partenza non valida");
  }
  if (!isValidCity(data.to_city)) {
    errors.push("Città di arrivo non valida");
  }
  if (data.from_city.toLowerCase().trim() === data.to_city.toLowerCase().trim()) {
    errors.push("La città di partenza e arrivo devono essere diverse");
  }

  // Validate date
  if (!isValidDate(data.date)) {
    errors.push("Data non valida. Deve essere oggi o nel futuro, entro 1 anno.");
  }

  // Validate time
  if (!isValidTime(data.time)) {
    errors.push("Orario non valido");
  }

  // Validate price
  if (!isValidPrice(data.price)) {
    errors.push("Prezzo non valido (max 1000€)");
  }

  // Validate seats
  if (!isValidSeats(data.seats)) {
    errors.push("Numero di posti non valido (1-8)");
  }

  // Check for SQL injection
  const fieldsToCheck = [data.from_city, data.to_city, data.description || ""];
  if (fieldsToCheck.some((field) => detectSQLInjection(field))) {
    errors.push("Input non valido rilevato");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Sanitize the data
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

/**
 * Server-side rate limit check using Supabase
 */
export async function checkServerRateLimit(
  userId: string,
  action: string,
  maxAttempts: number = 10,
  windowHours: number = 24
): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = createClient();

  const windowStart = new Date();
  windowStart.setHours(windowStart.getHours() - windowHours);

  // Count actions in the time window
  const { count, error } = await supabase
    .from("user_actions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action", action)
    .gte("created_at", windowStart.toISOString());

  if (error) {
    // console.error("Rate limit check error:", error);
    // Allow on error to not block users
    return { allowed: true, remaining: maxAttempts };
  }

  const currentCount = count || 0;

  if (currentCount >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  // Log the action
  await supabase.from("user_actions").insert({
    user_id: userId,
    action: action,
  });

  return { allowed: true, remaining: maxAttempts - currentCount - 1 };
}
