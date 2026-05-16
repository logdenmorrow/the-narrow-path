"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Info, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type GlobalPwaInstallState = {
  earlyListenerInstalled?: boolean;
  beforeInstallPromptFired?: boolean;
  appInstalledFired?: boolean;
  deferredPromptAvailable?: boolean;
};

declare global {
  interface Window {
    __TNP_DEFERRED_INSTALL_PROMPT?: BeforeInstallPromptEvent;
    __TNP_PWA_INSTALL?: GlobalPwaInstallState;
  }
}

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
  serviceWorkerRegistrationScope: string;
  serviceWorkerActiveScriptUrl: string;
  serviceWorkerControllerScriptUrl: string;
  manifestUrl: string;
  manifestFetchOk: boolean | null;
  manifestStartUrl: string;
  manifestScope: string;
  manifestDisplay: string;
  manifestIconCount: number | string;
  manifestHas192Icon: boolean | null;
  manifestHas512Icon: boolean | null;
  manifestHasMaskableIcon: boolean | null;
  startUrlFetchStatus: string;
  startUrlContentType: string;
  startUrlSameOrigin: boolean | null;
  serviceWorkerFetchOk: boolean | null;
  earlyListenerInstalled: boolean;
  earlyBeforeInstallPromptFired: boolean;
  reactBeforeInstallPromptFired: boolean;
  deferredPromptAvailable: boolean;
  displayMode: string;
};

type PwaInstallPromptProps = {
  className?: string;
  mobileOnly?: boolean;
  showDiagnostics?: boolean;
  title?: string;
};

const INSTALL_DISMISSED_KEY = "narrow-path-install-dismissed-session";
const SOFT_INSTALL_DISMISSED_KEY = "narrow-path-soft-install-dismissed-session";

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

function getGlobalPwaState() {
  return window.__TNP_PWA_INSTALL ?? {};
}

function getGlobalDeferredPrompt() {
  return window.__TNP_DEFERRED_INSTALL_PROMPT ?? null;
}

