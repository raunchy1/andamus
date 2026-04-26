"use client";

import { useState } from "react";
import { Flag, X, AlertTriangle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface ReportUserProps {
  reportedId: string;
  rideId?: string;
  reportedName: string;
}

const reportReasons = [
  { id: "inappropriate_behavior" },
  { id: "no_show" },
  { id: "fake_profile" },
  { id: "unsafe_driving" },
  { id: "harassment" },
  { id: "other" },
];

export function ReportUser({ reportedId, rideId, reportedName }: ReportUserProps) {
  const t = useTranslations("report");
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async () => {
    if (!reason) {
      toast.error(t("selectReason"));
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(t("mustBeAuthenticated"));
        return;
      }

      const { error } = await supabase.from("safety_reports").insert({
        reporter_id: user.id,
        reported_id: reportedId,
        ride_id: rideId || null,
        type: reason,
        description: description.trim(),
      });

      if (error) throw error;

      toast.success(t("reportSent"));
      setIsOpen(false);
      setReason("");
      setDescription("");
    } catch {
      toast.error(t("reportError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-red-400"
      >
        <Flag className="h-4 w-4" />
        {t("reportUser")}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1e2a4a] p-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{t("reportUser")}</h3>
                  <p className="text-sm text-white/50">{reportedName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Reasons */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-white/70">
                {t("reportReason")}
              </label>
              <div className="space-y-2">
                {reportReasons.map((r) => (
                  <label
                    key={r.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${
                      reason === r.id
                        ? "border-[#e63946] bg-[#e63946]/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r.id}
                      checked={reason === r.id}
                      onChange={(e) => setReason(e.target.value)}
                      className="h-4 w-4 accent-[#e63946]"
                    />
                    <span className="text-sm text-white">{t(`reasons.${r.id}`)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-white/70">
                {t("descriptionOptional")}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("describeWhatHappened")}
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-[#0f1729] p-3 text-sm text-white outline-none focus:border-[#e63946] placeholder:text-white/30"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading || !reason}
              className="w-full rounded-xl bg-red-500 py-3 text-sm font-semibold text-white transition-all hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="mx-auto h-5 w-5 animate-spin" />
              ) : (
                t("sendReport")
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
