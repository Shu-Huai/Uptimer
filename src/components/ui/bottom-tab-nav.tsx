"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconifyIcon } from "@/components/ui/iconify-icon";

const tabs = [
  { href: "/records", label: "记录", icon: "solar:notebook-minimalistic-outline" },
  { href: "/timer", label: "计时", icon: "solar:clock-circle-outline" },
  { href: "/analysis", label: "分析", icon: "solar:pie-chart-2-outline" },
  { href: "/goals", label: "目标", icon: "solar:target-outline" },
  { href: "/rewards", label: "动力", icon: "solar:medal-ribbons-star-outline" },
];

export function BottomTabNav() {
  const pathname = usePathname();

  return (
    <nav className="uptimer-tabbar" aria-label="主导航">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link key={tab.href} href={tab.href} className={`uptimer-tab ${active ? "is-active" : ""}`}>
            <span className="uptimer-tab-icon" aria-hidden>
              <IconifyIcon icon={tab.icon} className="up-icon up-icon-md" />
            </span>
            <span className="uptimer-tab-label">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
