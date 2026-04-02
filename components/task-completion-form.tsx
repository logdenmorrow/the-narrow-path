"use client";

import { useFormStatus } from "react-dom";
import { toggleTaskCompletion } from "@/app/today/actions";

function SubmitButton({ completed }: { completed: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition sm:text-sm ${
        completed
          ? "border border-emerald-700 bg-emerald-900/30 text-emerald-200 hover:bg-emerald-900/50"
          : "border border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {pending ? "Saving..." : completed ? "Completed" : "Mark Complete"}
    </button>
  );
}

export function TaskCompletionForm({
  planDayTaskId,
  completed,
}: {
  planDayTaskId: number;
  completed: boolean;
}) {
  return (
    <form action={toggleTaskCompletion}>
      <input type="hidden" name="planDayTaskId" value={planDayTaskId} />
      <SubmitButton completed={completed} />
    </form>
  );
}