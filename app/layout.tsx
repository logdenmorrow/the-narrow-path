import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import AuthNav from "@/components/auth-nav";
import AuthStateListener from "@/components/auth-state-listener";
import MainNav from "@/components/main-nav";
import MobileTabBar from "@/components/mobile-tab-bar";
import ProgressStrip from "@/components/progress-strip";
import { ThemeProvider } from "@/components/theme-provider";
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
      <body className="bg-app text-fg">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthStateListener />

          <header className="border-b border-border bg-surface/95 backdrop-blur">
            <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center justify-between gap-4">
                  <Link
                    href="/"
                    className="font-serif text-xl font-semibold tracking-tight sm:text-2xl"
                  >
                    The Narrow Path
                  </Link>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:flex-1 lg:justify-end">
                  <div className="hidden sm:block">
                    <MainNav />
                  </div>

                  <div className="sm:shrink-0">
                    <Suspense
                      fallback={<div className="text-sm text-muted">...</div>}
                    >
                      <AuthNav />
                    </Suspense>
                  </div>
                </div>
              </div>
              <Suspense fallback={null}>
                <ProgressStrip />
              </Suspense>
            </div>
          </header>

          <div className="mobile-page-shell">{children}</div>
          <MobileTabBar />
        </ThemeProvider>
      </body>
    </html>
  );
}
