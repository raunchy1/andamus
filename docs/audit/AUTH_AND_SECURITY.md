# Andamùs — Auth & Security Audit

> **Domain:** Authentication, authorization, secrets management, XSS, CSRF, injection attacks  
> **Status:** 🔴 Critical security vulnerabilities present  

---

## 1. Authentication Flow

### Methods Supported

| Method | Implementation | Status |
|--------|---------------|--------|
| OAuth (Google) | Supabase Auth | ⚠️ Vulnerable |
| Email + Password | Supabase Auth | ✅ Standard |
| Email OTP (Magic Link) | Supabase Auth | ✅ Standard |

### OAuth Callback Flow

**File:** `app/[locale]/auth/callback/route.ts`

```typescript
// VULNERABLE CODE
const requestUrl = new URL(request.url);
const code = requestUrl.searchParams.get("code");
const next = requestUrl.searchParams.get("next") ?? "/";

// ... exchange code for session ...

return NextResponse.redirect(new URL(next, request.url));
```

---

## 2. Critical Vulnerabilities (P0)

### P0-1: Open Redirect via `X-Forwarded-Host`

**Severity:** 🔴 Critical  
**CVSS Estimate:** 6.1 (Medium-High)  
**Attack Vector:** Remote, unauthenticated

**Vulnerability:** The OAuth callback constructs redirect URLs using `request.url`, which can be manipulated via the `X-Forwarded-Host` header. An attacker can redirect users to arbitrary domains after OAuth completion.

**Attack Scenario:**
1. Attacker sends victim a link: `https://andamus.vercel.app/it/auth/callback?code=...&next=/dashboard`
2. Victim completes OAuth with Google.
3. Attacker injects `X-Forwarded-Host: evil.com`.
4. Victim is redirected to `https://evil.com/it/dashboard`.
5. Attacker harvests session or phishes the user.

**Fix:**
```typescript
// WHITELIST-BASED REDIRECT
const ALLOWED_REDIRECTS = ["/", "/profilo", "/cerca", "/admin"];
const next = requestUrl.searchParams.get("next") ?? "/";
const safeNext = ALLOWED_REDIRECTS.includes(next) ? next : "/";
return NextResponse.redirect(new URL(safeNext, process.env.NEXT_PUBLIC_APP_URL));
```

**Also required:** Use a fixed base URL (`NEXT_PUBLIC_APP_URL`) instead of `request.url` for redirect construction.

### P0-2: Missing OAuth `state` Parameter (CSRF)

**Severity:** 🔴 Critical  
**Attack Vector:** Cross-site request forgery

**Vulnerability:** The OAuth flow does not generate or verify a `state` parameter. This allows CSRF attacks where an attacker can force a victim to log in with the attacker's account.

**Attack Scenario:**
1. Attacker starts OAuth flow, gets `code` from Google.
2. Attacker tricks victim into visiting: `https://andamus.vercel.app/it/auth/callback?code=ATTACKER_CODE`
3. Victim's browser exchanges the code, creating a session linked to the **attacker's** account.
4. Any actions victim takes (booking rides, adding payment info) are on attacker's account.

**Fix:**
```typescript
// BEFORE redirecting to OAuth provider
const state = crypto.randomUUID();
await supabase.auth.setSession({ ... });
// Or store state in httpOnly cookie
cookies().set("oauth_state", state, { httpOnly: true, secure: true, sameSite: "lax" });

// IN callback
const expectedState = cookies().get("oauth_state")?.value;
const receivedState = requestUrl.searchParams.get("state");
if (expectedState !== receivedState) {
  return NextResponse.json({ error: "Invalid state" }, { status: 403 });
}
```

---

## 3. High-Priority Security Issues (P1)

### P1-1: Unused Rate Limiting

**File:** `lib/rate-limit.ts` exists but is **not imported anywhere**.

**Impact:** All API routes and server actions are vulnerable to brute force and abuse.

**Fix:** Import and apply rate limiting to:
- `/api/stripe/checkout` — Prevent card testing
- `/api/chat/send` — Prevent spam
- Auth actions (login, signup) — Prevent brute force
- `searchRides` — Prevent scraping

### P1-2: Email Template XSS

**File:** `lib/emails/` templates

**Vulnerability:** User-controlled data (names, messages, ride details) is interpolated into HTML email templates without escaping.

