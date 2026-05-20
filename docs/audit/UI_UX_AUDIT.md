# Andamùs — UI/UX Audit

> **Domain:** Design system, components, accessibility, responsive patterns, modals  
> **Status:** 🟡 Good visual design; accessibility and focus management need work  

---

## 1. Design System

### Foundation

| Element | Technology | Status |
|---------|-----------|--------|
| CSS Framework | Tailwind CSS 4.x | ✅ |
| Component Base | shadcn/ui + Radix | ✅ |
| Color Tokens | Custom (Sardinian sunset theme) | ✅ |
| Typography | Inter (system fallback) | ✅ |
| Spacing | Tailwind scale | ✅ |
| Icons | Lucide React | ✅ |

### Token Consistency

Colors use a custom palette with semantic naming:
- `bg-primary`, `text-primary`, `border-primary`
- Dark mode: `dark:` variants throughout

**Observation:** Consistent use of `white/60`, `white/80` opacity for secondary text. Good visual hierarchy.

---

## 2. Component Quality

### shadcn/ui Components Used

| Component | Customized | Status |
|-----------|-----------|--------|
| Button | Yes (gradient variants) | ✅ |
| Dialog | Yes | ⚠️ Missing focus trap |
| Input | Yes | ✅ |
| Select | Yes | ✅ |
| Sheet | Yes | ⚠️ Missing focus trap |
| Toast | Yes | ✅ |
| Badge | Yes | ✅ |
| Card | Yes | ✅ |
| Avatar | Yes | ✅ |
| Tabs | Yes | ✅ |
| Dropdown Menu | Yes | ✅ |

### Custom Components

| Component | Lines | Quality |
|-----------|-------|---------|
| `AuthModal` | ~300 | 🟡 Good structure, no focus trap |
| `RatingModal` | ~250 | 🟢 Recently improved with success state |
| `ChatWindow` | ~1,190 | 🔴 Monolithic, needs splitting |
| `CarInfoCard` | ~150 | 🟢 Clean |
| `CarInfoForm` | ~200 | 🟢 Clean |
| `EmptyState` | ~50 | 🟢 Reusable, well done |
| `BookingButton` | ~100 | 🟡 Okay |
| `LaunchBanner` | ~80 | 🟢 Clean |
| `BottomNav` | ~120 | 🟡 Mobile-only, okay |

---

## 3. Accessibility (a11y) Audit

### Overall Grade: 🔴 D+

| Criterion | Status | Detail |
|-----------|--------|--------|
| Focus trapping in modals | ❌ Missing | No modal traps focus |
| `aria-label` on icon buttons | ❌ Missing | Many icon buttons unlabeled |
| `aria-live` regions | ❌ Missing | Dynamic content not announced |
| Skip links | ❌ Missing | No skip-to-content link |
| Color contrast | ⚠️ Partial | Some `white/60` on light backgrounds may fail WCAG AA |
| Keyboard navigation | ⚠️ Partial | Works for basic flows, modals broken |
| Reduced motion | ✅ | `prefers-reduced-motion` respected |
| Screen reader labels | ⚠️ Partial | Some form labels missing |

### Specific Issues

#### Icon Buttons Without Labels

```tsx
// VULNERABLE — screen readers announce "button" with no context
<button onClick={onClose}><X className="h-4 w-4" /></button>

// FIXED
<button onClick={onClose} aria-label="Close dialog">
  <X className="h-4 w-4" />
</button>
```

#### Missing ARIA in Modals

```tsx
// Current: No role, no aria-modal, no aria-labelledby
<Dialog>
  <DialogContent>
    <DialogTitle>Title</DialogTitle>
  </DialogContent>
</Dialog>

// Radix Dialog SHOULD handle this, but verify props are passed through
```

#### Focus Trap Missing

None of the custom modals (`AuthModal`, `RatingModal`, `AlertModal`, `OnboardingModal`, `SafetyButton`) implement focus trapping. Users can tab outside the modal while it's open.

**Fix:** Use Radix Dialog's built-in focus trap (if used) or add `react-focus-lock`.

---

## 4. Modal Audit

| Modal | Focus Trap | ARIA | Escape to Close | Click Outside |
|-------|-----------|------|-----------------|---------------|
| `AuthModal` | ❌ No | ⚠️ Partial | ✅ Yes | ✅ Yes |
| `RatingModal` | ❌ No | ⚠️ Partial | ✅ Yes | ✅ Yes |
| `AlertModal` | ❌ No | ⚠️ Partial | ✅ Yes | ✅ Yes |
| `OnboardingModal` | ❌ No | ⚠️ Partial | ✅ Yes | ✅ Yes |
| `SafetyButton` | ❌ No | ⚠️ Partial | ✅ Yes | ✅ Yes |
| `Dialog` (shadcn) | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

