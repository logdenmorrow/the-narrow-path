export function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    output[index] = rawData.charCodeAt(index);
  }

  return output;
}

export function isIosBrowser() {
  const platform = navigator.platform || "";
  const userAgent = navigator.userAgent || "";
  const isTouchMac = platform === "MacIntel" && navigator.maxTouchPoints > 1;

  return /iPad|iPhone|iPod/.test(userAgent) || isTouchMac;
}

export function isStandaloneDisplay() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && Boolean(navigator.standalone))
  );
}

export function getPushSupportStatus() {
  const hasWindowSupport =
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  if (!hasWindowSupport) {
    return {
      supported: false,
      reason: "This browser does not support web push notifications.",
    } as const;
  }

  if (isIosBrowser() && !isStandaloneDisplay()) {
    return {
      supported: false,
      reason:
        "On iPhone and iPad, notifications require opening The Narrow Path from the Home Screen app.",
    } as const;
  }

  return {
    supported: true,
    reason: null,
  } as const;
}
