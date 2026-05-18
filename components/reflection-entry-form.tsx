"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveReflectionEntry } from "@/app/reflection/actions";
import { Button } from "@/components/ui/button";
import { buildPlanDayHref } from "@/lib/plan-day-url";

type ReflectionEntryFormProps = {
  planDayId: number;
  dayNumber: number;
  reflectionTaskId: number | null;
  promptText: string;
  initialEntryText: string;
  initialHasSavedEntry: boolean;
  isLocked: boolean;
  selectedDay: number;
  planSlug: string;
};

export function ReflectionEntryForm({
  planDayId,
  dayNumber,
  reflectionTaskId,
  promptText,
  initialEntryText,
  initialHasSavedEntry,
  isLocked,
  selectedDay,
  planSlug,
}: ReflectionEntryFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [entryText, setEntryText] = useState(initialEntryText);
  const [lastSavedText, setLastSavedText] = useState(initialEntryText);
  const [isSaved, setIsSaved] = useState(initialHasSavedEntry);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isDirty = useMemo(() => entryText !== lastSavedText, [entryText, lastSavedText]);
  const isSubmitDisabled = isLocked || isSaving || isSaved || !entryText.trim();

  const handleEntryChange = (nextValue: string) => {
    setEntryText(nextValue);
    setErrorMessage(null);

    if (isSaved && nextValue !== lastSavedText) {
      setIsSaved(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLocked || isSaving || isSaved || !formRef.current) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const formData = new FormData(formRef.current);
      await saveReflectionEntry(formData);
      setLastSavedText(entryText);
      setIsSaved(true);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not save reflection.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mt-5 space-y-3.5 sm:mt-6 sm:space-y-4">
      <input type="hidden" name="planDayId" value={planDayId} />
      <input type="hidden" name="dayNumber" value={dayNumber} />
      <input type="hidden" name="planSlug" value={planSlug} />
      <input type="hidden" name="reflectionTaskId" value={reflectionTaskId ?? ""} />
      <input type="hidden" name="promptText" value={promptText} />

      <label htmlFor="entryText" className="block text-sm font-medium text-monastic-1">
        Journal Entry
      </label>

      <textarea
        id="entryText"
        name="entryText"
        value={entryText}
        onChange={(event) => handleEntryChange(event.target.value)}
        required
        rows={14}
        disabled={isLocked || isSaving}
        className="monastic-field min-h-[14rem] text-sm leading-6 sm:min-h-[18rem] sm:leading-7"
        placeholder="Write your reflection for today."
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isSubmitDisabled}>
          {isSaving ? "Saving..." : isSaved && !isDirty ? "Saved" : "Save Reflection"}
        </Button>

        <Button asChild variant="secondary">
          <Link href={buildPlanDayHref("/today", planSlug, selectedDay)}>
            Return to Today
          </Link>
        </Button>
      </div>

      <p aria-live="polite" className="text-sm text-monastic-2">
        {errorMessage
          ? errorMessage
          : isSaved && !isDirty
            ? "Reflection saved."
            : " "}
      </p>
    </form>
  );
}
