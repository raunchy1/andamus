"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Mail, Lock, User, Eye, EyeOff, Loader2, Car } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { FEATURES } from "@/lib/features";
import { signInWithGoogle } from "@/lib/auth";
import { ProductAnalytics } from "@/lib/posthog";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
}

export function AuthModal({ isOpen, onClose, defaultTab = "login" }: AuthModalProps) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [mode, setMode] = useState<"login" | "register">(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Sync mode with defaultTab when the modal is re-opened
  useEffect(() => {
    if (isOpen) {
      setMode(defaultTab);
    }
  }, [isOpen, defaultTab]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      requestAnimationFrame(() => setIsVisible(false));
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setName("");
    }, 200);
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { 
      if (e.key === "Escape" && isOpen) handleClose();
      if (e.key === "Tab" && isOpen) {
        const modalElement = document.getElementById("auth-modal-content");
        if (!modalElement) return;
        
        const focusableElements = modalElement.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, handleClose]);

  const handleLogin = async () => {
    if (!email || !password) return toast.error(t("fillAllFields"));
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success(t("loginSuccess"));
      handleClose();
      router.refresh();
      ProductAnalytics.trackEvent("login_success", { method: "email" });
    } catch (error: any) {
      toast.error(error.message || t("loginError"));
      ProductAnalytics.trackEvent("login_failed", { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !name) return toast.error(t("fillAllFields"));
    if (password !== confirmPassword) return toast.error(t("passwordsDoNotMatch"));
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, full_name: name, avatar_url: null },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      toast.success(t("registerSuccess"));
      handleClose();
      ProductAnalytics.trackEvent("registration_success");
    } catch (error: any) {
      toast.error(error.message || t("registerError"));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen && !isVisible) return null;

  const modal = (
    <div
      className={`fixed inset-0 z-modal flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      {/* Backdrop blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      <div
        id="auth-modal-content"
        className={`w-full sm:max-w-md bg-[#1a1a1a] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden transition-all duration-200 ${
          isVisible ? "translate-y-0 sm:scale-100" : "translate-y-8 sm:scale-95"
        }`}
        style={{ maxHeight: "92vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bar (if loading) */}
        {loading && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#e63946]/20 overflow-hidden">
            <div className="h-full bg-[#e63946] animate-progress-indeterminate" />
          </div>
        )}

        {/* Header */}
        <div className="px-6 pt-8 pb-4 relative">
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#e63946] flex items-center justify-center text-white shadow-lg shadow-[#e63946]/20">
              <Car size={24} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase">
              {mode === "login" ? t("loginTitle") : t("registerTitle")}
            </h2>
          </div>
          <p className="text-white/50 text-sm">
            {mode === "login" ? t("loginSubtitle") : t("registerSubtitle")}
          </p>
        </div>

        {/* Tabs */}
        <div className="px-6 mb-6">
          <div className="flex p-1 bg-white/[0.03] border border-white/5 rounded-2xl">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                mode === "login" 
                  ? "bg-[#e63946] text-white shadow-lg shadow-[#e63946]/20" 
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              {t("loginTab")}
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                mode === "register" 
                  ? "bg-[#e63946] text-white shadow-lg shadow-[#e63946]/20" 
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              {t("registerTab")}
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 pb-8 space-y-4">
          {mode === "register" && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">
                {t("nameLabel")}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/20 group-focus-within:text-[#e63946] transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/5 focus:border-[#e63946]/50 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-white/10 focus:outline-none transition-all"
                  placeholder={t("namePlaceholder")}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">
              {t("emailLabel")}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/20 group-focus-within:text-[#e63946] transition-colors">
                <Mail size={18} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/5 focus:border-[#e63946]/50 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-white/10 focus:outline-none transition-all"
                placeholder="nome@esempio.it"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">
              {t("passwordLabel")}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/20 group-focus-within:text-[#e63946] transition-colors">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/5 focus:border-[#e63946]/50 rounded-2xl pl-12 pr-12 py-4 text-white placeholder:text-white/10 focus:outline-none transition-all"
                placeholder={t("passwordPlaceholder")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/20 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {mode === "register" && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">
                {t("confirmPasswordLabel")}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/20 group-focus-within:text-[#e63946] transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/5 focus:border-[#e63946]/50 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-white/10 focus:outline-none transition-all"
                  placeholder={t("confirmPasswordPlaceholder")}
                />
              </div>
            </div>
          )}

          <button
            onClick={mode === "login" ? handleLogin : handleRegister}
            disabled={loading}
            className="w-full bg-[#e63946] hover:bg-[#c92a37] disabled:opacity-50 text-white font-black uppercase tracking-[0.2em] py-4 rounded-2xl transition-all shadow-xl shadow-[#e63946]/20 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              mode === "login" ? t("loginButton") : t("registerButton")
            )}
          </button>

          {/* Google Login (Only if enabled in features) */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
              <span className="bg-[#1a1a1a] px-4 text-white/20">{t("orContinueWith")}</span>
            </div>
          </div>

          <button
            onClick={() => signInWithGoogle(supabase)}
            className="w-full bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/90 transition-all active:scale-[0.98]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {t("loginWithGoogle")}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
