"use client";

import { useDeviceType } from "./view-mode";
import { BottomNav } from "./BottomNav";
import { usePathname } from "next/navigation";

export function Layout({ children }: { children: React.ReactNode }) {
  const deviceType = useDeviceType();

  return (
    <>
      {deviceType === "mobile" ? (
        <MobileLayout>{children}</MobileLayout>
      ) : (
        <DesktopLayout>{children}</DesktopLayout>
      )}
    </>
  );
}

function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboarding = pathname?.includes("/onboarding") ?? false;

  if (isOnboarding) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] overflow-x-hidden">
        <main className="w-full min-h-[100dvh] overflow-x-hidden">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] overflow-x-hidden">
      {/* Mobile container - full width on actual mobile devices */}
      <div className="relative w-full min-h-screen bg-[#0a0a0a] overflow-x-hidden">
        {/* Content wrapper with EXPLICIT padding for fixed navbars */}
        <main className="flex-1 w-full pt-[72px] pb-[calc(4rem+env(safe-area-inset-bottom,0px))] min-h-[100dvh] overflow-x-hidden">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}

function DesktopLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboarding = pathname?.includes("/onboarding") ?? false;

  if (isOnboarding) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] overflow-x-hidden flex items-center justify-center">
        <main className="w-full max-w-md min-h-screen flex flex-col justify-center">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#e5e2e1] overflow-x-hidden">
      <main className="pt-[80px] pb-16 max-w-6xl mx-auto px-6 lg:px-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}
