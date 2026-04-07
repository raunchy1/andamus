"use client";

import { useState } from "react";
import { Phone, Shield, Check, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

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
      toast.error("Inserisci un numero di telefono valido");
      return;
    }

    const formattedPhone = formatPhoneNumber(phone);
    
    // Basic validation for Italian numbers
    if (!formattedPhone.match(/^\+39\d{9,10}$/)) {
      toast.error("Inserisci un numero italiano valido (es. +39 340 1234567)");
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
      toast.success("Codice OTP inviato al tuo telefono!");
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error sending OTP:", err);
      }
      toast.error(err instanceof Error ? err.message : "Errore nell'invio dell'OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const verifyOtp = async () => {
    if (!otp.trim() || otp.length !== 6) {
      toast.error("Inserisci il codice OTP a 6 cifre");
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

      toast.success("Numero di telefono verificato con successo!");
      onVerified?.();
      setShowModal(false);
      setIsOtpSent(false);
      setOtp("");
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error verifying OTP:", err);
      }
      toast.error(err instanceof Error ? err.message : "Codice OTP non valido");
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
        <span>Telefono verificato</span>
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
        <span>Verifica telefono</span>
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
                    {isOtpSent ? "Inserisci codice OTP" : "Verifica il tuo numero"}
                  </h3>
                  <p className="text-sm text-on-surface-variant">
                    {isOtpSent 
                      ? "Hai ricevuto un SMS con il codice" 
                      : "Aggiungi sicurezza al tuo profilo"}
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
                      Numero di telefono
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
                      Inserisci il numero con prefisso internazionale (+39 per l&apos;Italia)
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
                        Invio in corso...
                      </>
                    ) : (
                      <>
                        Invia codice OTP
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
                      Codice OTP
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
                      Inserisci il codice a 6 cifre ricevuto via SMS
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
                          Verifica in corso...
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          Verifica
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setIsOtpSent(false)}
                      disabled={isLoading}
                      className="w-full h-12 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                      Modifica numero
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-surface-container-low rounded-b-2xl">
              <p className="text-xs text-center text-on-surface-variant">
                La verifica del numero aumenta la fiducia degli altri utenti e ti permette di ricevere notifiche importanti.
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
