#!/usr/bin/env node
/**
 * Andamusu Swarm Orchestrator
 * Coordinates multiple AI agents to develop/fix the Andamusu project
 */

const fs = require('fs');
const path = require('path');

// Task definitions based on the audit report
const TASKS = [
  // P0 - Critical (4 tasks)
  { id: 1, priority: 'P0', category: 'security', title: 'Fix OAuth callback open redirect', file: 'app/[locale]/auth/callback/route.ts', description: 'Whitelist redirects, use fixed base URL instead of X-Forwarded-Host' },
  { id: 2, priority: 'P0', category: 'security', title: 'Add OAuth state parameter', file: 'app/[locale]/auth/callback/route.ts', description: 'Generate and verify state parameter for CSRF protection' },
  { id: 3, priority: 'P0', category: 'database', title: 'Fix messages RLS for drivers', file: 'supabase/migrations', description: 'Add driver_id check to messages SELECT policy' },
  { id: 4, priority: 'P0', category: 'database', title: 'Fix bookings RLS for drivers', file: 'supabase/migrations', description: 'Add driver UPDATE policy on bookings table' },

  // P1 - High (8 tasks)
  { id: 5, priority: 'P1', category: 'security', title: 'Wire up rate limiting', file: 'lib/rate-limit.ts', description: 'Import and apply rate limiting to API routes and server actions' },
  { id: 6, priority: 'P1', category: 'security', title: 'Fix email template XSS', file: 'lib/emails/', description: 'Escape user data in email templates or use React Email' },
  { id: 7, priority: 'P1', category: 'database', title: 'Tighten INSERT policies', file: 'supabase/migrations', description: 'Add WITH CHECK (auth.uid() = user_id) to notifications, badges, referrals, user_actions, push_subscriptions' },
  { id: 8, priority: 'P1', category: 'database', title: 'Create waiting_list table', file: 'supabase/migrations', description: 'Create migration for waiting_list table referenced by coming-soon page' },
  { id: 9, priority: 'P1', category: 'database', title: 'Resolve duplicate group tables', file: 'supabase/migrations', description: 'Audit carpool_groups vs public.groups and drop unused table' },
  { id: 10, priority: 'P1', category: 'performance', title: 'Dynamic import heavy deps', file: 'admin/page.tsx, offri/page.tsx', description: 'Dynamic import recharts and @react-google-maps/api' },
  { id: 11, priority: 'P1', category: 'integrations', title: 'Fix Stripe API version', file: 'lib/stripe.ts', description: 'Use stable Stripe API version instead of future-dated' },
  { id: 12, priority: 'P1', category: 'database', title: 'Add missing indexes', file: 'supabase/migrations', description: 'Add indexes for frequently queried columns' },

  // P2 - Medium (6 tasks)
  { id: 13, priority: 'P2', category: 'ux', title: 'Add focus trapping to modals', file: 'AuthModal, RatingModal, AlertModal, OnboardingModal, SafetyButton', description: 'Use Radix Dialog focus trap or react-focus-lock' },
  { id: 14, priority: 'P2', category: 'ux', title: 'Fix useDeviceType hydration', file: 'lib/hooks.ts', description: 'Use CSS-only responsive patterns to avoid hydration mismatch' },
  { id: 15, priority: 'P2', category: 'performance', title: 'Reduce PWA cache TTL', file: 'Serwist config', description: 'Reduce Supabase GET cache from 24h to 5 minutes' },
  { id: 16, priority: 'P2', category: 'architecture', title: 'Begin Server Component migration', file: 'app/[locale]/', description: 'Convert data fetching from useEffect to Server Components' },
  { id: 17, priority: 'P2', category: 'database', title: 'Drop duplicate Italian columns in rides', file: 'supabase/migrations', description: 'Standardize on English names, drop Italian aliases' },
  { id: 18, priority: 'P2', category: 'ux', title: 'Complete German translations', file: 'messages/de.json', description: 'Add missing German i18n strings (~90% coverage)' },

  // P3 - Low (4 tasks)
  { id: 19, priority: 'P3', category: 'maintenance', title: 'Move admin email to DB', file: 'lib/admin-config.ts', description: 'Store admin emails in database or env var instead of hardcoded' },
  { id: 20, priority: 'P3', category: 'maintenance', title: 'Add down migrations', file: 'supabase/migrations', description: 'Document rollback steps or add down migrations' },
  { id: 21, priority: 'P3', category: 'features', title: 'Design cancellation/refund flow', file: 'N/A', description: 'Design and implement booking cancellation policy' },
  { id: 22, priority: 'P3', category: 'maintenance', title: 'Fix all lint errors', file: 'Multiple files', description: 'Fix 32 ESLint errors and 41 warnings' },

  // Component Refactoring (20 tasks)
  { id: 23, priority: 'P2', category: 'refactor', title: 'Refactor profilo/page.tsx - Part 1', file: 'app/[locale]/profilo/page.tsx', description: 'Extract ProfileHeader component from monolithic profile page' },
  { id: 24, priority: 'P2', category: 'refactor', title: 'Refactor profilo/page.tsx - Part 2', file: 'app/[locale]/profilo/page.tsx', description: 'Extract RidesList component' },
  { id: 25, priority: 'P2', category: 'refactor', title: 'Refactor profilo/page.tsx - Part 3', file: 'app/[locale]/profilo/page.tsx', description: 'Extract BookingsList component' },
  { id: 26, priority: 'P2', category: 'refactor', title: 'Refactor profilo/page.tsx - Part 4', file: 'app/[locale]/profilo/page.tsx', description: 'Extract StatsSection component' },
  { id: 27, priority: 'P2', category: 'refactor', title: 'Refactor profilo/page.tsx - Part 5', file: 'app/[locale]/profilo/page.tsx', description: 'Extract SettingsPanel component' },
  { id: 28, priority: 'P2', category: 'refactor', title: 'Refactor cerca/page.tsx - Part 1', file: 'app/[locale]/cerca/page.tsx', description: 'Extract SearchFilters component' },
  { id: 29, priority: 'P2', category: 'refactor', title: 'Refactor cerca/page.tsx - Part 2', file: 'app/[locale]/cerca/page.tsx', description: 'Extract SearchResultsList component' },
  { id: 30, priority: 'P2', category: 'refactor', title: 'Refactor cerca/page.tsx - Part 3', file: 'app/[locale]/cerca/page.tsx', description: 'Extract SearchMap component' },
  { id: 31, priority: 'P2', category: 'refactor', title: 'Refactor cerca/page.tsx - Part 4', file: 'app/[locale]/cerca/page.tsx', description: 'Extract useSearch custom hook' },
  { id: 32, priority: 'P2', category: 'refactor', title: 'Refactor ChatWindow.tsx - Part 1', file: 'components/ChatWindow.tsx', description: 'Extract MessageList component' },
  { id: 33, priority: 'P2', category: 'refactor', title: 'Refactor ChatWindow.tsx - Part 2', file: 'components/ChatWindow.tsx', description: 'Extract MessageInput component' },
  { id: 34, priority: 'P2', category: 'refactor', title: 'Refactor ChatWindow.tsx - Part 3', file: 'components/ChatWindow.tsx', description: 'Extract ChatHeader component' },
  { id: 35, priority: 'P2', category: 'refactor', title: 'Refactor ChatWindow.tsx - Part 4', file: 'components/ChatWindow.tsx', description: 'Extract useChat custom hook' },
  { id: 36, priority: 'P2', category: 'refactor', title: 'Refactor ChatWindow.tsx - Part 5', file: 'components/ChatWindow.tsx', description: 'Extract MessageBubble component' },
  { id: 37, priority: 'P2', category: 'refactor', title: 'Add aria-labels to icon buttons', file: 'components/', description: 'Add aria-label or aria-labelledby to all icon buttons' },
  { id: 38, priority: 'P2', category: 'refactor', title: 'Extract shared modal component', file: 'components/', description: 'Create reusable Modal wrapper with focus trap' },
  { id: 39, priority: 'P2', category: 'refactor', title: 'Create useRideSearch hook', file: 'lib/hooks.ts', description: 'Extract ride search logic into custom hook' },
  { id: 40, priority: 'P2', category: 'refactor', title: 'Create useBooking hook', file: 'lib/hooks.ts', description: 'Extract booking logic into custom hook' },
  { id: 41, priority: 'P2', category: 'refactor', title: 'Create useChat hook', file: 'lib/hooks.ts', description: 'Extract chat logic into custom hook' },
  { id: 42, priority: 'P2', category: 'refactor', title: 'Extract API client utilities', file: 'lib/', description: 'Create typed API client for all endpoints' },

  // Testing (15 tasks)
  { id: 43, priority: 'P2', category: 'testing', title: 'Add RLS policy tests - messages', file: '__tests__/rls/', description: 'Test messages RLS policies for both driver and passenger' },
  { id: 44, priority: 'P2', category: 'testing', title: 'Add RLS policy tests - bookings', file: '__tests__/rls/', description: 'Test bookings RLS policies for CRUD operations' },
  { id: 45, priority: 'P2', category: 'testing', title: 'Add RLS policy tests - rides', file: '__tests__/rls/', description: 'Test rides RLS policies' },
  { id: 46, priority: 'P2', category: 'testing', title: 'Add unit tests for auth actions', file: '__tests__/unit/', description: 'Test auth server actions' },
  { id: 47, priority: 'P2', category: 'testing', title: 'Add unit tests for ride actions', file: '__tests__/unit/', description: 'Test ride server actions' },
  { id: 48, priority: 'P2', category: 'testing', title: 'Add unit tests for booking actions', file: '__tests__/unit/', description: 'Test booking server actions' },
  { id: 49, priority: 'P2', category: 'testing', title: 'Add unit tests for gamification', file: '__tests__/unit/', description: 'Test gamification logic and badge awarding' },
  { id: 50, priority: 'P2', category: 'testing', title: 'Add E2E test - search flow', file: 'e2e/', description: 'End-to-end test for ride search and filter' },
  { id: 51, priority: 'P2', category: 'testing', title: 'Add E2E test - booking flow', file: 'e2e/', description: 'End-to-end test for booking request and confirmation' },
  { id: 52, priority: 'P2', category: 'testing', title: 'Add E2E test - chat flow', file: 'e2e/', description: 'End-to-end test for chat between driver and passenger' },
  { id: 53, priority: 'P2', category: 'testing', title: 'Add E2E test - payment flow', file: 'e2e/', description: 'End-to-end test for Stripe payment' },
  { id: 54, priority: 'P2', category: 'testing', title: 'Add E2E test - profile flow', file: 'e2e/', description: 'End-to-end test for profile editing and verification' },
  { id: 55, priority: 'P2', category: 'testing', title: 'Add visual regression tests', file: '__tests__/visual/', description: 'Setup visual regression testing with Playwright' },
  { id: 56, priority: 'P2', category: 'testing', title: 'Add performance tests', file: '__tests__/perf/', description: 'Add Lighthouse CI performance tests' },
  { id: 57, priority: 'P2', category: 'testing', title: 'Add accessibility tests', file: '__tests__/a11y/', description: 'Add axe-core accessibility tests' },

  // Performance Optimization (15 tasks)
  { id: 58, priority: 'P2', category: 'performance', title: 'Code split admin dashboard', file: 'app/[locale]/admin/page.tsx', description: 'Use dynamic imports for admin charts and heavy components' },
  { id: 59, priority: 'P2', category: 'performance', title: 'Code split route map', file: 'components/RouteMap.tsx', description: 'Dynamic import Google Maps component' },
  { id: 60, priority: 'P2', category: 'performance', title: 'Optimize images', file: 'public/', description: 'Convert images to WebP/AVIF, add proper sizes' },
  { id: 61, priority: 'P2', category: 'performance', title: 'Add image placeholders', file: 'components/', description: 'Add blur placeholders for images' },
  { id: 62, priority: 'P2', category: 'performance', title: 'Optimize bundle - remove unused deps', file: 'package.json', description: 'Audit and remove unused dependencies' },
  { id: 63, priority: 'P2', category: 'performance', title: 'Add React.memo to list items', file: 'components/', description: 'Memoize list item components to prevent re-renders' },
  { id: 64, priority: 'P2', category: 'performance', title: 'Add useMemo for expensive computations', file: 'components/', description: 'Memoize expensive computations in components' },
  { id: 65, priority: 'P2', category: 'performance', title: 'Implement virtual scrolling for lists', file: 'components/', description: 'Add virtual scrolling for long ride/booking lists' },
  { id: 66, priority: 'P2', category: 'performance', title: 'Add request deduplication', file: 'lib/', description: 'Implement request deduplication for Supabase queries' },
  { id: 67, priority: 'P2', category: 'performance', title: 'Optimize font loading', file: 'app/layout.tsx', description: 'Add font-display: swap and preload critical fonts' },
  { id: 68, priority: 'P2', category: 'performance', title: 'Add service worker precache config', file: 'app/sw.ts', description: 'Optimize Serwist precache configuration' },
  { id: 69, priority: 'P2', category: 'performance', title: 'Implement stale-while-revalidate', file: 'lib/', description: 'Add SWR pattern for ride data fetching' },
  { id: 70, priority: 'P2', category: 'performance', title: 'Add edge caching headers', file: 'next.config.mjs', description: 'Add Cache-Control headers for static assets' },
  { id: 71, priority: 'P2', category: 'performance', title: 'Optimize CSS bundle', file: 'app/globals.css', description: 'Remove unused Tailwind classes, purify CSS' },
  { id: 72, priority: 'P2', category: 'performance', title: 'Add loading skeletons', file: 'components/', description: 'Add skeleton screens for all major pages' },

  // Type Safety (10 tasks)
  { id: 73, priority: 'P2', category: 'types', title: 'Remove all any types - Part 1', file: 'lib/', description: 'Replace explicit any types in lib/ with proper types' },
  { id: 74, priority: 'P2', category: 'types', title: 'Remove all any types - Part 2', file: 'app/', description: 'Replace explicit any types in app/ with proper types' },
  { id: 75, priority: 'P2', category: 'types', title: 'Add Zod schemas for API inputs', file: 'lib/schemas.ts', description: 'Create Zod schemas for all API route inputs' },
  { id: 76, priority: 'P2', category: 'types', title: 'Add Zod schemas for server actions', file: 'lib/schemas.ts', description: 'Create Zod schemas for all server action inputs' },
  { id: 77, priority: 'P2', category: 'types', title: 'Generate types from Supabase schema', file: 'types/', description: 'Use supabase gen types to generate TypeScript types' },
  { id: 78, priority: 'P2', category: 'types', title: 'Add strict TypeScript config', file: 'tsconfig.json', description: 'Enable strict mode and noImplicitAny' },
  { id: 79, priority: 'P2', category: 'types', title: 'Type all API responses', file: 'app/api/', description: 'Add explicit return types for all API routes' },
  { id: 80, priority: 'P2', category: 'types', title: 'Type all server actions', file: 'lib/', description: 'Add explicit return types for all server actions' },
  { id: 81, priority: 'P2', category: 'types', title: 'Create shared DTO types', file: 'types/dto.ts', description: 'Create Data Transfer Object types for API communication' },
  { id: 82, priority: 'P2', category: 'types', title: 'Add branded types for IDs', file: 'types/brands.ts', description: 'Use branded types for UUIDs to prevent mixing' },

  // Documentation (8 tasks)
  { id: 83, priority: 'P3', category: 'docs', title: 'Document component API', file: 'components/', description: 'Add JSDoc comments to all reusable components' },
  { id: 84, priority: 'P3', category: 'docs', title: 'Document server actions', file: 'lib/', description: 'Add JSDoc comments to all server actions' },
  { id: 85, priority: 'P3', category: 'docs', title: 'Document API routes', file: 'app/api/', description: 'Add OpenAPI/Swagger comments to API routes' },
  { id: 86, priority: 'P3', category: 'docs', title: 'Create architecture decision records', file: 'docs/adr/', description: 'Document key architectural decisions' },
  { id: 87, priority: 'P3', category: 'docs', title: 'Update README with setup guide', file: 'README.md', description: 'Improve README with detailed setup instructions' },
  { id: 88, priority: 'P3', category: 'docs', title: 'Create onboarding guide', file: 'docs/ONBOARDING.md', description: 'Create guide for new developers' },
  { id: 89, priority: 'P3', category: 'docs', title: 'Document deployment process', file: 'docs/DEPLOYMENT.md', description: 'Document Vercel deployment and environment setup' },
  { id: 90, priority: 'P3', category: 'docs', title: 'Create troubleshooting guide', file: 'docs/TROUBLESHOOTING.md', description: 'Document common issues and solutions' },

  // DevOps / Tooling (10 tasks)
  { id: 91, priority: 'P3', category: 'devops', title: 'Setup GitHub Actions CI', file: '.github/workflows/', description: 'Create CI workflow for lint, test, build' },
  { id: 92, priority: 'P3', category: 'devops', title: 'Add pre-commit hooks', file: '.husky/', description: 'Setup Husky with lint-staged' },
  { id: 93, priority: 'P3', category: 'devops', title: 'Add Dependabot config', file: '.github/dependabot.yml', description: 'Configure automated dependency updates' },
  { id: 94, priority: 'P3', category: 'devops', title: 'Setup staging environment', file: 'vercel.json', description: 'Configure Vercel preview deployments' },
  { id: 95, priority: 'P3', category: 'devops', title: 'Add Docker support', file: 'Dockerfile', description: 'Create Dockerfile for local development' },
  { id: 96, priority: 'P3', category: 'devops', title: 'Add docker-compose', file: 'docker-compose.yml', description: 'Create docker-compose with Supabase local' },
  { id: 97, priority: 'P3', category: 'devops', title: 'Setup Sentry source maps', file: 'sentry.client.config.ts', description: 'Configure source map upload for Sentry' },
  { id: 98, priority: 'P3', category: 'devops', title: 'Add health check endpoint', file: 'app/api/health/route.ts', description: 'Create health check API endpoint' },
  { id: 99, priority: 'P3', category: 'devops', title: 'Add environment validation', file: 'lib/env.ts', description: 'Validate required environment variables at startup' },
  { id: 100, priority: 'P3', category: 'devops', title: 'Add error boundary components', file: 'components/', description: 'Add React error boundaries for all major sections' },
];

