import * as React from "react";
import { cn } from "@/lib/utils";

type PageFrameProps = React.HTMLAttributes<HTMLDivElement>;

export function PageFrame({ className, ...props }: PageFrameProps) {
  return <div className={cn("monastic-frame min-w-0 max-w-full py-5 sm:py-8", className)} {...props} />;
}

type SurfaceProps = React.HTMLAttributes<HTMLDivElement>;

export function SurfaceCard({ className, ...props }: SurfaceProps) {
  return <div className={cn("monastic-card min-w-0 max-w-full p-4 sm:p-6", className)} {...props} />;
}

export function SurfaceInset({ className, ...props }: SurfaceProps) {
  return <div className={cn("monastic-subcard min-w-0 max-w-full py-3.5 sm:py-4", className)} {...props} />;
}

type SectionHeaderProps = {
  kicker?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  align?: "left" | "center";
  level?: "h1" | "h2" | "h3";
  className?: string;
};

export function SectionHeader({
  kicker,
  title,
  description,
  action,
  align = "left",
  level = "h2",
  className,
}: SectionHeaderProps) {
  const Heading = level;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "items-center text-center sm:flex-col sm:items-center",
        className
      )}
    >
      <div className="min-w-0 max-w-full space-y-2">
        {kicker ? <p className="section-kicker">{kicker}</p> : null}
        <div>
          <Heading className="text-2xl font-semibold tracking-tight text-monastic-0 sm:text-3xl">
            {title}
          </Heading>
        </div>
        {description ? (
          <p className="max-w-3xl text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7">
            {description}
          </p>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

type MetricCardProps = {
  label: React.ReactNode;
  value: React.ReactNode;
  detail?: React.ReactNode;
  action?: React.ReactNode;
  meterValue?: number;
  className?: string;
  valueClassName?: string;
};

export function MetricCard({
  label,
  value,
  detail,
  action,
  meterValue,
  className,
  valueClassName,
}: MetricCardProps) {
  return (
    <div className={cn("monastic-stat h-full", className)}>
      <div className="text-sm font-medium text-monastic-1">{label}</div>
      <div className={cn("mt-1 text-2xl font-semibold text-monastic-0 sm:text-3xl", valueClassName)}>{value}</div>
      {detail ? <p className="mt-2 text-sm leading-6 text-monastic-1 sm:text-base">{detail}</p> : null}
      {typeof meterValue === "number" ? (
        <div className="monastic-meter mt-4 sm:mt-5">
          <span style={{ width: `${Math.max(0, Math.min(100, meterValue))}%` }} />
        </div>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

type HeroPanelProps = React.HTMLAttributes<HTMLDivElement>;

export function HeroPanel({ className, ...props }: HeroPanelProps) {
  return <section className={cn("monastic-hero px-0 py-4 sm:py-6", className)} {...props} />;
}

type ReadingColumnProps = React.HTMLAttributes<HTMLDivElement>;

export function ReadingColumn({ className, ...props }: ReadingColumnProps) {
  return <div className={cn("monastic-prose", className)} {...props} />;
}
