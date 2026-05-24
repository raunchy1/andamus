import { z } from "zod";

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url("Invalid push endpoint URL"),
  keys: z.object({
    p256dh: z.string().min(1, "p256dh key is required"),
    auth: z.string().min(1, "auth key is required"),
  }),
});

export const pushSendSchema = z.object({
  endpoint: z.string().url("Invalid push endpoint URL"),
  title: z.string().min(1, "Title is required").max(120, "Title too long"),
  body: z.string().max(300, "Body too long").optional(),
  icon: z.string().url().optional(),
  url: z.string().url().optional(),
});

export const notificationPreferencesSchema = z.object({
  push_enabled: z.boolean().optional(),
  email_enabled: z.boolean().optional(),
  sms_enabled: z.boolean().optional(),
  booking_updates: z.boolean().optional(),
  ride_reminders: z.boolean().optional(),
  marketing: z.boolean().optional(),
});

export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;
export type PushSendInput = z.infer<typeof pushSendSchema>;
export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;
