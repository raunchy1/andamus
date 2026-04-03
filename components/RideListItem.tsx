"use client";

import Image from "next/image";
import Link from "next/link";
import { Car, User, Star, ChevronRight } from "lucide-react";
import { useDeviceType } from "./view-mode";

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
  date?: string;
}

export function RideListItem(props: RideListItemProps) {
  const deviceType = useDeviceType();
  return deviceType === "mobile" ? <RideListItemMobile {...props} /> : <RideListItemDesktop {...props} />;
}

function RideListItemMobile({
  id, time, from, to, price, driverName, driverAvatar, driverRating, carModel = "", status = "Disponibile",
}: RideListItemProps) {
  return (
    <Link href={`/corsa/${id}`} className="group relative bg-surface p-6 rounded-xl transition-all duration-300 hover:bg-surface-container-low cursor-pointer block">
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{status}</span>
          <h3 className="text-4xl font-extrabold tracking-tighter text-on-surface">{time}</h3>
        </div>
        <div className="text-right">
          <div className="text-3xl font-extrabold tracking-tighter text-on-surface">{price === 0 ? "Gratis" : `€${price}`}</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface opacity-50">Posto singolo</div>
        </div>
      </div>
      <div className="relative py-8 flex items-center justify-between">
        <div className="absolute left-0 right-0 h-[2px] bg-surface-container-highest" />
        <div className="absolute left-0 right-0 h-[2px] bg-primary scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-700 ease-in-out" />
        <div className="relative z-10 flex flex-col items-start bg-surface pr-4 group-hover:bg-surface-container-low transition-colors">
          <span className="text-[11px] font-bold uppercase text-primary mb-1">{from}</span>
          <div className="w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
        </div>
        <div className="relative z-10 flex flex-col items-center bg-surface px-4 group-hover:bg-surface-container-low transition-colors">
          <Car className="w-5 h-5 text-primary" />
        </div>
        <div className="relative z-10 flex flex-col items-end bg-surface pl-4 group-hover:bg-surface-container-low transition-colors">
          <span className="text-[11px] font-bold uppercase text-on-surface mb-1 opacity-50">{to}</span>
          <div className="w-3 h-3 rounded-full bg-surface-container-highest ring-4 ring-background" />
        </div>
      </div>
      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full border-2 border-primary overflow-hidden grayscale group-hover:grayscale-0 transition-all">
            {driverAvatar ? <Image src={driverAvatar} alt={driverName} fill className="object-cover" /> : <div className="w-full h-full bg-surface-container-high flex items-center justify-center"><User className="w-5 h-5 text-on-surface-variant" /></div>}
          </div>
          <div>
            <p className="font-bold text-on-surface">{driverName}</p>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-primary fill-current" />
              <span className="text-[11px] font-bold text-on-surface-variant">{driverRating} {carModel ? `• ${carModel}` : ""}</span>
            </div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:translate-x-2 transition-transform" />
      </div>
    </Link>
  );
}

function RideListItemDesktop({
  id, time, from, to, price, driverName, driverAvatar, driverRating, date,
}: RideListItemProps) {
  return (
    <Link href={`/corsa/${id}`} className="group flex items-center gap-6 bg-[#1c1b1b] hover:bg-[#201f1f] transition-colors rounded-2xl p-6 border border-white/5">
      <div className="flex flex-col items-center justify-center w-20 shrink-0">
        <span className="text-3xl font-extrabold tracking-tighter text-white">{time}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#ffb3b1]">{date || "Oggi"}</span>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-4 mb-2">
          <span className="text-lg font-bold text-white">{from}</span>
          <div className="flex-1 h-[2px] bg-[#2a2a2a] relative">
            <div className="absolute inset-0 bg-[#ffb3b1] scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500" />
          </div>
          <span className="text-lg font-bold text-white">{to}</span>
        </div>
        <div className="flex items-center gap-3">
          {driverAvatar ? <Image src={driverAvatar} alt={driverName} width={28} height={28} className="rounded-full object-cover" /> : <div className="w-7 h-7 rounded-full bg-[#2a2a2a] flex items-center justify-center"><User className="w-3.5 h-3.5 text-white/50" /></div>}
          <span className="text-sm font-semibold text-white/70">{driverName}</span>
          <span className="text-sm text-[#ffb3b1]">★ {driverRating}</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-2xl font-extrabold tracking-tight text-white">{price === 0 ? "Gratis" : `€${price}`}</div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">a persona</span>
      </div>
    </Link>
  );
}
