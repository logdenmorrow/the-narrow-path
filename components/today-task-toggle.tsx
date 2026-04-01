"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type TodayTaskToggleProps = {
  userId: string;
  planDayTaskId: number;
  title: string;
  description?: string | null;
  isRequired: boolean;
  initialCompleted: boolean;
  isLocked?: boolean;
  lockedMessage?: string;
};

export default function TodayTaskToggle({
  userId,
  planDayTaskId,
  title,
  description,
  isRequired,
  initialCompleted,
  isLocked = false,
  lockedMessage = "Preview only until launch.",
}: TodayTaskToggleProps) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleToggle = async () => {
    if (isSaving || isLocked) return;

    const supabase = createClient();
    const nextCompleted = !completed;

    setIsSaving(true);
    setError(null);

    try {
      if (nextCompleted) {
        const { error } = await supabase.from("user_task_completions").upsert(
          {
            user_id: userId,
            plan_day_task_id: planDayTaskId,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,plan_day_task_id",
          }
        );

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_task_completions")
          .update({
            completed_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .eq("plan_day_task_id", planDayTaskId);

        if (error) throw error;
      }

      setCompleted(nextCompleted);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setIsSaving(false);
    }
  };

  const statusText = isLocked
    ? "Locked"
    : isSaving
    ? "Saving..."
    : completed
    ? "Completed"
    : "Pending";

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isSaving || isLocked}
        aria-pressed={completed}
        className={`w-full rounded-xl border px-4 py-4 text-left transition ${
          completed
            ? "border-zinc-700 bg-zinc-900"
            : "border-zinc-800 bg-black"
        } ${
          isLocked
            ? "cursor-not-allowed opacity-80"
            : "hover:border-zinc-700"
        } ${isSaving ? "opacity-70" : ""}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`mt-1 flex h-5 w-5 items-center justify-center rounded border text-xs font-bold ${
                completed
                  ? "border-white bg-white text-black"
                  : "border-zinc-600 bg-transparent text-transparent"
              }`}
            >
              ✓
            </div>

            <div>
              <p
                className={`font-medium ${
                  completed ? "text-zinc-300 line-through" : "text-white"
                }`}
              >
                {title}
              </p>

              {description && (
                <p className="mt-1 text-sm text-zinc-400">{description}</p>
              )}

              {isLocked && (
                <p className="mt-2 text-sm text-zinc-500">{lockedMessage}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs uppercase tracking-wide text-zinc-300">
              {isRequired ? "Required" : "Optional"}
            </span>
            <span
              className={`text-xs uppercase tracking-wide ${
                completed ? "text-zinc-300" : "text-zinc-500"
              }`}
            >
              {statusText}
            </span>
          </div>
        </div>
      </button>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}