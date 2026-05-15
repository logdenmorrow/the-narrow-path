"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Info, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type DeviceInfo = {
  isMobile: boolean;
  isAndroid: boolean;
  isIos: boolean;
  isChromium: boolean;
  browserFamily: string;
};

type Diagnostics = {
  isSecureContext: boolean;
  serviceWorkerSupported: boolean;
  serviceWorkerRegistered: boolean;
  serviceWorkerController: boolean;
  manifestUrl: string;
  manifestFetchOk: boolean | null;
  serviceWorkerFetchOk: boolean | null;
  displayMode: string;
};

type PwaInstallPromptProps = {
  className?: string;
  mobileOnly?: boolean;
  showDiagnostics?: boolean;
  title?: string;
};

const INSTALL_DISMISSED_KEY = "narrow-path-install-dismissed-session";

function getStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }

  const navigatorStandalone =
    "standalone" in window.navigator &&
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

  return window.matchMedia("(display-mode: standalone)").matches || navigatorStandalone;
}

function getDisplayMode() {
  if (typeof window === "undefined") {
    return "unknown";
  }

  const modes = ["fullscreen", "standalone", "minimal-ui", "browser"];
  return modes.find((mode) => window.matchMedia(`(display-mode: ${mode})`).matches) ?? "unknown";
}

function getDeviceInfo(): DeviceInfo {
  if (typeof window === "undefined") {
    return {
      isMobile: false,
      isAndroid: false,
      isIos: false,
      isChromium: false,
      browserFamily: "Unknown",
    };
  }

  const ua = window.navigator.userAgent;
  const platform = window.navigator.platform;
  const maxTouchPoints = window.navigator.maxTouchPoints ?? 0;
  const isAndroid = /Android/i.test(ua);
  const isIos =
    /iPhone|iPad|iPod/i.test(ua) ||
    (platform === "MacIntel" && maxTouchPoints > 1);
  const isMobile = isAndroid || isIos || window.matchMedia("(max-width: 767px)").matches;
  const isEdge = /Edg\//i.test(ua);
  const isChrome = /Chrome|CriOS/i.test(ua) && !/Firefox|FxiOS|OPR|Edg\//i.test(ua);
  const isChromium = isChrome || isEdge;
  const browserFamily = isEdge
    ? "Edge"
    : isChrome
      ? "Chrome"
      : /Safari/i.test(ua) && !/Chrome|CriOS|Android/i.test(ua)
        ? "Safari"
        : /Firefox|FxiOS/i.test(ua)
          ? "Firefox"
          : "Other";

  return { isMobile, isAndroid, isIos, isChromium, browserFamily };
}

function StatusBadge({
  label,
  value,
}: {
  label: string;
  value: boolean | string | null;
}) {
  const isBoolean = typeof value === "boolean";
  const tone = value === true ? "good" : value === false ? "muted" : "neutral";

  return (
    <div className="flex items-center justify-between gap-3 rounded-[0.85rem] border border-[color:var(--line-soft)] bg-[color:var(--surface-2)] px-3 py-2 text-sm">
      <span className="text-monastic-1">{label}</span>
      <span
        className={cn(
          "shrink-0 font-semibold text-monastic-0",
          tone === "good" && "text-[#4f7357] dark:text-[#a7ccb9]",
          tone === "muted" && "text-monastic-2"
        )}
      >
        {isBoolean ? (value ? "Yes" : "No") : value ?? "Checking"}
      </span>
    </div>
  );
}