function StatusBadge({
  label,
  value,
}: {
  label: string;
  value: boolean | number | string | null;
}) {
  const isBoolean = typeof value === "boolean";
  const tone = value === true ? "good" : value === false ? "muted" : "neutral";

  return (
    <div className="flex items-center justify-between gap-3 rounded-[0.85rem] border border-[color:var(--line-soft)] bg-[color:var(--surface-2)] px-3 py-2 text-sm">
      <span className="text-monastic-1">{label}</span>
      <span
        className={cn(
          "min-w-0 text-right font-semibold text-monastic-0 break-all",
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
  const [earlyBeforeInstallPromptFired, setEarlyBeforeInstallPromptFired] = useState(false);
  const [earlyListenerInstalled, setEarlyListenerInstalled] = useState(false);
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);

  const debugEnabled = showDiagnostics || debugFromQuery;

  useEffect(() => {
    const globalState = getGlobalPwaState();
    const globalPrompt = getGlobalDeferredPrompt();

    setDeviceInfo(getDeviceInfo());
    setIsStandalone(getStandaloneMode());
    setIsDismissed(sessionStorage.getItem(INSTALL_DISMISSED_KEY) === "true");
    setDebugFromQuery(new URLSearchParams(window.location.search).get("debug") === "1");
    setDeferredPrompt(globalPrompt);
    setEarlyListenerInstalled(Boolean(globalState.earlyListenerInstalled));
    setEarlyBeforeInstallPromptFired(Boolean(globalState.beforeInstallPromptFired));
    setBeforeInstallPromptFired(Boolean(globalState.beforeInstallPromptFired));
    setAppInstalledFired(Boolean(globalState.appInstalledFired));

    const standaloneMedia = window.matchMedia("(display-mode: standalone)");
    const handleStandaloneChange = () => setIsStandalone(getStandaloneMode());

    standaloneMedia.addEventListener("change", handleStandaloneChange);

    return () => standaloneMedia.removeEventListener("change", handleStandaloneChange);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setBeforeInstallPromptFired(true);
      setEarlyBeforeInstallPromptFired(Boolean(getGlobalPwaState().beforeInstallPromptFired));
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setIsDismissed(false);
    };

    const handleGlobalBeforeInstallPrompt = () => {
      setEarlyBeforeInstallPromptFired(true);
      setBeforeInstallPromptFired(true);
      setDeferredPrompt(getGlobalDeferredPrompt());
      setIsDismissed(false);
    };

    const handleAppInstalled = () => {
      setAppInstalledFired(true);
      setDeferredPrompt(null);
      setIsStandalone(true);
      setInstallOutcome("accepted");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("tnp-beforeinstallprompt", handleGlobalBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("tnp-appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("tnp-beforeinstallprompt", handleGlobalBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("tnp-appinstalled", handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadDiagnostics() {
      const manifestUrl = `${window.location.origin}/manifest.webmanifest`;
      const initialDiagnostics = {
        isSecureContext: window.isSecureContext,
        serviceWorkerSupported: "serviceWorker" in navigator,
        serviceWorkerRegistered: false,
        serviceWorkerController: Boolean(navigator.serviceWorker?.controller),
        serviceWorkerRegistrationScope: "None",
        serviceWorkerActiveScriptUrl: "None",
        serviceWorkerControllerScriptUrl: navigator.serviceWorker?.controller?.scriptURL ?? "None",
        manifestUrl,
        manifestFetchOk: null,
        manifestStartUrl: "Unknown",
        manifestScope: "Unknown",
        manifestDisplay: "Unknown",
        manifestIconCount: "Unknown",
        manifestHas192Icon: null,
        manifestHas512Icon: null,
        manifestHasMaskableIcon: null,
        startUrlFetchStatus: "Unknown",
        startUrlContentType: "Unknown",
        startUrlSameOrigin: null,
        serviceWorkerFetchOk: null,
        earlyListenerInstalled,
        earlyBeforeInstallPromptFired,
        reactBeforeInstallPromptFired: beforeInstallPromptFired,
        deferredPromptAvailable: Boolean(deferredPrompt ?? getGlobalDeferredPrompt()),
        displayMode: getDisplayMode(),
      };

      let manifestFetchOk = false;
      let serviceWorkerFetchOk = false;
      let manifestStartUrl = "Unknown";
      let manifestScope = "Unknown";
      let manifestDisplay = "Unknown";
      let manifestIconCount: number | string = "Unknown";
      let manifestHas192Icon: boolean | null = null;
      let manifestHas512Icon: boolean | null = null;
      let manifestHasMaskableIcon: boolean | null = null;
      let startUrlFetchStatus = "Unknown";
      let startUrlContentType = "Unknown";
      let startUrlSameOrigin: boolean | null = null;

      try {
        const manifestResponse = await fetch("/manifest.webmanifest", { cache: "no-store" });
        manifestFetchOk = manifestResponse.ok;
        const manifest = await manifestResponse.json();
        const icons = Array.isArray(manifest.icons) ? manifest.icons : [];

        manifestStartUrl = typeof manifest.start_url === "string" ? manifest.start_url : "Missing";
        manifestScope = typeof manifest.scope === "string" ? manifest.scope : "Missing";
        manifestDisplay = typeof manifest.display === "string" ? manifest.display : "Missing";
        manifestIconCount = icons.length;
        manifestHas192Icon = icons.some((icon: { sizes?: string }) =>
          icon.sizes?.split(/\s+/).includes("192x192")
        );
        manifestHas512Icon = icons.some((icon: { sizes?: string }) =>
          icon.sizes?.split(/\s+/).includes("512x512")
        );
        manifestHasMaskableIcon = icons.some((icon: { purpose?: string }) =>
          icon.purpose?.split(/\s+/).includes("maskable")
        );

        const startUrl = new URL(manifestStartUrl, window.location.origin);
        startUrlSameOrigin = startUrl.origin === window.location.origin;
        const startUrlResponse = await fetch(startUrl.href, { cache: "no-store" });
        startUrlFetchStatus = String(startUrlResponse.status);
        startUrlContentType = startUrlResponse.headers.get("content-type") ?? "None";
      } catch {
        manifestFetchOk = false;
      }

      try {
        const serviceWorkerResponse = await fetch("/sw.js", { cache: "no-store" });
        serviceWorkerFetchOk = serviceWorkerResponse.ok;
      } catch {
        serviceWorkerFetchOk = false;
      }

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

      const globalState = getGlobalPwaState();

      setDiagnostics({
        ...initialDiagnostics,
        serviceWorkerRegistered: Boolean(registration),
        serviceWorkerController: Boolean(navigator.serviceWorker?.controller),
        serviceWorkerRegistrationScope: registration?.scope ?? "None",
        serviceWorkerActiveScriptUrl: registration?.active?.scriptURL ?? "None",
        serviceWorkerControllerScriptUrl: navigator.serviceWorker?.controller?.scriptURL ?? "None",
        manifestFetchOk,
        manifestStartUrl,
        manifestScope,
        manifestDisplay,
        manifestIconCount,
        manifestHas192Icon,
        manifestHas512Icon,
        manifestHasMaskableIcon,
        startUrlFetchStatus,
        startUrlContentType,
        startUrlSameOrigin,
        serviceWorkerFetchOk,
        earlyListenerInstalled: Boolean(globalState.earlyListenerInstalled),
        earlyBeforeInstallPromptFired: Boolean(globalState.beforeInstallPromptFired),
        reactBeforeInstallPromptFired: beforeInstallPromptFired,
        deferredPromptAvailable: Boolean(deferredPrompt ?? getGlobalDeferredPrompt()),
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
  }, [
    appInstalledFired,
    beforeInstallPromptFired,
    debugEnabled,
    deferredPrompt,
    earlyBeforeInstallPromptFired,
    earlyListenerInstalled,
  ]);

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
      return canUseNativePrompt ? "Ready to install" : "Install on Android";
    }

    return mobileOnly ? title : "Install on your phone";
  }, [canUseNativePrompt, deviceInfo?.isAndroid, deviceInfo?.isIos, mobileOnly, title]);

  const promptBody = useMemo(() => {
    if (canUseNativePrompt) {
      return "Chrome can install The Narrow Path on this device.";
    }

    if (deviceInfo?.isIos) {
      return "Safari uses the Share menu for Home Screen installs.";
    }

    if (deviceInfo?.isAndroid) {
      return "Use Chrome's browser menu if the install prompt is not shown.";
    }

    return "Open this page on your phone to install The Narrow Path.";
  }, [canUseNativePrompt, deviceInfo?.isAndroid, deviceInfo?.isIos]);

  const showPromptBody =
    canUseNativePrompt || Boolean(deviceInfo?.isIos) || Boolean(deviceInfo?.isAndroid);

  async function handleInstallClick() {
    if (!deferredPrompt) {
      return;
    }

    setIsPrompting(true);
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    setInstallOutcome(choice.outcome);
    setIsPrompting(false);
    setDeferredPrompt(null);
    window.__TNP_DEFERRED_INSTALL_PROMPT = undefined;
    window.__TNP_PWA_INSTALL = {
      ...getGlobalPwaState(),
      deferredPromptAvailable: false,
    };

    if (choice.outcome === "accepted") {
      setAppInstalledFired(true);
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
          {showPromptBody ? (
            <p className="mt-2 text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7">
              {promptBody}
            </p>
          ) : null}
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
          steps={["Open this page on your phone to install The Narrow Path."]}
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

export function SoftMobileInstallPrompt({ className }: { className?: string }) {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [appInstalledFired, setAppInstalledFired] = useState(false);

  useEffect(() => {
    const globalState = getGlobalPwaState();

    setDeviceInfo(getDeviceInfo());
    setIsStandalone(getStandaloneMode());
    setIsDismissed(sessionStorage.getItem(SOFT_INSTALL_DISMISSED_KEY) === "true");
    setAppInstalledFired(Boolean(globalState.appInstalledFired));

    const standaloneMedia = window.matchMedia("(display-mode: standalone)");
    const handleStandaloneChange = () => setIsStandalone(getStandaloneMode());
    const handleAppInstalled = () => {
      setAppInstalledFired(true);
      setIsStandalone(true);
    };

    standaloneMedia.addEventListener("change", handleStandaloneChange);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("tnp-appinstalled", handleAppInstalled);

    return () => {
      standaloneMedia.removeEventListener("change", handleStandaloneChange);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("tnp-appinstalled", handleAppInstalled);
    };
  }, []);

  function handleDismiss() {
    sessionStorage.setItem(SOFT_INSTALL_DISMISSED_KEY, "true");
    setIsDismissed(true);
  }

  if (!deviceInfo?.isMobile || isStandalone || appInstalledFired || isDismissed) {
    return null;
  }

  return (
    <section
      className={cn(
        "rounded-[1.2rem] border border-[color:var(--line-soft)] bg-[color:var(--surface-1)] p-4 shadow-[0_18px_42px_-34px_rgba(19,12,8,0.72)]",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--line-soft)] bg-[color:var(--surface-2)] text-[color:var(--surface-strong)]">
          <Smartphone aria-hidden className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-monastic-0">
            Add The Narrow Path to your Home Screen
          </h2>
          <p className="mt-2 text-sm leading-6 text-monastic-1">
            Open The Narrow Path like an app from your phone.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button asChild className="w-full sm:w-auto">
          <Link href="/install">Install</Link>
        </Button>
        <Button
          className="w-full sm:w-auto"
          onClick={handleDismiss}
          type="button"
          variant="ghost"
        >
          Not now
        </Button>
      </div>
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
        <StatusBadge label="Manifest start URL" value={diagnostics.manifestStartUrl} />
        <StatusBadge label="Manifest scope" value={diagnostics.manifestScope} />
        <StatusBadge label="Manifest display" value={diagnostics.manifestDisplay} />
        <StatusBadge label="Manifest icon count" value={diagnostics.manifestIconCount} />
        <StatusBadge label="Has 192 icon" value={diagnostics.manifestHas192Icon} />
        <StatusBadge label="Has 512 icon" value={diagnostics.manifestHas512Icon} />
        <StatusBadge label="Has maskable icon" value={diagnostics.manifestHasMaskableIcon} />
        <StatusBadge label="Start URL fetch status" value={diagnostics.startUrlFetchStatus} />
        <StatusBadge label="Start URL content type" value={diagnostics.startUrlContentType} />
        <StatusBadge label="Start URL same origin" value={diagnostics.startUrlSameOrigin} />
        <StatusBadge label="Service worker fetch" value={diagnostics.serviceWorkerFetchOk} />
        <StatusBadge label="SW registration scope" value={diagnostics.serviceWorkerRegistrationScope} />
        <StatusBadge label="SW active script" value={diagnostics.serviceWorkerActiveScriptUrl} />
        <StatusBadge label="SW controller script" value={diagnostics.serviceWorkerControllerScriptUrl} />
        <StatusBadge label="Standalone mode active" value={isStandalone} />
        <StatusBadge label="Early listener installed" value={diagnostics.earlyListenerInstalled} />
        <StatusBadge
          label="Early beforeinstallprompt caught"
          value={diagnostics.earlyBeforeInstallPromptFired}
        />
        <StatusBadge
          label="React beforeinstallprompt caught"
          value={diagnostics.reactBeforeInstallPromptFired}
        />
        <StatusBadge label="Deferred prompt available" value={diagnostics.deferredPromptAvailable} />
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
