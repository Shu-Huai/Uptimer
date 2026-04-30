import type { Metadata } from "next";

import { AppShell } from "@/components/ui/app-shell";
import { APP_NAME } from "@/lib/constants";

import "./globals.css";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "个人成长时间记录与积分激励系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="uptimer-body">
        <div className="uptimer-shell">
          <AppShell>{children}</AppShell>
          <div id="uptimer-overlay-root" className="uptimer-overlay-root" />
        </div>
      </body>
    </html>
  );
}
