import { z } from "zod";

export const createRideSchema = z.object({
  from_city: z.string().min(1, "From city is required").max(100, "City name too long"),
  to_city: z.string().min(1, "To city is required").max(100, "City name too long"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM"),
  seats: z.number().int().min(1, "At least 1 seat required").max(8, "Max 8 seats"),
  price: z.number().min(0, "Price cannot be negative").max(1000, "Price too high"),
  smoking_allowed: z.boolean().optional().nullable(),
  pets_allowed: z.boolean().optional().nullable(),
  large_luggage: z.boolean().optional().nullable(),
  music_preference: z.enum(["quiet", "music", "talk"]).optional().nullable(),
  women_only: z.boolean().optional().nullable(),
  students_only: z.boolean().optional().nullable(),
  description: z.string().max(500, "Description too long").optional().nullable(),
});

export const updateRideSchema = createRideSchema.partial().extend({
  id: z.string().uuid("Invalid ride ID"),
});

export const rideQuerySchema = z.object({
  from: z.string().min(1).max(100).optional(),
  to: z.string().min(1).max(100).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const rideIdSchema = z.object({
  id: z.string().uuid("Invalid ride ID"),
});

export type CreateRideInput = z.infer<typeof createRideSchema>;
export type UpdateRideInput = z.infer<typeof updateRideSchema>;
export type RideQueryInput = z.infer<typeof rideQuerySchema>;
export type RideIdInput = z.infer<typeof rideIdSchema>;
