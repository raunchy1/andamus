# Loop Journal — one entry per iteration, newest first

> Format per entry:
> ## <date> — iteration <N>
> **Picked:** backlog items tackled
> **Shipped:** what actually merged (PR #, commit) / what didn't and why
> **Verification:** tsc/build/preview/production checks performed
> **Discovered:** new issues added to backlog
> **Owner actions needed:** anything requiring the human (or "none")

---

## 2026-07-02 — iteration 0 (bootstrap, manual session)

**Picked:** loop scaffolding.
**Shipped:** design v2 Phase 2H (100% token coverage, PR #1) and the performance overhaul
(middleware getClaims + onboarding cookie + parallel home fetch + preconnect + lazy Sentry
Replay + lazy GA, PR #2) were merged to main earlier today (commit 9b413c3). This entry
bootstraps the loop memory files.
**Verification:** tsc clean, next build passes, Vercel preview READY before each merge,
production deployment READY and aliased.
**Discovered:** Supabase project is PAUSED (INACTIVE) — the app cannot fetch data until the
owner restores it. Vercel functions in iad1 vs DB in eu-west-1 (region pinning queued as P0).
**Owner actions needed:** Restore the Supabase project (dashboard → andamus → Restore project).
