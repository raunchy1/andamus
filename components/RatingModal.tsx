"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Star, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { notifyNewReview } from "@/lib/notifications";
import { completeGamificationAction } from "@/lib/gamification";
import Image from "next/image";
import toast from "react-hot-toast";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  rideId: string;
  reviewedUser: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  currentUserId: string;
  onSuccess?: () => void;
}

export function RatingModal({
  isOpen,
  onClose,
  rideId,
  reviewedUser,
  currentUserId,
  onSuccess,
}: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const supabase = createClient();

  const checkExistingReview = useCallback(async () => {
    const { data } = await supabase
      .from("reviews")
      .select("id")
      .eq("ride_id", rideId)
      .eq("reviewer_id", currentUserId)
      .single();
    
    if (data) {
      setAlreadyReviewed(true);
    }
  }, [supabase, rideId, currentUserId]);

  useEffect(() => {
    if (isOpen) {
      checkExistingReview();
    }
  }, [isOpen, checkExistingReview]);

    const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Seleziona una valutazione");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("reviews").insert({
        ride_id: rideId,
        reviewer_id: currentUserId,
        reviewed_id: reviewedUser.id,
        rating,
        comment: comment.trim() || null,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("Hai già recensito questo passaggio");
        } else {
          throw error;
        }
      } else {
        // Get reviewer name for notification
        const { data: { user } } = await supabase.auth.getUser();
        const reviewerName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Utente";
        
        // Notify reviewed user
        await notifyNewReview(reviewedUser.id, reviewerName, rideId);
        
        // Add gamification points for 5-star review (to reviewed user)
        if (rating === 5) {
          const result = await completeGamificationAction(
            reviewedUser.id,
            'five_star_review'
          );
          
          if (result.pointsAdded > 0) {
            toast.success(`Il conducente ha guadagnato +${result.pointsAdded} punti per la recensione 5 stelle! ⭐`);
          }
        }
        
        toast.success("Recensione inviata!");
        onSuccess?.();
        onClose();
        setRating(0);
        setComment("");
      }
    } catch {
      toast.error("Errore durante l'invio");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1e2a4a] p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Lascia una recensione</h3>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {alreadyReviewed ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/20">
              <Star className="h-8 w-8 text-yellow-400 fill-yellow-400" />
            </div>
            <p className="text-white/60">Hai già lasciato una recensione per questo passaggio.</p>
          </div>
        ) : (
          <>
            {/* User Info */}
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e63946]/10 text-[#e63946]">
                {reviewedUser.avatar_url ? (
                  <Image
                    src={reviewedUser.avatar_url}
                    alt={reviewedUser.name}
                    width={64}
                    height={64}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold">
                    {reviewedUser.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm text-white/50">Come valuti</p>
                <p className="text-lg font-semibold text-white">{reviewedUser.name}?</p>
              </div>
            </div>

            {/* Star Rating */}
            <div className="mb-6">
              <p className="mb-3 text-center text-sm text-white/50">Tocca per valutare</p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-10 w-10 transition-all ${
                        star <= (hoverRating || rating)
                          ? "fill-yellow-400 text-yellow-400 drop-shadow-lg"
                          : "text-white/20"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="mt-2 text-center text-sm font-medium text-[#e63946]">
                {rating === 1 && "Pessimo"}
                {rating === 2 && "Scarso"}
                {rating === 3 && "Buono"}
                {rating === 4 && "Ottimo"}
                {rating === 5 && "Eccellente"}
              </p>
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-white/70">
                Commento (opzionale)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Descrivi la tua esperienza..."
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-[#0f1729] p-4 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-[#e63946]"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading || rating === 0}
              className="w-full rounded-xl bg-[#e63946] py-4 text-base font-semibold text-white shadow-lg shadow-[#e63946]/25 transition-all hover:bg-[#c92a37] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="mx-auto h-5 w-5 animate-spin" />
              ) : (
                "Invia recensione"
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
