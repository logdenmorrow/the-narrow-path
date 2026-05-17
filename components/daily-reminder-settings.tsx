"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Clock, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";

type ReminderType = "morning_scripture" | "night_prayer";

type ReminderSlot = {
  reminder_type: ReminderType;
  enabled: boolean;
  local_time: string | null;
  timezone: string | null;
};

type DailyReminderSettingsProps = {
  initialSlots: ReminderSlot[];
};

type TimePeriod = "AM" | "PM";

type TimeParts = {
  hour: string;
  minute: string;
  period: TimePeriod;
};

type EditableReminderSlot = {
  reminder_type: ReminderType;
  title: string;
  body: string;
  enabled: boolean;
  local_time: string;
  timezone: string;
};

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) => String(index + 1));
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0")
);
const PERIOD_OPTIONS: TimePeriod[] = ["AM", "PM"];

const REMINDER_DEFINITIONS: Array<{
  reminder_type: ReminderType;
  title: string;
  body: string;
  default_time: string;
}> = [
  {
    reminder_type: "morning_scripture",
    title: "Morning Scripture",
    body: "Start the day with Scripture.",
    default_time: "07:00",
  },
  {
    reminder_type: "night_prayer",
    title: "Night Prayer",
    body: "End the day in prayer.",
    default_time: "21:30",
  },
];

function formatTimeForInput(value: string | null, fallback: string) {
  if (!value) {
    return fallback;
  }

  return value.slice(0, 5);
}

