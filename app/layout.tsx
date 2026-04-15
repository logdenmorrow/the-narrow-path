import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import AuthNav from "@/components/auth-nav";
import AuthStateListener from "@/components/auth-state-listener";
import MainNav from "@/components/main-nav";
import MobileTabBar from "@/components/mobile-tab-bar";
import ProgressStrip from "@/components/progress-strip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeSwitcher } from "@/components/theme-switcher";
import "./globals.css";


export const metadata: Metadata = {
  title: "The Narrow Path",
  description:
    "A private brotherhood app for discipline, prayer, and perseverance.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000")
  ),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="monastic-shell">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthStateListener />

          <header className="monastic-header">
            <div className="monastic-frame">
              <div className="monastic-topbar">
                <div className="flex items-start justify-between gap-4 lg:items-center">
                  <div className="space-y-2">
                    <Link href="/" className="monastic-wordmark monastic-heading text-2xl font-semibold sm:text-[2rem]">
                      <span className="monastic-wordmark-mark">+</span>
                      <span>The Narrow Path</span>
                    </Link>
                    <p className="hidden text-sm tracking-[0.18em] text-monastic-2 sm:block">
                      Prayer • Discipline • Brotherhood
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <ThemeSwitcher />
                    <div className="hidden sm:block">
                      <Suspense fallback={<div className="text-sm text-monastic-2">...</div>}>
                        <AuthNav />
                      </Suspense>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="hidden sm:block">
                    <MainNav />
                  </div>

                  <div className="sm:hidden">
                    <Suspense fallback={<div className="text-sm text-monastic-2">...</div>}>
                      <AuthNav mobile />
                    </Suspense>
                  </div>

                  <Suspense fallback={null}>
                    <ProgressStrip />
                  </Suspense>
                </div>
              </div>
            </div>
          </header>

          <div className="mobile-page-shell">{children}</div>
          <MobileTabBar />
        </ThemeProvider>
      </body>
    </html>
  );
}
