import {
  Snowflake, Usb, Smartphone, Bluetooth, Luggage, PawPrint, CigaretteOff,
  Music, VolumeOff, Accessibility, Baby, Zap, Gem, GraduationCap, UserRound,
  Check, type LucideIcon,
} from "lucide-react";

/** Maps the `icon` name on VEHICLE_FEATURES onto a real icon component. */
const ICONS: Record<string, LucideIcon> = {
  Snowflake, Usb, Smartphone, Bluetooth, Luggage, PawPrint, CigaretteOff,
  Music, VolumeOff, Accessibility, Baby, Zap, Gem, GraduationCap, UserRound,
};

export function FeatureIcon({
  name,
  className = "h-4 w-4",
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Check;
  return <Icon className={className} strokeWidth={1.5} aria-hidden />;
}
