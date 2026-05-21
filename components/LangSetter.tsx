"use client";

import { useEffect } from "react";
import { updateUserLocale } from "@/lib/user-preferences";

export function LangSetter({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
    // Sync locale to user profile (non-blocking)
    updateUserLocale(locale).catch(() => {});
  }, [locale]);
  return null;
}
