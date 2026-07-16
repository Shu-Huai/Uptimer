"use client";

import { Icon } from "@iconify/react";

type IconifyIconProps = {
  icon?: string | null;
  className?: string;
  fallback?: string;
};

const legacyIconMap: Record<number, string> = {
  0x1f4d8: "material-symbols:menu-book",
  0x1f4d6: "material-symbols:menu-book",
  0x1f3c3: "material-symbols:directions-run",
  0x1f634: "material-symbols:bedtime",
  0x1f35a: "material-symbols:restaurant",
  0x1f4f1: "material-symbols:smartphone",
  0x1f3ae: "material-symbols:sports-esports",
  0x1f381: "material-symbols:redeem",
};

export function IconifyIcon({ icon, className = "size-4", fallback = "•" }: IconifyIconProps) {

  if (!icon) {
    return fallback.includes(":") ? <Icon icon={fallback} className={className} aria-hidden /> : <span className={className}>{fallback}</span>;
  }

  const legacyIcon = legacyIconMap[icon.codePointAt(0) ?? -1];
  const resolvedIcon = icon.includes(":") ? icon : legacyIcon;

  if (resolvedIcon) {
    return <Icon icon={resolvedIcon} className={className} aria-hidden />;
  }

  return <span className={className}>{icon}</span>;
}