**Example (hypothetical):**
```tsx
// VULNERABLE
<div>Hello {userName}</div>
// If userName = "<script>alert('xss')</script>", email clients may execute.
```

**Fix:** Use a template engine with auto-escaping (e.g., React's JSX in `@react-email/components`), or manually escape HTML entities.

### P1-3: Admin Email Hardcoded

**File:** `lib/admin-config.ts`

```typescript
export const ADMIN_EMAILS = ["cristiermurache@gmail.com"];
```

**Impact:** Single point of failure; no way to add admins without code deploy.

**Fix:** Store admin list in database or environment variable.

---

## 4. Session Management

### Cookie Configuration

| Attribute | Status |
|-----------|--------|
| `httpOnly` | ✅ Set by Supabase |
| `secure` | ✅ Set in production |
| `sameSite` | ✅ `lax` |
| `maxAge` | ✅ 7 days |

### Session Refresh

Middleware correctly refreshes sessions via `supabase.auth.getUser()`. ✅

### Logout

Logout calls `supabase.auth.signOut()` and clears cookies. ✅

---

## 5. Authorization

### Admin Check

```typescript
// lib/admin.ts
export function isAdmin(userId: string): boolean {
  return ADMIN_EMAILS.includes(user?.email);
}
```

**Issue:** Checks by email, not by a database role. If a user's email changes, they lose admin access.

**Fix:** Add `is_admin` boolean to `profiles` table and check that.

### RLS as Authorization

The application relies heavily on RLS for authorization. This is correct in principle, but the RLS bugs (P0-3, P0-4) mean authorization is partially broken.

---

## 6. Secrets Management

### Environment Variables

| Secret | Client Exposure | Risk |
|--------|----------------|------|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | ✅ Low risk (RLS enforced) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Public | ⚠️ Restrict by HTTP referrer |
| `STRIPE_SECRET_KEY` | Server only | ✅ Safe |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | ✅ Safe |
| `CRON_SECRET` | Server only | ✅ Safe |
| `RESEND_API_KEY` | Server only | ✅ Safe |

### Google Maps API Key

The `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is exposed client-side (required for Maps JS API). **Ensure** the Google Cloud Console has HTTP referrer restrictions set to `https://andamus.vercel.app/*`.

---

## 7. Input Validation

### API Routes

Most API routes do **not** validate request bodies with a schema library (Zod, Yup, Joi).

**Example vulnerability:**
```typescript
// /api/chat/send
const { bookingId, content } = await request.json();
// No validation! bookingId could be anything.
```

**Fix:** Add Zod schemas to all API routes:
```typescript
import { z } from "zod";

const sendMessageSchema = z.object({
  bookingId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

const body = sendMessageSchema.parse(await request.json());
```

---

## 8. Security Headers

### Current Headers (Vercel Default)

| Header | Status |
|--------|--------|
| `X-Frame-Options` | ✅ `DENY` |
| `X-Content-Type-Options` | ✅ `nosniff` |
| `Referrer-Policy` | ✅ `strict-origin-when-cross-origin` |
| `Content-Security-Policy` | ❌ Missing |
| `Permissions-Policy` | ❌ Missing |

**Fix:** Add CSP in `next.config.mjs`:
```javascript
async headers() {
  return [{
    source: "/:path*",
    headers: [{
      key: "Content-Security-Policy",
      value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://*.googleapis.com https://*.gstatic.com; connect-src 'self' https://*.supabase.co https://api.stripe.com; frame-src https://js.stripe.com https://hooks.stripe.com; font-src 'self';"
    }]
  }];
}
```

---

## 9. Recommendations

| Priority | Action | Effort |
|----------|--------|--------|
| P0 | Fix open redirect in OAuth callback (whitelist + fixed base URL) | Low |
| P0 | Add and verify OAuth `state` parameter | Low |
| P1 | Wire up `lib/rate-limit.ts` to all API routes and auth actions | Medium |
| P1 | Escape user data in email templates | Low |
| P1 | Move admin list from hardcoded email to database flag | Low |
| P1 | Add Zod validation to all API routes | Medium |
| P2 | Add `is_admin` boolean to `profiles` table | Low |
| P2 | Add CSP and Permissions-Policy headers | Low |
| P2 | Restrict Google Maps API key by HTTP referrer | Low |
