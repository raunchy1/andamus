"use client";

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Users,
  MessageCircle,
  Car,
  Cigarette,
  CigaretteOff,
  PawPrint,
  Luggage,
  UserCircle,
  GraduationCap,
  Music,
  Clock,
} from "lucide-react";
import { ShareRide } from "@/components/ShareRide";
import { CelebrationModal } from "@/components/FirstRideCelebration";
import type { VehicleWithImages } from "@/lib/types/vehicle";
import { createClient } from "@/lib/supabase/client";
import { signInWithGoogle } from "@/lib/auth";
import { getDeterministicDriverMetrics, getDeterministicActivity } from "@/lib/reputation";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { notifyBookingRequest } from "@/lib/notification-actions";
import { useDeviceType } from "@/components/view-mode";
import { toast } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { computeRideStatus, isRideBookable, getRideStatusLabel, getRideStatusColor } from "@/lib/ride-status";
import { Analytics } from "@/lib/analytics";
import { ReportUser } from "@/components/ReportUser";
import { SARDINIA_CITIES } from "@/lib/sardinia-cities";
import { RouteLine } from "@/components/ui/route-line";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const PostActionModal = dynamic(() => import("@/components/PostActionModal").then((m) => m.PostActionModal), { ssr: false });
const RouteMap = dynamic(() => import("@/components/RouteMap").then((m) => m.RouteMap), { ssr: false });

const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const },
};

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function formatDurationMinutes(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainder = mins % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.slice(0, 5).split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function getRouteTiming(fromCity: string, toCity: string, departureTime: string) {
  const from = SARDINIA_CITIES[fromCity];
  const to = SARDINIA_CITIES[toCity];
  if (!from || !to) {
    return { meta: "", arrivalTime: "" };
  }
  const km = haversineKm(from, to);
  const durationMins = Math.max(15, Math.round((km / 75) * 60));
  return {
    meta: `${Math.round(km)} km · ${formatDurationMinutes(durationMins)}`,
    arrivalTime: addMinutesToTime(departureTime, durationMins),
  };
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer: {
    name: string;
    avatar_url: string | null;
  };
}

interface Booking {
  id: string;
  ride_id: string;
  passenger_id: string;
  status: string;
}

interface Ride {
  id: string;
  driver_id: string;
  from_city: string;
  to_city: string;
  date: string;
  time: string;
  seats: number;
  price: number;
  meeting_point: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  smoking_allowed?: boolean | null;
  pets_allowed?: boolean | null;
  large_luggage?: boolean | null;
  music_preference?: "quiet" | "music" | "talk" | null;
  women_only?: boolean | null;
  students_only?: boolean | null;
  car_model?: string | null;
  car_color?: string | null;
  car_plate?: string | null;
  car_year?: number | null;
  profiles: {
    name: string;
    avatar_url: string | null;
    rating: number;
    rides_count: number;
    review_count?: number | null;
  };
}

interface RideDetailViewProps {
  ride: Ride;
  user: SupabaseUser | null;
  reviews: Review[];
  similarRides: Ride[];
  stops: { city: string; order_index: number }[];
  existingBooking: Booking | null;
  requesting: boolean;
  showLoginModal: boolean;
  vehicle?: VehicleWithImages | null;
  setShowLoginModal: (v: boolean) => void;
  handleShare: () => void;
  handleRequestRide: () => void;
  formatDate: (dateStr: string) => string;
  formatReviewDate: (dateStr: string) => string;
  rideStatus: import("@/lib/ride-status").ComputedRideStatus;
  canBook: boolean;
}

function RideDetailTopBar({
  onBack,
  ride,
}: {
  onBack: () => void;
  ride: Ride;
}) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-bg/95 px-4 py-3 backdrop-blur-md md:px-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex size-10 items-center justify-center rounded-[var(--radius-sm)] text-fg transition-colors hover:bg-surface-2"
        aria-label="Indietro"
      >
        <ChevronLeft className="size-5" strokeWidth={1.5} />
      </button>
      <ShareRide
        ride={{
          id: ride.id,
          from_city: ride.from_city,
          to_city: ride.to_city,
          date: ride.date,
          time: ride.time,
          price: ride.price,
          driverName: ride.profiles.name,
        }}
        variant="icon"
        className="!rounded-[var(--radius-sm)] !bg-transparent !p-0 hover:!bg-surface-2 [&_svg]:!text-muted"
      />
    </header>
  );
}

