"use client";

import { useViewMode } from "./view-mode";
import { ViewModeToggle } from "./ViewModeToggle";
import { BottomNav } from "./BottomNav";
import { DesktopNav } from "./DesktopNav";

export function Layout({ children }: { children: React.ReactNode }) {
  const { viewMode } = useViewMode();

  return (
    <>
      <ViewModeToggle />
      {viewMode === "mobile" ? (
        <MobileLayout>{children}</MobileLayout>
      ) : (
        <DesktopLayout>{children}</DesktopLayout>
      )}
    </>
  );
}

function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050505] flex items-start justify-center py-0 md:py-8">
      {/* iPhone 16 Pro Frame */}
      <div className="relative w-full max-w-[393px] min-h-[852px] md:min-h-[852px] md:h-auto bg-[#0a0a0a] md:rounded-[55px] md:border-[8px] md:border-[#1a1a1a] md:shadow-2xl overflow-hidden">
        {/* Dynamic Island */}
        <div className="hidden md:block absolute top-3 left-1/2 -translate-x-1/2 w-[120px] h-[35px] bg-black rounded-[20px] z-[100]" />
        <div className="relative z-0">
          {children}
          <BottomNav />
        </div>
      </div>
    </div>
  );
}

function DesktopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#e5e2e1]">
      <DesktopNav />
      <main className="max-w-7xl mx-auto px-6 lg:px-12 pt-24 pb-16">
        {children}
      </main>
    </div>
  );
}
