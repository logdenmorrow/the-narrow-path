"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Clock, LocateFixed } from "lucide-react";
import { saveDailyReminderPreference } from "@/app/settings/actions";
import { Button } from "@/components/ui/button";

type DailyReminderSettingsProps = {
  initialEnabled: boolean;
  initialLocalTime: string | null;
  initialTimezone: string | null;
};

function formatTimeForInput(value: string | null) {
  if (!value) {
    return "09:00";
  }

  return value.slice(0, 5);
}

function detectTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
}

export function DailyReminderSettings({
  initialEnabled,
  initialLocalTime,
  initialTimezone,
}: DailyReminderSettingsProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [localTime, setLocalTime] = useState(formatTimeForInput(initialLocalTime));
  const [timezone, setTimezone] = useState(initialTimezone ?? "");
  const [detectedTimezone, setDetectedTimezone] = useState("");
  const [message, setMessage] = useState("Reminder sending is not active yet.");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const detected = detectTimezone();
    setDetectedTimezone(detected);

    if (!initialTimezone && detected) {
      setTimezone(detected);
    }
  }, [initialTimezone]);

  const statusLabel = useMemo(() => (enabled ? "On" : "Off"), [enabled]);

  const useDetectedTimezone = () => {
    const detected = detectTimezone();
    setDetectedTimezone(detected);

    if (detected) {
      setTimezone(detected);
      setMessage("Detected timezone applied. Reminder sending is not active yet.");
      setError(null);
      return;
    }

    setError("Could not detect this device timezone.");
  };

  const savePreference = () => {
    setError(null);
    setMessage("Saving reminder preference...");

    startTransition(async () => {
      try {
        await saveDailyReminderPreference({
          enabled,
          localTime,
          timezone,
        });
        setMessage("Daily reminder preference saved. Reminder sending is not active yet.");
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : "Could not save reminder preference."
        );
        setMessage("Reminder sending is not active yet.");
      }
    });
  };

  return (
    <div className="monastic-subcard p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="section-kicker">Account Reminder</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="text-lg font-semibold text-monastic-0">Daily reminder</p>
            <span className="rounded-full border border-monastic px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-monastic-1">
              {statusLabel}
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-monastic-1">
            Choose one daily reminder time for this account. It will send to your enabled
            devices once reminder sending is turned on.
          </p>
          <p className="mt-2 text-sm leading-6 text-amber-200">
            Reminder sending is not active yet.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-[0.7fr_1.3fr]">
        <label className="monastic-subcard flex cursor-pointer items-center gap-3 p-4 text-sm font-medium text-monastic-1">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
            className="h-4 w-4 accent-[color:var(--surface-strong)]"
            disabled={isPending}
          />
          Enable daily reminder
        </label>

        <div className="grid gap-2">
          <label htmlFor="daily-reminder-time" className="text-sm font-medium text-monastic-1">
            Local time
          </label>
          <input
            id="daily-reminder-time"
            type="time"
            value={localTime}
            onChange={(event) => setLocalTime(event.target.value)}
            className="monastic-field"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="grid gap-2">
          <label htmlFor="daily-reminder-timezone" className="text-sm font-medium text-monastic-1">
            Timezone
          </label>
          <input
            id="daily-reminder-timezone"
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
            className="monastic-field"
            placeholder="America/New_York"
            disabled={isPending}
          />
          <p className="text-xs leading-5 text-monastic-2">
            Detected: {detectedTimezone || "Unavailable"}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={useDetectedTimezone}
          disabled={isPending}
        >
          <LocateFixed aria-hidden="true" />
          Use Detected
        </Button>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="button" size="sm" onClick={savePreference} disabled={isPending}>
          <Clock aria-hidden="true" />
          {isPending ? "Saving..." : "Save Reminder"}
        </Button>
        <p className="text-sm leading-6 text-monastic-1">{message}</p>
      </div>

      {error ? (
        <div className="mt-4 rounded-[1rem] border border-red-700/40 bg-red-950/20 px-4 py-3 text-sm leading-6 text-red-100">
          {error}
        </div>
      ) : null}
    </div>
  );
}
