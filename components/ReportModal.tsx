"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { X, Bug, Send, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useDeviceType } from "@/components/view-mode";

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
}

export function ReportModal({ open, onClose }: ReportModalProps) {
  const t = useTranslations("feedback");
  const locale = useLocale();
  const deviceType = useDeviceType();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(async () => {
    if (!text.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          locale,
          deviceType,
          route: typeof window !== "undefined" ? window.location.pathname : "",
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        }),
      });

      if (!res.ok) throw new Error("Failed to send");

      setSent(true);
      setText("");
      toast.success(t("sent"));
      setTimeout(() => {
        setSent(false);
        onClose();
      }, 1500);
    } catch {
      toast.error(t("error"));
    } finally {
      setSending(false);
    }
  }, [text, sending, locale, deviceType, onClose, t]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:w-full sm:max-w-md bg-[#1a1a1a] sm:rounded-3xl rounded-t-3xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-[#e63946]" />
            <h3 className="font-bold text-white text-lg">{t("title")}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 pb-6 space-y-4">
          {sent ? (
            <div className="py-8 flex flex-col items-center gap-3">
              <CheckCircle className="w-12 h-12 text-green-400" />
              <p className="text-white font-medium">{t("thankYou")}</p>
            </div>
          ) : (
            <>
              <p className="text-white/60 text-sm">{t("description")}</p>

              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t("placeholder")}
                rows={4}
                maxLength={1000}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#e63946]/50 resize-none"
              />

              <div className="flex items-center justify-between">
                <span className="text-white/30 text-xs">
                  {text.length}/1000
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={sending || !text.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#e63946] text-white rounded-xl text-sm font-semibold hover:bg-[#c92a37] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {t("send")}
                </button>
              </div>

              <p className="text-white/30 text-[11px]">
                {t("privacyNote")}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
