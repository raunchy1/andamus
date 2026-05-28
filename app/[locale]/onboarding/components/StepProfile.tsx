"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check, Camera, AlertCircle, Loader2 } from "lucide-react";
import { Haptic } from "@/lib/haptic";
import { toast } from "sonner";

interface StepProfileProps {
  userId: string;
  initialData: {
    fullName: string;
    phone: string;
    bio: string;
    birthYear: number;
    avatarUrl: string;
  };
  onNext: (data: {
    fullName: string;
    phone: string;
    bio: string;
    birthYear: number;
    avatarUrl: string;
  }) => Promise<void>;
  onBack: () => void;
}

export default function StepProfile({ userId, initialData, onNext, onBack }: StepProfileProps) {
  const [fullName, setFullName] = useState(initialData.fullName || "");
  const [phone, setPhone] = useState(initialData.phone || "");
  const [bio, setBio] = useState(initialData.bio || "");
  const [birthYear, setBirthYear] = useState<number>(initialData.birthYear || 0);
  const [avatarUrl, setAvatarUrl] = useState(initialData.avatarUrl || "");
  
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation States
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 70 - 18 + 1 }, (_, i) => currentYear - 18 - i);

  // Validate fields in real time
  const validateField = (name: string, value: any) => {
    let err = "";
    if (name === "fullName") {
      if (!value.trim()) {
        err = "Il nome completo è richiesto";
      } else if (value.trim().length < 3) {
        err = "Inserisci almeno nome e cognome";
      }
    } else if (name === "phone") {
      // Italian validation: start with +39 or 3, 10 digits
      const phoneDigits = value.replace(/\s+/g, "");
      const cleanPhone = phoneDigits.startsWith("+39") ? phoneDigits.substring(3) : phoneDigits;
      
      if (!value.trim()) {
        err = "Il numero di telefono è richiesto per la prenotazione";
      } else if (!/^[0-9]+$/.test(cleanPhone)) {
        err = "Il numero può contenere solo cifre";
      } else if (cleanPhone.length !== 10) {
        err = "Il numero deve essere composto da 10 cifre (escluso +39)";
      } else if (!cleanPhone.startsWith("3")) {
        err = "Il numero di cellulare italiano deve iniziare con 3";
      }
    } else if (name === "birthYear") {
      if (!value || value === 0) {
        err = "Anno di nascita richiesto";
      } else if (currentYear - value < 18) {
        err = "Devi avere almeno 18 anni per iscriverti";
      }
    }
    
    setErrors((prev) => {
      const updated = { ...prev };
      if (err) {
        updated[name] = err;
      } else {
        delete updated[name];
      }
      return updated;
    });
  };

  const handleBlur = (name: string, value: any) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  // Check form validity
  const isValid = 
    fullName.trim().length >= 3 &&
    phone.trim().length >= 9 &&
    birthYear >= currentYear - 70 &&
    birthYear <= currentYear - 18 &&
    Object.keys(errors).length === 0;

  // Handle avatar upload and client side crop
  const handleAvatarClick = () => {
    Haptic.light();
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'immagine supera il limite massimo di 5MB");
      return;
    }

    setAvatarLoading(true);
    Haptic.light();

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas for square crop client side
        const canvas = document.createElement("canvas");
        const size = Math.min(img.width, img.height);
        canvas.width = 300;
        canvas.height = 300;
        
        const ctx = canvas.getContext("2d");
        if (ctx) {
          // Center square crop
          const sx = (img.width - size) / 2;
          const sy = (img.height - size) / 2;
          ctx.drawImage(img, sx, sy, size, size, 0, 0, 300, 300);
          
          canvas.toBlob(async (blob) => {
            if (blob) {
              try {
                // Upload blob to Supabase Storage avatars bucket
                const { createClient } = await import("@/lib/supabase/client");
                const supabase = createClient();
                const path = `${userId}/avatar.jpg`;
                
                const { error: uploadError } = await supabase.storage
                  .from("avatars")
                  .upload(path, blob, {
                    contentType: "image/jpeg",
                    upsert: true,
                  });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                  .from("avatars")
                  .getPublicUrl(path);

                setAvatarUrl(publicUrl);
                Haptic.success();
              } catch (err) {
                console.error("Avatar upload failed:", err);
              } finally {
                setAvatarLoading(false);
              }
            }
          }, "image/jpeg", 0.85);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || submitting) return;

    setSubmitting(true);
    Haptic.success();
    try {
      await onNext({
        fullName: fullName.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        birthYear: Number(birthYear),
        avatarUrl,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = () => {
    if (!fullName) return "U";
    return fullName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  return (
    <form onSubmit={handleNext} className="flex flex-col flex-1 justify-between h-full w-full">
      <div className="space-y-6 overflow-y-auto max-h-[70vh] pb-4 px-1 scrollbar-none">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-white tracking-tight font-display">
            Completa il Profilo
          </h2>
          <p className="text-zinc-400 text-xs font-sans mt-1">
            Gli altri pendolari ti vedranno così
          </p>
        </div>

        {/* Avatar Upload */}
        <div className="flex flex-col items-center gap-2">
          <div 
            onClick={handleAvatarClick}
            className="w-24 h-24 rounded-full relative cursor-pointer group active:scale-95 transition-all overflow-hidden border-2 border-white/[0.08] bg-zinc-900 flex items-center justify-center"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-white tracking-wide font-display">{getInitials()}</span>
            )}
            
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera className="w-5 h-5 text-white" />
            </div>

            {avatarLoading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              </div>
            )}
          </div>
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <span className="text-[10px] text-zinc-500 font-medium">Tocca per caricare una foto (Max 5MB)</span>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          {/* Nome */}
          <div className="space-y-1 text-left">
            <label className="text-xs font-bold text-zinc-300 block">Nome Completo</label>
            <div className="relative">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={() => handleBlur("fullName", fullName)}
                aria-describedby={errors.fullName ? "fullName-error" : undefined}
                className={`w-full bg-[#121212] border ${
                  touched.fullName && errors.fullName
                    ? "border-[#e63946]"
                    : touched.fullName
                    ? "border-green-500"
                    : "border-white/[0.08]"
                } rounded-xl px-4 py-3.5 text-base text-white focus:outline-none focus:border-[#e63946] placeholder:text-zinc-600 font-sans`}
                placeholder="es. Mario Rossi"
              />
              {touched.fullName && !errors.fullName && (
                <Check className="w-5 h-5 text-green-500 absolute right-4 top-4" />
              )}
            </div>
            {touched.fullName && errors.fullName && (
              <p id="fullName-error" className="text-xs text-[#e63946] flex items-center gap-1 font-sans mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Telefono */}
          <div className="space-y-1 text-left">
            <label className="text-xs font-bold text-zinc-300 block">Numero di Cellulare</label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => handleBlur("phone", phone)}
                aria-describedby={errors.phone ? "phone-error" : undefined}
                className={`w-full bg-[#121212] border ${
                  touched.phone && errors.phone
                    ? "border-[#e63946]"
                    : touched.phone
                    ? "border-green-500"
                    : "border-white/[0.08]"
                } rounded-xl px-4 py-3.5 text-base text-white focus:outline-none focus:border-[#e63946] placeholder:text-zinc-600 font-sans`}
                placeholder="+39 333 000 0000"
              />
              {touched.phone && !errors.phone && (
                <Check className="w-5 h-5 text-green-500 absolute right-4 top-4" />
              )}
            </div>
            {touched.phone && errors.phone && (
              <p id="phone-error" className="text-xs text-[#e63946] flex items-center gap-1 font-sans mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.phone}
              </p>
            )}
          </div>

          {/* Anno di nascita */}
          <div className="space-y-1 text-left">
            <label className="text-xs font-bold text-zinc-300 block">Anno di Nascita</label>
            <div className="relative">
              <select
                value={birthYear || ""}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setBirthYear(val);
                  validateField("birthYear", val);
                }}
                onBlur={() => handleBlur("birthYear", birthYear)}
                aria-describedby={errors.birthYear ? "birthYear-error" : undefined}
                className={`w-full bg-[#121212] border ${
                  touched.birthYear && errors.birthYear
                    ? "border-[#e63946]"
                    : touched.birthYear && birthYear > 0
                    ? "border-green-500"
                    : "border-white/[0.08]"
                } rounded-xl px-4 py-3.5 text-base text-white focus:outline-none focus:border-[#e63946] font-sans`}
              >
                <option value="">Seleziona anno</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            {touched.birthYear && errors.birthYear && (
              <p id="birthYear-error" className="text-xs text-[#e63946] flex items-center gap-1 font-sans mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.birthYear}
              </p>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-1 text-left">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-zinc-300 block">Bio Breve (opzionale)</label>
              <span className="text-[10px] text-zinc-500 font-sans">{bio.length}/120</span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.substring(0, 120))}
              maxLength={120}
              rows={2}
              className="w-full bg-[#121212] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#e63946] placeholder:text-zinc-600 font-sans resize-none"
              placeholder="es. Pendolare Cagliari-Sassari ogni venerdì 🚗"
            />
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="pt-6 flex gap-3">
        <button
          type="button"
          onClick={() => {
            Haptic.light();
            onBack();
          }}
          className="flex-1 py-4 border border-white/5 bg-white/5 text-white font-bold rounded-xl text-base transition-all active:scale-[0.99]"
        >
          Indietro
        </button>
        <button
          type="submit"
          disabled={!isValid || submitting}
          className="flex-1 py-4 bg-[#e63946] text-white font-bold rounded-xl text-base transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Continua →"
          )}
        </button>
      </div>
    </form>
  );
}
