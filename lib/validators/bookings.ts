import { z } from "zod";

export const createBookingSchema = z.object({
  ride_id: z.string().uuid("Invalid ride ID"),
  seats_requested: z.number().int().min(1, "At least 1 seat required").max(8, "Max 8 seats").default(1),
  message: z.string().max(500, "Message too long").optional().nullable(),
});

export const updateBookingStatusSchema = z.object({
  booking_id: z.string().uuid("Invalid booking ID"),
  status: z.enum(["pending", "confirmed", "rejected", "cancelled", "completed"]),
});

export const bookingIdSchema = z.object({
  booking_id: z.string().uuid("Invalid booking ID"),
});

export const bookingQuerySchema = z.object({
  status: z.enum(["pending", "confirmed", "rejected", "cancelled", "completed"]).optional(),
  role: z.enum(["driver", "passenger"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type BookingIdInput = z.infer<typeof bookingIdSchema>;
export type BookingQueryInput = z.infer<typeof bookingQuerySchema>;
