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
    id_verified?: boolean | null
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
  const isFree = ride.price === 0
  const priceLabel = isFree ? freeLabel : `${ride.price} €`

  // Only show a score once someone has actually been reviewed. profiles.rating
  // defaults to 5.0, so an ungated read prints a rating for every driver who
  // has never carried a passenger — the same invented stat the ride page and
  // the public profile already refuse to show.
  const hasReviews = (profile?.review_count ?? 0) > 0

  const rating =
    hasReviews && profile?.rating != null && Number(profile.rating) > 0
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

  // The card's check mark is the same claim the ride page makes: identity
  // verified, not "has been reviewed".
  const verified = profile?.id_verified === true

  return (
    <RideCard
      href={`/${locale}/corsa/${ride.id}`}
      index={index}
      departureTime={departureTime}
      arrivalTime=""
      price={priceLabel}
      origin={{ name: ride.from_city, time: departureTime }}
      destination={{ name: ride.to_city }}
      free={isFree}
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