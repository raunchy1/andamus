# Failed Deployments Report

| Deployment ID | Age | Status | Root Cause |
|---|---|---|---|
| andamus-cyfrmmhcr | 31m | Error | TypeScript Error: `Property 'track' does not exist on type...` in `app/[locale]/cerca/page.tsx` |
| andamus-ogz9mvi5v | 38m | Error | TypeScript Error: `Property 'track' does not exist on type...` in `app/[locale]/cerca/page.tsx` |
| andamus-izr6a63yj | 46m | Error | TypeScript Error: `Property 'track' does not exist on type...` in `app/[locale]/cerca/page.tsx` |
| andamus-lne7nen2s | 59m | Error | TypeScript Error: `Property 'track' does not exist on type...` in `app/[locale]/cerca/page.tsx` |
| andamus-2tlblvynu | 59m | Error | TypeScript Error: `Property 'track' does not exist on type...` in `app/[locale]/cerca/page.tsx` |
| andamus-a30zeyocx | 1h | Error | TypeScript Error: `Property 'track' does not exist on type...` in `app/[locale]/cerca/page.tsx` |

**Affected Files:**
- `app/[locale]/cerca/page.tsx` (Analytics.track vs trackEvent)
- `components/cerca/AlertModal.tsx` (cities prop type mismatch)
