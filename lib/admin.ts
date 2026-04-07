// Admin configuration
// Add admin emails to .env.local as comma-separated list:
// NEXT_PUBLIC_ADMIN_EMAILS=admin1@example.com,admin2@example.com

export const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
  .split(',')
  .map(email => email.trim())
  .filter(Boolean);

/**
 * Check if an email belongs to an admin
 * @param email - User email to check
 * @returns boolean indicating if user is admin
 */
export function isAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

/**
 * Check if current user is admin (for client-side use)
 * Requires user object from Supabase Auth
 */
export function checkIsAdmin(user: { email?: string } | null): boolean {
  return isAdmin(user?.email);
}
