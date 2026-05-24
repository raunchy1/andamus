import { z } from "zod";

export const recurringRideSchema = z.object({
  from_city: z.string().min(1, "From city is required").max(100),
  to_city: z.string().min(1, "To city is required").max(100),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM"),
  seats: z.number().int().min(1).max(8).default(1),
  price: z.number().min(0).max(1000).default(0),
  days_of_week: z.array(z.number().int().min(0).max(6)).min(1, "Select at least one day"),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be YYYY-MM-DD"),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be YYYY-MM-DD").optional().nullable(),
  smoking_allowed: z.boolean().optional().nullable(),
  pets_allowed: z.boolean().optional().nullable(),
  large_luggage: z.boolean().optional().nullable(),
  women_only: z.boolean().optional().nullable(),
  students_only: z.boolean().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
});

export const recurringRideIdSchema = z.object({
  id: z.string().uuid("Invalid recurring ride ID"),
});

export const generateRecurringSchema = z.object({
  days_ahead: z.number().int().min(1).max(90).default(30),
});

export type RecurringRideInput = z.infer<typeof recurringRideSchema>;
export type RecurringRideIdInput = z.infer<typeof recurringRideIdSchema>;
export type GenerateRecurringInput = z.infer<typeof generateRecurringSchema>;
