import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import AuthNav from "@/components/auth-nav";
import AuthStateListener from "@/components/auth-state-listener";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Narrow Path",
  description:
    "A private brotherhood app for discipline, prayer, and perseverance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        <AuthStateListener />

        <header className="border-b border-zinc-800 bg-black">
          <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center justify-between gap-4">
                <Link
                  href="/"
                  className="text-lg font-semibold tracking-tight sm:text-xl"
                >
                  The Narrow Path
                </Link>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:flex-1 lg:justify-end">
                <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-300 sm:gap-x-6">
                  <Link href="/" className="transition hover:text-white">
                    Home
                  </Link>

                  <Link
                    href="/dashboard"
                    className="transition hover:text-white"
                  >
                    Dashboard
                  </Link>

                  <Link href="/today" className="transition hover:text-white">
                    Today
                  </Link>

                  <Link
                    href="/this-week"
                    className="transition hover:text-white"
                  >
                    This Week
                  </Link>

                  <Link
                    href="/daily-reading"
                    className="transition hover:text-white"
                  >
                    Daily Reading
                  </Link>

                  <Link
                    href="/brotherhood"
                    className="transition hover:text-white"
                  >
                    Brotherhood
                  </Link>
                </nav>

                <div className="sm:shrink-0">
                  <Suspense
                    fallback={<div className="text-sm text-zinc-500">...</div>}
                  >
                    <AuthNav />
                  </Suspense>
                </div>
              </div>
            </div>
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}