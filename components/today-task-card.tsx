"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { toggleTaskCompletion } from "@/app/today/actions";

type TodayTaskCardProps = {
  planDayTaskId: number;
  title: string;
  note?: string | null;
  isRequired: boolean;
  isOptional: boolean;
  progressLabel?: string | null;
  completed: boolean;
  locked: boolean;
  lockedLabel?: string;
  href?: string;
};

const INTERACTIVE_TARGET_SELECTOR =
  "a, button, input, textarea, select, [role='button'], [role='link']";

export function TodayTaskCard({
  planDayTaskId,
  title,
  note,
  isRequired,
  isOptional,
  progressLabel,
  completed,
  locked,
  lockedLabel,
  href,
}: TodayTaskCardProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optimisticCompleted, setOptimisticCompleted] = useState(completed);

  const isBusy = isSubmitting || locked || Boolean(href);

  const submitTask = async (formData: FormData) => {
    if (isBusy) return;

    const nextCompleted = !optimisticCompleted;
    setIsSubmitting(true);
    setOptimisticCompleted(nextCompleted);

    try {
      await toggleTaskCompletion(formData);
    } catch {
      setOptimisticCompleted((prev) => !prev);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      ref={formRef}
      action={submitTask}
      onClick={(event) => {
        if (isBusy) return;

        const target = event.target as HTMLElement;
        if (target.closest(INTERACTIVE_TARGET_SELECTOR)) return;

        formRef.current?.requestSubmit();
      }}
      className={`group rounded-xl border bg-app p-4 transition ${
        optimisticCompleted
          ? "border-emerald-800/80"
          : "border-border hover:border-border"
      } active:scale-[0.99] active:bg-surface`}
    >
      <input type="hidden" name="planDayTaskId" value={planDayTaskId} />

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={`text-base font-semibold sm:text-lg ${
                optimisticCompleted ? "text-muted" : "text-fg"
              }`}
            >
              {title}
            </h3>

            {isRequired && (
              <span className="rounded-full border border-red-700 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-red-200">
                Required Today
              </span>
            )}

            {!isRequired && isOptional && (
              <span className="rounded-full border border-border px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Optional Today
              </span>
            )}

            {progressLabel && (
              <span className="rounded-full border border-blue-700 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-blue-200">
                {progressLabel}
              </span>
            )}
          </div>

          {note ? (
            <p
              className={`text-sm leading-6 ${
                optimisticCompleted ? "text-muted" : "text-muted"
              }`}
            >
              {note}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || locked || Boolean(href)}
          aria-label={`Toggle completion for ${title}`}
          aria-pressed={optimisticCompleted}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border bg-surface-elevated text-fg transition hover:bg-progress-track active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <span
            aria-hidden="true"
            className={`flex h-6 w-6 items-center justify-center rounded border text-sm font-semibold ${
              optimisticCompleted
                ? "border-emerald-300 bg-emerald-300 text-accent-foreground"
                : "border-border bg-transparent text-transparent"
            }`}
          >
            ✓
          </span>
        </button>
      </div>

      <p className="mt-3 text-xs uppercase tracking-[0.2em] text-muted">
        {isSubmitting
          ? "Saving..."
          : href
          ? "Open journal"
          : locked
          ? lockedLabel ?? "Locked"
          : optimisticCompleted
          ? "Completed"
          : "Tap to mark complete"}
      </p>

      {href ? (
        <Link
          href={href}
          className="mt-3 inline-flex rounded-lg border border-border px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-fg transition hover:bg-surface-elevated"
        >
          Open Reflection
        </Link>
      ) : null}
    </form>
  );
}
