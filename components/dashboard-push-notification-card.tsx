"use client";

import { useEffect, useState } from "react";
import { SectionHeader } from "@/components/monastic-ui";
import { PushNotificationControl } from "@/components/push-notification-control";
import { getPushSupportStatus } from "@/lib/push/client";

type CardState = "checking" | "hidden" | "visible";

async function hasActivePushSubscription() {
  const support = getPushSupportStatus();

  if (!support.supported || Notification.permission !== "granted") {
    return false;
  }

  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();

  return Boolean(subscription);
}

export function DashboardPushNotificationCard() {
  const [state, setState] = useState<CardState>("checking");

  useEffect(() => {
    let active = true;

    const refreshState = async () => {
      try {
        const isEnabled = await hasActivePushSubscription();

        if (active) {
          setState(isEnabled ? "hidden" : "visible");
        }
      } catch {
        if (active) {
          setState("visible");
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshState();
      }
    };

    void refreshState();
    window.addEventListener("focus", refreshState);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      window.removeEventListener("focus", refreshState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  if (state !== "visible") {
    return null;
  }

  return (
    <section className="border-y border-monastic py-5">
      <SectionHeader
        kicker="Notifications"
        title="Device Notifications"
        description="Enable push notifications for the browser or Home Screen app you are using now."
      />
      <div className="mt-4">
        <PushNotificationControl onEnabled={() => setState("hidden")} />
      </div>
    </section>
  );
}
