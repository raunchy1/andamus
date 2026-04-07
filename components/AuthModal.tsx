"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Mail, Lock, User, Eye, EyeOff, Loader2, Car } from "lucide-react";
import { signInWithGoogle, signInWithFacebook, signUpWithEmail, signInWithEmail } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
}

export function AuthModal({ isOpen, onClose, defaultTab = "login" }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">(defaultTab);
  const [isLoading, setIsLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

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
      // Prevent body scroll
      document.body.style.overflow = "hidden";
      // Trigger animation
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

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      setError(null);
      setSuccessMessage(null);
      onClose();
    }, 200);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return "La password deve essere di almeno 6 caratteri";
    }
    return null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!loginEmail || !loginPassword) {
      setError("Inserisci email e password");
      return;
    }

    setIsLoading(true);

    try {
      await signInWithEmail(loginEmail, loginPassword);
      setSuccessMessage("Accesso effettuato con successo!");
      setTimeout(() => {
        handleClose();
        router.push("/profilo");
        router.refresh();
      }, 500);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Errore durante l'accesso";
      
      if (errorMessage.includes("Invalid login credentials")) {
        setError("Email o password non corretti");
      } else if (errorMessage.includes("Email not confirmed")) {
        setError("Email non confermata. Controlla la tua casella di posta.");
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
      setError("Compila tutti i campi");
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setError("Le password non coincidono");
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
      setSuccessMessage("Account creato con successo! Reindirizzamento...");
      setTimeout(() => {
        handleClose();
        router.push("/profilo");
        router.refresh();
      }, 1000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Errore durante la registrazione";
      
      if (errorMessage.includes("User already registered")) {
        setError("Email già registrata. Prova ad accedere.");
      } else if (errorMessage.includes("valid email")) {
        setError("Inserisci un'email valida");
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
      await signInWithGoogle();
    } catch {
      setError("Errore durante l'accesso con Google");
      setIsGoogleLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setIsFacebookLoading(true);
    setError(null);
    try {
      await signInWithFacebook();
    } catch {
      setError("Errore durante l'accesso con Facebook");
      setIsFacebookLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleBackdropClick}
    >
      {/* Full screen dark backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      {/* Modal Container */}
      <div 
        className={`relative w-full max-w-[420px] bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 ${
          isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
      >
        {/* Header with Logo and Close */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#0f0f0f]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e63946]">
              <Car className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Andamus</span>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all"
            disabled={isLoading}
            aria-label="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 bg-[#0f0f0f]">
          <button
            onClick={() => {
              setActiveTab("login");
              setError(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-all ${
              activeTab === "login"
                ? "text-[#e63946] border-b-2 border-[#e63946] bg-white/[0.03]"
                : "text-white/50 hover:text-white hover:bg-white/[0.02]"
            }`}
          >
            Accedi
          </button>
          <button
            onClick={() => {
              setActiveTab("register");
              setError(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-all ${
              activeTab === "register"
                ? "text-[#e63946] border-b-2 border-[#e63946] bg-white/[0.03]"
                : "text-white/50 hover:text-white hover:bg-white/[0.02]"
            }`}
          >
            Registrati
          </button>
        </div>

        {/* Content */}
        <div className="p-6 bg-[#111111]">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-sm text-center font-medium">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
              <p className="text-green-400 text-sm text-center font-medium">{successMessage}</p>
            </div>
          )}

          {activeTab === "login" ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="La tua email"
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-white/25 focus:outline-none focus:border-[#e63946]/50 focus:ring-1 focus:ring-[#e63946]/30 transition-all"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="La tua password"
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3.5 pl-12 pr-12 text-white placeholder:text-white/25 focus:outline-none focus:border-[#e63946]/50 focus:ring-1 focus:ring-[#e63946]/30 transition-all"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  className="text-xs text-[#e63946] hover:text-[#ff4d5a] transition-colors font-medium"
                  disabled={isLoading}
                >
                  Password dimenticata?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || isGoogleLoading || isFacebookLoading}
                className="w-full bg-[#e63946] hover:bg-[#d32f3c] text-white py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Accesso in corso...
                  </>
                ) : (
                  "Accedi"
                )}
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">
                  Nome completo
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type="text"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="Mario Rossi"
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-white/25 focus:outline-none focus:border-[#e63946]/50 focus:ring-1 focus:ring-[#e63946]/30 transition-all"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="mario@esempio.it"
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-white/25 focus:outline-none focus:border-[#e63946]/50 focus:ring-1 focus:ring-[#e63946]/30 transition-all"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">
                  Password <span className="text-white/25 font-normal">(min. 6 caratteri)</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="Crea una password"
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3.5 pl-12 pr-12 text-white placeholder:text-white/25 focus:outline-none focus:border-[#e63946]/50 focus:ring-1 focus:ring-[#e63946]/30 transition-all"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">
                  Conferma password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    placeholder="Ripeti la password"
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3.5 pl-12 pr-12 text-white placeholder:text-white/25 focus:outline-none focus:border-[#e63946]/50 focus:ring-1 focus:ring-[#e63946]/30 transition-all"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || isGoogleLoading || isFacebookLoading}
                className="w-full bg-[#e63946] hover:bg-[#d32f3c] text-white py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creazione account...
                  </>
                ) : (
                  "Crea account"
                )}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-[#111111] text-xs text-white/30 uppercase tracking-wider">
                Oppure
              </span>
            </div>
          </div>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading || isGoogleLoading || isFacebookLoading}
            className="w-full bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-white py-4 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
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
            {isGoogleLoading ? "Connessione a Google..." : "Accedi con Google"}
          </button>

          {/* Facebook Login Button */}
          <button
            onClick={handleFacebookLogin}
            disabled={isLoading || isGoogleLoading || isFacebookLoading}
            className="w-full bg-[#1877F2] hover:bg-[#166fe5] text-white py-4 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-3"
          >
            {isFacebookLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            )}
            {isFacebookLoading ? "Connessione a Facebook..." : "Accedi con Facebook"}
          </button>
        </div>
      </div>
    </div>
  );
}
