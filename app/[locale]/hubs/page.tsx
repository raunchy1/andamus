import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import {
  Plane,
  GraduationCap,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

// Enable incremental static regeneration (ISR) - cache for 1 hour
export const revalidate = 3600;

type HubType = "airport" | "university";

interface HubData {
  id: string;
  type: HubType;
  city: string;
  /** Search terms used to build the three quick-route links, in order. */
  shortcuts: { from: string; to: string }[];
}

const HUBS: HubData[] = [
  {
    id: "cagliari-elmas",
    type: "airport",
    city: "Cagliari",
    shortcuts: [
      { from: "Cagliari Aeroporto", to: "Sassari" },
      { from: "Sassari", to: "Cagliari Aeroporto" },
      { from: "Oristano", to: "Cagliari Aeroporto" },
    ],
  },
  {
    id: "olbia-airport",
    type: "airport",
    city: "Olbia",
    shortcuts: [
      { from: "Olbia Aeroporto", to: "Sassari" },
      { from: "Cagliari", to: "Olbia Aeroporto" },
      { from: "Nuoro", to: "Olbia Aeroporto" },
    ],
  },
  {
    id: "unica-monserrato",
    type: "university",
    city: "Monserrato",
    shortcuts: [
      { from: "Oristano", to: "Cittadella Universitaria Monserrato" },
      { from: "Cittadella Universitaria Monserrato", to: "Sassari" },
      { from: "Cagliari", to: "Cittadella Universitaria Monserrato" },
    ],
  },
  {
    id: "uniss-piazza-italia",
    type: "university",
    city: "Sassari",
    shortcuts: [
      { from: "Sassari", to: "Cagliari" },
      { from: "Alghero", to: "Sassari" },
      { from: "Porto Torres", to: "Sassari" },
    ],
  },
];

export default async function HubsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "hubs" });

  const supabase = await createClient();

  const hubsWithRides = await Promise.all(
    HUBS.map(async (hub) => {
      const cityFilter = `from_city.ilike.%${hub.city}%,to_city.ilike.%${hub.city}%`;

      // The preview list is capped at 3, so it cannot be used to report a
      // total. Count separately, otherwise the badge would claim "3 active"
      // for a hub that actually has fifty.
      const [ridesRes, countRes] = await Promise.all([
        supabase
          .from("rides")
          .select(
            "id, from_city, to_city, date, time, price, seats_available, profiles:driver_id (name, avatar_url)"
          )
          .eq("status", "active")
          .or(cityFilter)
          .order("date", { ascending: true })
          .order("time", { ascending: true })
          .limit(3),
        supabase
          .from("rides")
          .select("id", { count: "exact", head: true })
          .eq("status", "active")
          .or(cityFilter),
      ]);

      return {
        ...hub,
        upcomingRides: ridesRes.data ?? [],
        activeCount: countRes.count ?? 0,
      };
    })
  );

  const dateFmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mx-auto max-w-2xl text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-accent-dim px-3 py-1 text-xs font-semibold text-accent">
          <MapPin className="h-3.5 w-3.5" />
          {t("badge")}
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-3 leading-relaxed text-muted">{t("subtitle")}</p>
      </header>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {hubsWithRides.map((hub) => {
          const Icon = hub.type === "airport" ? Plane : GraduationCap;
          const base = `hubs.${hub.id}`;

          return (
            <section
              key={hub.id}
              className="rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-border-strong"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-dim text-accent">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
                    {hub.type === "airport" ? t("typeAirport") : t("typeUniversity")}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold leading-snug text-fg">
                    {t(`${base}.name`)}
                  </h2>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-muted">
                {t(`${base}.description`)}
              </p>

              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-faint">
                  {t("quickRoutes")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {hub.shortcuts.map((s, i) => (
                    <Link
                      key={`${s.from}-${s.to}`}
                      href={`/${locale}/cerca?from=${encodeURIComponent(s.from)}&to=${encodeURIComponent(s.to)}`}
                      className="inline-flex items-center gap-1 rounded-xl border border-line bg-surface-2 px-3 py-1.5 text-xs text-fg transition-colors hover:border-accent/40 hover:text-accent"
                    >
                      {t(`${base}.shortcut${i + 1}`)}
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-6 border-t border-line pt-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-faint">
                    {t("upcomingDepartures")}
                  </p>
                  {hub.activeCount > 0 && (
                    <span className="rounded-full bg-accent-dim px-2 py-0.5 text-[10px] font-bold text-accent">
                      {t("activeRides", { count: hub.activeCount })}
                    </span>
                  )}
                </div>

                {hub.upcomingRides.length > 0 ? (
                  <ul className="mt-3 flex flex-col gap-2">
                    {hub.upcomingRides.map((ride: any) => (
                      <li key={ride.id}>
                        <Link
                          href={`/${locale}/corsa/${ride.id}`}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-line px-3 py-2.5 transition-colors hover:bg-surface-2"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            {ride.profiles?.avatar_url ? (
                              <Image
                                src={ride.profiles.avatar_url}
                                alt=""
                                width={28}
                                height={28}
                                className="h-7 w-7 shrink-0 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-bold text-muted">
                                {ride.profiles?.name?.[0] ?? "?"}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-fg">
                                {ride.from_city} → {ride.to_city}
                              </p>
                              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
                                <Calendar className="h-3 w-3" />
                                {dateFmt.format(new Date(ride.date))}
                                <Clock className="ml-1 h-3 w-3" />
                                {ride.time?.slice(0, 5)}
                              </p>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-semibold text-accent">€{ride.price}</p>
                            <p className="text-[10px] text-muted">
                              {t("seats", { count: ride.seats_available })}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-3 rounded-2xl border border-dashed border-line px-4 py-6 text-center">
                    <p className="text-xs text-muted">{t("noDepartures")}</p>
                    <Link
                      href={`/${locale}/offri?from=${encodeURIComponent(hub.city)}`}
                      className="mt-2 inline-block text-xs font-semibold text-accent hover:underline"
                    >
                      {t("publishFirst")}
                    </Link>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
