"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPushSupportStatus } from "@/lib/push/client";

type ReminderOnboardingCardProps = {
  hasEnabledReminder: boolean;
};

type CardState = "checking" | "hidden" | "push-off" | "reminders-off";

const DISMISSAL_STORAGE_KEY = "tnp-reminder-onboarding-dismissed-until";
const DISMISSAL_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const MOBILE_MEDIA_QUERY = "(max-width: 639px)";

function getPermissionState() {
  return "Notification" in window ? Notification.permission : "default";
}

function isDismissed() {
  try {
    const dismissedUntil = Number(
      window.localStorage.getItem(DISMISSAL_STORAGE_KEY)
    );

    return Number.isFinite(dismissedUntil) && dismissedUntil > Date.now();
  } catch {
    return false;
  }
}

function dismissForCooldown() {
  try {
    window.localStorage.setItem(
      DISMISSAL_STORAGE_KEY,
      String(Date.now() + DISMISSAL_COOLDOWN_MS)
    );
  } catch {
    // Local storage can be unavailable in private or restricted contexts.
  }
}

async function getCurrentReminderState(fallback: boolean) {
  try {
    const response = await fetch("/api/settings/reminder-onboarding", {
      credentials: "same-origin",
      cache: "no-store",
    });

    if (!response.ok) {
      return fallback;
    }

    const result = (await response.json().catch(() => null)) as {
      hasEnabledReminder?: unknown;
    } | null;

    return typeof result?.hasEnabledReminder === "boolean"
      ? result.hasEnabledReminder
      : fallback;
  } catch {
    return fallback;
  }
}

export function ReminderOnboardingCard({
  hasEnabledReminder,
}: ReminderOnboardingCardProps) {
  const [state, setState] = useState<CardState>("checking");
  const pathname = usePathname();

  const refreshState = useCallback(async () => {
    if (pathname === "/settings") {
      setState("hidden");
      return;
    }

    if (!window.matchMedia(MOBILE_MEDIA_QUERY).matches) {
      setState("hidden");
      return;
    }

    if (isDismissed()) {
      setState("hidden");
      return;
    }

    const support = getPushSupportStatus();

    if (!support.supported) {
      setState("hidden");
      return;
    }

    const permission = getPermissionState();

    if (permission !== "granted") {
      setState("push-off");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();

      if (!subscription) {
        setState("push-off");
        return;
      }

      const currentHasEnabledReminder =
        await getCurrentReminderState(hasEnabledReminder);

      setState(currentHasEnabledReminder ? "hidden" : "reminders-off");
    } catch {
      setState("hidden");
    }
  }, [hasEnabledReminder, pathname]);

  useEffect(() => {
    void refreshState();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshState();
      }
    };

    const mobileMedia = window.matchMedia(MOBILE_MEDIA_QUERY);

    window.addEventListener("focus", refreshState);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    mobileMedia.addEventListener("change", refreshState);

    return () => {
      window.removeEventListener("focus", refreshState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      mobileMedia.removeEventListener("change", refreshState);
    };
  }, [refreshState]);

  if (state === "checking" || state === "hidden") {
    return null;
  }

  const copy =
    state === "push-off"
      ? {
          title: "Enable reminders",
          body: "Turn on notifications for Morning Scripture and Night Prayer.",
        }
      : {
          title: "Set reminder times",
          body: "Choose times for Morning Scripture and Night Prayer.",
        };
  const settingsHref =
    state === "push-off" ? "/settings#notifications" : "/settings#reminders";

  const handleDismiss = () => {
    dismissForCooldown();
    setState("hidden");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-8 backdrop-blur-[2px] sm:hidden">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reminder-onboarding-title"
        className="monastic-card w-full max-w-sm p-5 shadow-2xl"
      >
        <h2
          id="reminder-onboarding-title"
          className="text-xl font-semibold text-monastic-0"
        >
          {copy.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-monastic-1">{copy.body}</p>

        <div className="mt-5 grid gap-2">
          <Button asChild size="sm" className="w-full">
            <Link href={settingsHref}>
              <Settings aria-hidden="true" />
              Open Settings
            </Link>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="w-full"
            onClick={handleDismiss}
          >
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
}
