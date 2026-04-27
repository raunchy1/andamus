// Admin configuration (safe for client + server)
// Add admin emails to .env.local as comma-separated list:
// ADMIN_EMAILS=admin1@example.com,admin2@example.com

export const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
  .split(',')
  .map(email => email.trim())
  .filter(Boolean);

export function isAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

export function checkIsAdmin(user: { email?: string } | null): boolean {
  return isAdmin(user?.email);
}