class SwarmOrchestrator {
  constructor(tasks) {
    this.tasks = tasks;
    this.results = [];
    this.running = new Set();
    this.completed = new Set();
    this.failed = new Set();
  }

  getStats() {
    return {
      total: this.tasks.length,
      running: this.running.size,
      completed: this.completed.size,
      failed: this.failed.size,
      pending: this.tasks.length - this.completed.size - this.failed.size - this.running.size
    };
  }

  getNextBatch(batchSize = 5) {
    const pending = this.tasks.filter(t => 
      !this.running.has(t.id) && 
      !this.completed.has(t.id) && 
      !this.failed.has(t.id)
    );
    return pending.slice(0, batchSize);
  }

  markRunning(id) {
    this.running.add(id);
  }

  markCompleted(id, result) {
    this.running.delete(id);
    this.completed.add(id);
    this.results.push({ id, status: 'completed', result });
  }

  markFailed(id, error) {
    this.running.delete(id);
    this.failed.add(id);
    this.results.push({ id, status: 'failed', error });
  }

  printStatus() {
    const stats = this.getStats();
    console.log(`\n=== SWARM STATUS ===`);
    console.log(`Total: ${stats.total} | Running: ${stats.running} | Completed: ${stats.completed} | Failed: ${stats.failed} | Pending: ${stats.pending}`);
    console.log(`Progress: ${((stats.completed + stats.failed) / stats.total * 100).toFixed(1)}%`);
    console.log(`====================\n`);
  }

  exportReport() {
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.getStats(),
      completed: this.results.filter(r => r.status === 'completed'),
      failed: this.results.filter(r => r.status === 'failed'),
      pending: this.tasks.filter(t => !this.completed.has(t.id) && !this.failed.has(t.id)).map(t => ({ id: t.id, title: t.title }))
    };

    const reportPath = path.join(__dirname, '..', 'swarm-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Report exported to: ${reportPath}`);
    return report;
  }
}

// Main execution
if (require.main === module) {
  const orchestrator = new SwarmOrchestrator(TASKS);
  
  console.log('🐝 Andamusu Swarm Orchestrator');
  console.log(`📋 Loaded ${TASKS.length} tasks`);
  console.log('\nTask distribution:');
  
  const byPriority = {};
  const byCategory = {};
  TASKS.forEach(t => {
    byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
    byCategory[t.category] = (byCategory[t.category] || 0) + 1;
  });
  
  console.log('By Priority:', byPriority);
  console.log('By Category:', byCategory);
  
  orchestrator.printStatus();
  
  // Export initial report
  orchestrator.exportReport();
}

module.exports = { SwarmOrchestrator, TASKS };
