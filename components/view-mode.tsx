"use client";

import { useSyncExternalStore } from "react";

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
  return useSyncExternalStore(subscribe, getDeviceTypeSnapshot, getServerSnapshot);
}

// Hook for responsive value based on device type
export function useResponsiveValue<T>(mobileValue: T, desktopValue: T): T {
  const deviceType = useDeviceType();
  return deviceType === "mobile" ? mobileValue : desktopValue;
}
