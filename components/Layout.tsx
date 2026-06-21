"use client";

import { useDeviceType } from "./view-mode";
import { BottomNav } from "./BottomNav";
import { usePathname } from "next/navigation";

/** Active conversation thread — not the inbox list. */
function isChatThread(pathname: string | null) {
  if (!pathname) return false;
  return /\/chat\/[^/]+/.test(pathname);
}

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
  const chatThread = isChatThread(pathname);

  if (isOnboarding) {
    return (
      <div className="min-h-screen bg-bg overflow-x-hidden">
        <main className="w-full min-h-[100dvh] overflow-x-hidden">
          {children}
        </main>
      </div>
    );
  }

  if (chatThread) {
    return (
      <div className="min-h-screen bg-bg overflow-x-hidden">
        <main className="w-full min-h-[100dvh] overflow-hidden pt-16">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg overflow-x-hidden">
      <div className="relative w-full min-h-screen overflow-x-hidden">
        <main className="flex-1 w-full pt-16 pb-[calc(4rem+env(safe-area-inset-bottom,0px))] min-h-[100dvh] overflow-x-hidden">
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
  const chatThread = isChatThread(pathname);

  if (isOnboarding) {
    return (
      <div className="min-h-screen bg-bg overflow-x-hidden flex items-center justify-center">
        <main className="w-full max-w-md min-h-screen flex flex-col justify-center">
          {children}
        </main>
      </div>
    );
  }

  if (chatThread) {
    return (
      <div className="min-h-screen bg-bg text-fg overflow-hidden">
        <main className="min-h-0 overflow-hidden">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-fg overflow-x-hidden">
      <main className="pt-20 pb-16 max-w-6xl mx-auto px-6 lg:px-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}