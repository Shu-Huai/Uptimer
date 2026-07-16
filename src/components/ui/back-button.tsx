"use client";

import { useRouter } from "next/navigation";

import { IconifyIcon } from "@/components/ui/iconify-icon";

type BackButtonProps = {
  fallbackHref: string;
  className?: string;
  label?: string;
};

export function BackButton({
  fallbackHref,
  className = "up-ghost-icon-btn text-base",
  label = "返回",
}: BackButtonProps) {
  const router = useRouter();

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  }

  return (
    <button type="button" onClick={handleBack} className={className} aria-label={label}>
      <IconifyIcon icon="solar:alt-arrow-left-outline" className="up-icon up-icon-md" />
    </button>
  );
}
