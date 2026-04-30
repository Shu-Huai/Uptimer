"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { logoutAction } from "@/actions/auth.actions";
import { APP_NAME } from "@/lib/constants";
import { IconifyIcon } from "@/components/ui/iconify-icon";

import { BottomTabNav } from "./bottom-tab-nav";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isAuthRoute = pathname.startsWith("/auth");

  if (isAuthRoute) {
    return (
      <main className="uptimer-content uptimer-auth-content">
        <div className="uptimer-page">{children}</div>
      </main>
    );
  }

  return (
    <>
      <header className="uptimer-brand">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-8 items-center justify-center up-text-weak">
            <IconifyIcon icon="solar:hamburger-menu-outline" className="up-icon up-icon-lg" />
          </span>
          <Link href="/records" className="uptimer-brand-link">
            <span className="uptimer-logo" aria-hidden>
              <IconifyIcon icon="ph:timer" className="up-icon up-icon-md text-[#2d3543]" />
            </span>
            <span>{APP_NAME}</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/activities" className="uptimer-entry-link">
            活动管理
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="uptimer-entry-link border-0 bg-transparent p-0">
              退出
            </button>
          </form>
        </div>
      </header>
      <main className="uptimer-content">
        <div className="uptimer-page">{children}</div>
      </main>
      <BottomTabNav />
    </>
  );
}
