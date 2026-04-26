"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Mail, Lock, User, Eye, EyeOff, Loader2, Car } from "lucide-react";
import { signInWithGoogle, signUpWithEmail, signInWithEmail } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
}

export function AuthModal({ isOpen, onClose, defaultTab = "login" }: AuthModalProps) {
  const t = useTranslations('auth');
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<"login" | "register">(defaultTab);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");

  // Handle animation and body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      setError(null);
      setSuccessMessage(null);
      onClose();
    }, 200);
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, handleClose]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return t('passwordMinLength');
    }
    return null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!loginEmail || !loginPassword) {
      setError(t('enterEmailPassword'));
      return;
    }

    setIsLoading(true);

    try {
      await signInWithEmail(loginEmail, loginPassword);
      
      // Check if user has profile — new users go to onboarding, existing to profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();
        
        handleClose();
        if (profile) {
          router.push(`/${locale}/profilo`);
        } else {
          router.push(`/${locale}/lansare`);
        }
        router.refresh();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('loginError');
      
      if (errorMessage.includes("Invalid login credentials")) {
        setError(t('invalidCredentials'));
      } else if (errorMessage.includes("Email not confirmed")) {
        setError(t('emailNotConfirmed'));
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!registerName || !registerEmail || !registerPassword || !registerConfirmPassword) {
      setError(t('fillAllFields'));
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }

    const passwordError = validatePassword(registerPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setIsLoading(true);

    try {
      await signUpWithEmail(registerEmail, registerPassword, registerName);
      setSuccessMessage(t('registerSuccess'));
      setTimeout(() => {
        setActiveTab("login");
        setSuccessMessage(null);
      }, 1500);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('registerError');
      
      if (errorMessage.includes("User already registered")) {
        setError(t('emailAlreadyRegistered'));
      } else if (errorMessage.includes("valid email")) {
        setError(t('invalidEmail'));
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      const redirectTo = `${window.location.origin}/${locale}/auth/callback`;
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
    } catch {
      setError(t('googleLoginError'));
      setIsGoogleLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      {/* Modal card — stops click propagation */}
      <div 
        className={`relative w-full max-w-md bg-surface-container rounded-3xl shadow-2xl overflow-hidden transition-all duration-200 ${
          isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* X close button top-right */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-outline/20 transition-colors"
          aria-label={t('close')}
          disabled={isLoading}
        >
          <X size={20} className="text-on-surface-variant" />
        </button>

        {/* Header with Logo */}
        <div className="flex items-center justify-center pt-8 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Car className="h-6 w-6 text-on-primary" />
            </div>
            <span className="text-2xl font-bold text-on-surface tracking-tight">Andamus</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-outline/20 mx-6">
          <button
            onClick={() => {
              setActiveTab("login");
              setError(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === "login"
                ? "text-primary border-primary"
                : "text-on-surface-variant border-transparent hover:text-on-surface"
            }`}
          >
            {t('login')}
          </button>
          <button
            onClick={() => {
              setActiveTab("register");
              setError(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === "register"
                ? "text-primary border-primary"
                : "text-on-surface-variant border-transparent hover:text-on-surface"
            }`}
          >
            {t('register')}
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-xl">
              <p className="text-error text-sm text-center font-medium">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-xl">
              <p className="text-success text-sm text-center font-medium">{successMessage}</p>
            </div>
          )}

          {activeTab === "login" ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  {t('email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/50" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    className="w-full bg-surface border border-outline rounded-xl px-4 py-3 pl-12 text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none transition-colors"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  {t('password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/50" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder={t('passwordPlaceholder')}
                    className="w-full bg-surface border border-outline rounded-xl px-4 py-3 pl-12 pr-12 text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none transition-colors"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full bg-primary text-on-primary rounded-xl py-4 font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('loggingIn')}
                  </>
                ) : (
                  t('login')
                )}
              </button>
              
              <p className="text-center text-sm text-on-surface-variant">
                {t('noAccount')}{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("register")}
                  className="text-primary hover:underline font-medium"
                >
                  {t('register')}
                </button>
              </p>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  {t('fullName')}
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/50" />
                  <input
                    type="text"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder={t('namePlaceholder')}
                    className="w-full bg-surface border border-outline rounded-xl px-4 py-3 pl-12 text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none transition-colors"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  {t('email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/50" />
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder={t('registerEmailPlaceholder')}
                    className="w-full bg-surface border border-outline rounded-xl px-4 py-3 pl-12 text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none transition-colors"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  {t('password')} <span className="text-on-surface-variant/60 font-normal">({t('min8chars')})</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/50" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder={t('createPasswordPlaceholder')}
                    className="w-full bg-surface border border-outline rounded-xl px-4 py-3 pl-12 pr-12 text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none transition-colors"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  {t('confirmPassword')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/50" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    placeholder={t('confirmPasswordPlaceholder')}
                    className="w-full bg-surface border border-outline rounded-xl px-4 py-3 pl-12 pr-12 text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none transition-colors"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full bg-primary text-on-primary rounded-xl py-4 font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('creatingAccount')}
                  </>
                ) : (
                  t('createAccount')
                )}
              </button>
              
              <p className="text-center text-sm text-on-surface-variant">
                {t('alreadyHaveAccount')}{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("login")}
                  className="text-primary hover:underline font-medium"
                >
                  {t('login')}
                </button>
              </p>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline/30"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-surface-container text-xs text-on-surface-variant uppercase tracking-wider">
                {t('or')}
              </span>
            </div>
          </div>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading || isGoogleLoading}
            className="w-full border border-outline rounded-xl py-3 flex items-center justify-center gap-3 hover:bg-surface-variant transition-colors text-on-surface font-medium disabled:opacity-50"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {isGoogleLoading ? t('connectingGoogle') : t('loginWithGoogle')}
          </button>
        </div>
      </div>
    </div>
  );
}
