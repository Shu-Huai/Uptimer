import type { Metadata, Viewport } from "next";

import { AppShell } from "@/components/ui/app-shell";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { APP_NAME } from "@/lib/constants";

import "./globals.css";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "个人成长时间记录与积分激励系统",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
          <ThemeProvider>
            <AppShell>{children}</AppShell>
          </ThemeProvider>
          <div id="uptimer-overlay-root" className="uptimer-overlay-root" />
        </div>
      </body>
    </html>
  );
}
