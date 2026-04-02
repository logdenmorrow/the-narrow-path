"use client";

import { useFormStatus } from "react-dom";
import { toggleTaskCompletion } from "@/app/today/actions";

function SubmitButton({
  completed,
  locked,
}: {
  completed: boolean;
  locked: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || locked}
      className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition sm:text-sm ${
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
        ? "Locked Until Launch"
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
}: {
  planDayTaskId: number;
  completed: boolean;
  locked: boolean;
}) {
  return (
    <form action={toggleTaskCompletion}>
      <input type="hidden" name="planDayTaskId" value={planDayTaskId} />
      <SubmitButton completed={completed} locked={locked} />
    </form>
  );
}