function RideDetailRouteHero({
  ride,
  stops,
  rideStatus,
}: {
  ride: Ride;
  stops: { city: string; order_index: number }[];
  rideStatus: import("@/lib/ride-status").ComputedRideStatus;
}) {
  const t = useTranslations("ride");
  const departureTime = ride.time.slice(0, 5);
  const { meta, arrivalTime } = getRouteTiming(ride.from_city, ride.to_city, departureTime);

  const intermediateStops = stops
    .filter((s) => s.city !== ride.from_city && s.city !== ride.to_city)
    .map((s) => ({ name: s.city }));

  const dateLabel = new Date(ride.date).toLocaleDateString("it-IT", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <motion.section {...fadeUp} className="px-4 py-8 md:px-0 md:py-10">
      <div className="mb-4">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[11px] ${getRideStatusColor(rideStatus)}`}
        >
          {getRideStatusLabel(rideStatus)}
        </span>
      </div>

      <RouteLine
        hero
        animate
        dateLabel={dateLabel}
        origin={{ name: ride.from_city, time: departureTime }}
        destination={{ name: ride.to_city, time: arrivalTime || undefined }}
        stops={intermediateStops}
        meta={meta}
      />

      {ride.meeting_point && (
        <p className="mt-6 font-mono text-xs text-dim">
          {t("pickupPoint")}: {ride.meeting_point}
        </p>
      )}
    </motion.section>
  );
}

function RideDetailPriceSeats({ ride }: { ride: Ride }) {
  const t = useTranslations("ride");

  return (
    <motion.section {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }} className="px-4 md:px-0">
      <div className="flex items-center justify-between py-4">
        <span className="font-mono text-2xl font-medium tabular-nums text-fg">
          {ride.price === 0 ? t("free") : `€${ride.price}`}
        </span>
        <div className="flex items-center gap-2 font-mono text-sm text-muted">
          <Users className="size-4" strokeWidth={1.5} />
          <span className="tabular-nums">
            {ride.seats} {t("seatsAvailable").toLowerCase()}
          </span>
        </div>
      </div>
      <Separator />
    </motion.section>
  );
}

function RideDetailDriverTrust({
  ride,
  locale,
  existingBooking,
  isMyRide,
}: {
  ride: Ride;
  locale: string;
  existingBooking: Booking | null;
  isMyRide: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("ride");
  const metrics = getDeterministicDriverMetrics(ride.driver_id, ride.profiles.rating);
  const activity = getDeterministicActivity(ride.id);
  const verified =
    (ride.profiles.rating || 0) >= 4.5 || (ride.profiles.review_count || 0) > 5;
  const speaksSardo = metrics.languages.some((l) => l.toLowerCase().includes("sardo"));
  const memberYear = ride.created_at
    ? new Date(ride.created_at).getFullYear()
    : new Date().getFullYear();

  return (
    <motion.section {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="px-4 md:px-0">
        <Card
          tappable
          className="p-5"
          onClick={() => {
            Analytics.shareEvent?.("profile_click", {
              source: "ride_detail",
              driver_id: ride.driver_id,
            });
            router.push(`/${locale}/u/${ride.driver_id}`);
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar
                src={ride.profiles.avatar_url}
                name={ride.profiles.name}
                size="lg"
                className="size-12"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-fg tracking-[-0.02em]">
                    {ride.profiles.name}
                  </h3>
                  {verified && <Badge verified>verificato</Badge>}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-sm">
                  <span className="tabular-nums text-fg">
                    {ride.profiles.rating.toFixed(1)}
                  </span>
                  <span className="text-muted">
                    · {ride.profiles.review_count || 0} {t("reviews").toLowerCase()}
                  </span>
                </div>
                {speaksSardo && (
                  <span className="mt-2 inline-flex rounded-full border border-line px-2.5 py-0.5 font-mono text-[11px] text-muted">
                    parla sardo
                  </span>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {existingBooking && !isMyRide && (
                <Link
                  href={`/${locale}/chat/${existingBooking.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex size-10 items-center justify-center rounded-[var(--radius-sm)] text-muted transition-colors hover:bg-surface-2 hover:text-fg"
                >
                  <MessageCircle className="size-5" strokeWidth={1.5} />
                </Link>
              )}
              {!isMyRide && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex size-10 items-center justify-center rounded-[var(--radius-sm)] text-muted transition-colors hover:bg-surface-2 hover:text-fg"
                >
                  <ReportUser
                    reportedId={ride.driver_id}
                    rideId={ride.id}
                    reportedName={ride.profiles.name}
                    iconOnly
                  />
                </div>
              )}
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-1.5 font-mono text-xs text-dim">
            <p>membro dal {memberYear}</p>
            <p className="flex items-center gap-1.5">
              <Clock className="size-3.5" strokeWidth={1.5} />
              {metrics.responseTimeText}
            </p>
            <p>{activity.publishedText}</p>
          </div>
        </Card>
    </motion.section>
  );
}

