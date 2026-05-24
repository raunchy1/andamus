import { z } from "zod";

export const assignRoleSchema = z.object({
  user_id: z.string().uuid("Invalid user ID"),
  role: z.enum(["admin", "moderator", "support"]),
});

export const removeRoleSchema = z.object({
  user_id: z.string().uuid("Invalid user ID"),
  role: z.enum(["admin", "moderator", "support"]),
});

export const adminUserQuerySchema = z.object({
  email: z.string().email().optional(),
  role: z.enum(["admin", "moderator", "support"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
export type RemoveRoleInput = z.infer<typeof removeRoleSchema>;
export type AdminUserQueryInput = z.infer<typeof adminUserQuerySchema>;
