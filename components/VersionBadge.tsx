"use client";

import { useEffect, useState } from "react";

const APP_VERSION = "v1.0";
const DEV_HOSTNAMES = ["localhost", "127.0.0.1", "dev.", "staging.", "preview."];

export function VersionBadge() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if in development
    const isDev = DEV_HOSTNAMES.some(
      (hostname) =>
        window.location.hostname.includes(hostname) ||
        window.location.hostname === "localhost"
    );

    // Check if user is admin (basic check, can be enhanced)
    const checkAdmin = async () => {
      try {
        // You can add more sophisticated admin checking here
        // For now, just show in dev mode
        setIsVisible(isDev);
      } catch {
        setIsVisible(isDev);
      }
    };

    checkAdmin();
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[90]">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#e63946]/90 text-white text-xs font-mono shadow-lg backdrop-blur-sm">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span>{APP_VERSION}</span>
        {isAdmin && <span className="text-white/70">[ADMIN]</span>}
      </div>
    </div>
  );
}
