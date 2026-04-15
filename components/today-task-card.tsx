"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const previousCompletedRef = useRef(completed);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optimisticCompleted, setOptimisticCompleted] = useState(completed);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (completed !== previousCompletedRef.current) {
      previousCompletedRef.current = completed;
      setOptimisticCompleted(completed);
    }
  }, [completed]);

  const isBusy = isSubmitting || locked || Boolean(href);

  const submitTask = async (formData: FormData) => {
    if (isBusy) return;

    const nextCompleted = !optimisticCompleted;
    setIsSubmitting(true);
    setOptimisticCompleted(nextCompleted);
    setErrorMessage(null);

    try {
      await toggleTaskCompletion(formData);
      router.refresh();
    } catch (error) {
      setOptimisticCompleted((prev) => !prev);
      setErrorMessage(
        error instanceof Error ? error.message : "Could not update this task right now."
      );
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
        className={`p-4 transition duration-200 ${
          optimisticCompleted
            ? "border-[rgba(86,124,102,0.45)] bg-[rgba(151,186,164,0.09)]"
            : "hover:border-[color:var(--line-strong)] hover:bg-[color:var(--surface-2)]"
        } active:scale-[0.99]`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={`text-base font-semibold sm:text-lg ${
                  optimisticCompleted
                    ? "text-[#5d725f] dark:text-[#a7ccb9]"
                    : "text-monastic-0"
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
                    ? "text-[#6f776d] dark:text-[#c2b49c]"
                    : "text-monastic-1"
                }`}
              >
                {note}
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            disabled={isBusy}
            aria-label={`Toggle completion for ${title}`}
            aria-pressed={optimisticCompleted}
            aria-busy={isSubmitting}
            variant="secondary"
            size="icon"
            className="h-12 w-12 shrink-0 rounded-[1.1rem]"
          >
            <span
              aria-hidden="true"
              className={`flex h-7 w-7 items-center justify-center rounded-[0.7rem] border transition ${
                isSubmitting
                  ? "border-[#7d887b] bg-[rgba(154,185,165,0.12)] text-[#7d887b]"
                  : optimisticCompleted
                  ? "border-[#57785e] bg-[#9ab9a5] text-[#223127]"
                  : "border-[color:var(--line-strong)] bg-transparent text-transparent"
              }`}
            >
              {isSubmitting ? (
                <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin motion-reduce:animate-none" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </span>
          </Button>
        </div>

        <TaskCardMeta className="mt-3 justify-between gap-3">
          <span>
            {errorMessage
              ? errorMessage
              : isSubmitting
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
