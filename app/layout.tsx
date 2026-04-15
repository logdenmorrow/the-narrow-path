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
import { createClient } from "@/lib/supabase/server";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isSignedIn = Boolean(user);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="monastic-shell">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthStateListener />

          <header className="monastic-header">
            <div className="monastic-frame">
              <div className="monastic-topbar">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between lg:items-center">
                  <div className="space-y-1 sm:space-y-2">
                    <Link
                      href="/"
                      className="monastic-wordmark monastic-heading text-[1.15rem] font-semibold sm:text-[2rem]"
                    >
                      <span className="monastic-wordmark-mark">+</span>
                      <span className="whitespace-nowrap">The Narrow Path</span>
                    </Link>
                    <p className="hidden text-sm tracking-[0.18em] text-monastic-2 sm:block">
                      Prayer • Discipline • Brotherhood
                    </p>
                  </div>

                  <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-3">
                    <ThemeSwitcher />
                    <div className="min-w-0 flex-1 sm:hidden">
                      <Suspense fallback={<div className="text-sm text-monastic-2">...</div>}>
                        <AuthNav mobile />
                      </Suspense>
                    </div>
                    <div className="hidden sm:block">
                      <Suspense fallback={<div className="text-sm text-monastic-2">...</div>}>
                        <AuthNav />
                      </Suspense>
                    </div>
                  </div>
                </div>

                {isSignedIn ? (
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div className="hidden sm:block">
                      <MainNav />
                    </div>

                    <Suspense fallback={null}>
                      <ProgressStrip />
                    </Suspense>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <div className={isSignedIn ? "mobile-page-shell" : undefined}>{children}</div>
          {isSignedIn ? <MobileTabBar /> : null}
        </ThemeProvider>
      </body>
    </html>
  );
}
