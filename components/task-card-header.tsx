import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type TaskCardHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  titleClassName?: string;
};

export function TaskCardHeader({
  title,
  subtitle,
  action,
  className,
  titleClassName,
}: TaskCardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div className="min-w-0 flex-1">
        <p className={cn("text-base font-semibold text-[#312111] dark:text-white", titleClassName)}>
          {title}
        </p>
        {subtitle ? <p className="mt-1 text-sm text-[#5e4a31] dark:text-zinc-500">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