function parseTimeToParts(value: string): TimeParts {
  const [hourSegment, minuteSegment] = value.split(":");
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

function buildInitialSlots({
  initialSlots,
}: DailyReminderSettingsProps): EditableReminderSlot[] {
  return REMINDER_DEFINITIONS.map((definition) => {
    const slot = initialSlots.find(
      (candidate) => candidate.reminder_type === definition.reminder_type
    );

    return {
      reminder_type: definition.reminder_type,
      title: definition.title,
      body: definition.body,
      enabled: slot?.enabled ?? false,
      local_time: formatTimeForInput(slot?.local_time ?? null, definition.default_time),
      timezone: slot?.timezone ?? "",
    };
  });
}

export function DailyReminderSettings({
  initialSlots,
}: DailyReminderSettingsProps) {
  const [slots, setSlots] = useState<EditableReminderSlot[]>(() =>
    buildInitialSlots({ initialSlots })
  );
  const [detectedTimezone, setDetectedTimezone] = useState("");
  const [message, setMessage] = useState(
    "Reminders send to enabled devices for this account."
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const detected = detectTimezone();
    setDetectedTimezone(detected);

    if (detected) {
      setSlots((currentSlots) =>
        currentSlots.map((slot) => ({
          ...slot,
          timezone: slot.timezone || detected,
        }))
      );
    }
  }, []);

  const enabledCount = useMemo(
    () => slots.filter((slot) => slot.enabled).length,
    [slots]
  );

  const updateSlot = (
    reminderType: ReminderType,
    changes: Partial<EditableReminderSlot>
  ) => {
    setSlots((currentSlots) =>
      currentSlots.map((slot) =>
        slot.reminder_type === reminderType ? { ...slot, ...changes } : slot
      )
    );
  };

  const updateTimePart = (reminderType: ReminderType, nextParts: TimeParts) => {
    updateSlot(reminderType, { local_time: formatPartsToTime(nextParts) });
  };

  const applyDetectedTimezone = (reminderType: ReminderType) => {
    const detected = detectTimezone();
    setDetectedTimezone(detected);

    if (detected) {
      updateSlot(reminderType, { timezone: detected });
      setMessage("Detected timezone applied.");
      setError(null);
      return;
    }

    setError("Could not detect this device timezone.");
  };

  const saveSlots = async () => {
    setError(null);
    setMessage("Saving reminders...");
    setIsSaving(true);

    try {
      const response = await fetch("/api/settings/reminder-slots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slots: slots.map((slot) => ({
            reminder_type: slot.reminder_type,
            enabled: slot.enabled,
            local_time: slot.local_time,
            timezone: slot.timezone,
          })),
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(result?.error || "Could not save reminders.");
      }

      setMessage("Reminders saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Could not save reminders."
      );
      setMessage("Reminders send to enabled devices for this account.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid min-w-0 max-w-full gap-4">
      <div className="flex min-w-0 max-w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 break-words text-sm leading-6 text-monastic-1">
          Reminders send to enabled devices for this account.
        </p>
        <span className="w-fit shrink-0 rounded-full border border-monastic px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-monastic-1">
          {enabledCount} enabled
        </span>
      </div>

      <div className="grid min-w-0 max-w-full gap-4">
        {slots.map((slot) => {
          const timeParts = parseTimeToParts(slot.local_time);
          const timeLabelId = `${slot.reminder_type}-time-label`;
          const timezoneInputId = `${slot.reminder_type}-timezone`;

          return (
            <div
              key={slot.reminder_type}
              className="monastic-subcard grid min-w-0 max-w-full gap-4 p-4 sm:p-5"
            >
              <div className="flex min-w-0 max-w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 max-w-full">
                  <div className="section-kicker">Preset Reminder</div>
                  <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
                    <p className="min-w-0 break-words text-lg font-semibold text-monastic-0">
                      {slot.title}
                    </p>
                    <span className="shrink-0 rounded-full border border-monastic px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-monastic-1">
                      {slot.enabled ? "On" : "Off"}
                    </span>
                  </div>
                  <p className="mt-2 max-w-full text-sm leading-6 text-monastic-1 sm:max-w-2xl">
                    {slot.body}
                  </p>
                </div>

                <label className="flex min-w-0 cursor-pointer items-center gap-3 rounded-lg border border-monastic bg-monastic-2/40 px-4 py-3 text-sm font-medium text-monastic-1 sm:min-w-[10rem]">
                  <input
                    type="checkbox"
                    checked={slot.enabled}
                    onChange={(event) =>
                      updateSlot(slot.reminder_type, {
                        enabled: event.target.checked,
                      })
                    }
                    className="h-4 w-4 shrink-0 accent-[color:var(--surface-strong)]"
                    disabled={isSaving}
                  />
                  <span>{slot.enabled ? "Enabled" : "Disabled"}</span>
                </label>
              </div>

              <div className="grid min-w-0 max-w-full gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                <div className="grid min-w-0 max-w-full gap-2">
                  <label
                    id={timeLabelId}
                    className="text-sm font-medium text-monastic-1"
                  >
                    Local time
                  </label>
                  <div
                    className="grid min-w-0 max-w-full grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)]"
                    role="group"
                    aria-labelledby={timeLabelId}
                  >
                    <select
                      aria-label={`${slot.title} hour`}
                      value={timeParts.hour}
                      onChange={(event) =>
                        updateTimePart(slot.reminder_type, {
                          ...timeParts,
                          hour: event.target.value,
                        })
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
                      aria-label={`${slot.title} minute`}
                      value={timeParts.minute}
                      onChange={(event) =>
                        updateTimePart(slot.reminder_type, {
                          ...timeParts,
                          minute: event.target.value,
                        })
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
                      aria-label={`${slot.title} period`}
                      value={timeParts.period}
                      onChange={(event) =>
                        updateTimePart(slot.reminder_type, {
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

                <div className="grid min-w-0 max-w-full gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                  <div className="grid min-w-0 max-w-full gap-2">
                    <label
                      htmlFor={timezoneInputId}
                      className="text-sm font-medium text-monastic-1"
                    >
                      Timezone
                    </label>
                    <input
                      id={timezoneInputId}
                      value={slot.timezone}
                      onChange={(event) =>
                        updateSlot(slot.reminder_type, {
                          timezone: event.target.value,
                        })
                      }
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
                    onClick={() => applyDetectedTimezone(slot.reminder_type)}
                    disabled={isSaving}
                    className="w-full max-w-full sm:w-auto"
                  >
                    <LocateFixed aria-hidden="true" />
                    Use Detected
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex min-w-0 max-w-full flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="button"
          size="sm"
          onClick={saveSlots}
          disabled={isSaving}
          className="w-full max-w-full sm:w-auto"
        >
          {isSaving ? <Clock aria-hidden="true" /> : <Bell aria-hidden="true" />}
          {isSaving ? "Saving..." : "Save Reminders"}
        </Button>
        <p className="min-w-0 break-words text-sm leading-6 text-monastic-1 sm:flex-1">
          {message}
        </p>
      </div>

      {error ? (
        <div className="min-w-0 max-w-full break-words rounded-[1rem] border border-red-700/40 bg-red-950/20 px-4 py-3 text-sm leading-6 text-red-100">
          {error}
        </div>
      ) : null}
    </div>
  );
}
