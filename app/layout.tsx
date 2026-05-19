import type { Metadata, Viewport } from "next";
import Link from "next/link";
import Script from "next/script";
import { Suspense } from "react";
import { AuthDebugPanel } from "@/components/auth-debug-panel";
import AuthNav from "@/components/auth-nav";
import AuthStateListener from "@/components/auth-state-listener";
import MainNav from "@/components/main-nav";
import MobileAccountMenu from "@/components/mobile-account-menu";
import MobileTabBar from "@/components/mobile-tab-bar";
import ProgressStrip from "@/components/progress-strip";
import { ReminderOnboardingCard } from "@/components/reminder-onboarding-card";
import ServiceWorkerRegister from "@/components/service-worker-register";
import SignOutButton from "@/components/sign-out-button";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { syncAdminProfileVisibility } from "@/lib/admin";
import { isServerAuthDebugEnabled } from "@/lib/auth-debug";
import { createClient } from "@/lib/supabase/server";
import { getCommunityName, normalizeTrack } from "@/lib/track";
import "./globals.css";

const pwaInstallListenerScript = `
(function () {
  if (typeof window === "undefined") return;
  var state = window.__TNP_PWA_INSTALL || {};
  window.__TNP_PWA_INSTALL = state;
  if (state.earlyListenerInstalled) return;

  state.earlyListenerInstalled = true;
  state.beforeInstallPromptFired = Boolean(state.beforeInstallPromptFired);
  state.appInstalledFired = Boolean(state.appInstalledFired);
  state.deferredPromptAvailable = Boolean(window.__TNP_DEFERRED_INSTALL_PROMPT);

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    window.__TNP_DEFERRED_INSTALL_PROMPT = event;
    state.beforeInstallPromptFired = true;
    state.deferredPromptAvailable = true;
    window.dispatchEvent(new CustomEvent("tnp-beforeinstallprompt"));
  });

  window.addEventListener("appinstalled", function () {
    window.__TNP_DEFERRED_INSTALL_PROMPT = undefined;
    state.appInstalledFired = true;
    state.deferredPromptAvailable = false;
    window.dispatchEvent(new CustomEvent("tnp-appinstalled"));
  });
})();
`;

type ReminderSlotSummaryRow = {
  reminder_type: "morning_scripture" | "night_prayer";
  enabled: boolean;
};

export const metadata: Metadata = {
  title: "The Narrow Path",
  applicationName: "The Narrow Path",
  description:
    "A Catholic app for daily readings, tasks, reminders, and accountability.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000")
  ),
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Narrow Path",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      {
        url: "/favicon-v2-light.svg",
        media: "(prefers-color-scheme: light)",
        type: "image/svg+xml",
      },
      {
        url: "/favicon-v2-dark.svg",
        media: "(prefers-color-scheme: dark)",
        type: "image/svg+xml",
      },
      { url: "/favicon-v2.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-touch-icon-v2.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f1e6" },
    { media: "(prefers-color-scheme: dark)", color: "#14100f" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authDebugEnabled = isServerAuthDebugEnabled();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isSignedIn = Boolean(user);
  if (user) {
    await syncAdminProfileVisibility(user);
  }
  const { data: profileData } = user
    ? await supabase
        .from("profiles")
        .select("track")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };
  const { data: reminderSlots } = user
    ? await supabase
        .from("notification_reminder_slots")
        .select("reminder_type, enabled")
        .eq("user_id", user.id)
        .in("reminder_type", ["morning_scripture", "night_prayer"])
        .returns<ReminderSlotSummaryRow[]>()
    : { data: null };
  const hasEnabledReminder = Boolean(
    reminderSlots?.some((slot) => slot.enabled)
  );
  const communityName = getCommunityName(normalizeTrack(profileData?.track));

  return (
    <html lang="en" suppressHydrationWarning>
      <Script
        id="tnp-pwa-install-listener"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: pwaInstallListenerScript }}
      />
      <body className="monastic-shell" data-auth-debug-default={authDebugEnabled ? "true" : "false"}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ServiceWorkerRegister />
          <AuthStateListener />
          <Suspense fallback={null}>
            <AuthDebugPanel />
          </Suspense>

          <header className="monastic-header">
            <div className="monastic-frame">
              <div className="monastic-topbar">
                <div className="monastic-topbar-row flex items-center justify-between gap-2 sm:items-start lg:items-center">
                  <div className="min-w-0 space-y-1 sm:space-y-2">
                    <Link
                      href="/"
                      className="monastic-wordmark monastic-heading text-[1.05rem] font-semibold sm:text-[2rem]"
                    >
                      <span className="monastic-wordmark-mark">+</span>
                      <span className="whitespace-nowrap">The Narrow Path</span>
                    </Link>
                    {isSignedIn ? (
                      <p className="hidden text-sm tracking-[0.18em] text-monastic-2 sm:block">
                        Prayer • Discipline • {communityName}
                      </p>
                    ) : null}
                  </div>

                  <div className="monastic-header-actions flex shrink-0 items-center justify-end gap-1.5 sm:w-auto sm:gap-3">
                    {isSignedIn ? (
                      <div className="hidden sm:block">
                        <ThemeSwitcher />
                      </div>
                    ) : (
                      <ThemeSwitcher />
                    )}
                    {isSignedIn ? (
                      <div className="sm:hidden">
                        <MobileAccountMenu
                          signOutAction={
                            <SignOutButton
                              mobile
                              className="h-10 w-full justify-start rounded-[0.85rem] px-3 text-[11px] tracking-[0.12em]"
                              label="Logout"
                              size="sm"
                              variant="outline"
                            />
                          }
                        />
                      </div>
                    ) : (
                      <div className="min-w-0 sm:hidden">
                        <Suspense fallback={<div className="text-sm text-monastic-2">...</div>}>
                          <AuthNav mobile />
                        </Suspense>
                      </div>
                    )}
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
                      <MainNav communityName={communityName} />
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
          {isSignedIn ? (
            <ReminderOnboardingCard hasEnabledReminder={hasEnabledReminder} />
          ) : null}
          {isSignedIn ? <MobileTabBar communityName={communityName} /> : null}
        </ThemeProvider>
      </body>
    </html>
  );
}
