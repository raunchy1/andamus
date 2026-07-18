"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, X } from "lucide-react";
import { Haptic } from "@/lib/haptic";

export default function CookieConsent() {
  const [show, setShow] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    functional: false,
  });

  useEffect(() => {
    // Check if consent has already been given
    const consent = localStorage.getItem("andamus_cookie_consent");
    if (!consent) {
      // Show banner after 1.5 seconds delay for premium entrance feel
      const timer = setTimeout(() => {
        setShow(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    Haptic.success();
    localStorage.setItem("andamus_cookie_consent", "all");
    localStorage.setItem("andamus_cookie_preferences", JSON.stringify({
      necessary: true,
      analytics: true,
      functional: true,
    }));
    setShow(false);
    // Reload to trigger analytics script initialization safely
    window.location.reload();
  };

  const handleNecessaryOnly = () => {
    Haptic.light();
    localStorage.setItem("andamus_cookie_consent", "necessary");
    localStorage.setItem("andamus_cookie_preferences", JSON.stringify({
      necessary: true,
      analytics: false,
      functional: false,
    }));
    setShow(false);
    // Reload to ensure tracking remains blocked
    window.location.reload();
  };

  const handleSaveCustom = () => {
    Haptic.success();
    const consentType = preferences.analytics ? "all" : "necessary";
    localStorage.setItem("andamus_cookie_consent", consentType);
    localStorage.setItem("andamus_cookie_preferences", JSON.stringify(preferences));
    setShow(false);
    window.location.reload();
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-elevated border border-line rounded-[var(--radius)] p-5 shadow-2xl backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-surface-2 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-muted" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-fg">Informativa sui Cookie & Privacy</h4>
            <p className="text-xs text-muted mt-1.5 leading-relaxed">
              Andamus usa i cookie per migliorare l'esperienza di carpooling.
            </p>
          </div>
          <button 
            onClick={handleNecessaryOnly} 
            className="text-dim hover:text-muted transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {customizing && (
          <div className="mt-4 pt-4 border-t border-line space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-fg block">Cookie Necessari</span>
                <span className="text-dim text-[10px]">Essenziali per il funzionamento dell&apos;app (Supabase, Stripe).</span>
              </div>
              <input type="checkbox" disabled checked className="accent-accent" />
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-fg block">Cookie Analitici</span>
                <span className="text-dim text-[10px]">Analisi dei flussi di viaggio sardi e usabilità (PostHog).</span>
              </div>
              <input 
                type="checkbox" 
                checked={preferences.analytics}
                onChange={(e) => setPreferences({...preferences, analytics: e.target.checked})}
                className="accent-accent cursor-pointer" 
              />
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-fg block">Cookie Funzionali</span>
                <span className="text-dim text-[10px]">Salvataggio preferenze di lingua e filtri di ricerca.</span>
              </div>
              <input 
                type="checkbox" 
                checked={preferences.functional}
                onChange={(e) => setPreferences({...preferences, functional: e.target.checked})}
                className="accent-accent cursor-pointer" 
              />
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 mt-5">
          {customizing ? (
            <>
              <button
                onClick={() => setCustomizing(false)}
                className="flex-1 py-2 text-center text-xs lowercase text-muted hover:text-fg border border-line hover:bg-surface-2 rounded-[var(--radius-sm)] transition-all"
              >
                Indietro
              </button>
              <button
                onClick={handleSaveCustom}
                className="flex-1 py-2 text-center text-xs lowercase bg-accent text-accent-fg font-semibold rounded-[var(--radius-sm)] hover:opacity-90 transition-all"
              >
                Salva Preferenze
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setCustomizing(true)}
                className="flex-1 py-2 text-center text-xs lowercase text-muted hover:text-fg rounded-[var(--radius-sm)] transition-all"
              >
                Personalizza
              </button>
              <button
                onClick={handleNecessaryOnly}
                className="flex-1 py-2 text-center text-xs lowercase text-fg border border-line hover:bg-surface-2 rounded-[var(--radius-sm)] transition-all font-medium"
              >
                Solo Necessari
              </button>
              <button
                onClick={handleAcceptAll}
                className="flex-1 py-2 text-center text-xs lowercase bg-accent text-accent-fg font-semibold rounded-[var(--radius-sm)] hover:opacity-90 transition-all"
              >
                Accetta Tutto
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}