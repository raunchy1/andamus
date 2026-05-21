"use client";

import { useState, useEffect, useSyncExternalStore } from "react";

export type DeviceType = "mobile" | "desktop";

function getDeviceTypeSnapshot(): DeviceType {
  return window.innerWidth < 768 ? "mobile" : "desktop";
}

function getServerSnapshot(): DeviceType {
  return "mobile"; // SSR always renders mobile-first
}

function subscribe(callback: () => void): () => void {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

export function useDeviceType(): DeviceType {
  // Use a client-only state to avoid hydration mismatch
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const deviceType = useSyncExternalStore(
    subscribe,
    getDeviceTypeSnapshot,
    getServerSnapshot
  );

  // During SSR and first client render, return "mobile" consistently
  // After hydration, return the actual device type
  return isClient ? deviceType : "mobile";
}

// Hook for responsive value based on device type
export function useResponsiveValue<T>(mobileValue: T, desktopValue: T): T {
  const deviceType = useDeviceType();
  return deviceType === "mobile" ? mobileValue : desktopValue;
}
