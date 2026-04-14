"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  toggleTaskCompletionWithResult,
  type ToggleTaskCompletionResult,
} from "@/app/today/actions";

function SubmitButton({
  completed,
  locked,
  lockedLabel,
}: {
  completed: boolean;
  locked: boolean;
  lockedLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || locked}
      className={`w-full rounded-lg px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition sm:w-auto sm:text-sm ${
        locked
          ? "border border-amber-800 bg-amber-950/30 text-amber-200"
          : completed
          ? "border border-emerald-700 bg-emerald-900/30 text-emerald-200 hover:bg-emerald-900/50"
          : "border border-border bg-surface-elevated text-fg hover:bg-progress-track"
      } disabled:cursor-not-allowed disabled:opacity-70`}
    >
      {pending
        ? "Saving..."
        : locked
        ? lockedLabel ?? "Locked"
        : completed
        ? "Completed"
        : "Mark Complete"}
    </button>
  );
}

export function TaskCompletionForm({
  planDayTaskId,
  completed,
  locked,
  lockedLabel,
}: {
  planDayTaskId: number;
  completed: boolean;
  locked: boolean;
  lockedLabel?: string;
}) {
  const [showToast, setShowToast] = useState(false);
  const [state, formAction] = useActionState<ToggleTaskCompletionResult, FormData>(
    toggleTaskCompletionWithResult,
    {
      status: "idle",
      planDayTaskId: null,
      transitionedToComplete: false,
    }
  );

  useEffect(() => {
    if (
      state.status === "success" &&
      state.planDayTaskId === planDayTaskId &&
      state.transitionedToComplete
    ) {
      setShowToast(true);

      const toastTimer = window.setTimeout(() => setShowToast(false), 1200);

      return () => {
        window.clearTimeout(toastTimer);
      };
    }
  }, [state, planDayTaskId]);

  return (
    <div className="relative">
      <form action={formAction}>
        <input type="hidden" name="planDayTaskId" value={planDayTaskId} />
        <SubmitButton completed={completed} locked={locked} lockedLabel={lockedLabel} />
      </form>

      <div
        aria-live="polite"
        className={`pointer-events-none absolute right-0 top-full mt-2 rounded-md border border-border bg-surface px-3 py-2 text-xs font-medium text-muted-foreground shadow-lg transition motion-reduce:transition-none ${
          showToast
            ? "translate-y-0 opacity-100 motion-safe:duration-150"
            : "translate-y-1 opacity-0 motion-safe:duration-100"
        }`}
      >
        Saved
      </div>
    </div>
  );
}
