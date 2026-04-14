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
  pulseCheck,
}: {
  completed: boolean;
  locked: boolean;
  lockedLabel?: string;
  pulseCheck: boolean;
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
          : "border border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
      } disabled:cursor-not-allowed disabled:opacity-70`}
    >
      {pending
        ? "Saving..."
        : locked
        ? lockedLabel ?? "Locked"
        : completed
        ? (
            <span className="inline-flex items-center gap-1">
              Completed
              <span
                className={`inline-block ${
                  pulseCheck ? "motion-safe:animate-ping motion-reduce:animate-none" : ""
                }`}
              >
                ✓
              </span>
            </span>
          )
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
  const [pulseCheck, setPulseCheck] = useState(false);
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
      setPulseCheck(true);

      const toastTimer = window.setTimeout(() => setShowToast(false), 1400);
      const pulseTimer = window.setTimeout(() => setPulseCheck(false), 500);

      return () => {
        window.clearTimeout(toastTimer);
        window.clearTimeout(pulseTimer);
      };
    }
  }, [state, planDayTaskId]);

  return (
    <div className="relative">
      <form action={formAction}>
        <input type="hidden" name="planDayTaskId" value={planDayTaskId} />
        <SubmitButton
          completed={completed}
          locked={locked}
          lockedLabel={lockedLabel}
          pulseCheck={pulseCheck}
        />
      </form>

      <div
        aria-live="polite"
        className={`pointer-events-none absolute right-0 top-full mt-2 rounded-md border border-emerald-700/60 bg-emerald-950/90 px-3 py-2 text-xs font-medium text-emerald-100 shadow-lg transition motion-reduce:transition-none ${
          showToast
            ? "translate-y-0 opacity-100 motion-safe:duration-150"
            : "translate-y-1 opacity-0 motion-safe:duration-100"
        }`}
      >
        Nice—+1 consistency
      </div>
    </div>
  );
}
