"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { logoutAction } from "@/actions/auth.actions";
import { APP_NAME } from "@/lib/constants";
import { IconifyIcon } from "@/components/ui/iconify-icon";
import { useTheme } from "./theme-provider";

import { BottomTabNav } from "./bottom-tab-nav";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isAuthRoute = pathname.startsWith("/auth");
  const { theme, cycleTheme } = useTheme();

  const themeIcon = {
    light: "solar:sun-2-outline",
    dark: "solar:moon-outline",
    system: "solar:monitor-outline",
  }[theme];
  const themeLabel = {
    light: "浅色模式",
    dark: "深色模式",
    system: "跟随系统",
  }[theme];

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
        <div className="flex items-center">
          <Link href="/records" className="uptimer-brand-link">
            <span className="uptimer-logo" aria-hidden>
              <IconifyIcon icon="ph:timer" className="up-icon up-icon-md text-[#2d3543]" />
            </span>
            <span>{APP_NAME}</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/activities" className="uptimer-icon-button" aria-label="活动管理" title="活动管理">
            <IconifyIcon icon="solar:widget-4-outline" className="up-icon up-icon-md" />
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="uptimer-icon-button" aria-label="退出" title="退出">
              <IconifyIcon icon="solar:logout-2-outline" className="up-icon up-icon-md" />
            </button>
          </form>
          <button
            type="button"
            className="uptimer-icon-button"
            aria-label={`切换主题，当前为${themeLabel}`}
            title={`切换主题（当前：${themeLabel}）`}
            onClick={cycleTheme}
          >
            <IconifyIcon icon={themeIcon} className="up-icon up-icon-md" />
          </button>
        </div>
      </header>
      <main className="uptimer-content">
        <div className="uptimer-page">{children}</div>
      </main>
      <BottomTabNav />
    </>
  );
}
