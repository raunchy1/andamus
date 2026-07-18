"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, X, ChevronRight } from "lucide-react"

import { LocationCombobox } from "@/components/LocationCombobox"
import { PremiumDatePicker } from "@/components/ui/premium-date-picker"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { DiscoveryRideCard } from "@/components/discovery/DiscoveryRideCard"
import { saveRoute, deleteSavedRoute } from "@/lib/server/actions/saved-routes"
import { toast } from "sonner"
import { Analytics } from "@/lib/analytics"

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
  }
  savedRoutes: Array<{ id: string; from_city: string; to_city: string }>
  router: { push: (url: string) => void; refresh: () => void }
  suggestion: { from: string; to: string; reason: string } | null
  showInlineOnboarding: boolean
  setShowInlineOnboarding: (value: boolean) => void
}

function HomeMobileView({
  origin,
  setOrigin,
  destination,
  setDestination,
  todayRides,
  loading,
  locale,
  translations: t,
  savedRoutes,
  router,
  suggestion,
  showInlineOnboarding,
  setShowInlineOnboarding,
}: HomeMobileViewProps) {
  const today = new Date().toISOString().split("T")[0]
  const [date, setDate] = useState(today)

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (origin) params.set("from", origin)
    if (destination) params.set("to", destination)
    if (date && date !== today) params.set("date", date)
    router.push(`/${locale}/cerca?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-bg text-fg overflow-x-hidden">
      <main className="flex-1 overflow-x-hidden px-4 sm:px-6 pb-8">
        <header className="pt-6 pb-8">
          <p className="text-eyebrow">{"// "}{t.heroEyebrow}</p>
          <h1 className="mt-3 font-h2 heading-editorial text-fg">{t.heroHeadline}</h1>
        </header>

        <form onSubmit={onSubmit} className="space-y-3 border border-line rounded-[var(--radius)] bg-surface p-5">
          <div className="space-y-1">
            <label className="text-eyebrow lowercase">{t.heroFrom}</label>
            <LocationCombobox
              value={origin}
              onChange={setOrigin}
              placeholder={t.heroFromPlaceholder}
              buttonClassName="w-full"
            />
          </div>
          <div className="space-y-1">
            <label className="text-eyebrow lowercase">{t.heroTo}</label>
            <LocationCombobox
              value={destination}
              onChange={setDestination}
              placeholder={t.heroCityPlaceholder}
              buttonClassName="w-full"
            />
          </div>
          <div className="space-y-1">
            <label className="text-eyebrow lowercase">{t.heroDate}</label>
            <PremiumDatePicker
              date={date}
              onSelect={(newDate) => setDate(newDate || today)}
              onClear={() => setDate(today)}
              min={today}
              placeholder={t.heroDate}
              label=""
              className="w-full"
            />
          </div>
          <Button type="submit" variant="primary" className="w-full">
            <Search size={20} strokeWidth={1.5} />
            {t.heroSearchButton}
          </Button>
        </form>

        {showInlineOnboarding && (
          <section className="mt-6 border border-line rounded-[var(--radius)] bg-surface p-5">
            <button
              type="button"
              onClick={() => {
                localStorage.setItem("onboarding_done_v2", "true")
                setShowInlineOnboarding(false)
                Analytics.trackEvent("onboarding_skipped")
              }}
              className="float-right text-dim hover:text-muted transition-colors"
              aria-label={t.close}
            >
              <X size={18} strokeWidth={1.5} />
            </button>
            <p className="text-eyebrow mb-2">{"// "}{t.quickGuide}</p>
            <h3 className="font-semibold text-fg mb-3">{t.howItWorksTitle}</h3>
            <ol className="space-y-2 text-sm text-muted list-decimal list-inside">
              <li>{t.howItWorksStep1}</li>
              <li>{t.howItWorksStep2}</li>
              <li>{t.howItWorksStep3}</li>
            </ol>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => {
                localStorage.setItem("onboarding_done_v2", "true")
                setShowInlineOnboarding(false)
                Analytics.trackEvent("onboarding_completed")
              }}
            >
              {t.gotIt}
            </Button>
          </section>
        )}

        {savedRoutes.length > 0 && (
          <section className="mt-8">
            <p className="text-eyebrow mb-3">{"// "}{t.savedRoutes}</p>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {savedRoutes.map((route) => (
                <div
                  key={route.id}
                  className="flex shrink-0 items-center gap-2 border border-line rounded-[var(--radius-sm)] bg-surface px-3 py-2"
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
                    className="text-left"
                  >
                    <span className="block text-sm font-medium text-fg whitespace-nowrap">
                      {route.from_city} → {route.to_city}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation()
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
                    className="text-dim hover:text-bad transition-colors"
                    aria-label="Rimuovi tratta"
                  >
                    <X size={14} strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {suggestion && (
          <section className="mt-6 border border-line rounded-[var(--radius)] bg-surface p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-eyebrow mb-1">// suggerimento</p>
              <p className="text-sm font-medium text-fg truncate">
                {suggestion.from} → {suggestion.to}
              </p>
              <p className="text-xs text-muted truncate">{suggestion.reason}</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setOrigin(suggestion.from)
                setDestination(suggestion.to)
                router.push(
                  `/${locale}/cerca?from=${encodeURIComponent(suggestion.from)}&to=${encodeURIComponent(suggestion.to)}`
                )
              }}
            >
              cerca
            </Button>
          </section>
        )}

        <section className="mt-10">
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-eyebrow">{"// "}{t.today}</p>
              <h2 className="mt-1 font-semibold text-fg">{t.todayRides}</h2>
            </div>
            <Link
              href={`/${locale}/cerca`}
              className="inline-flex items-center gap-1 font-mono text-xs text-accent hover:text-fg transition-colors lowercase"
            >
              {t.seeAll}
              <ChevronRight size={14} strokeWidth={1.5} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-40 rounded-[var(--radius)] border border-line bg-surface animate-pulse" />
              ))}
            </div>
          ) : todayRides.length > 0 ? (
            <div className="space-y-3">
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
            <div className="border border-line rounded-[var(--radius)] bg-surface px-5 py-8 text-center">
              <p className="font-medium text-fg mb-2">{t.noRidesToday}</p>
              <Link
                href={`/${locale}/cerca`}
                className="inline-flex items-center gap-1 text-sm text-accent hover:text-fg transition-colors lowercase mb-5"
              >
                {t.searchOtherDates}
                <ChevronRight size={14} strokeWidth={1.5} />
              </Link>
              <div>
                <Link href={`/${locale}/offri`}>
                  <Button variant="primary">{t.offerRide}</Button>
                </Link>
              </div>
            </div>
          )}
        </section>

        <Separator className="my-8" />

        <div className="grid grid-cols-2 gap-3 pb-4">
          <Link
            href={`/${locale}/offri`}
            className="border border-line rounded-[var(--radius-sm)] bg-surface px-4 py-5 text-sm font-semibold text-fg hover:bg-surface-2 transition-colors lowercase"
          >
            {t.offerRide}
          </Link>
          <Link
            href={`/${locale}/profilo`}
            className="border border-line rounded-[var(--radius-sm)] bg-surface px-4 py-5 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-fg transition-colors"
          >
            profilo
          </Link>
        </div>
      </main>
    </div>
  )
}

export { HomeMobileView }