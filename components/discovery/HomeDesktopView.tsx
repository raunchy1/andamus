"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, ChevronRight } from "lucide-react"

import { LocationCombobox } from "@/components/LocationCombobox"
import { PremiumDatePicker } from "@/components/ui/premium-date-picker"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
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

interface HomeDesktopViewProps {
  origin: string
  setOrigin: (value: string) => void
  destination: string
  setDestination: (value: string) => void
  todayRides: Ride[]
  loading: boolean
  locale: string
  translations: {
    heroFrom: string
    heroTo: string
    heroDate: string
    heroSearchButton: string
    heroCityPlaceholder: string
    heroFromPlaceholder: string
    todayRides: string
    today: string
    seeAll: string
    departuresConfirmed: string
    free: string
    noRidesToday: string
    searchOtherDates: string
    offerRide: string
    headline: string
  }
  router: { push: (url: string) => void }
}

function HomeDesktopView({
  origin,
  setOrigin,
  destination,
  setDestination,
  todayRides,
  loading,
  locale,
  translations: t,
  router,
}: HomeDesktopViewProps) {
  const today = new Date().toISOString().split("T")[0]
  const [date, setDate] = useState(today)

  const departuresSubtitle = (() => {
    const formatted = new Date().toLocaleDateString(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
    if (locale === "it") return `partenze confermate · ${formatted}`
    return `confirmed departures · ${formatted}`
  })()

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
      <section className="max-w-5xl mx-auto px-6 lg:px-10 pt-12 pb-16">
        <p className="text-eyebrow">ANDAMUS</p>
        <h1 className="mt-4 font-hero heading-editorial text-fg">{t.headline}</h1>
        <p className="mt-4 max-w-xl text-muted lowercase">{departuresSubtitle}</p>

        <form
          onSubmit={onSubmit}
          className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-3 border border-line rounded-[var(--radius)] bg-surface p-5 items-end"
        >
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
      </section>

      <section className="max-w-5xl mx-auto px-6 lg:px-10 pb-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-eyebrow">{t.today}</p>
            <h2 className="mt-2 font-h2 text-fg">{t.todayRides}</h2>
          </div>
          <Link
            href={`/${locale}/cerca`}
            className="inline-flex items-center gap-1 font-mono text-sm text-accent hover:text-fg transition-colors lowercase"
          >
            {t.seeAll}
            <ChevronRight size={14} strokeWidth={1.5} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-[var(--radius)] border border-line bg-surface animate-pulse" />
            ))}
          </div>
        ) : todayRides.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="border border-line rounded-[var(--radius)] bg-surface px-8 py-12 text-center max-w-lg">
            <p className="font-h3 text-fg mb-2">{t.noRidesToday}</p>
            <Link
              href={`/${locale}/cerca`}
              className="inline-flex items-center gap-1 text-accent hover:text-fg transition-colors lowercase mb-6"
            >
              {t.searchOtherDates}
              <ChevronRight size={14} strokeWidth={1.5} />
            </Link>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href={`/${locale}/cerca`}>
                <Button variant="secondary">{t.heroSearchButton}</Button>
              </Link>
              <Link href={`/${locale}/offri`}>
                <Button variant="primary">{t.offerRide}</Button>
              </Link>
            </div>
          </div>
        )}
      </section>

      <Separator />
    </div>
  )
}

export { HomeDesktopView }