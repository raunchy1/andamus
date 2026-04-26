"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Phone, Shield, Check, Loader2, X } from "lucide-react";
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
  
  const supabase = createClient();

  // Format phone number to E.164 format (+39XXXXXXXXXX)
  const formatPhoneNumber = (input: string): string => {
    // Remove all non-numeric characters
    let cleaned = input.replace(/\D/g, "");
    
    // If it starts with 0, replace with +39 (Italy)
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
      <div className="flex items-center gap-2 text-sm text-tertiary">
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-tertiary/20">
          <Check className="w-3 h-3 text-tertiary" />
        </div>
        <span>{t("phoneVerified")}</span>
        <span className="text-on-surface-variant">{currentPhone}</span>
      </div>
    );
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-highest text-on-surface hover:bg-surface-container-high transition-colors text-sm font-medium"
      >
        <Shield className="w-4 h-4 text-primary" />
        <span>{t("verifyPhone")}</span>
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-surface rounded-2xl shadow-2xl border border-outline-variant overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-outline-variant">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-on-surface">
                    {isOtpSent ? t("enterOtpTitle") : t("verifyYourNumber")}
                  </h3>
                  <p className="text-sm text-on-surface-variant">
                    {isOtpSent 
                      ? t("receivedSmsCode") 
                      : t("addSecurityToProfile")}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-surface-container-highest transition-colors"
              >
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {!isOtpSent ? (
                // Step 1: Phone Input
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-on-surface">
                      {t("phoneNumber")}
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+39 340 1234567"
                        className="w-full h-12 px-4 rounded-xl bg-surface-container-highest border-none focus:ring-2 focus:ring-primary text-on-surface placeholder:text-on-surface-variant"
                      />
                      <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      {t("enterPhoneWithPrefix")}
                    </p>
                  </div>

                  <button
                    onClick={sendOtp}
                    disabled={isLoading}
                    className="w-full h-12 bg-primary text-on-primary font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {t("sending")}
                      </>
                    ) : (
                      <>
                        {t("sendOtpCode")}
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </>
              ) : (
                // Step 2: OTP Input
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-on-surface">
                      {t("otpCode")}
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full h-12 px-4 text-center text-2xl tracking-widest rounded-xl bg-surface-container-highest border-none focus:ring-2 focus:ring-primary text-on-surface placeholder:text-on-surface-variant"
                    />
                    <p className="text-xs text-on-surface-variant text-center">
                      {t("enter6DigitCode")}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={verifyOtp}
                      disabled={isLoading || otp.length !== 6}
                      className="w-full h-12 bg-primary text-on-primary font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
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
                      className="w-full h-12 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                      {t("changeNumber")}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-surface-container-low rounded-b-2xl">
              <p className="text-xs text-center text-on-surface-variant">
                {t("phoneVerificationFooter")}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ChevronRight component for the button
function ChevronRight({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
