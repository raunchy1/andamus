"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Phone, Check, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface PhoneVerificationProps {
  userId: string;
  currentPhone?: string | null;
  isVerified?: boolean;
  onVerified?: () => void;
}

export function PhoneVerification({ 
  userId, 
  currentPhone, 
  isVerified = false,
  onVerified 
}: PhoneVerificationProps) {
  const t = useTranslations("profile");
  const [phone, setPhone] = useState(currentPhone || "");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const [supabase] = useState(() => createClient());

  // Format phone number to E.164 format (+39XXXXXXXXXX)
  const formatPhoneNumber = (input: string): string => {
    let cleaned = input.replace(/\D/g, "");

    // Handle international 00 prefix (e.g. 00339... -> +339...)
    if (cleaned.startsWith("00")) {
      cleaned = cleaned.substring(2);
    }

    // If it starts with 0, replace with 39 (Italy)
    if (cleaned.startsWith("0")) {
      cleaned = "39" + cleaned.substring(1);
    }

    // If it doesn't start with +, add it
    if (!cleaned.startsWith("+")) {
      cleaned = "+" + cleaned;
    }

    return cleaned;
  };

  // Step 1: Send OTP
  const sendOtp = async () => {
    if (!phone.trim()) {
      toast.error(t("enterValidPhone"));
      return;
    }

    const formattedPhone = formatPhoneNumber(phone);
    
    // Basic validation for Italian numbers
    if (!formattedPhone.match(/^\+39\d{9,10}$/)) {
      toast.error(t("enterValidItalianPhone"));
      return;
    }

    setIsLoading(true);
    
    try {
      // Update user phone in Supabase Auth - this triggers OTP
      const { error } = await supabase.auth.updateUser({
        phone: formattedPhone,
      });

      if (error) {
        throw error;
      }

      setIsOtpSent(true);
      toast.success(t("otpSent"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("otpSendError"));
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const verifyOtp = async () => {
    if (!otp.trim() || otp.length !== 6) {
      toast.error(t("enterOtpCode"));
      return;
    }

    setIsLoading(true);
    
    try {
      const formattedPhone = formatPhoneNumber(phone);
      
      // Verify the OTP
      const { error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: "phone_change",
      });

      if (error) {
        throw error;
      }

      // Update profile to mark phone as verified
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ 
          phone_verified: true,
          phone: formattedPhone 
        })
        .eq("id", userId);

      if (profileError) {
        throw profileError;
      }

      toast.success(t("phoneVerifiedSuccess"));
      onVerified?.();
      setShowModal(false);
      setIsOtpSent(false);
      setOtp("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("invalidOtp"));
    } finally {
      setIsLoading(false);
    }
  };

  // Reset and close modal
  const handleClose = () => {
    setShowModal(false);
    setIsOtpSent(false);
    setOtp("");
    setPhone(currentPhone || "");
  };

  if (isVerified) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        <Check className="h-4 w-4 shrink-0 text-green" strokeWidth={1.5} aria-hidden />
        {t("phoneVerified")}
      </p>
    );
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setShowModal(true)}
        className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-line text-sm font-medium text-ink transition-colors hover:bg-sand"
      >
        {t("verifyPhone")}
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-modal flex items-end justify-center bg-[var(--bg-overlay)] p-4 sm:items-center">
          <div role="dialog" aria-modal="true" aria-labelledby="phone-verify-title" className="relative w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-line p-6">
              <div className="flex items-center gap-3">
                <Phone className="mt-1 h-5 w-5 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
                <div>
                  <h3 id="phone-verify-title" className="font-heading text-lg text-ink">
                    {isOtpSent ? t("enterOtpTitle") : t("verifyYourNumber")}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {isOtpSent 
                      ? t("receivedSmsCode") 
                      : t("addSecurityToProfile")}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                aria-label={t("cancel")}
                className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-sand hover:text-ink"
              >
                <X className="h-5 w-5" strokeWidth={1.5} aria-hidden />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {!isOtpSent ? (
                // Step 1: Phone Input
                <>
                  <div className="space-y-2">
                    <label htmlFor="phone-input" className="text-sm font-medium text-ink">
                      {t("phoneNumber")}
                    </label>
                    <div className="relative">
                      <input
                        id="phone-input"
                        type="tel"
                        autoComplete="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+39 340 1234567"
                        className="h-12 w-full rounded-xl border border-line bg-sand px-4 text-base text-ink outline-none placeholder:text-faint focus:border-green"
                      />
                    </div>
                    <p className="text-xs leading-relaxed text-muted">
                      {t("enterPhoneWithPrefix")}
                    </p>
                  </div>

                  <button
                    onClick={sendOtp}
                    disabled={isLoading}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-green text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                        {t("sending")}
                      </>
                    ) : (
                      t("sendOtpCode")
                    )}
                  </button>
                </>
              ) : (
                // Step 2: OTP Input
                <>
                  <div className="space-y-2">
                    <label htmlFor="otp-input" className="text-sm font-medium text-ink">
                      {t("otpCode")}
                    </label>
                    <input
                      id="otp-input"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="h-12 w-full rounded-xl border border-line bg-sand px-4 text-center text-2xl tabular-nums tracking-[0.3em] text-ink outline-none placeholder:text-faint focus:border-green"
                    />
                    <p className="text-center text-xs leading-relaxed text-muted">
                      {t("enter6DigitCode")}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={verifyOtp}
                      disabled={isLoading || otp.length !== 6}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-green text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                          {t("verifying")}
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          {t("verify")}
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setIsOtpSent(false)}
                      disabled={isLoading}
                      className="h-12 w-full text-sm font-medium text-muted transition-colors hover:text-ink"
                    >
                      {t("changeNumber")}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-line bg-sand px-6 py-4">
              <p className="text-center text-xs leading-relaxed text-muted">
                {t("phoneVerificationFooter")}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
