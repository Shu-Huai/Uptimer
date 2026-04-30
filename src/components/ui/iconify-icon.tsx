"use client";

import { Icon } from "@iconify/react";

type IconifyIconProps = {
  icon?: string | null;
  className?: string;
  fallback?: string;
};

export function IconifyIcon({ icon, className = "size-4", fallback = "•" }: IconifyIconProps) {

  if (!icon) {
    return <span className={className}>{fallback}</span>;
  }

  if (icon.includes(":")) {
    return <Icon icon={icon} className={className} aria-hidden />;
  }

  return <span className={className}>{icon}</span>;
}
