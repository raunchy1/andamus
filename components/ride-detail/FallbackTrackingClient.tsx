"use client";

import { useEffect } from "react";
import { captureEvent } from "@/lib/posthog";

interface TrackingProps {
  rideId: string;
}

export function FallbackTrackingClient({ rideId }: TrackingProps) {
  useEffect(() => {
    captureEvent("ride_detail_404", {
      ride_id: rideId,
      url: typeof window !== "undefined" ? window.location.href : "",
      referrer: typeof document !== "undefined" ? document.referrer : "",
    });
  }, [rideId]);

  return null;
}
