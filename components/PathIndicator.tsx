"use client";

import { Car } from "lucide-react";

interface PathIndicatorProps {
  from: string;
  to: string;
  variant?: "horizontal" | "vertical";
  stops?: string[];
}

export function PathIndicator({ from, to, variant = "horizontal", stops = [] }: PathIndicatorProps) {
  if (variant === "vertical") {
    return (
      <div className="space-y-8 relative">
        <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-surface-container-highest" />
        
        <div className="flex items-center space-x-6 relative">
          <div className="w-4 h-4 rounded-full bg-surface-container-lowest border-2 border-primary z-10 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          </div>
          <span className="font-headline font-semibold text-on-surface">{from}</span>
        </div>
        
        {stops.map((stop, idx) => (
          <div key={idx} className="flex items-center space-x-6 relative">
            <div className="w-4 h-4 rounded-full bg-surface-container-lowest border-2 border-surface-container-highest z-10 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-surface-container-highest" />
            </div>
            <span className="font-headline font-semibold text-on-surface/60">{stop}</span>
          </div>
        ))}
        
        <div className="flex items-center space-x-6 relative">
          <div className="w-4 h-4 rounded-full bg-surface-container-lowest border-2 border-primary z-10 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          </div>
          <span className="font-headline font-semibold text-on-surface">{to}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative py-8 flex items-center justify-between">
      <div className="absolute left-0 right-0 h-[2px] bg-surface-container-highest" />
      <div className="absolute left-0 right-0 h-[2px] bg-primary scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-700 ease-in-out" />
      
      <div className="relative z-10 flex flex-col items-start bg-surface pr-4">
        <span className="text-[11px] font-bold uppercase text-primary mb-1">{from}</span>
        <div className="w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
      </div>
      
      <div className="relative z-10 flex flex-col items-center bg-surface px-4">
        <Car className="w-5 h-5 text-primary" />
      </div>
      
      <div className="relative z-10 flex flex-col items-end bg-surface pl-4">
        <span className="text-[11px] font-bold uppercase text-on-surface mb-1 opacity-50">{to}</span>
        <div className="w-3 h-3 rounded-full bg-surface-container-highest ring-4 ring-background" />
      </div>
    </div>
  );
}
