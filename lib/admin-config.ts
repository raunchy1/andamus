// Admin configuration — SERVER ONLY. Never import from client components.
// Configure additional admins via ADMIN_EMAILS env var (comma-separated, no NEXT_PUBLIC_ prefix).

const DEFAULT_ADMINS = ["cristiermurache@gmail.com"];

export const ADMIN_EMAILS = Array.from(
  new Set(
    [
      ...DEFAULT_ADMINS,
      ...(process.env.ADMIN_EMAILS || "")
        .split(",")
        .map((email) => email.trim())
        .filter(Boolean),
    ].map((e) => e.toLowerCase())
  )
);

export function isAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

export function checkIsAdmin(user: { email?: string } | null): boolean {
  return isAdmin(user?.email);
}