export function PwaInstallPrompt({
  className,
  mobileOnly = false,
  showDiagnostics = false,
  title = "Install The Narrow Path",
}: PwaInstallPromptProps) {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [debugFromQuery, setDebugFromQuery] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);
  const [installOutcome, setInstallOutcome] = useState<"accepted" | "dismissed" | null>(null);
  const [beforeInstallPromptFired, setBeforeInstallPromptFired] = useState(false);
  const [appInstalledFired, setAppInstalledFired] = useState(false);
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);

  const debugEnabled = showDiagnostics || debugFromQuery;

  useEffect(() => {
    setDeviceInfo(getDeviceInfo());
    setIsStandalone(getStandaloneMode());
    setIsDismissed(sessionStorage.getItem(INSTALL_DISMISSED_KEY) === "true");
    setDebugFromQuery(new URLSearchParams(window.location.search).get("debug") === "1");

    const standaloneMedia = window.matchMedia("(display-mode: standalone)");
    const handleStandaloneChange = () => setIsStandalone(getStandaloneMode());

    standaloneMedia.addEventListener("change", handleStandaloneChange);

    return () => standaloneMedia.removeEventListener("change", handleStandaloneChange);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setBeforeInstallPromptFired(true);
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setIsDismissed(false);
    };

    const handleAppInstalled = () => {
      setAppInstalledFired(true);
      setDeferredPrompt(null);
      setIsStandalone(true);
      setInstallOutcome("accepted");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadDiagnostics() {
      const manifestUrl = `${window.location.origin}/manifest.webmanifest`;
      const initialDiagnostics: Diagnostics = {
        isSecureContext: window.isSecureContext,
        serviceWorkerSupported: "serviceWorker" in navigator,
        serviceWorkerRegistered: false,
        serviceWorkerController: Boolean(navigator.serviceWorker?.controller),
        manifestUrl,
        manifestFetchOk: null,
        serviceWorkerFetchOk: null,
        displayMode: getDisplayMode(),
      };

      const [manifestResult, serviceWorkerResult] = await Promise.allSettled([
        fetch("/manifest.webmanifest", { cache: "no-store" }),
        fetch("/sw.js", { cache: "no-store" }),
      ]);

      if (!isMounted) {
        return;
      }

      const registration =
        "serviceWorker" in navigator
          ? await navigator.serviceWorker.getRegistration("/")
          : undefined;

      if (!isMounted) {
        return;
      }

      setDiagnostics({
        ...initialDiagnostics,
        serviceWorkerRegistered: Boolean(registration),
        serviceWorkerController: Boolean(navigator.serviceWorker?.controller),
        manifestFetchOk:
          manifestResult.status === "fulfilled" ? manifestResult.value.ok : false,
        serviceWorkerFetchOk:
          serviceWorkerResult.status === "fulfilled" ? serviceWorkerResult.value.ok : false,
        displayMode: getDisplayMode(),
      });
    }

    if (!debugEnabled) {
      setDiagnostics(null);
      return;
    }

    loadDiagnostics();

    const handleControllerChange = () => {
      setDiagnostics((current) =>
        current
          ? {
              ...current,
              serviceWorkerController: Boolean(navigator.serviceWorker?.controller),
            }
          : current
      );
    };

    navigator.serviceWorker?.addEventListener("controllerchange", handleControllerChange);

    return () => {
      isMounted = false;
      navigator.serviceWorker?.removeEventListener("controllerchange", handleControllerChange);
    };
  }, [appInstalledFired, beforeInstallPromptFired, debugEnabled]);

  const canUseNativePrompt =
    Boolean(deferredPrompt) &&
    Boolean(deviceInfo?.isAndroid) &&
    Boolean(deviceInfo?.isChromium);
  const shouldHideForContext =
    isStandalone || appInstalledFired || (mobileOnly && !deviceInfo?.isMobile) || isDismissed;

  const fallbackTitle = useMemo(() => {
    if (deviceInfo?.isIos) {
      return "Install on iPhone";
    }

    if (deviceInfo?.isAndroid) {
      return canUseNativePrompt ? title : "Install on Android";
    }

    return title;
  }, [canUseNativePrompt, deviceInfo?.isAndroid, deviceInfo?.isIos, title]);

  async function handleInstallClick() {
    if (!deferredPrompt) {
      return;
    }

    setIsPrompting(true);
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    setInstallOutcome(choice.outcome);
    setIsPrompting(false);

    if (choice.outcome === "accepted") {
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    sessionStorage.setItem(INSTALL_DISMISSED_KEY, "true");
    setIsDismissed(true);
  }

  if (!deviceInfo || shouldHideForContext) {
    return debugEnabled && diagnostics ? (
      <InstallDiagnostics
        appInstalledFired={appInstalledFired}
        beforeInstallPromptFired={beforeInstallPromptFired}
        deviceInfo={deviceInfo}
        diagnostics={diagnostics}
        installOutcome={installOutcome}
        isStandalone={isStandalone}
      />
    ) : null;
  }

  return (
    <section
      className={cn(
        "rounded-[1.2rem] border border-[color:var(--line-soft)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-1)_94%,transparent),color-mix(in_srgb,var(--surface-2)_98%,transparent))] p-4 shadow-[0_18px_42px_-32px_rgba(19,12,8,0.8)] sm:p-5",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--line-soft)] bg-[color:var(--surface-2)] text-[color:var(--surface-strong)]">
          {canUseNativePrompt ? (
            <Download aria-hidden className="h-5 w-5" />
          ) : (
            <Smartphone aria-hidden className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="section-kicker">Home Screen App</div>
          <h2 className="mt-1 text-2xl font-semibold text-monastic-0">{fallbackTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7">
            Install The Narrow Path for quicker access to Today, Daily Reading,
            prayer, and accountability.
          </p>
        </div>
      </div>

      {canUseNativePrompt ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            className="w-full sm:w-auto"
            disabled={isPrompting}
            onClick={handleInstallClick}
            type="button"
          >
            {isPrompting ? "Opening Prompt" : "Install Narrow Path"}
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={handleDismiss}
            type="button"
            variant="ghost"
          >
            Continue in Browser for Now
          </Button>
        </div>
      ) : deviceInfo.isIos ? (
        <InstructionList
          steps={[
            "Open The Narrow Path in Safari.",
            "Tap Share.",
            "Tap Add to Home Screen.",
            "Tap Add.",
            "Open Narrow Path from the Home Screen.",
          ]}
          onDismiss={handleDismiss}
        />
      ) : deviceInfo.isAndroid ? (
        <InstructionList
          note="Chrome may need a refresh after the service worker registers."
          steps={[
            "Open The Narrow Path in Chrome.",
            "Tap the three-dot menu.",
            "Tap Install app or Add to Home screen.",
          ]}
          onDismiss={handleDismiss}
        />
      ) : (
        <InstructionList
          steps={["Open this page on your phone to add Narrow Path to your Home Screen."]}
          onDismiss={handleDismiss}
        />
      )}

      {installOutcome === "dismissed" ? (
        <p className="mt-3 text-sm leading-6 text-monastic-2">
          The browser install prompt was dismissed. You can try again from this
          page or use your browser menu.
        </p>
      ) : null}

      {debugEnabled && diagnostics ? (
        <div className="mt-5">
          <InstallDiagnostics
            appInstalledFired={appInstalledFired}
            beforeInstallPromptFired={beforeInstallPromptFired}
            deviceInfo={deviceInfo}
            diagnostics={diagnostics}
            installOutcome={installOutcome}
            isStandalone={isStandalone}
          />
        </div>
      ) : null}
    </section>
  );
}

function InstructionList({
  note,
  onDismiss,
  steps,
}: {
  note?: string;
  onDismiss: () => void;
  steps: string[];
}) {
  return (
    <div className="mt-4">
      <ol className="space-y-2">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-3 text-sm leading-6 text-monastic-1 sm:text-base">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[color:var(--line-soft)] bg-[color:var(--surface-2)] text-xs font-semibold text-monastic-0">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      {note ? (
        <p className="mt-3 flex gap-2 text-sm leading-6 text-monastic-2">
          <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{note}</span>
        </p>
      ) : null}
      <Button
        className="mt-4 w-full sm:w-auto"
        onClick={onDismiss}
        type="button"
        variant="ghost"
      >
        Continue in Browser for Now
      </Button>
    </div>
  );
}

function InstallDiagnostics({
  appInstalledFired,
  beforeInstallPromptFired,
  deviceInfo,
  diagnostics,
  installOutcome,
  isStandalone,
}: {
  appInstalledFired: boolean;
  beforeInstallPromptFired: boolean;
  deviceInfo: DeviceInfo | null;
  diagnostics: Diagnostics;
  installOutcome: "accepted" | "dismissed" | null;
  isStandalone: boolean;
}) {
  return (
    <div className="rounded-[1rem] border border-[color:var(--line-soft)] bg-[color:var(--surface-1)] p-3 sm:p-4">
      <div className="flex items-center gap-2 text-monastic-0">
        <CheckCircle2 aria-hidden className="h-4 w-4 text-[color:var(--surface-strong)]" />
        <h3 className="text-lg font-semibold">Troubleshooting</h3>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <StatusBadge label="Secure context" value={diagnostics.isSecureContext} />
        <StatusBadge label="Service worker supported" value={diagnostics.serviceWorkerSupported} />
        <StatusBadge label="Service worker registered" value={diagnostics.serviceWorkerRegistered} />
        <StatusBadge label="Service worker controlling page" value={diagnostics.serviceWorkerController} />
        <StatusBadge label="Manifest fetch" value={diagnostics.manifestFetchOk} />
        <StatusBadge label="Service worker fetch" value={diagnostics.serviceWorkerFetchOk} />
        <StatusBadge label="Standalone mode active" value={isStandalone} />
        <StatusBadge label="beforeinstallprompt fired" value={beforeInstallPromptFired} />
        <StatusBadge label="appinstalled fired" value={appInstalledFired} />
        <StatusBadge label="Install choice" value={installOutcome ?? "None yet"} />
        <StatusBadge label="Browser" value={deviceInfo?.browserFamily ?? "Unknown"} />
        <StatusBadge label="Display mode" value={diagnostics.displayMode} />
      </div>
      <p className="mt-3 break-all text-xs leading-5 text-monastic-2">
        Manifest: {diagnostics.manifestUrl}
      </p>
    </div>
  );
}
