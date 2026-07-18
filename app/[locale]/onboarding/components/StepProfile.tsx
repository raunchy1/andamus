"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Camera, AlertCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Haptic } from "@/lib/haptic";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const t = useTranslations("onboarding.flow");
  const tCommon = useTranslations("common");
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
        err = t("nameRequired");
      } else if (value.trim().length < 3) {
        err = t("nameTooShort");
      }
    } else if (name === "phone") {
      // Italian validation: start with +39 or 3, 10 digits
      const phoneDigits = value.replace(/\s+/g, "");
      const cleanPhone = phoneDigits.startsWith("+39") ? phoneDigits.substring(3) : phoneDigits;

      if (!value.trim()) {
        err = t("phoneRequired");
      } else if (!/^[0-9]+$/.test(cleanPhone)) {
        err = t("phoneDigitsOnly");
      } else if (cleanPhone.length !== 10) {
        err = t("phoneLength");
      } else if (!cleanPhone.startsWith("3")) {
        err = t("phonePrefix");
      }
    } else if (name === "birthYear") {
      if (!value || value === 0) {
        err = t("birthYearRequired");
      } else if (currentYear - value < 18) {
        err = t("ageRequirement");
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
      toast.error(t("photoSizeError"));
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

  const fieldClass = (field: string, validWhen?: boolean) =>
    cn(
      "w-full rounded-[var(--radius-sm)] border bg-surface-2 px-4 py-3.5 text-base text-fg placeholder:text-dim focus:outline-none focus:border-accent",
      touched[field] && errors[field]
        ? "border-bad"
        : touched[field] && (validWhen ?? true)
          ? "border-ok/50"
          : "border-line"
    );

  return (
    <form onSubmit={handleNext} className="flex h-full w-full flex-1 flex-col justify-between">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="scrollbar-none max-h-[70vh] space-y-6 overflow-y-auto px-1 pb-4"
      >
        <div className="text-center">
          <h2 className="heading-editorial text-2xl text-fg">{t("profileTitle")}</h2>
          <p className="mt-1 text-xs text-muted">{t("profileSubtitle")}</p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div
            onClick={handleAvatarClick}
            className="group relative cursor-pointer transition-transform active:scale-95"
          >
            <Avatar src={avatarUrl} name={fullName} size="lg" className="size-24 text-xl" />
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-bg/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="size-5 text-fg" strokeWidth={1.5} />
            </div>
            {avatarLoading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-bg/70">
                <Loader2 className="size-6 animate-spin text-accent" strokeWidth={1.5} />
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
          <span className="text-[10px] font-medium text-dim">{t("photoHint")}</span>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="text-eyebrow lowercase">{t("nameLabel")}</label>
            <div className="relative">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={() => handleBlur("fullName", fullName)}
                aria-describedby={errors.fullName ? "fullName-error" : undefined}
                className={fieldClass("fullName")}
                placeholder={t("namePlaceholder")}
              />
              {touched.fullName && !errors.fullName && (
                <Check className="absolute right-4 top-4 size-5 text-ok" strokeWidth={1.5} />
              )}
            </div>
            {touched.fullName && errors.fullName && (
              <p id="fullName-error" className="mt-1 flex items-center gap-1 text-xs text-bad">
                <AlertCircle className="size-3.5" strokeWidth={1.5} />
                {errors.fullName}
              </p>
            )}
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-eyebrow lowercase">{t("phoneLabel")}</label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => handleBlur("phone", phone)}
                aria-describedby={errors.phone ? "phone-error" : undefined}
                className={fieldClass("phone")}
                placeholder={t("phonePlaceholder")}
              />
              {touched.phone && !errors.phone && (
                <Check className="absolute right-4 top-4 size-5 text-ok" strokeWidth={1.5} />
              )}
            </div>
            {touched.phone && errors.phone && (
              <p id="phone-error" className="mt-1 flex items-center gap-1 text-xs text-bad">
                <AlertCircle className="size-3.5" strokeWidth={1.5} />
                {errors.phone}
              </p>
            )}
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-eyebrow lowercase">{t("birthYearLabel")}</label>
            <select
              value={birthYear || ""}
              onChange={(e) => {
                const val = Number(e.target.value);
                setBirthYear(val);
                validateField("birthYear", val);
              }}
              onBlur={() => handleBlur("birthYear", birthYear)}
              aria-describedby={errors.birthYear ? "birthYear-error" : undefined}
              className={fieldClass("birthYear", birthYear > 0)}
            >
              <option value="">{t("birthYearPlaceholder")}</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            {touched.birthYear && errors.birthYear && (
              <p id="birthYear-error" className="mt-1 flex items-center gap-1 text-xs text-bad">
                <AlertCircle className="size-3.5" strokeWidth={1.5} />
                {errors.birthYear}
              </p>
            )}
          </div>

          <div className="space-y-1.5 text-left">
            <div className="flex items-center justify-between">
              <label className="text-eyebrow lowercase">{t("bioLabel")}</label>
              <span className="font-mono text-[10px] text-dim">{bio.length}/120</span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.substring(0, 120))}
              maxLength={120}
              rows={2}
              className="w-full resize-none rounded-[var(--radius-sm)] border border-line bg-surface-2 px-4 py-3 text-sm text-fg placeholder:text-dim focus:border-accent focus:outline-none"
              placeholder={t("bioPlaceholder")}
            />
          </div>
        </div>
      </motion.div>

      <div className="flex gap-3 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            Haptic.light();
            onBack();
          }}
          className="flex-1"
        >
          {tCommon("back")}
        </Button>
        <Button type="submit" disabled={!isValid || submitting} className="flex-1">
          {submitting ? <Loader2 className="size-5 animate-spin" strokeWidth={1.5} /> : tCommon("continue")}
        </Button>
      </div>
    </form>
  );
}
