import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type TaskCardProps = {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  completed?: boolean;
};

export function TaskCard({ children, className, interactive = false, completed = false }: TaskCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-[#f8efdd] p-4 shadow-[0_8px_20px_-14px_rgba(68,44,23,0.55)] dark:border-zinc-800 dark:bg-black dark:shadow-none",
        completed ? "border-[#1e8f6a]/60" : "border-[#ab8b61]",
        interactive && "transition hover:border-[#94724a] hover:bg-[#f3e5ca] active:scale-[0.99] dark:hover:border-zinc-600",
        className
      )}
    >
      {children}
    </div>
  );
}
