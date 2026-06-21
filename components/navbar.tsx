"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
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
import { FEATURES } from "@/lib/features";
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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);
  const [supabase] = useState(() => createClient());
  
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
      (_event: import("@supabase/supabase-js").AuthChangeEvent, session: import("@supabase/supabase-js").Session | null) => {
        setUser(session?.user ?? null);
        setAvatarError(false);
        setAvatarKey(prev => prev + 1);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  if (pathname?.includes("/onboarding")) {
    return null;
  }

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
        className="fixed top-0 left-0 right-0 z-[100] bg-bg/95 backdrop-blur-md border-b border-line"
      >
      <nav className="mx-auto flex h-16 md:h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
        {/* Logo */}
        <Link 
          href={`/${locale}`} 
          className="flex items-center flex-shrink-0 transition-opacity hover:opacity-80"
        >
          <span className="text-xl md:text-2xl font-bold tracking-[-0.03em] text-fg lowercase whitespace-nowrap">
            andamus
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex lg:items-center lg:gap-1 flex-1 justify-center mx-4">
          {navLinks.slice(0, 4).map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3 xl:px-4 py-2 text-sm font-medium transition-colors rounded-[var(--radius-sm)] whitespace-nowrap ${
                  isActive
                    ? "text-fg bg-accent-dim"
                    : "text-muted hover:text-fg hover:bg-surface-2"
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Desktop Auth Section */}
        <div className="hidden md:flex md:items-center md:gap-2 lg:gap-3 flex-shrink-0">
          {/* Language Selector — always visible */}
          <Suspense fallback={<div className="w-10 h-10 rounded-full" />}>
            <LanguageSelector isHome={isHome} />
          </Suspense>

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
                      className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-fg"
                      title={t('admin')}
                    >
                      <Shield className="h-5 w-5" />
                    </Link>
                  )}

                  {/* Notification Bell */}
                  <NotificationBell isHome={isHome} />

                  {/* Share App */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-fg">
                    <ShareApp variant="icon" className="text-muted" />
                  </div>

                  {/* Invite Friends Link -->
                  {FEATURES.WAITLIST_MODE && (
                    <Link
                      href={`/${locale}/invita`}
                      className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-fg"
                      title={t('invite')}
                    >
                      <Gift className="h-5 w-5" />
                    </Link>
                  )}

                  {/* Statistics Link */}
                  <Link
                    href={`/${locale}/statistiche`}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-fg"
                    title={t('statistics')}
                  >
                    <BarChart3 className="h-5 w-5" />
                  </Link>

                  {/* SOS Button */}
                  <button
                    onClick={openSOSModal}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-bad transition-colors hover:bg-bad/10 hover:text-bad"
                    title={t('sosEmergency')}
                    aria-label={t('sosEmergency')} // a11y: icon-only button
                  >
                    <Siren className="h-5 w-5" />
                  </button>

                  <Link 
                    href={`/${locale}/profilo`}
                    className="flex items-center gap-2 rounded-full border border-line bg-surface px-2 py-1.5 text-fg transition-colors hover:bg-surface-2 lg:px-3 min-w-0"
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
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-muted flex-shrink-0">
                        <User className="h-4 w-4" strokeWidth={1.5} />
                      </div>
                    )}
                    <span className="hidden xl:inline text-sm font-medium max-w-[120px] truncate">
                      {getUserName()}
                    </span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-fg"
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
                    variant="secondary"
                  >
                    {t('login')}
                  </Button>
                  <Button
                    onClick={handleOpenRegister}
                    variant="primary"
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
          className="inline-flex items-center justify-center rounded-[var(--radius-sm)] p-2 text-fg transition-colors hover:bg-surface-2 md:hidden"
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
        <div className="fixed inset-x-0 top-16 border-b border-line bg-bg/98 backdrop-blur-lg md:hidden">
          <div className="space-y-1 px-4 pb-4 pt-2">
            {/* Language & Theme - Mobile */}
            <div className="flex items-center justify-between rounded-[var(--radius-sm)] px-3 py-3 text-muted">
              <span className="font-medium">{t('language')}</span>
              <div className="flex items-center gap-2">
                <Suspense fallback={<div className="w-10 h-10 rounded-full" />}>
                  <LanguageSelector isHome={isHome} />
                </Suspense>
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
                  className={`flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-3 text-base font-medium transition-colors ${
                    isActive
                      ? "bg-accent-dim text-fg"
                      : "text-muted hover:bg-surface-2 hover:text-fg"
                  }`}
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </Link>
              );
            })}
            
            {/* Mobile Auth */}
            <div className="border-t border-line pt-3 mt-3">
              {!loading && (
                <>
                  {user ? (
                    <div className="space-y-2">
                      {FEATURES.WAITLIST_MODE && (
                        <Link
                          href={`/${locale}/invita`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-3 text-muted hover:bg-surface-2"
                        >
                          <Gift className="h-5 w-5" />
                          <span>{t('invite')}</span>
                        </Link>
                      )}
                      <Link
                        href={`/${locale}/statistiche`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-3 text-muted hover:bg-surface-2"
                      >
                        <BarChart3 className="h-5 w-5" />
                        <span>{t('statistics')}</span>
                      </Link>
                      <button
                        onClick={() => {
                          openSOSModal();
                          setMobileMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-3 text-left text-bad hover:bg-bad/10"
                      >
                        <Siren className="h-5 w-5" />
                        <span>{t('sosEmergency')}</span>
                      </button>
                      {isAdmin(user?.email) && (
                        <Link
                          href="/admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-3 text-muted hover:bg-surface-2"
                        >
                          <Shield className="h-5 w-5" />
                          <span>{t('admin')}</span>
                        </Link>
                      )}
                      <Link
                        href={`/${locale}/profilo`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-3 text-fg"
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
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-muted">
                            <User className="h-4 w-4" />
                          </div>
                        )}
                        <span className="font-medium">{getUserName()}</span>
                      </Link>
                      <div className="border-t border-line pt-3 mt-2">
                        <button
                          onClick={() => {
                            handleLogout();
                            setMobileMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-3 text-left text-bad hover:bg-bad/10"
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
                        variant="secondary"
                        className="w-full"
                      >
                        {t('login')}
                      </Button>
                      <Button
                        onClick={() => {
                          handleOpenRegister();
                          setMobileMenuOpen(false);
                        }}
                        variant="primary"
                        className="w-full"
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
