"use client";

import { useState } from "react";
import { CalendarDays, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

type ReligiousOrderCalendarPreference = "dominican" | null;

type LiturgicalCalendarSettingsProps = {
  initialPreference: ReligiousOrderCalendarPreference;
};

const OPTIONS: Array<{
  value: "general" | "dominican";
  title: string;
  body: string;
}> = [
  {
    value: "general",
    title: "General U.S. calendar only",
    body: "Use the general U.S. liturgical calendar as the primary calendar.",
  },
  {
    value: "dominican",
    title: "Also show Dominican calendar",
    body: "For Dominican parishes and communities. The general U.S. calendar remains primary; Dominican proper observances appear as local additions when available.",
  },
];

function preferenceToOption(value: ReligiousOrderCalendarPreference) {
  return value === "dominican" ? "dominican" : "general";
}

function optionToPreference(value: "general" | "dominican") {
  return value === "dominican" ? "dominican" : null;
}

export function LiturgicalCalendarSettings({
  initialPreference,
}: LiturgicalCalendarSettingsProps) {
  const [selectedOption, setSelectedOption] = useState<"general" | "dominican">(
    () => preferenceToOption(initialPreference)
  );
  const [message, setMessage] = useState(
    "The general U.S. calendar remains primary."
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const savePreference = async () => {
    setError(null);
    setMessage("Saving calendar preference...");
    setIsSaving(true);

    try {
      const response = await fetch("/api/settings/liturgical-calendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          religious_order_calendar: optionToPreference(selectedOption),
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(result?.error || "Could not save calendar preference.");
      }

      setMessage("Calendar preference saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save calendar preference."
      );
      setMessage("The general U.S. calendar remains primary.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid min-w-0 max-w-full gap-4">
      <p className="text-sm leading-6 text-monastic-1">
        The general U.S. calendar stays primary. Proper observances appear only
        as local additions when available, and optional memorials remain
        optional.
      </p>

      <div className="grid gap-3">
        {OPTIONS.map((option) => (
          <label
            key={option.value}
            className="monastic-subcard flex cursor-pointer gap-3 p-4 sm:p-5"
          >
            <input
              type="radio"
              name="liturgical-calendar-preference"
              value={option.value}
              checked={selectedOption === option.value}
              onChange={() => setSelectedOption(option.value)}
              className="mt-1 h-4 w-4 shrink-0 accent-[color:var(--surface-strong)]"
              disabled={isSaving}
            />
            <span className="min-w-0">
              <span className="block text-base font-semibold text-monastic-0">
                {option.title}
              </span>
              <span className="mt-1 block text-sm leading-6 text-monastic-1">
                {option.body}
              </span>
            </span>
          </label>
        ))}
      </div>

      <div className="flex min-w-0 max-w-full flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="button"
          size="sm"
          onClick={savePreference}
          disabled={isSaving}
          className="w-full max-w-full sm:w-auto"
        >
          {isSaving ? (
            <CalendarDays aria-hidden="true" />
          ) : (
            <Save aria-hidden="true" />
          )}
          {isSaving ? "Saving..." : "Save Calendar"}
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