function RideDetailAmenities({ ride }: { ride: Ride }) {
  const t = useTranslations("ride");

  const items: { icon: ReactNode; label: string }[] = [];

  if (ride.smoking_allowed) {
    items.push({
      icon: <Cigarette className="size-4" strokeWidth={1.5} />,
      label: t("smokersAllowed"),
    });
  } else if (!ride.smoking_allowed) {
    items.push({
      icon: <CigaretteOff className="size-4" strokeWidth={1.5} />,
      label: t("noSmoking"),
    });
  }

  if (ride.pets_allowed) {
    items.push({
      icon: <PawPrint className="size-4" strokeWidth={1.5} />,
      label: t("petsOk"),
    });
  }

  if (ride.large_luggage) {
    items.push({
      icon: <Luggage className="size-4" strokeWidth={1.5} />,
      label: t("largeLuggage"),
    });
  }

  if (ride.women_only) {
    items.push({
      icon: <UserCircle className="size-4" strokeWidth={1.5} />,
      label: t("womenOnly"),
    });
  }

  if (ride.students_only) {
    items.push({
      icon: <GraduationCap className="size-4" strokeWidth={1.5} />,
      label: t("studentsOnly"),
    });
  }

  if (ride.music_preference) {
    items.push({
      icon: <Music className="size-4" strokeWidth={1.5} />,
      label:
        ride.music_preference === "quiet"
          ? t("quiet")
          : ride.music_preference === "music"
            ? t("music")
            : t("chat"),
    });
  }

  if (items.length === 0) return null;

  return (
    <motion.section
      {...fadeUp}
      transition={{ ...fadeUp.transition, delay: 0.15 }}
      className="px-4 py-6 md:px-0"
    >
      <p className="text-eyebrow mb-3">{t("preferences")}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item.label}
            className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 font-mono text-xs text-muted"
          >
            {item.icon}
            {item.label}
          </span>
        ))}
      </div>
    </motion.section>
  );
}

function RideDetailVehicle({
  ride,
  vehicle,
}: {
  ride: Ride;
  vehicle?: VehicleWithImages | null;
}) {
  const t = useTranslations("ride");
  const model = vehicle?.make_name
    ? `${vehicle.make_name} ${vehicle.model_name || ""}`.trim()
    : ride.car_model;
  const color = vehicle?.color || ride.car_color;

  if (!model && !color) return null;

  return (
    <motion.section
      {...fadeUp}
      transition={{ ...fadeUp.transition, delay: 0.18 }}
      className="px-4 py-2 md:px-0"
    >
      <div className="flex items-center gap-3 py-3">
        <Car className="size-4 shrink-0 text-muted" strokeWidth={1.5} />
        <p className="text-sm text-fg">
          {[model, color].filter(Boolean).join(" · ")}
        </p>
        {!model && color && (
          <span className="sr-only">{t("vehicle")}</span>
        )}
      </div>
      <Separator />
    </motion.section>
  );
}

