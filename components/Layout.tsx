"use client";

import { useDeviceType } from "./view-mode";
import { BottomNav } from "./BottomNav";
import { DesktopNav } from "./DesktopNav";

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
  return (
    <div className="min-h-screen bg-[#050505] overflow-x-hidden">
      {/* Mobile container - full width on actual mobile devices */}
      <div className="relative w-full min-h-screen bg-[#0a0a0a] overflow-x-hidden">
        {/* Content wrapper with proper z-index and padding for fixed navbars */}
        <div className="relative z-content mobile-layout-shell">
          {children}
        </div>
        <BottomNav />
      </div>
    </div>
  );
}

function DesktopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#e5e2e1] overflow-x-hidden">
      <DesktopNav />
      <main className="desktop-layout-shell max-w-6xl mx-auto px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
