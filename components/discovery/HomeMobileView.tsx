"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Search, ArrowUpDown, Calendar, Users, Bell, MapPin, ChevronRight, X } from "lucide-react"

import { LocationCombobox } from "@/components/LocationCombobox"
import { PremiumDatePicker } from "@/components/ui/premium-date-picker"
import { deleteSavedRoute } from "@/lib/server/actions/saved-routes"
import { toast } from "sonner"
import { DiscoveryRideCard } from "@/components/discovery/DiscoveryRideCard"

interface Ride {
  id: string
  from_city: string
  to_city: string
  date: string
  time: string
  price: number
  profiles: {
    name: string
    avatar_url: string | null
    rating: number
  }
}

interface HomeMobileViewProps {
  origin: string
  setOrigin: (value: string) => void
  destination: string
  setDestination: (value: string) => void
  todayRides: Ride[]
  loading: boolean
  locale: string
  userName?: string
  userAvatar?: string | null
  translations: {
    heroEyebrow: string
    heroHeadline: string
    heroFrom: string
    heroTo: string
    heroDate: string
    heroSearchButton: string
    heroCityPlaceholder: string
    heroFromPlaceholder: string
    todayRides: string
    today: string
    seeAll: string
    free: string
    noRidesToday: string
    searchOtherDates: string
    offerRide: string
    savedRoutes: string
    routeRemoved: string
    routeRemoveError: string
    gotIt: string
    quickGuide: string
    howItWorksTitle: string
    howItWorksStep1: string
    howItWorksStep2: string
    howItWorksStep3: string
    close: string
    welcomeBack?: string
    greetingMorning: string
    greetingAfternoon: string
    greetingEvening: string
    featuredToday: string
    withDriver: string
    driverFallback: string
  }
  savedRoutes: Array<{ id: string; from_city: string; to_city: string }>
  router: ReturnType<typeof useRouter>
  suggestion: { from: string; to: string; reason: string } | null
  showInlineOnboarding: boolean
  setShowInlineOnboarding: (value: boolean) => void
}

function formatRideDate(date: string, locale: string) {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return date
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(d)
}

