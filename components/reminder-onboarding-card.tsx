"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPushSupportStatus } from "@/lib/push/client";

type ReminderOnboardingCardProps = {
  hasEnabledReminder: boolean;
};

type CardState = "checking" | "hidden" | "push-off" | "reminders-off";

function getPermissionState() {
  return "Notification" in window ? Notification.permission : "default";
}

export function ReminderOnboardingCard({
  hasEnabledReminder,
}: ReminderOnboardingCardProps) {
  const [state, setState] = useState<CardState>("checking");

  const refreshState = useCallback(async () => {
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

      setState(hasEnabledReminder ? "hidden" : "reminders-off");
    } catch {
      setState("hidden");
    }
  }, [hasEnabledReminder]);

  useEffect(() => {
    void refreshState();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshState();
      }
    };

    window.addEventListener("focus", refreshState);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", refreshState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
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

  return (
    <div className="monastic-subcard flex min-w-0 max-w-full flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-monastic-0">{copy.title}</h2>
        <p className="mt-1 text-sm leading-6 text-monastic-1">{copy.body}</p>
      </div>
      <Button asChild size="sm" variant="outline" className="w-full shrink-0 sm:w-auto">
        <Link href="/settings">
          <Settings aria-hidden="true" />
          Open Settings
        </Link>
      </Button>
    </div>
  );
}
