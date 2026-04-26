"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, ArrowLeft, Calendar, MapPin, User, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface BookingDetails {
  id: string;
  status: string;
  ride: {
    id: string;
    from_city: string;
    to_city: string;
    date: string;
    time: string;
    driver_id: string;
  };
  passenger: {
    id: string;
    name: string;
  };
  passenger_id: string;
}

export default function CancelBookingPage() {
  const t = useTranslations("cancellation");
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [details, setDetails] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const supabase = createClient();

  const cancellationReasons = [
    { value: "found_other_ride", label: t("reasons.foundOtherRide") },
    { value: "change_plans", label: t("reasons.plansChanged") },
    { value: "personal_emergency", label: t("reasons.emergency") },
    { value: "driver_no_response", label: t("reasons.driverIssue") },
    { value: "other", label: t("reasons.other") },
  ];

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/");
          return;
        }
        setUserId(user.id);

        const { data, error } = await supabase
          .from("bookings")
          .select(`
            id,
            status,
            passenger_id,
            ride:ride_id (
              id,
              from_city,
              to_city,
              date,
              time,
              driver_id
            ),
            passenger:passenger_id (id, name)
          `)
          .eq("id", bookingId)
          .single();

        if (error) throw error;

        if (!data) {
          toast.error(t("notFound"));
          router.push("/profilo");
          return;
        }

        const ride = Array.isArray(data.ride) ? data.ride[0] : data.ride;
        const passenger = Array.isArray(data.passenger) ? data.passenger[0] : data.passenger;
        
        const isPassenger = data.passenger_id === user.id;
        const isDriver = ride?.driver_id === user.id;

        if (!isPassenger && !isDriver) {
          toast.error(t("noAccess"));
          router.push("/profilo");
          return;
        }

        if (data.status === "cancelled") {
          toast.error(t("alreadyCancelled"));
          router.push("/profilo");
          return;
        }

        setBooking({
          ...data,
          ride: ride,
          passenger: passenger,
        } as BookingDetails);
      } catch (_error) {
        toast.error(t("loadError"));
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, router, supabase, t]);

  const handleCancel = async () => {
    if (!selectedReason) {
      toast.error(t("selectReason"));
      return;
    }

    setCancelling(true);

    try {
      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancellation_reason: `${selectedReason}${details ? `: ${details}` : ""}`,
          cancelled_by: userId,
        })
        .eq("id", bookingId);

      if (updateError) throw updateError;

      try {
        await fetch("/api/emails/booking-rejected", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId,
            reason: selectedReason,
          }),
        });
      } catch {
        // Email error - logged silently
      }

      toast.success(t("successMessage"));
      router.push("/profilo");
    } catch (_error) {
      toast.error(t("errorMessage"));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#e63946]" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
        <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
        <h1 className="text-2xl font-bold text-white">{t("notFoundTitle")}</h1>
        <Link href="/profilo" className="mt-6 text-[#e63946] flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> {t("backToProfile")}
        </Link>
      </div>
    );
  }

  const isPassenger = userId === booking.passenger_id;

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20 pb-12">
      <div className="bg-[#12121e] border-b border-white/10 px-4 py-4">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/profilo"
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            {t("backToProfile")}
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <X className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{t("title")}</h1>
          <p className="text-white/60">{t("subtitle")}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#1e2a4a] p-6 mb-6">
          <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">
            {t("rideDetails")}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-white">
              <MapPin className="h-5 w-5 text-[#e63946]" />
              <span>{booking.ride.from_city} → {booking.ride.to_city}</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <Calendar className="h-5 w-5 text-[#e63946]" />
              <span>
                {new Date(booking.ride.date).toLocaleDateString("it-IT", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
                {booking.ride.time && ` alle ${booking.ride.time}`}
              </span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <User className="h-5 w-5 text-[#e63946]" />
              <span>
                {isPassenger ? t("passenger") : t("driver")}: {booking.passenger.name}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#1e2a4a] p-6 mb-6">
          <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">
            {t("reasonTitle")}
          </h3>

          <div className="space-y-3 mb-4">
            {cancellationReasons.map((reason) => (
              <label
                key={reason.value}
                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                  selectedReason === reason.value
                    ? "border-[#e63946] bg-[#e63946]/10"
                    : "border-white/10 bg-white/5 hover:bg-white/[0.07]"
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedReason === reason.value
                    ? "border-[#e63946]"
                    : "border-white/30"
                }`}>
                  {selectedReason === reason.value && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#e63946]" />
                  )}
                </div>
                <input
                  type="radio"
                  name="reason"
                  value={reason.value}
                  checked={selectedReason === reason.value}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="hidden"
                />
                <span className="text-white">{reason.label}</span>
              </label>
            ))}
          </div>

          {selectedReason === "other" && (
            <div className="mt-4">
              <label className="block text-sm text-white/60 mb-2">
                {t("detailsLabel")}
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={t("detailsPlaceholder")}
                className="w-full h-24 px-4 py-3 rounded-xl border border-white/10 bg-[#0f1729] text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-[#e63946]"
              />
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <Link
            href="/profilo"
            className="flex-1 py-4 rounded-xl border border-white/10 bg-white/5 text-white font-semibold text-center hover:bg-white/10 transition-colors"
          >
            {t("cancel")}
          </Link>
          <button
            onClick={handleCancel}
            disabled={cancelling || !selectedReason}
            className="flex-1 py-4 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {cancelling ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {t("cancelling")}
              </>
            ) : (
              <>
                <X className="h-5 w-5" />
                {t("confirm")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
