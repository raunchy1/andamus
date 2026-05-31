# Deployment Blockers

**Current Blockers:** 0

**Previous Blockers (Now Resolved):**

1. **Type**: TypeScript Strict Type Checking Error
   - **Severity**: Critical (Vercel Build Blocker)
   - **File**: `app/[locale]/cerca/page.tsx`
   - **Line**: 276
   - **Root Cause**: An incorrect method call was used for tracking events (`Analytics.track()` instead of `Analytics.trackEvent()`). The `track` method is an internal private function in `lib/analytics.ts` and is not exposed on the exported `Analytics` object.
   - **Resolution**: Updated all instances of `Analytics.track` to `Analytics.trackEvent`.

2. **Type**: TypeScript Interface Mismatch
   - **Severity**: Critical (Vercel Build Blocker)
   - **File**: `app/[locale]/cerca/page.tsx`
   - **Line**: 499, 881
   - **Root Cause**: The parent component (`page.tsx`) was attempting to pass a `cities` prop (containing the deprecated `sardinianCities` static array) to the `AlertModal` component. However, the `AlertModalProps` interface had been previously updated to remove this prop since it now relies on the `LocationCombobox` and Supabase directly.
   - **Resolution**: Removed the `cities={sardinianCities}` prop injection from the `AlertModal` JSX invocations in the parent file.