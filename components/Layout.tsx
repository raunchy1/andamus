"use client";

import { useDeviceType } from "./view-mode";
import { BottomNav } from "./BottomNav";

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
        {/* Content wrapper with EXPLICIT padding for fixed navbars */}
        <main className="flex-1 w-full pt-[72px] pb-[100px] min-h-screen overflow-x-hidden">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}

function DesktopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#e5e2e1] overflow-x-hidden">
      <main className="pt-[80px] pb-16 max-w-6xl mx-auto px-6 lg:px-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}