**Observation:** shadcn/ui `Dialog` has proper a11y. Custom modals built on top may be stripping it.

---

## 5. Responsive Patterns

### Breakpoints

| Breakpoint | Usage |
|------------|-------|
| `sm` (640px) | Minor adjustments |
| `md` (768px) | Layout switches |
| `lg` (1024px) | Full desktop layout |
| `xl` (1280px) | Max-width containers |

### Mobile UX

| Feature | Status |
|---------|--------|
| Safe area insets | ✅ `env(safe-area-inset-*)` |
| Touch targets | ✅ Min 44px |
| Bottom nav | ✅ Mobile-only |
| PWA install prompt | ✅ |
| Viewport meta | ✅ Correct |

### `useDeviceType` Hydration Risk

```tsx
// lib/hooks.ts
export function useDeviceType() {
  const [device, setDevice] = useState("mobile"); // Default = mobile
  useEffect(() => {
    setDevice(window.innerWidth < 768 ? "mobile" : "desktop");
  }, []);
  return device;
}
```

**Problem:** Server renders as `"mobile"`, client may hydrate as `"desktop"`. This causes a hydration mismatch if the component renders different DOM trees based on device type.

**Fix:** Use CSS-only responsive patterns (`hidden md:block`, `md:hidden`) instead of JS device detection for layout differences.

---

## 6. Loading States

| Page/Component | Loading State | Quality |
|----------------|--------------|---------|
| Search results | Skeleton cards | 🟢 Good |
| Ride detail | Spinner | 🟡 Okay |
| Profile page | Skeleton sections | 🟢 Good |
| Chat | Skeleton messages | 🟡 Okay |
| Admin dashboard | Spinner | 🔴 Missing skeleton |
| Stripe checkout | Redirect to Stripe | 🟢 Good |

**Observation:** Loading states exist but are **inconsistent** across pages. Standardize on skeletons for all data-fetching UIs.

---

## 7. Empty States

### `EmptyState` Component

Reusable component for empty lists, search results, and error states.

```tsx
<EmptyState
  icon={<Search className="h-12 w-12" />}
  title={t("noResults")}
  description={t("tryDifferentSearch")}
/>
```

**Grade:** 🟢 A- — Well-designed, localized, consistent.

---

## 8. Form UX

### Offer Ride Form (`offri/page.tsx`)

| Aspect | Status |
|--------|--------|
| Field validation | ⚠️ Basic, no Zod |
| Error messages | 🟢 Inline, localized |
| Progressive disclosure | 🟡 All fields visible at once |
| Auto-save | ❌ None |
| Confirm on leave | ❌ None |

### Search Form (`cerca/page.tsx`)

| Aspect | Status |
|--------|--------|
| Location autocomplete | 🟢 Google Places |
| Date picker | 🟢 Native date input |
| Passenger count | 🟢 Stepper |
| Preset filters | ⚠️ Limited |
| Search history | ❌ None |

---

## 9. Animations

| Animation | Implementation | Performance | Accessibility |
|-----------|---------------|-------------|---------------|
| Page transitions | CSS transitions | ✅ GPU-accelerated | ✅ Respects reduced motion |
| Modal open/close | CSS + Radix | ✅ Smooth | ⚠️ No focus management |
| Skeleton shimmer | Tailwind animate | ✅ Lightweight | ✅ |
| Premium effects | Framer Motion? | ⚠️ Heavy on critical paths | ✅ Respects reduced motion |

**Observation:** Some "premium" effects (blur, gradient animations) appear on critical paths and may cause jank on low-end devices.

---

## 10. Recommendations

| Priority | Action | Effort |
|----------|--------|--------|
| P2 | Add focus trapping to all custom modals | Low |
| P2 | Add `aria-label` to all icon buttons | Low |
| P2 | Add `aria-live` regions for dynamic content | Low |
| P2 | Add skip-to-content link | Low |
| P2 | Fix `useDeviceType` hydration risk | Low |
| P2 | Standardize loading states (all skeletons) | Medium |
| P2 | Add form auto-save (offer ride) | Medium |
| P3 | Audit color contrast ratios | Low |
| P3 | Reduce premium animation complexity on mobile | Low |
