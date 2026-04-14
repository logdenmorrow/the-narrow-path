import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type TaskCardMetaProps = {
  children: ReactNode;
  className?: string;
};

export function TaskCardMeta({ children, className }: TaskCardMetaProps) {
  return <div className={cn("mt-3 flex flex-wrap items-center gap-2", className)}>{children}</div>;
}
