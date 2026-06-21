"use client";

import { useEffect, useState } from "react";

const APP_VERSION = "v1.0";
const DEV_HOSTNAMES = ["localhost", "127.0.0.1", "dev.", "staging.", "preview."];

export function VersionBadge() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isDev = DEV_HOSTNAMES.some(
      (hostname) =>
        window.location.hostname.includes(hostname) ||
        window.location.hostname === "localhost"
    );
    setIsVisible(isDev && process.env.NODE_ENV === "development");
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[90] hidden md:block">
      <div className="flex items-center gap-2 rounded-full border border-line bg-surface/95 px-3 py-1.5 font-mono text-xs text-dim shadow-sm backdrop-blur-sm">
        <span className="size-2 rounded-full bg-accent/60" />
        <span>{APP_VERSION}</span>
      </div>
    </div>
  );
}