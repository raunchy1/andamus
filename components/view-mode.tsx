"use client";

import { useLayoutEffect, useState } from "react";

export type DeviceType = "mobile" | "desktop";

function getDeviceType(): DeviceType {
  if (typeof window === "undefined") return "mobile";
  return window.innerWidth < 768 ? "mobile" : "desktop";
}

export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>(getDeviceType);

  useLayoutEffect(() => {
    const checkDevice = () => {
      setDeviceType(getDeviceType());
    };

    checkDevice();

    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  return deviceType;
}

// Hook for responsive value based on device type
export function useResponsiveValue<T>(mobileValue: T, desktopValue: T): T {
  const deviceType = useDeviceType();
  return deviceType === "mobile" ? mobileValue : desktopValue;
}