function RideDetailMapSection({ ride }: { ride: Ride }) {
  return (
    <motion.section
      {...fadeUp}
      transition={{ ...fadeUp.transition, delay: 0.2 }}
      className="px-4 py-6 md:px-0"
    >
      <div className="overflow-hidden rounded-[var(--radius)] border border-line bg-surface">
        <RouteMap fromCity={ride.from_city} toCity={ride.to_city} height="240px" />
      </div>
    </motion.section>
  );
}

function RideDetailReviews({
  reviews,
  formatReviewDate,
}: {
  reviews: Review[];
  formatReviewDate: (dateStr: string) => string;
}) {
  const t = useTranslations("ride");

  return (
    <motion.section
      {...fadeUp}
      transition={{ ...fadeUp.transition, delay: 0.22 }}
      className="px-4 py-6 md:px-0"
    >
      <p className="text-eyebrow mb-4">{t("reviews")}</p>

      {reviews.length === 0 ? (
        <p className="font-mono text-sm text-muted">{t("noReviews")}</p>
      ) : (
        <div className="divide-y divide-line">
          {reviews.map((review) => (
            <div key={review.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
              <Avatar
                src={review.reviewer.avatar_url}
                name={review.reviewer.name}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate font-medium text-fg">{review.reviewer.name}</p>
                  <span className="shrink-0 font-mono text-xs text-dim tabular-nums">
                    {review.rating.toFixed(1)}
                  </span>
                </div>
                <p className="mt-0.5 font-mono text-[11px] text-dim">
                  {formatReviewDate(review.created_at)}
                </p>
                {review.comment && (
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {review.comment}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.section>
  );
}

function RideDetailSimilarRides({
  similarRides,
  locale,
}: {
  similarRides: Ride[];
  locale: string;
}) {
  const t = useTranslations("ride");

  if (similarRides.length === 0) return null;

  return (
    <motion.section
      {...fadeUp}
      transition={{ ...fadeUp.transition, delay: 0.25 }}
      className="px-4 pb-8 md:px-0"
    >
      <p className="text-eyebrow mb-4">{t("similarRides")}</p>
      <div className="divide-y divide-line rounded-[var(--radius)] border border-line bg-surface">
        {similarRides.map((similar) => (
          <Link
            key={similar.id}
            href={`/${locale}/corsa/${similar.id}`}
            className="flex items-center justify-between px-4 py-4 transition-colors hover:bg-surface-2"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-fg">
                {similar.from_city} → {similar.to_city}
              </p>
              <p className="mt-0.5 font-mono text-xs text-muted">
                {similar.time.slice(0, 5)} · {similar.profiles.name}
              </p>
            </div>
            <span className="ml-3 shrink-0 font-mono text-sm tabular-nums text-fg">
              {similar.price === 0 ? t("free") : `€${similar.price}`}
            </span>
          </Link>
        ))}
      </div>
    </motion.section>
  );
}

function RideDetailStickyCTA({
  ride,
  locale,
  isMyRide,
  existingBooking,
  canBook,
  rideStatus,
  requesting,
  handleRequestRide,
  fixed = true,
}: {
  ride: Ride;
  locale: string;
  isMyRide: boolean;
  existingBooking: Booking | null;
  canBook: boolean;
  rideStatus: import("@/lib/ride-status").ComputedRideStatus;
  requesting: boolean;
  handleRequestRide: () => void;
  fixed?: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("ride");

  const priceLabel = ride.price === 0 ? t("free") : `€${ride.price}`;

  const action = (() => {
    if (isMyRide) {
      return (
        <Button
          className="w-full md:w-auto"
          variant="outline"
          onClick={() => router.push(`/${locale}/profilo`)}
        >
          {t("manageFromProfile")}
        </Button>
      );
    }
    if (existingBooking) {
      return (
        <Button
          className="w-full md:w-auto"
          onClick={() => router.push(`/${locale}/chat/${existingBooking.id}`)}
        >
          {t("openChat")}
        </Button>
      );
    }
    if (!canBook) {
      return (
        <Button className="w-full md:w-auto" disabled>
          {rideStatus === "completed" ? t("rideCompleted") : t("rideUnavailable")}
        </Button>
      );
    }
    return (
      <Button
        className="w-full md:w-auto"
        onClick={handleRequestRide}
        disabled={requesting}
      >
        {requesting ? t("booking") : t("requestRide")}
      </Button>
    );
  })();

  const bar = (
    <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-5">
      <div>
        <p className="font-mono text-xs text-dim">{t("pricePerSeat")}</p>
        <p className="font-mono text-xl tabular-nums text-fg">{priceLabel}</p>
      </div>
      {action}
    </div>
  );

  if (!fixed) {
    return (
      <Card className="p-0 overflow-hidden">
        <div className="border-t border-line">{bar}</div>
      </Card>
    );
  }

  return (
    <div
      className="fixed inset-x-0 bottom-16 z-40 border-t border-line bg-bg md:bottom-0"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {bar}
    </div>
  );
}

function RideDetailLoginModal({
  show,
  onClose,
}: {
  show: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("ride");
  const tc = useTranslations("common");

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-sm p-6">
        <h3 className="heading-editorial mb-2 text-xl text-fg">{t("loginToBook")}</h3>
        <p className="mb-6 text-sm text-muted">{t("authRequiredToBook")}</p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {tc("cancel")}
          </Button>
          <Button className="flex-1" onClick={() => signInWithGoogle()}>
            {tc("login")}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function RideDetailMobile(props: RideDetailViewProps) {
  const router = useRouter();
  const locale = useLocale();
  const isMyRide = props.user?.id === props.ride.driver_id;

  return (
    <div className="min-h-screen bg-bg pb-36">
      <RideDetailTopBar onBack={() => router.back()} ride={props.ride} />

      <main>
        <RideDetailRouteHero
          ride={props.ride}
          stops={props.stops}
          rideStatus={props.rideStatus}
        />
        <RideDetailPriceSeats ride={props.ride} />
        <RideDetailDriverTrust
          ride={props.ride}
          locale={locale}
          existingBooking={props.existingBooking}
          isMyRide={isMyRide}
        />
        <RideDetailAmenities ride={props.ride} />
        <RideDetailVehicle ride={props.ride} vehicle={props.vehicle} />
        <RideDetailMapSection ride={props.ride} />
        <RideDetailReviews
          reviews={props.reviews}
          formatReviewDate={props.formatReviewDate}
        />
        <RideDetailSimilarRides similarRides={props.similarRides} locale={locale} />
      </main>

      <RideDetailStickyCTA
        ride={props.ride}
        locale={locale}
        isMyRide={isMyRide}
        existingBooking={props.existingBooking}
        canBook={props.canBook}
        rideStatus={props.rideStatus}
        requesting={props.requesting}
        handleRequestRide={props.handleRequestRide}
      />

      <RideDetailLoginModal
        show={props.showLoginModal}
        onClose={() => props.setShowLoginModal(false)}
      />
    </div>
  );
}

function RideDetailDesktop(props: RideDetailViewProps) {
  const router = useRouter();
  const locale = useLocale();
  const isMyRide = props.user?.id === props.ride.driver_id;

  return (
    <div className="min-h-screen bg-bg">
      <RideDetailTopBar onBack={() => router.back()} ride={props.ride} />

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="space-y-2 lg:col-span-2">
            <RideDetailRouteHero
              ride={props.ride}
              stops={props.stops}
              rideStatus={props.rideStatus}
            />
            <RideDetailPriceSeats ride={props.ride} />
            <RideDetailDriverTrust
              ride={props.ride}
              locale={locale}
              existingBooking={props.existingBooking}
              isMyRide={isMyRide}
            />
            <RideDetailAmenities ride={props.ride} />
            <RideDetailVehicle ride={props.ride} vehicle={props.vehicle} />
            <RideDetailMapSection ride={props.ride} />
            <RideDetailReviews
              reviews={props.reviews}
              formatReviewDate={props.formatReviewDate}
            />
            <RideDetailSimilarRides similarRides={props.similarRides} locale={locale} />
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <RideDetailStickyCTA
                ride={props.ride}
                locale={locale}
                isMyRide={isMyRide}
                existingBooking={props.existingBooking}
                canBook={props.canBook}
                rideStatus={props.rideStatus}
                requesting={props.requesting}
                handleRequestRide={props.handleRequestRide}
                fixed={false}
              />
            </div>
          </div>
        </div>
      </main>

      <RideDetailLoginModal
        show={props.showLoginModal}
        onClose={() => props.setShowLoginModal(false)}
      />
    </div>
  );
}

export interface RideDetailClientProps {
  ride: Ride;
  user: SupabaseUser | null;
  reviews: Review[];
  similarRides: Ride[];
  stops: { city: string; order_index: number }[];
  existingBooking: Booking | null;
  rideId: string;
  locale: string;
  vehicle?: VehicleWithImages | null;
}

export function RideDetailClient({
  ride,
  user,
  reviews,
  similarRides,
  stops,
  existingBooking: initialBooking,
  rideId,
  locale,
  vehicle,
}: RideDetailClientProps) {
  const router = useRouter();
  const deviceType = useDeviceType();
  const t = useTranslations("ride");

  const [requesting, setRequesting] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showPostAction, setShowPostAction] = useState(false);
  const [postActionBookingId, setPostActionBookingId] = useState<string | null>(null);
  const [existingBooking] = useState<Booking | null>(initialBooking);

  const [supabase] = useState(() => createClient());
  const isMountedRef = useRef(true);

  const rideStatus = computeRideStatus(ride.status, ride.date, ride.time);
  const canBook = isRideBookable(ride.status, ride.date, ride.time);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const formatDate = useCallback(
    (dateStr: string) => {
      const date = new Date(dateStr);
      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

      let prefix = "";
      if (dateStr === today) prefix = `${t("today")}, `;
      else if (dateStr === tomorrow) prefix = `${t("tomorrow")}, `;

      return (
        prefix +
        date.toLocaleDateString(locale, {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      );
    },
    [locale, t]
  );

  const formatReviewDate = useCallback(
    (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString(locale, {
        month: "short",
        year: "numeric",
      });
    },
    [locale]
  );

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("linkCopied"));
    } catch {
      toast.error(t("copyError"));
    }
  };

  const handleRequestRide = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!ride) return;
    if (user.id === ride.driver_id) {
      toast.error(t("cannotBookOwnRide"));
      return;
    }
    if (existingBooking) {
      router.push(`/${locale}/chat/${existingBooking.id}`);
      return;
    }
    if (!canBook) {
      toast.error(t("rideUnavailable"));
      return;
    }

    setRequesting(true);
    Analytics.trackEvent("booking_started", { ride_id: ride.id, price: ride.price });
    Analytics.trackEvent("first_booking_started", { ride_id: ride.id, price: ride.price });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("booking_intent"));
    }

    try {
      if (ride.price > 0) {
        const res = await fetch("/api/stripe/connect/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rideId, locale }),
        });
        const data = await res.json();

        if (!res.ok) {
          if (data.error === "Driver has not set up payments") {
            toast.error(
              t("driverPaymentsNotSetup") ||
                "Il guidatore non ha ancora configurato i pagamenti."
            );
          } else {
            throw new Error(data.error || "Checkout failed");
          }
          setRequesting(false);
          return;
        }

        window.location.href = data.url;
        return;
      }

      await supabase.from("profiles").upsert(
        {
          id: user.id,
          name:
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "Utente",
          email: user.email || "",
          rating: 5.0,
          rides_count: 0,
          points: 0,
          level: "Viaggiatore",
        },
        { onConflict: "id", ignoreDuplicates: true }
      );

      const { count: confirmedCount, error: countError } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("ride_id", rideId)
        .eq("status", "confirmed");

      if (countError) {
        throw new Error(`Seat count failed: ${countError.message}`);
      }

      const availableSeats = ride.seats - (confirmedCount || 0);
      if (availableSeats <= 0) {
        toast.error(t("noSeatsAvailable"));
        setRequesting(false);
        return;
      }

      const { count: priorBookings } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("passenger_id", user.id);
      const isFirstBooking = (priorBookings || 0) === 0;

      const { data: booking, error } = await supabase
        .from("bookings")
        .insert({
          ride_id: rideId,
          passenger_id: user.id,
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          toast.error(
            t("alreadyBooked") || "Hai già una prenotazione per questo viaggio"
          );
          setRequesting(false);
          return;
        }
        throw new Error(`Booking insert failed: ${error.message}`);
      }
      if (!booking?.id) throw new Error("Booking insert returned no data");

      await supabase.from("messages").insert({
        booking_id: booking.id,
        sender_id: user.id,
        content: t("initialMessage", { from: ride.from_city, to: ride.to_city }),
        read: false,
      });

      try {
        await notifyBookingRequest(
          ride.driver_id,
          user.user_metadata?.name || user.email?.split("@")[0] || t("passenger"),
          rideId,
          booking.id
        );
      } catch (notifyErr) {
        console.error("[booking] notification error (non-fatal):", notifyErr);
      }

      Analytics.trackEvent("booking_completed", {
        ride_id: ride.id,
        booking_id: booking.id,
        price: ride.price,
      });
      toast.success(t("bookingSuccess"));

      localStorage.setItem("pwa_has_booked", "true");
      window.dispatchEvent(new Event("trigger_pwa_prompt"));

      if (isFirstBooking) {
        setShowCelebration(true);
        setTimeout(() => {
          router.push(`/${locale}/chat/${booking.id}`);
        }, 2500);
      } else {
        setPostActionBookingId(booking.id);
        setShowPostAction(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[booking] error:", err);
      toast.error(`${t("bookingError")}: ${message}`);
      setRequesting(false);
    }
  };

  const commonProps: RideDetailViewProps = {
    ride,
    user,
    reviews,
    similarRides,
    stops,
    existingBooking,
    requesting,
    showLoginModal,
    vehicle,
    setShowLoginModal,
    handleShare,
    handleRequestRide,
    formatDate,
    formatReviewDate,
    rideStatus,
    canBook,
  };

  return (
    <ErrorBoundary>
      {deviceType === "desktop" ? (
        <RideDetailDesktop {...commonProps} />
      ) : (
        <RideDetailMobile {...commonProps} />
      )}
      {showCelebration && (
        <CelebrationModal
          type="first_booking"
          onClose={() => {
            setShowCelebration(false);
            router.push(`/${locale}/chat/${existingBooking?.id || ""}`);
          }}
        />
      )}
      {showPostAction && ride && (
        <PostActionModal
          type="booking_confirmed"
          open={showPostAction}
          onClose={() => {
            setShowPostAction(false);
            if (postActionBookingId) {
              router.push(`/${locale}/chat/${postActionBookingId}`);
            }
          }}
          onPrimaryAction={() => {
            if (postActionBookingId) {
              router.push(`/${locale}/chat/${postActionBookingId}`);
            }
          }}
          context={{
            rideId: ride.id,
            fromCity: ride.from_city,
            toCity: ride.to_city,
            date: ride.date,
            time: ride.time,
            price: ride.price,
            driverName: ride.profiles?.name,
          }}
        />
      )}
    </ErrorBoundary>
  );
}