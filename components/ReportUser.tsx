"use client";

import { useState } from "react";
import { Flag, X, AlertTriangle, Loader2 } from "lucide-react";
import { submitSafetyReport } from "@/lib/safety-actions";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface ReportUserProps {
  reportedId: string;
  rideId?: string;
  reportedName: string;
  iconOnly?: boolean;
}

const reportReasons = [
  { id: "inappropriate_behavior" },
  { id: "no_show" },
  { id: "fake_profile" },
  { id: "unsafe_driving" },
  { id: "harassment" },
  { id: "other" },
];

export function ReportUser({ reportedId, rideId, reportedName, iconOnly = false }: ReportUserProps) {
  const t = useTranslations("report");
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error(t("selectReason"));
      return;
    }

    setLoading(true);

    try {
      await submitSafetyReport({
        reported_id: reportedId,
        ride_id: rideId || null,
        type: reason,
        description: description.trim() || null,
      });

      toast.success(t("reportSent"));
      setIsOpen(false);
      setReason("");
      setDescription("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("reportError");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={iconOnly ? "text-muted hover:text-bad transition-colors flex items-center justify-center" : "flex items-center gap-2 text-sm text-muted transition-colors hover:text-bad"}
        title={t("reportUser")}
      >
        <Flag className="h-4.5 w-4.5" />
        {!iconOnly && t("reportUser")}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur">
          <div className="w-full max-w-md rounded-3xl border border-line bg-elevated p-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bad/20">
                  <AlertTriangle className="h-5 w-5 text-bad" />
                </div>
                <div>
                  <h3 className="font-semibold text-ink">{t("reportUser")}</h3>
                  <p className="text-sm text-muted">{reportedName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-sand-deep hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Reasons */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-fg">
                {t("reportReason")}
              </label>
              <div className="space-y-2">
                {reportReasons.map((r) => (
                  <label
                    key={r.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${
                      reason === r.id
                        ? "border-primary bg-primary/10"
                        : "border-line bg-surface hover:bg-sand-deep"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r.id}
                      checked={reason === r.id}
                      onChange={(e) => setReason(e.target.value)}
                      className="h-4 w-4 accent-[#2D6A4F]"
                    />
                    <span className="text-sm text-ink">{t(`reasons.${r.id}`)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-fg">
                {t("descriptionOptional")}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("describeWhatHappened")}
                rows={3}
                className="w-full rounded-xl border border-line bg-bg p-3 text-sm text-ink outline-none focus:border-green placeholder:text-faint"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading || !reason}
              className="w-full rounded-xl bg-bad py-3 text-sm font-semibold text-white transition-all hover:bg-bad disabled:opacity-50"
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
