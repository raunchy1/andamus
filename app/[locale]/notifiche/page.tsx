import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { NotificationsClient } from "@/components/notifications/NotificationsClient";

export const dynamic = "force-dynamic";

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/join?next=/${locale}/notifiche`);

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, type, title, body, read, ride_id, booking_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <NotificationsClient locale={locale} initialNotifications={notifications ?? []} />
  );
}
