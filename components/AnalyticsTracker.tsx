"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { capturePageview, identifyUser } from "@/lib/posthog";
import { setSentryUser, setSentryTags } from "@/lib/sentry";
import { createClient } from "@/lib/supabase/client";
import { reportWebVitals } from "@/lib/vitals";
import { useDeviceType } from "@/components/view-mode";
import { useLocale } from "next-intl";

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const deviceType = useDeviceType();
  const locale = useLocale();

  // Identify user + set context on mount
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser()
      .then(({ data }: { data: { user: import('@supabase/supabase-js').User | null } }) => {
        const user = data?.user;
        if (user) {
          identifyUser(user.id, {
            email: user.email,
            name: user.user_metadata?.name || user.user_metadata?.full_name,
          });
          setSentryUser({
            id: user.id,
            email: user.email || undefined,
          });
        } else {
          setSentryUser(null);
        }
      })
      .catch(() => {
        // Silently fail for analytics
      });

    setSentryTags({
      locale,
      device_type: deviceType,
    });

    reportWebVitals();
  }, [locale, deviceType]);

  // Track pageviews
  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    capturePageview(url);
  }, [pathname, searchParams]);

  return null;
}
