"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Loader2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Car
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { notifyBookingRequest } from "@/lib/notifications";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "sonner";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface Booking {
  id: string;
  ride_id: string;
  passenger_id: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  created_at: string;
}

interface BookingButtonProps {
  rideId: string;
  driverId: string;
  availableSeats: number;
  currentUserId: string | null;
  user: SupabaseUser | null;
  ride: {
    from_city: string;
    to_city: string;
    driver_id: string;
  };
  variant?: "mobile" | "desktop";
}

export function BookingButton({
  rideId,
  driverId,
  availableSeats,
  currentUserId,
  user,
  ride,
  variant = "mobile",
}: BookingButtonProps) {
  const router = useRouter();
  const t = useTranslations('booking');
  const [bookingStatus, setBookingStatus] = useState<Booking["status"] | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  
  const supabase = createClient();

  // Check for existing booking on mount
  useEffect(() => {
    const checkExistingBooking = async () => {
      if (!currentUserId) {
        setIsChecking(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("bookings")
          .select("id, status")
          .eq("ride_id", rideId)
          .eq("passenger_id", currentUserId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setBookingStatus(data.status);
          setBookingId(data.id);
        }
      } catch {
        // Error handled silently
      } finally {
        setIsChecking(false);
      }
    };

    checkExistingBooking();
  }, [currentUserId, rideId, supabase]);

  const handleBooking = async () => {
    // Check authentication
    if (!currentUserId || !user) {
      toast.error(t('loginRequired'));
      return;
    }

    // Prevent booking own ride
    if (currentUserId === driverId) {
      toast.error(t('cannotBookOwnRide'));
      return;
    }

    // Check available seats
    if (availableSeats === 0) {
      toast.error(t('noSeatsAvailable'));
      return;
    }

    // If already has booking, go to chat
    if (bookingId && bookingStatus !== "rejected") {
      router.push(`/chat/${bookingId}`);
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading(t('sendingRequest'));

    try {
      // Create booking
      const { data: booking, error } = await supabase
        .from("bookings")
        .insert({
          ride_id: rideId,
          passenger_id: currentUserId,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial message
      await supabase.from("messages").insert({
        booking_id: booking.id,
        sender_id: currentUserId,
        content: t('initialMessage', { from: ride.from_city, to: ride.to_city }),
        read: false,
      });

      // Notify driver
      await notifyBookingRequest(
        driverId,
        user.user_metadata?.name || user.email?.split("@")[0] || t('passenger'),
        rideId,
        booking.id
      );

      setBookingStatus("pending");
      setBookingId(booking.id);
      
      toast.dismiss(toastId);
      toast.success(t('requestSent'));
      
      // Redirect to chat after short delay
      setTimeout(() => {
        router.push(`/chat/${booking.id}`);
      }, 1500);
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err instanceof Error ? err.message : t('bookingError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while checking existing booking
  if (isChecking) {
    return (
      <button
        disabled
        className="w-full h-14 bg-surface-container-highest text-on-surface-variant rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-70"
      >
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>{t('checking')}</span>
      </button>
    );
  }

  // Driver viewing their own ride
  if (currentUserId === driverId) {
    return (
      <div className="w-full h-14 bg-surface-container-highest/50 text-on-surface-variant rounded-2xl font-bold flex items-center justify-center gap-2 border-2 border-dashed border-outline-variant">
        <Car className="w-5 h-5" />
        <span>{t('yourRide')}</span>
      </div>
    );
  }

  // No seats available
  if (availableSeats === 0) {
    return (
      <button
        disabled
        className="w-full h-14 bg-error/10 text-error rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-70"
      >
        <XCircle className="w-5 h-5" />
        <span>{t('seatsFull')}</span>
      </button>
    );
  }

  // Render based on booking status
  switch (bookingStatus) {
    case "pending":
      return (
        <Link
          href={`/chat/${bookingId}`}
          className="w-full h-14 bg-warning/10 text-warning border-2 border-warning/30 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-warning/20 transition-colors"
        >
          <Clock className="w-5 h-5" />
          <span>{t('pendingConfirmation')}</span>
        </Link>
      );

    case "accepted":
      return (
        <Link
          href={`/chat/${bookingId}`}
          className="w-full h-14 bg-tertiary/10 text-tertiary border-2 border-tertiary/30 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-tertiary/20 transition-colors"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>{t('bookingConfirmed')}</span>
        </Link>
      );

    case "rejected":
      return (
        <button
          disabled
          className="w-full h-14 bg-error/10 text-error/60 rounded-2xl font-bold flex items-center justify-center gap-2"
        >
          <XCircle className="w-5 h-5" />
          <span>{t('requestRejected')}</span>
        </button>
      );

    default:
      // No booking yet - show primary CTA
      return (
        <button
          onClick={handleBooking}
          disabled={isLoading}
          className={`
            w-full h-14 rounded-2xl font-bold flex items-center justify-center gap-2
            transition-all duration-300 transform active:scale-95
            ${variant === "mobile" 
              ? "bg-primary text-on-primary shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.02]" 
              : "bg-primary text-on-primary shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40"
            }
            disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none
          `}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{t('booking')}</span>
            </>
          ) : (
            <>
              <Car className="w-5 h-5" />
              <span>{t('requestSeat')}</span>
            </>
          )}
        </button>
      );
  }
}

// Compact version for inline use
export function BookingButtonCompact(props: BookingButtonProps) {
  return (
    <div className="w-full">
      <BookingButton {...props} />
    </div>
  );
}
