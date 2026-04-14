import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type TaskCardActionsProps = {
  children: ReactNode;
  className?: string;
};

export function TaskCardActions({ children, className }: TaskCardActionsProps) {
  return <div className={cn("mt-4 flex flex-wrap items-center gap-2", className)}>{children}</div>;
}
