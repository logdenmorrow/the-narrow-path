"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  APP_DAY_REFRESH_INTERVAL_MS,
  hasAppDayChanged,
} from "@/lib/app-day";

const REFRESH_RETRY_DELAY_MS = 10_000;

export default function DayRolloverRefresh({
  renderedDateIso,
}: {
  renderedDateIso: string;
}) {
  const router = useRouter();
  const renderedDateRef = useRef(renderedDateIso);
  const lastRefreshAttemptRef = useRef(0);

  useEffect(() => {
    renderedDateRef.current = renderedDateIso;
    lastRefreshAttemptRef.current = 0;
  }, [renderedDateIso]);

  useEffect(() => {
    const refreshIfDayChanged = () => {
      if (!hasAppDayChanged(renderedDateRef.current)) {
        return;
      }

      const now = Date.now();
      if (now - lastRefreshAttemptRef.current < REFRESH_RETRY_DELAY_MS) {
        return;
      }

      lastRefreshAttemptRef.current = now;
      router.refresh();
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        refreshIfDayChanged();
      }
    };

    refreshIfDayChanged();

    const intervalId = window.setInterval(
      refreshIfDayChanged,
      APP_DAY_REFRESH_INTERVAL_MS
    );
    window.addEventListener("focus", refreshIfDayChanged);
    window.addEventListener("pageshow", refreshIfDayChanged);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshIfDayChanged);
      window.removeEventListener("pageshow", refreshIfDayChanged);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [router]);

  return null;
}
