"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePrayerRequest, savePrayerRequest } from "@/app/today/actions";
import {
  PRAYER_REQUEST_CATEGORY_LABELS,
  PRAYER_REQUEST_CATEGORY_VALUES,
  type PrayerRequestCategory,
} from "@/lib/accountability";
import { Button } from "@/components/ui/button";

type PrayerRequestCardProps = {
  initialCategory: PrayerRequestCategory | null;
  initialNote: string;
  disabled?: boolean;
  helperText?: string;
};

const NOTE_MAX_LENGTH = 200;

export function PrayerRequestCard({
  initialCategory,
  initialNote,
  disabled = false,
  helperText,
}: PrayerRequestCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [category, setCategory] = useState<PrayerRequestCategory>(
    initialCategory ?? "unspoken"
  );
  const [note, setNote] = useState(initialNote);
  const [savedCategory, setSavedCategory] = useState<PrayerRequestCategory | null>(
    initialCategory
  );
  const [savedNote, setSavedNote] = useState(initialNote);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setCategory(initialCategory ?? "unspoken");
    setNote(initialNote);
    setSavedCategory(initialCategory);
    setSavedNote(initialNote);
  }, [initialCategory, initialNote]);

  const hasPrayerRequest = Boolean(savedCategory);

  const handleSubmit = () => {
    if (disabled || isPending) return;

    const trimmedNote = note.trim();
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("category", category);
        formData.set("note", trimmedNote);
        await savePrayerRequest(formData);
        setSavedCategory(category);
        setSavedNote(trimmedNote);
        setIsEditing(false);
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not save prayer request."
        );
      }
    });
  };

  const handleDelete = () => {
    if (disabled || isPending || !hasPrayerRequest) return;

    setErrorMessage(null);

    startTransition(async () => {
      try {
        await deletePrayerRequest();
        setSavedCategory(null);
        setSavedNote("");
        setCategory("unspoken");
        setNote("");
        setIsEditing(false);
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not remove prayer request."
        );
      }
    });
  };

  return (
    <div className="mt-5 space-y-4">
      {hasPrayerRequest && !isEditing ? (
        <div className="space-y-4">
          <div className="rounded-[1.1rem] border border-[rgba(86,124,102,0.45)] bg-[rgba(151,186,164,0.09)] p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5d725f] dark:text-[#a7ccb9]">
              Prayer requested
            </p>
            <p className="mt-3 text-lg font-semibold text-monastic-0">
              {savedCategory ? PRAYER_REQUEST_CATEGORY_LABELS[savedCategory] : ""}
            </p>
            {savedNote ? (
              <p className="mt-2 text-sm leading-6 text-monastic-1">{savedNote}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={disabled || isPending}
              onClick={() => {
                setCategory(savedCategory ?? "unspoken");
                setNote(savedNote);
                setIsEditing(true);
              }}
            >
              Edit Prayer Request
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={disabled || isPending}
              onClick={handleDelete}
            >
              Remove
            </Button>
          </div>
        </div>
      ) : isEditing || !hasPrayerRequest ? (
        <div className="space-y-4">
          {!hasPrayerRequest ? (
            <Button
              type="button"
              variant="secondary"
              disabled={disabled || isPending}
              onClick={() => setIsEditing(true)}
            >
              Request Prayer
            </Button>
          ) : null}

          {isEditing ? (
            <div className="space-y-4 rounded-[1.1rem] border border-[color:var(--line-strong)] bg-[color:var(--surface-2)] p-4">
              <div className="space-y-2">
                <label
                  htmlFor="prayer-category"
                  className="text-sm font-medium text-monastic-1"
                >
                  Category
                </label>
                <select
                  id="prayer-category"
                  value={category}
                  disabled={disabled || isPending}
                  onChange={(event) =>
                    setCategory(event.target.value as PrayerRequestCategory)
                  }
                  className="monastic-field h-11 w-full"
                >
                  {PRAYER_REQUEST_CATEGORY_VALUES.map((value) => (
                    <option key={value} value={value}>
                      {PRAYER_REQUEST_CATEGORY_LABELS[value]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="prayer-note" className="text-sm font-medium text-monastic-1">
                  Optional note. Keep it short. This will be visible to the brotherhood.
                </label>
                <textarea
                  id="prayer-note"
                  value={note}
                  maxLength={NOTE_MAX_LENGTH}
                  rows={4}
                  disabled={disabled || isPending}
                  onChange={(event) => setNote(event.target.value)}
                  className="monastic-field min-h-[7rem] w-full text-sm leading-6"
                />
                <p className="text-xs uppercase tracking-[0.16em] text-monastic-2">
                  {note.length}/{NOTE_MAX_LENGTH}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  disabled={disabled || isPending}
                  onClick={handleSubmit}
                >
                  {isPending ? "Saving..." : "Save Prayer Request"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={disabled || isPending}
                  onClick={() => {
                    setErrorMessage(null);
                    setCategory(savedCategory ?? "unspoken");
                    setNote(savedNote);
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <p aria-live="polite" className="text-sm text-monastic-2">
        {errorMessage
          ? errorMessage
          : isPending
            ? "Saving..."
            : helperText ?? " "}
      </p>
    </div>
  );
}
