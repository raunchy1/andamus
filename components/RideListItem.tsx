"use client";

import Image from "next/image";
import Link from "next/link";

interface RideListItemProps {
  id: string;
  time: string;
  from: string;
  to: string;
  price: number;
  driverName: string;
  driverAvatar: string | null;
  driverRating: number;
  carModel?: string;
  status?: string;
}

export function RideListItem({
  id,
  time,
  from,
  to,
  price,
  driverName,
  driverAvatar,
  driverRating,
  carModel = "",
  status = "Disponibile",
}: RideListItemProps) {
  return (
    <Link
      href={`/corsa/${id}`}
      className="group relative bg-surface p-6 rounded-xl transition-all duration-300 hover:bg-surface-container-low cursor-pointer block"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{status}</span>
          <h3 className="text-4xl font-extrabold tracking-tighter text-on-surface">{time}</h3>
        </div>
        <div className="text-right">
          <div className="text-3xl font-extrabold tracking-tighter text-on-surface">
            {price === 0 ? "Gratis" : `€${price}`}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface opacity-50">Posto singolo</div>
        </div>
      </div>

      {/* Path Indicator */}
      <div className="relative py-8 flex items-center justify-between">
        <div className="absolute left-0 right-0 h-[2px] bg-surface-container-highest" />
        <div className="absolute left-0 right-0 h-[2px] bg-primary scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-700 ease-in-out" />
        <div className="relative z-10 flex flex-col items-start bg-surface pr-4 group-hover:bg-surface-container-low transition-colors">
          <span className="text-[11px] font-bold uppercase text-primary mb-1">{from}</span>
          <div className="w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
        </div>
        <div className="relative z-10 flex flex-col items-center bg-surface px-4 group-hover:bg-surface-container-low transition-colors">
          <span className="material-symbols-outlined text-primary text-xl">directions_car</span>
        </div>
        <div className="relative z-10 flex flex-col items-end bg-surface pl-4 group-hover:bg-surface-container-low transition-colors">
          <span className="text-[11px] font-bold uppercase text-on-surface mb-1 opacity-50">{to}</span>
          <div className="w-3 h-3 rounded-full bg-surface-container-highest ring-4 ring-background" />
        </div>
      </div>

      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full border-2 border-primary overflow-hidden grayscale group-hover:grayscale-0 transition-all">
            {driverAvatar ? (
              <Image
                src={driverAvatar}
                alt={driverName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant">person</span>
              </div>
            )}
          </div>
          <div>
            <p className="font-bold text-on-surface">{driverName}</p>
            <div className="flex items-center gap-1">
              <span
                className="material-symbols-outlined text-[12px] text-primary"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
              >
                star
              </span>
              <span className="text-[11px] font-bold text-on-surface-variant">
                {driverRating} {carModel ? `• ${carModel}` : ""}
              </span>
            </div>
          </div>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-2 transition-transform">
          arrow_forward_ios
        </span>
      </div>
    </Link>
  );
}
