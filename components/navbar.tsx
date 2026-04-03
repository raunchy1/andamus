"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { 
  Menu, 
  X, 
  Car, 
  LogOut, 
  User,
  Search,
  PlusCircle,
  Home,
  Shield,
  Gift,
  BarChart3,
  Users,
  Siren
} from "lucide-react";

import { ThemeToggle } from "./ThemeToggle";
import { LanguageSelector } from "./LanguageSelector";
import { NotificationBell } from "./NotificationBell";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { signInWithGoogle, signOut } from "@/lib/auth";
import { openSOSModal } from "./SafetyButton";
import { ShareApp } from "./ShareApp";

const ADMIN_EMAILS = [
  'cristianermurache@gmail.com',
  'cristiermurache@gmail.com'
];

interface UserData {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    full_name?: string;
    avatar_url?: string;
    picture?: string;
  };
}

export function Navbar() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;
  const supabase = createClient();
  
  const navLinks = [
    { href: `/${locale}/`, label: t('home'), icon: Home },
    { href: `/${locale}/cerca`, label: t('search'), icon: Search },
    { href: `/${locale}/richieste`, label: "Richieste", icon: User },
    { href: `/${locale}/offri`, label: t('offer'), icon: PlusCircle },
    { href: `/${locale}/eventi`, label: "Eventi", icon: Car },
    { href: `/${locale}/gruppi`, label: "Gruppi", icon: Users },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const getInitialUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getInitialUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    setAvatarError(false);
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch {
      // // console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      // // console.error("Logout failed:", error);
    }
  };



  const getUserName = () => {
    if (!user) return "";
    return user.user_metadata?.name || 
           user.user_metadata?.full_name || 
           user.email?.split("@")[0] || 
           "Utente";
  };

  const getUserAvatar = () => {
    if (!user) return null;
    return user.user_metadata?.avatar_url || 
           user.user_metadata?.picture || 
           null;
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isHome 
          ? scrolled || mobileMenuOpen
            ? "bg-[#1a1a2e]/95 backdrop-blur-md border-b border-white/10 shadow-lg"
            : "bg-transparent"
          : "bg-white/95 backdrop-blur-md border-b border-border shadow-sm"
      }`}
    >
      <nav className="mx-auto flex h-16 md:h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
        {/* Logo */}
        <Link 
          href="/" 
          className={`flex items-center gap-2 md:gap-3 transition-all hover:scale-105 flex-shrink-0 ${
            isHome ? "text-white" : "text-[#1a1a2e]"
          }`}
        >
          <div className="flex h-9 w-9 md:h-11 md:w-11 items-center justify-center rounded-xl bg-[#e63946] flex-shrink-0">
            <Car className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </div>
          <span className="text-xl md:text-2xl font-bold tracking-tight whitespace-nowrap">Andamus</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex lg:items-center lg:gap-1 flex-1 justify-center mx-4">
          {navLinks.slice(0, 4).map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3 xl:px-4 py-2 text-sm font-medium transition-all rounded-lg whitespace-nowrap ${
                  isHome 
                    ? isActive
                      ? "text-white bg-white/10"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                    : isActive
                      ? "text-[#e63946] bg-[#e63946]/10"
                      : "text-gray-600 hover:text-[#1a1a2e] hover:bg-gray-100"
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#e63946]" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Desktop Auth Section */}
        <div className="hidden md:flex md:items-center md:gap-2 lg:gap-3 flex-shrink-0">
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-3">
                  {/* Admin Link */}
                  {user?.email && ADMIN_EMAILS.includes(user.email) && (
                    <Link
                      href="/admin"
                      className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                        isHome 
                          ? "text-white/70 hover:bg-white/10 hover:text-white" 
                          : "text-gray-500 hover:bg-gray-100 hover:text-[#1a1a2e]"
                      }`}
                      title="Admin"
                    >
                      <Shield className="h-5 w-5" />
                    </Link>
                  )}
                  
                  {/* Language Selector */}
                  <LanguageSelector isHome={isHome} />

                  {/* Theme Toggle */}
                  <ThemeToggle isHome={isHome} />

                  {/* Notification Bell */}
                  <NotificationBell isHome={isHome} />

                  {/* Share App */}
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                    isHome 
                      ? "text-white/70 hover:bg-white/10 hover:text-white" 
                      : "text-gray-500 hover:bg-gray-100 hover:text-[#1a1a2e]"
                  }`}>
                    <ShareApp variant="icon" className={isHome ? "text-white/70" : "text-gray-500"} />
                  </div>

                  {/* Invite Friends Link -->
                  <Link
                    href={`/${locale}/invita`}
                    className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                      isHome 
                        ? "text-white/70 hover:bg-white/10 hover:text-white" 
                        : "text-gray-500 hover:bg-gray-100 hover:text-[#1a1a2e]"
                    }`}
                    title={t('invite')}
                  >
                    <Gift className="h-5 w-5" />
                  </Link>

                  {/* Statistics Link */}
                  <Link
                    href={`/${locale}/statistiche`}
                    className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                      isHome 
                        ? "text-white/70 hover:bg-white/10 hover:text-white" 
                        : "text-gray-500 hover:bg-gray-100 hover:text-[#1a1a2e]"
                    }`}
                    title="Statistiche"
                  >
                    <BarChart3 className="h-5 w-5" />
                  </Link>

                  {/* SOS Button */}
                  <button
                    onClick={openSOSModal}
                    className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                      isHome 
                        ? "text-red-400 hover:bg-red-500/10 hover:text-red-300" 
                        : "text-red-500 hover:bg-red-500/10 hover:text-red-600"
                    }`}
                    title="SOS Emergenza"
                  >
                    <Siren className="h-5 w-5" />
                  </button>

                  <Link 
                    href={`/${locale}/profilo`}
                    className={`flex items-center gap-2 rounded-full border px-2 lg:px-3 py-1.5 transition-all min-w-0 ${
                      isHome
                        ? "border-white/10 bg-white/5 hover:bg-white/10 text-white"
                        : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-[#1a1a2e]"
                    }`}
                  >
                    <span className="text-sm font-medium truncate max-w-[80px] lg:max-w-[120px] hidden sm:block">{getUserName()}</span>
                    {getUserAvatar() && !avatarError ? (
                      <Image 
                        src={getUserAvatar()!} 
                        alt={getUserName()}
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e63946]/10 text-[#e63946] flex-shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                    <span className={`text-sm font-medium max-w-[100px] truncate`}>
                      {getUserName()}
                    </span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                      isHome 
                        ? "text-white/70 hover:bg-white/10 hover:text-white" 
                        : "text-gray-500 hover:bg-gray-100 hover:text-[#1a1a2e]"
                    }`}
                    title={t('logout')}
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Button
                  onClick={handleLogin}
                  className="bg-[#e63946] text-white hover:bg-[#c92a37] shadow-lg shadow-[#e63946]/20"
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {t('login')}
                </Button>
              )}
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className={`inline-flex items-center justify-center rounded-lg p-2 transition-colors md:hidden ${
            isHome
              ? "text-white hover:bg-white/10"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="sr-only">
            {mobileMenuOpen ? "Chiudi menu" : "Apri menu"}
          </span>
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className={`fixed inset-x-0 top-16 border-b md:hidden ${
          isHome 
            ? "border-white/10 bg-[#1a1a2e]/98 backdrop-blur-lg" 
            : "border-border bg-white"
        }`}>
          <div className="space-y-1 px-4 pb-4 pt-2">
            {/* Language & Theme - Mobile */}
            <div className={`flex items-center justify-between rounded-lg px-3 py-3 ${
              isHome ? "text-white/70" : "text-gray-600"
            }`}>
              <span className="font-medium">Lingua / Language</span>
              <div className="flex items-center gap-2">
                <LanguageSelector isHome={isHome} />
                <ThemeToggle isHome={isHome} />
              </div>
            </div>
            
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors ${
                    isActive
                      ? isHome
                        ? "bg-[#e63946] text-white"
                        : "bg-[#e63946]/10 text-[#e63946]"
                      : isHome
                        ? "text-white/70 hover:bg-white/10 hover:text-white"
                        : "text-gray-600 hover:bg-gray-100 hover:text-[#1a1a2e]"
                  }`}
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </Link>
              );
            })}
            
            {/* Mobile Auth */}
            <div className="border-t border-white/10 pt-3 mt-3">
              {!loading && (
                <>
                  {user ? (
                    <div className="space-y-2">
                      <Link
                        href={`/${locale}/invita`}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 rounded-lg px-3 py-3 ${
                          isHome 
                            ? "text-white/70 hover:bg-white/10" 
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <Gift className="h-5 w-5" />
                        <span>{t('invite')}</span>
                      </Link>
                      <Link
                        href={`/${locale}/statistiche`}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 rounded-lg px-3 py-3 ${
                          isHome 
                            ? "text-white/70 hover:bg-white/10" 
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <BarChart3 className="h-5 w-5" />
                        <span>Statistiche</span>
                      </Link>
                      <button
                        onClick={() => {
                          openSOSModal();
                          setMobileMenuOpen(false);
                        }}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left ${
                          isHome 
                            ? "text-red-400 hover:bg-red-500/10" 
                            : "text-red-500 hover:bg-red-500/10"
                        }`}
                      >
                        <Siren className="h-5 w-5" />
                        <span>SOS Emergenza</span>
                      </button>
                      {user?.email && ADMIN_EMAILS.includes(user.email || '') && (
                        <Link
                          href="/admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 rounded-lg px-3 py-3 ${
                            isHome 
                              ? "text-white/70 hover:bg-white/10" 
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          <Shield className="h-5 w-5" />
                          <span>Admin</span>
                        </Link>
                      )}
                      <Link
                        href={`/${locale}/profilo`}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 rounded-lg px-3 py-3 ${
                          isHome ? "text-white" : "text-[#1a1a2e]"
                        }`}
                      >
                        {getUserAvatar() && !avatarError ? (
                          <Image 
                            src={getUserAvatar()!} 
                            alt={getUserName()}
                            width={32}
                            height={32}
                            className="h-8 w-8 rounded-full object-cover"
                            onError={() => setAvatarError(true)}
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e63946]/10 text-[#e63946]">
                            <User className="h-4 w-4" />
                          </div>
                        )}
                        <span className="font-medium">{getUserName()}</span>
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left ${
                          isHome 
                            ? "text-white/70 hover:bg-white/10" 
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <LogOut className="h-5 w-5" />
                        <span>{t('logout')}</span>
                      </button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        handleLogin();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full bg-[#e63946] text-white hover:bg-[#c92a37]"
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      {t('loginWithGoogle')}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
