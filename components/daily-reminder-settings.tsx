"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";

type DailyReminderSettingsProps = {
  initialEnabled: boolean;
  initialLocalTime: string | null;
  initialTimezone: string | null;
};

type TimePeriod = "AM" | "PM";

type TimeParts = {
  hour: string;
  minute: string;
  period: TimePeriod;
};

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) => String(index + 1));
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0")
);
const PERIOD_OPTIONS: TimePeriod[] = ["AM", "PM"];

function formatTimeForInput(value: string | null) {
  if (!value) {
    return "09:00";
  }

  return value.slice(0, 5);
}

function parseTimeToParts(value: string | null): TimeParts {
  const [hourSegment, minuteSegment] = formatTimeForInput(value).split(":");
  const parsedHour = Number(hourSegment);
  const parsedMinute = Number(minuteSegment);
  const hour24 =
    Number.isInteger(parsedHour) && parsedHour >= 0 && parsedHour <= 23
      ? parsedHour
      : 9;
  const minute =
    Number.isInteger(parsedMinute) && parsedMinute >= 0 && parsedMinute <= 59
      ? parsedMinute
      : 0;

  return {
    hour: String(hour24 % 12 || 12),
    minute: String(minute).padStart(2, "0"),
    period: hour24 >= 12 ? "PM" : "AM",
  };
}

function formatPartsToTime({ hour, minute, period }: TimeParts) {
  const parsedHour = Number(hour);
  const parsedMinute = Number(minute);
  const hour12 =
    Number.isInteger(parsedHour) && parsedHour >= 1 && parsedHour <= 12
      ? parsedHour
      : 9;
  const safeMinute =
    Number.isInteger(parsedMinute) && parsedMinute >= 0 && parsedMinute <= 59
      ? parsedMinute
      : 0;
  const hour24 = period === "PM" ? (hour12 % 12) + 12 : hour12 % 12;

  return `${String(hour24).padStart(2, "0")}:${String(safeMinute).padStart(2, "0")}`;
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
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const detected = detectTimezone();
    setDetectedTimezone(detected);

    if (!initialTimezone && detected) {
      setTimezone(detected);
    }
  }, [initialTimezone]);

  const statusLabel = useMemo(() => (enabled ? "On" : "Off"), [enabled]);
  const timeParts = useMemo(() => parseTimeToParts(localTime), [localTime]);

  const updateTimePart = (nextParts: TimeParts) => {
    setLocalTime(formatPartsToTime(nextParts));
  };

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

  const savePreference = async () => {
    setError(null);
    setMessage("Saving reminder preference...");
    setIsSaving(true);

    try {
      const response = await fetch("/api/settings/daily-reminder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled,
          local_time: localTime,
          timezone,
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(result?.error || "Could not save reminder preference.");
      }

      setMessage("Daily reminder preference saved. Reminder sending is not active yet.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save reminder preference."
      );
      setMessage("Reminder sending is not active yet.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="monastic-subcard min-w-0 max-w-full p-4 sm:p-5">
      <div className="flex min-w-0 max-w-full flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 max-w-full">
          <div className="section-kicker">Account Reminder</div>
          <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
            <p className="min-w-0 break-words text-lg font-semibold text-monastic-0">Daily reminder</p>
            <span className="shrink-0 rounded-full border border-monastic px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-monastic-1">
              {statusLabel}
            </span>
          </div>
          <p className="mt-2 max-w-full text-sm leading-6 text-monastic-1 sm:max-w-2xl">
            Choose one daily reminder time for this account. It will send to your enabled
            devices once reminder sending is turned on.
          </p>
          <p className="mt-2 break-words text-sm leading-6 text-amber-200">
            Reminder sending is not active yet.
          </p>
        </div>
      </div>

      <div className="mt-5 grid min-w-0 max-w-full gap-4 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] sm:gap-5">
        <label className="monastic-subcard flex min-w-0 max-w-full cursor-pointer items-center gap-3 p-4 text-sm font-medium text-monastic-1">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
            className="h-4 w-4 shrink-0 accent-[color:var(--surface-strong)]"
            disabled={isSaving}
          />
          <span className="min-w-0">Enable daily reminder</span>
        </label>

        <div className="grid min-w-0 max-w-full gap-2">
          <label id="daily-reminder-time-label" className="text-sm font-medium text-monastic-1">
            Local time
          </label>
          <div
            className="grid min-w-0 max-w-full grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)]"
            role="group"
            aria-labelledby="daily-reminder-time-label"
          >
            <select
              aria-label="Reminder hour"
              value={timeParts.hour}
              onChange={(event) =>
                updateTimePart({ ...timeParts, hour: event.target.value })
              }
              className="monastic-field min-w-0 max-w-full px-3 py-2 text-sm sm:px-4 sm:py-[0.85rem]"
              disabled={isSaving}
            >
              {HOUR_OPTIONS.map((hour) => (
                <option key={hour} value={hour}>
                  {hour}
                </option>
              ))}
            </select>
            <select
              aria-label="Reminder minute"
              value={timeParts.minute}
              onChange={(event) =>
                updateTimePart({ ...timeParts, minute: event.target.value })
              }
              className="monastic-field min-w-0 max-w-full px-3 py-2 text-sm sm:px-4 sm:py-[0.85rem]"
              disabled={isSaving}
            >
              {MINUTE_OPTIONS.map((minute) => (
                <option key={minute} value={minute}>
                  {minute}
                </option>
              ))}
            </select>
            <select
              aria-label="Reminder period"
              value={timeParts.period}
              onChange={(event) =>
                updateTimePart({
                  ...timeParts,
                  period: event.target.value as TimePeriod,
                })
              }
              className="monastic-field col-span-2 min-w-0 max-w-full px-3 py-2 text-sm sm:col-span-1 sm:px-4 sm:py-[0.85rem]"
              disabled={isSaving}
            >
              {PERIOD_OPTIONS.map((period) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-5 grid min-w-0 max-w-full gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="grid min-w-0 max-w-full gap-2">
          <label htmlFor="daily-reminder-timezone" className="text-sm font-medium text-monastic-1">
            Timezone
          </label>
          <input
            id="daily-reminder-timezone"
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
            className="monastic-field min-w-0 max-w-full"
            placeholder="America/New_York"
            disabled={isSaving}
          />
          <p className="min-w-0 break-words text-xs leading-5 text-monastic-2">
            Detected: {detectedTimezone || "Unavailable"}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={useDetectedTimezone}
          disabled={isSaving}
          className="w-full max-w-full sm:w-auto"
        >
          <LocateFixed aria-hidden="true" />
          Use Detected
        </Button>
      </div>

      <div className="mt-5 flex min-w-0 max-w-full flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="button"
          size="sm"
          onClick={savePreference}
          disabled={isSaving}
          className="w-full max-w-full sm:w-auto"
        >
          <Clock aria-hidden="true" />
          {isSaving ? "Saving..." : "Save Reminder"}
        </Button>
        <p className="min-w-0 break-words text-sm leading-6 text-monastic-1 sm:flex-1">{message}</p>
      </div>

      {error ? (
        <div className="mt-4 min-w-0 max-w-full break-words rounded-[1rem] border border-red-700/40 bg-red-950/20 px-4 py-3 text-sm leading-6 text-red-100">
          {error}
        </div>
      ) : null}
    </div>
  );
}
