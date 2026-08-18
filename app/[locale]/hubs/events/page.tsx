import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Calendar, MapPin, ArrowRight, Music, Users, Shield, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "eventsHub" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

interface SardiniaEvent {
  id: string;
  name: string;
  description: string;
  image_url: string;
  start_date: string;
  location: string;
  category: string;
  slug: string;
  ride_count?: number;
}

export default async function EventsHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "eventsHub" });

  const supabase = await createClient();

  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .order("start_date", { ascending: true });

  if (error) {
    console.error("[events-hub] Error fetching events:", error.message);
  }

  const parsedEvents: SardiniaEvent[] = events ?? [];

  // Real ride counts per event — the badge only renders when this is > 0.
  if (parsedEvents.length > 0) {
    await Promise.all(
      parsedEvents.map(async (event) => {
        const { count } = await supabase
          .from("rides")
          .select("id", { count: "exact", head: true })
          .eq("event_id", event.id)
          .eq("status", "active");

        event.ride_count = count ?? 0;
      })
    );
  }

  const dateFmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const trustPoints = [
    { Icon: Shield, title: t("trustTitle1"), desc: t("trustDesc1") },
    { Icon: Users, title: t("trustTitle2"), desc: t("trustDesc2") },
    { Icon: Music, title: t("trustTitle3"), desc: t("trustDesc3") },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mx-auto max-w-2xl text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-accent-dim px-3 py-1 text-xs font-semibold text-accent">
          <Sparkles className="h-3.5 w-3.5" />
          {t("badge")}
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-3 leading-relaxed text-muted">{t("subtitle")}</p>
      </header>

      <div className="mt-12">
        <h2 className="border-b border-line pb-4 text-xs font-semibold uppercase tracking-wider text-faint">
          {t("upcoming")}
        </h2>

        {parsedEvents.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-line py-16 text-center">
            <Calendar className="mx-auto mb-3 h-10 w-10 text-faint" />
            <p className="text-sm text-muted">{t("noEvents")}</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {parsedEvents.map((event) => (
              <Link
                key={event.id}
                href={`/${locale}/cerca?event=${event.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:border-accent/40"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-2">
                  <Image
                    src={event.image_url}
                    alt={event.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  {event.ride_count && event.ride_count > 0 ? (
                    <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-accent-fg">
                      {t("ridesAvailable", { count: event.ride_count })}
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                      {event.category}
                    </p>
                    <h3 className="mt-1 text-base font-semibold leading-snug text-fg">
                      {event.name}
                    </h3>
                  </div>

                  <div className="flex flex-col gap-1.5 text-xs text-muted">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-accent" />
                      {dateFmt.format(new Date(event.start_date))}
                    </span>
                    <span className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-accent" />
                      <span className="truncate">{event.location}</span>
                    </span>
                  </div>

                  <p className="line-clamp-2 text-xs leading-relaxed text-faint">
                    {event.description}
                  </p>

                  <span className="mt-auto flex items-center gap-1.5 pt-2 text-xs font-semibold text-accent">
                    {t("searchRide")}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <section className="mt-20 grid gap-8 rounded-2xl border border-line bg-surface p-8 sm:grid-cols-3">
        {trustPoints.map(({ Icon, title, desc }) => (
          <div key={title}>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent-dim text-accent">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-fg">{title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">{desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