function getInitials(name?: string) {
  if (!name) return "?"
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

function greeting(t: HomeMobileViewProps["translations"]) {
  const h = new Date().getHours()
  if (h < 12) return t.greetingMorning
  if (h < 18) return t.greetingAfternoon
  return t.greetingEvening
}

export function HomeMobileView({
  origin,
  setOrigin,
  destination,
  setDestination,
  todayRides,
  loading,
  locale,
  userName,
  userAvatar,
  translations: t,
  savedRoutes,
  router,
  suggestion,
}: HomeMobileViewProps) {
  // Pluralised seat labels resolve here rather than via props: ICU plurals
  // need the live count, which is client state.
  const tHome = useTranslations("home")
  const today = new Date().toISOString().split("T")[0]
  const [date, setDate] = useState(today)
  const [seats, setSeats] = useState(1)

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (origin) params.set("from", origin)
    if (destination) params.set("to", destination)
    if (date && date !== today) params.set("date", date)
    if (seats > 1) params.set("seats", String(seats))
    router.push(`/${locale}/cerca?${params.toString()}`)
  }

  const handleSwap = () => {
    setOrigin(destination)
    setDestination(origin)
  }

  const nextRide = todayRides[0] ?? null

  return (
    <div
      style={{ background: "var(--sand)", minHeight: "100dvh" }}
      className="overflow-x-hidden pb-24"
    >
      {/* ── Header ─────────────────────────────────────── */}
      <header
        style={{ padding: "60px 22px 20px" }}
        className="flex items-center justify-between"
      >
        <div>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 2 }}>
            {greeting(t)}
          </p>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: "-0.6px",
              color: "var(--ink)",
              margin: 0,
            }}
          >
            {userName?.split(" ")[0] ?? ""}
          </h1>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* Bell */}
          <Link
            href={`/${locale}/notifiche`}
            style={{
              width: 42,
              height: 42,
              borderRadius: 999,
              background: "var(--surface)",
              border: "1px solid var(--line)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <Bell size={18} strokeWidth={1.7} style={{ color: "var(--ink)" }} />
            {/* badge */}
            <span
              style={{
                position: "absolute",
                top: 9,
                right: 9,
                width: 8,
                height: 8,
                borderRadius: 999,
                background: "var(--terracotta)",
                border: "2px solid var(--surface)",
              }}
            />
          </Link>

          {/* Avatar */}
          <Link
            href={`/${locale}/profilo`}
            style={{
              width: 42,
              height: 42,
              borderRadius: 999,
              background: "var(--terracotta)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "-0.3px",
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            {userAvatar ? (
              <Image
                src={userAvatar}
                alt=""
                width={42}
                height={42}
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 999 }}
              />
            ) : (
              getInitials(userName)
            )}
          </Link>
        </div>
      </header>

      {/* ── Search card ────────────────────────────────── */}
      <form onSubmit={onSubmit} style={{ padding: "0 16px" }}>
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 26,
            padding: 8,
            boxShadow: "0 8px 24px -14px rgba(22,33,28,.3)",
          }}
        >
          {/* Route row */}
          <div style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
            {/* Indicator column */}
            <div
              style={{
                width: 32,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                paddingTop: 18,
                paddingBottom: 18,
                gap: 0,
                flexShrink: 0,
              }}
            >
              {/* origin dot */}
              <div
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 999,
                  border: "2px solid var(--green)",
                  background: "transparent",
                }}
              />
              {/* dashed line */}
              <div
                style={{
                  width: 1,
                  height: 22,
                  borderLeft: "2px dashed var(--track)",
                  margin: "3px 0",
                }}
              />
              {/* destination square */}
              <div
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 2,
                  background: "var(--terracotta)",
                }}
              />
            </div>

            {/* Input fields */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "10px 10px 10px 0" }}>
                <LocationCombobox
                  value={origin}
                  onChange={setOrigin}
                  placeholder={t.heroFromPlaceholder}
                  buttonClassName="w-full border-0 shadow-none bg-transparent p-0 h-auto text-[17px] font-medium text-ink"
                />
              </div>
              {/* hairline */}
              <div style={{ height: 1, background: "var(--line-soft)" }} />
              <div style={{ padding: "10px 10px 10px 0" }}>
                <LocationCombobox
                  value={destination}
                  onChange={setDestination}
                  placeholder={t.heroCityPlaceholder}
                  buttonClassName="w-full border-0 shadow-none bg-transparent p-0 h-auto text-[17px] font-medium text-ink"
                />
              </div>
            </div>

            {/* Swap button */}
            <div style={{ display: "flex", alignItems: "center", padding: "0 10px 0 6px" }}>
              <button
                type="button"
                onClick={handleSwap}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  border: "1px solid var(--line)",
                  background: "var(--surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
                aria-label="Scambia partenza e arrivo"
              >
                <ArrowUpDown size={15} strokeWidth={1.7} style={{ color: "var(--muted)" }} />
              </button>
            </div>
          </div>

          {/* Date + Seats chips */}
          <div style={{ display: "flex", gap: 8, padding: "8px 8px 4px" }}>
            <div
              style={{
                background: "var(--sand-deep)",
                borderRadius: 16,
                padding: "7px 12px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                flex: 1,
              }}
            >
              <Calendar size={14} strokeWidth={1.7} style={{ color: "var(--muted)", flexShrink: 0 }} />
              <PremiumDatePicker
                date={date}
                onSelect={(d) => setDate(d || today)}
                onClear={() => setDate(today)}
                min={today}
                placeholder={t.heroDate}
                label=""
                className="border-0 shadow-none bg-transparent p-0 h-auto text-[13px] text-ink font-medium w-full"
              />
            </div>
            <button
              type="button"
              onClick={() => setSeats((s) => (s >= 4 ? 1 : s + 1))}
              style={{
                background: "var(--sand-deep)",
                borderRadius: 16,
                padding: "7px 12px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                border: 0,
                cursor: "pointer",
              }}
              aria-label={tHome("changeSeats")}
            >
              <Users size={14} strokeWidth={1.7} style={{ color: "var(--muted)", flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", whiteSpace: "nowrap" }}>
                {tHome("seatsCount", { count: seats })}
              </span>
            </button>
          </div>

          {/* CTA */}
          <button
            type="submit"
            style={{
              width: "100%",
              height: 54,
              borderRadius: 20,
              background: "var(--green)",
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              border: 0,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginTop: 4,
              transition: "background 0.2s",
            }}
          >
            <Search size={18} strokeWidth={2} />
            {t.heroSearchButton}
          </button>
        </div>
      </form>

      {/* ── Prossimo viaggio ───────────────────────────── */}
      {nextRide && (
        <section style={{ padding: "24px 16px 0" }}>
          <Link href={`/${locale}/corsa/${nextRide.id}`}>
            <div
              style={{
                background: "var(--ink)",
                borderRadius: 24,
                padding: "20px 20px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* decorative circle */}
              <div
                style={{
                  position: "absolute",
                  width: 160,
                  height: 160,
                  borderRadius: 999,
                  background: "rgba(45,106,79,.35)",
                  top: -40,
                  right: -40,
                  pointerEvents: "none",
                }}
              />
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "rgba(244,241,234,.55)",
                  marginBottom: 8,
                }}
              >
                {t.featuredToday}
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "rgba(244,241,234,.6)",
                  marginBottom: 4,
                }}
              >
                {nextRide.date === today ? t.today : formatRideDate(nextRide.date, locale)} · {nextRide.time?.slice(0, 5)}
              </p>
              <h3
                style={{
                  fontSize: 23,
                  fontWeight: 600,
                  color: "var(--sand)",
                  margin: "0 0 6px",
                  letterSpacing: "-0.5px",
                }}
              >
                {nextRide.from_city} → {nextRide.to_city}
              </h3>
              <p style={{ fontSize: 13, color: "rgba(244,241,234,.6)", margin: 0 }}>
                {t.withDriver.replace("{name}", nextRide.profiles?.name ?? t.driverFallback)}
              </p>
              {/* arrow */}
              <div
                style={{
                  position: "absolute",
                  right: 20,
                  bottom: 20,
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  background: "rgba(244,241,234,.14)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChevronRight size={20} strokeWidth={1.7} color="rgba(244,241,234,.8)" />
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* ── Tratte salvate ────────────────────────────── */}
      {savedRoutes.length > 0 && (
        <section style={{ padding: "24px 0 0" }}>
          <h2
            style={{
              fontSize: 19,
              fontWeight: 600,
              letterSpacing: "-0.3px",
              color: "var(--ink)",
              margin: "0 0 14px",
              padding: "0 22px",
            }}
          >
            {t.savedRoutes}
          </h2>
          <div
            style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0 16px 4px" }}
            className="no-scrollbar"
          >
            {savedRoutes.map((route) => (
              <div
                key={route.id}
                style={{
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: 999,
                  padding: "8px 12px",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setOrigin(route.from_city)
                    setDestination(route.to_city)
                    router.push(
                      `/${locale}/cerca?from=${encodeURIComponent(route.from_city)}&to=${encodeURIComponent(route.to_city)}`
                    )
                  }}
                  style={{
                    background: "transparent",
                    border: 0,
                    padding: 0,
                    fontSize: 13.5,
                    fontWeight: 500,
                    color: "var(--ink)",
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                  }}
                >
                  {route.from_city} → {route.to_city}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await deleteSavedRoute(route.id)
                      if (res.success) {
                        toast.success(t.routeRemoved)
                        router.refresh()
                      }
                    } catch {
                      toast.error(t.routeRemoveError)
                    }
                  }}
                  style={{
                    background: "transparent",
                    border: 0,
                    padding: 0,
                    display: "inline-flex",
                    color: "var(--faint)",
                    cursor: "pointer",
                  }}
                  aria-label="Rimuovi tratta"
                >
                  <X size={13} strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Suggerimento ──────────────────────────────── */}
      {suggestion && (
        <section style={{ padding: "24px 16px 0" }}>
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 22,
              padding: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "var(--faint)",
                  margin: "0 0 6px",
                }}
              >
                Suggerimento
              </p>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--ink)",
                  margin: "0 0 2px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {suggestion.from} → {suggestion.to}
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--muted)",
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {suggestion.reason}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setOrigin(suggestion.from)
                setDestination(suggestion.to)
                router.push(
                  `/${locale}/cerca?from=${encodeURIComponent(suggestion.from)}&to=${encodeURIComponent(suggestion.to)}`
                )
              }}
              style={{
                flexShrink: 0,
                height: 40,
                padding: "0 18px",
                borderRadius: 999,
                background: "var(--green-tint)",
                color: "var(--green)",
                fontSize: 14,
                fontWeight: 600,
                border: 0,
                cursor: "pointer",
              }}
            >
              Cerca
            </button>
          </div>
        </section>
      )}

      {/* ── Passaggi di oggi ──────────────────────────── */}
      <section style={{ padding: "28px 16px 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <h2 style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.3px", color: "var(--ink)", margin: 0 }}>
            {t.todayRides}
          </h2>
          <Link
            href={`/${locale}/cerca`}
            style={{ fontSize: 13, color: "var(--green)", fontWeight: 500 }}
          >
            {t.seeAll}
          </Link>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2].map((i) => (
              <div
                key={i}
                style={{
                  height: 100,
                  borderRadius: 22,
                  background: "var(--sand-deep)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            ))}
          </div>
        ) : todayRides.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {todayRides.map((ride, idx) => (
              <DiscoveryRideCard
                key={ride.id}
                ride={ride}
                locale={locale}
                index={idx}
                freeLabel={t.free}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 22,
              padding: "32px 20px",
              textAlign: "center",
              border: "1px solid var(--line)",
            }}
          >
            <p style={{ fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>
              {t.noRidesToday}
            </p>
            <Link
              href={`/${locale}/cerca`}
              style={{ fontSize: 14, color: "var(--green)" }}
            >
              {t.searchOtherDates}
            </Link>
          </div>
        )}
      </section>

    </div>
  )
}
