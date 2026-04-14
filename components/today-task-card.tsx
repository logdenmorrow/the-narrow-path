"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Check } from "lucide-react";
import { toggleTaskCompletion } from "@/app/today/actions";
import { StatusPill, TaskCard, TaskCardMeta } from "@/components/task-card";
import { Button } from "@/components/ui/button";

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
      className="group"
    >
      <input type="hidden" name="planDayTaskId" value={planDayTaskId} />

      <TaskCard
        className={`p-4 transition ${
          optimisticCompleted
            ? "border-emerald-700/60 bg-[#f0e8d8] dark:bg-zinc-950"
            : "bg-[#f8f0df] hover:border-[#a98056] dark:bg-zinc-950"
        } active:scale-[0.99] active:bg-[#efe2ca] dark:active:bg-zinc-900`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={`text-base font-semibold sm:text-lg ${
                  optimisticCompleted
                    ? "text-[#70543c] dark:text-emerald-100"
                    : "text-[#3c2a1b] dark:text-white"
                }`}
              >
                {title}
              </h3>

              {isRequired ? <StatusPill tone="required">Required Today</StatusPill> : null}
              {!isRequired && isOptional ? (
                <StatusPill tone="optional">Optional Today</StatusPill>
              ) : null}
              {progressLabel ? (
                <StatusPill tone="progress">{progressLabel}</StatusPill>
              ) : null}
            </div>

            {note ? (
              <p
                className={`text-sm leading-6 ${
                  optimisticCompleted
                    ? "text-[#876955] dark:text-zinc-300"
                    : "text-[#6c4c32] dark:text-zinc-300"
                }`}
              >
                {note}
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || locked || Boolean(href)}
            aria-label={`Toggle completion for ${title}`}
            aria-pressed={optimisticCompleted}
            variant="secondary"
            size="icon"
            className="h-11 w-11 shrink-0"
          >
            <span
              aria-hidden="true"
              className={`flex h-6 w-6 items-center justify-center rounded border ${
                optimisticCompleted
                  ? "border-[#2f8067] bg-[#7cd9b7] text-[#1f3c30]"
                  : "border-[#9f8a6b] bg-transparent text-transparent dark:border-zinc-600"
              }`}
            >
              <Check className="h-4 w-4" />
            </span>
          </Button>
        </div>

        <TaskCardMeta className="mt-3 justify-between gap-3">
          <span className="uppercase tracking-[0.2em] text-[#84654a] dark:text-zinc-400">
            {isSubmitting
              ? "Saving..."
              : href
                ? "Open journal"
                : locked
                  ? lockedLabel ?? "Locked"
                  : optimisticCompleted
                    ? "Completed"
                    : "Tap to mark complete"}
          </span>

          {href ? (
            <Button asChild variant="secondary" size="xs">
              <Link href={href}>Open Reflection</Link>
            </Button>
          ) : null}
        </TaskCardMeta>
      </TaskCard>
    </form>
  );
}
