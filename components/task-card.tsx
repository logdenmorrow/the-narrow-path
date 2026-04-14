import * as React from "react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TaskCardProps = React.HTMLAttributes<HTMLDivElement>;

type TaskCardHeaderProps = {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

type TaskCardMetaProps = React.HTMLAttributes<HTMLDivElement>;

type StatusPillTone =
  | "required"
  | "optional"
  | "done"
  | "started"
  | "momentum"
  | "neutral"
  | "progress";

type StatusPillProps = Omit<BadgeProps, "variant"> & {
  tone?: StatusPillTone;
};

const statusPillToneMap: Record<StatusPillTone, NonNullable<BadgeProps["variant"]>> = {
  required: "required",
  optional: "optional",
  done: "done",
  started: "started",
  momentum: "momentum",
  neutral: "secondary",
  progress: "outline",
};

export function TaskCard({ className, ...props }: TaskCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#ad8e63] bg-[#f4e9d2]/95 p-5 shadow-[0_14px_32px_-22px_rgba(68,44,23,0.58)] dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none",
        className
      )}
      {...props}
    />
  );
}

export function TaskCardHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: TaskCardHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 space-y-2">
        {eyebrow ? (
          <div className="text-xs uppercase tracking-[0.2em] text-[#5b462b] dark:text-zinc-400">
            {eyebrow}
          </div>
        ) : null}
        <div className="text-xl font-semibold text-[#312111] dark:text-white">{title}</div>
        {description ? (
          <div className="text-sm text-[#46331d] dark:text-zinc-300">{description}</div>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function TaskCardMeta({ className, ...props }: TaskCardMetaProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 text-xs text-[#6a5538] dark:text-zinc-400",
        className
      )}
      {...props}
    />
  );
}

export function StatusPill({
  tone = "neutral",
  className,
  ...props
}: StatusPillProps) {
  return (
    <Badge
      variant={statusPillToneMap[tone]}
      className={cn("text-[9px] sm:text-[10px]", className)}
      {...props}
    />
  );
}
