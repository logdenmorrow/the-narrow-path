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
        "monastic-card p-4 sm:p-5",
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
          <div className="section-kicker">
            {eyebrow}
          </div>
        ) : null}
        <div className="text-xl font-semibold text-monastic-0 sm:text-2xl">{title}</div>
        {description ? (
          <div className="text-sm leading-6 text-monastic-1">{description}</div>
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
        "flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.12em] text-monastic-2 sm:tracking-[0.18em]",
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
      className={cn("text-[9px] tracking-[0.12em] sm:text-[10px] sm:tracking-[0.22em]", className)}
      {...props}
    />
  );
}
