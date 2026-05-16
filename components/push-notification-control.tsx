"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getPushSupportStatus,
  urlBase64ToUint8Array,
} from "@/lib/push/client";

type ControlState =
  | "checking"
  | "unsupported"
  | "permission-default"
  | "permission-denied"
  | "enabled"
  | "disabled"
  | "saving"
  | "error";

type PreviousState = Exclude<ControlState, "saving">;

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

async function getServiceWorkerRegistration() {
  const existingRegistration = await navigator.serviceWorker.getRegistration("/");

  if (existingRegistration) {
    return existingRegistration;
  }

  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

async function postJson(path: string, body: unknown) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => null);
    const message =
      result && typeof result.error === "string"
        ? result.error
        : "Notification settings could not be saved.";
    throw new Error(message);
  }
}

function getPermissionState() {
  return "Notification" in window ? Notification.permission : "default";
}

export function PushNotificationControl() {
  const [state, setState] = useState<ControlState>("checking");
  const [previousState, setPreviousState] = useState<PreviousState>("checking");
  const [message, setMessage] = useState<string>("Checking this browser...");

  const setSavingState = useCallback((nextPreviousState: PreviousState) => {
    setPreviousState(nextPreviousState);
    setState("saving");
    setMessage("Saving notification setting...");
  }, []);

  const refreshState = useCallback(async () => {
    const support = getPushSupportStatus();

    if (!support.supported) {
      setState("unsupported");
      setPreviousState("unsupported");
      setMessage(support.reason);
      return;
    }

    const permission = getPermissionState();

    if (permission === "denied") {
      setState("permission-denied");
      setPreviousState("permission-denied");
      setMessage(
        "Notifications are blocked for this browser. Change the browser or system permission to enable them."
      );
      return;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();

      if (permission === "granted" && subscription) {
        setState("enabled");
        setPreviousState("enabled");
        setMessage("Notifications are enabled on this device.");
        return;
      }

      if (permission === "granted") {
        setState("disabled");
        setPreviousState("disabled");
        setMessage("Permission is granted, but this device is not subscribed.");
        return;
      }

      setState("permission-default");
      setPreviousState("permission-default");
      setMessage("Enable notifications when you want app reminders on this device.");
    } catch {
      setState("error");
      setPreviousState("error");
      setMessage("Unable to read notification status in this browser.");
    }
  }, []);

  useEffect(() => {
    void refreshState();
  }, [refreshState]);

  const enableNotifications = async () => {
    const support = getPushSupportStatus();

    if (!support.supported) {
      setState("unsupported");
      setPreviousState("unsupported");
      setMessage(support.reason);
      return;
    }

    if (!VAPID_PUBLIC_KEY) {
      setState("error");
      setPreviousState("error");
      setMessage("Push notifications are not configured on this server yet.");
      return;
    }

    const stablePreviousState = state === "saving" ? previousState : state;
    setSavingState(
      stablePreviousState === "checking" ? "permission-default" : stablePreviousState
    );

    try {
      const permission =
        Notification.permission === "granted"
          ? "granted"
          : await Notification.requestPermission();

      if (permission === "denied") {
        setState("permission-denied");
        setPreviousState("permission-denied");
        setMessage(
          "Notifications are blocked for this browser. Change the browser or system permission to enable them."
        );
        return;
      }

      if (permission !== "granted") {
        setState("permission-default");
        setPreviousState("permission-default");
        setMessage("Notifications were not enabled.");
        return;
      }

      const registration = await getServiceWorkerRegistration();
      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription =
        existingSubscription ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }));

      await postJson("/api/push/subscribe", {
        subscription: subscription.toJSON(),
        metadata: {
          appDisplayMode: window.matchMedia("(display-mode: standalone)").matches
            ? "standalone"
            : "browser",
          permissionState: Notification.permission,
          platform: navigator.platform,
          userAgent: navigator.userAgent,
        },
      });

      setState("enabled");
      setPreviousState("enabled");
      setMessage("Notifications are enabled on this device.");
    } catch (error) {
      console.error("Unable to enable push notifications.", error);
      setState("error");
      setPreviousState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to enable notifications on this device."
      );
    }
  };

  const disableNotifications = async () => {
    const stablePreviousState = state === "saving" ? previousState : state;
    setSavingState(stablePreviousState === "checking" ? "disabled" : stablePreviousState);

    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      const subscriptionJson = subscription?.toJSON();

      if (subscription) {
        await subscription.unsubscribe();
      }

      await postJson("/api/push/unsubscribe", {
        endpoint: subscription?.endpoint,
        subscription: subscriptionJson,
      });

      setState("disabled");
      setPreviousState("disabled");
      setMessage("Notifications are disabled on this device.");
    } catch (error) {
      console.error("Unable to disable push notifications.", error);
      setState("error");
      setPreviousState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to disable notifications on this device."
      );
    }
  };

  const statusLabel = useMemo(() => {
    switch (state) {
      case "unsupported":
        return "Unsupported";
      case "permission-denied":
        return "Blocked";
      case "enabled":
        return "Enabled";
      case "disabled":
        return "Disabled";
      case "saving":
        return "Saving";
      case "error":
        return "Needs Attention";
      case "checking":
        return "Checking";
      case "permission-default":
      default:
        return "Off";
    }
  }, [state]);

  const canEnable =
    state === "permission-default" || state === "disabled" || state === "error";
  const canDisable = state === "enabled";
  const isBusy = state === "checking" || state === "saving";

  return (
    <div className="monastic-subcard p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="section-kicker">Device Notifications</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="text-lg font-semibold text-monastic-0">Push Notifications</p>
            <span className="rounded-full border border-monastic px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-monastic-1">
              {statusLabel}
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-monastic-1">
            {message}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {canEnable ? (
            <Button
              type="button"
              size="sm"
              onClick={enableNotifications}
              disabled={isBusy}
            >
              <Bell aria-hidden="true" />
              Enable
            </Button>
          ) : null}
          {canDisable ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={disableNotifications}
              disabled={isBusy}
            >
              <BellOff aria-hidden="true" />
              Disable
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
