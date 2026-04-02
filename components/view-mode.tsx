"use client";

import { useEffect, useState } from "react";

export type DeviceType = "mobile" | "desktop";

export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>("desktop");

  useEffect(() => {
    const checkDevice = () => {
      const isMobile = window.innerWidth < 768;
      setDeviceType(isMobile ? "mobile" : "desktop");
    };

    // Initial check
    checkDevice();

    // Listen for resize
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
