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
import { signOut } from "@/lib/auth";
import { openSOSModal } from "./SafetyButton";
import { ShareApp } from "./ShareApp";
import { isAdmin } from "@/lib/admin-config";
import { AuthModal } from "./AuthModal";

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
  const [, setScrolled] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [avatarKey, setAvatarKey] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login");
  const pathname = usePathname();
  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;
  const supabase = createClient();
  
  const navLinks = [
    { href: `/${locale}/`, label: t('home'), icon: Home },
    { href: `/${locale}/cerca`, label: t('search'), icon: Search },
    { href: `/${locale}/richieste`, label: t('requests'), icon: User },
    { href: `/${locale}/offri`, label: t('offer'), icon: PlusCircle },
    { href: `/${locale}/eventi`, label: t('events'), icon: Car },
    { href: `/${locale}/gruppi`, label: t('groups'), icon: Users },
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
        setAvatarError(false);
        setAvatarKey(prev => prev + 1);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Reset avatar error when user changes by incrementing key

  const handleOpenLogin = () => {
    setAuthModalTab("login");
    setAuthModalOpen(true);
  };

  const handleOpenRegister = () => {
    setAuthModalTab("register");
    setAuthModalOpen(true);
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
           t('user');
  };

  const getUserAvatar = () => {
    if (!user) return null;
    return user.user_metadata?.avatar_url || 
           user.user_metadata?.picture || 
           null;
  };

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10 shadow-lg`}
      >
      <nav className="mx-auto flex h-16 md:h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
        {/* Logo */}
        <Link 
          href={`/${locale}`} 
          className="flex items-center gap-2 md:gap-3 text-white transition-all hover:scale-105 flex-shrink-0"
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
                  isActive
                    ? "text-white bg-[#e63946]/20"
                    : "text-white/65 hover:text-white hover:bg-white/5"
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
          {/* Language Selector — always visible */}
          <LanguageSelector isHome={isHome} />

          {/* Theme Toggle — always visible */}
          <ThemeToggle isHome={isHome} />

          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-3">
                  {/* Admin Link */}
                  {isAdmin(user?.email) && (
                    <Link
                      href="/admin"
                      className="flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                      title={t('admin')}
                    >
                      <Shield className="h-5 w-5" />
                    </Link>
                  )}

                  {/* Notification Bell */}
                  <NotificationBell isHome={isHome} />

                  {/* Share App */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white">
                    <ShareApp variant="icon" className="text-white/70" />
                  </div>

                  {/* Invite Friends Link -->
                  <Link
                    href={`/${locale}/invita`}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    title={t('invite')}
                  >
                    <Gift className="h-5 w-5" />
                  </Link>

                  {/* Statistics Link */}
                  <Link
                    href={`/${locale}/statistiche`}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    title={t('statistics')}
                  >
                    <BarChart3 className="h-5 w-5" />
                  </Link>

                  {/* SOS Button */}
                  <button
                    onClick={openSOSModal}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                    title={t('sosEmergency')}
                    aria-label={t('sosEmergency')} // a11y: icon-only button
                  >
                    <Siren className="h-5 w-5" />
                  </button>

                  <Link 
                    href={`/${locale}/profilo`}
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1.5 text-white transition-all hover:bg-white/10 lg:px-3 min-w-0"
                  >
                    {getUserAvatar() && !avatarError ? (
                      <Image 
                        key={avatarKey}
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
                    <span className="hidden xl:inline text-sm font-medium max-w-[120px] truncate">
                      {getUserName()}
                    </span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    title={t('logout')}
                    aria-label={t('logout')} // a11y: icon-only button
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleOpenLogin}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 hover:text-white bg-transparent"
                  >
                    {t('login')}
                  </Button>
                  <Button
                    onClick={handleOpenRegister}
                    className="bg-[#e63946] text-white hover:bg-[#c92a37] shadow-lg shadow-[#e63946]/20"
                  >
                    {t('register')}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg p-2 text-white transition-colors hover:bg-white/10 md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? t('closeMenu') : t('openMenu')} // a11y: icon-only button
        >
          <span className="sr-only">
            {mobileMenuOpen ? t('closeMenu') : t('openMenu')}
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
        <div className="fixed inset-x-0 top-16 border-b border-white/10 bg-[#0a0a0a]/98 backdrop-blur-lg md:hidden">
          <div className="space-y-1 px-4 pb-4 pt-2">
            {/* Language & Theme - Mobile */}
            <div className="flex items-center justify-between rounded-lg px-3 py-3 text-white/70">
              <span className="font-medium">{t('language')}</span>
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
                      ? "bg-[#e63946] text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
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
                        className="flex items-center gap-3 rounded-lg px-3 py-3 text-white/70 hover:bg-white/10"
                      >
                        <Gift className="h-5 w-5" />
                        <span>{t('invite')}</span>
                      </Link>
                      <Link
                        href={`/${locale}/statistiche`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-3 text-white/70 hover:bg-white/10"
                      >
                        <BarChart3 className="h-5 w-5" />
                        <span>{t('statistics')}</span>
                      </Link>
                      <button
                        onClick={() => {
                          openSOSModal();
                          setMobileMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-red-400 hover:bg-red-500/10"
                      >
                        <Siren className="h-5 w-5" />
                        <span>{t('sosEmergency')}</span>
                      </button>
                      {isAdmin(user?.email) && (
                        <Link
                          href="/admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-3 text-white/70 hover:bg-white/10"
                        >
                          <Shield className="h-5 w-5" />
                          <span>{t('admin')}</span>
                        </Link>
                      )}
                      <Link
                        href={`/${locale}/profilo`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-3 text-white"
                      >
                        {getUserAvatar() && !avatarError ? (
                          <Image 
                            key={avatarKey}
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
                      <div className="border-t border-white/10 pt-3 mt-2">
                        <button
                          onClick={() => {
                            handleLogout();
                            setMobileMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-red-400 hover:bg-red-500/10"
                          aria-label={t('logout')}
                        >
                          <LogOut className="h-5 w-5" />
                          <span>{t('logout')}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        onClick={() => {
                          handleOpenLogin();
                          setMobileMenuOpen(false);
                        }}
                        variant="outline"
                        className="w-full border-white/20 text-white hover:bg-white/10 hover:text-white bg-transparent"
                      >
                        {t('login')}
                      </Button>
                      <Button
                        onClick={() => {
                          handleOpenRegister();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full bg-[#e63946] text-white hover:bg-[#c92a37]"
                      >
                        {t('register')}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      </header>

      {/* Auth Modal — rendered at root level via portal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        defaultTab={authModalTab}
      />
    </>
  );
}
