"use client"

import { RideCard } from "@/components/ui/ride-card"

export type DiscoveryRide = {
  id: string
  from_city: string
  to_city: string
  date?: string
  time: string
  price: number
  seats?: number
  profiles?: {
    name?: string | null
    avatar_url?: string | null
    rating?: number | null
    review_count?: number | null
  } | null
}

interface DiscoveryRideCardProps {
  ride: DiscoveryRide
  locale: string
  index: number
  freeLabel: string
  seatsFormatter?: (count: number) => string
  formatDate?: (date: string) => string
  today?: string
}

function DiscoveryRideCard({
  ride,
  locale,
  index,
  freeLabel,
  seatsFormatter,
  formatDate,
  today,
}: DiscoveryRideCardProps) {
  const profile = ride.profiles
  const driverName = profile?.name?.trim() || "Conducente"
  const departureTime = ride.time?.slice(0, 5) || "—"
  const priceLabel = ride.price === 0 ? freeLabel : `€${ride.price}`

  const rating =
    profile?.rating != null && Number(profile.rating) > 0
      ? Number(profile.rating).toFixed(1)
      : undefined

  const seatsLabel =
    ride.seats != null && ride.seats > 0 && seatsFormatter
      ? seatsFormatter(ride.seats)
      : undefined

  const routeMeta =
    ride.date && formatDate && today && ride.date !== today
      ? formatDate(ride.date)
      : undefined

  const verified = (profile?.review_count ?? 0) > 0

  return (
    <RideCard
      href={`/${locale}/corsa/${ride.id}`}
      index={index}
      departureTime={departureTime}
      arrivalTime=""
      price={priceLabel}
      origin={{ name: ride.from_city, time: departureTime }}
      destination={{ name: ride.to_city }}
      routeMeta={routeMeta}
      driverName={driverName}
      driverAvatar={profile?.avatar_url ?? null}
      verified={verified}
      rating={rating}
      seatsLabel={seatsLabel}
    />
  )
}

export { DiscoveryRideCard }