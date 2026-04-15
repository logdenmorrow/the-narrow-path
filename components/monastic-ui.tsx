import * as React from "react";
import { cn } from "@/lib/utils";

type PageFrameProps = React.HTMLAttributes<HTMLDivElement>;

export function PageFrame({ className, ...props }: PageFrameProps) {
  return <div className={cn("monastic-frame py-8 sm:py-10 lg:py-12", className)} {...props} />;
}

type SurfaceProps = React.HTMLAttributes<HTMLDivElement>;

export function SurfaceCard({ className, ...props }: SurfaceProps) {
  return <div className={cn("monastic-card p-5 sm:p-6", className)} {...props} />;
}

export function SurfaceInset({ className, ...props }: SurfaceProps) {
  return <div className={cn("monastic-subcard p-4 sm:p-5", className)} {...props} />;
}

type SectionHeaderProps = {
  kicker?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeader({
  kicker,
  title,
  description,
  action,
  align = "left",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "items-center text-center sm:flex-col sm:items-center",
        className
      )}
    >
      <div className="space-y-3">
        {kicker ? <div className="section-kicker">{kicker}</div> : null}
        <div className="section-rule">
          <h2 className="text-3xl font-semibold tracking-tight text-monastic-0 sm:text-4xl">
            {title}
          </h2>
        </div>
        {description ? (
          <p className="max-w-3xl text-base leading-7 text-monastic-1 sm:text-lg">
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
  meterValue?: number;
  className?: string;
};

export function MetricCard({
  label,
  value,
  detail,
  meterValue,
  className,
}: MetricCardProps) {
  return (
    <SurfaceCard className={cn("h-full", className)}>
      <div className="section-kicker">{label}</div>
      <div className="mt-3 text-3xl font-semibold text-monastic-0 sm:text-4xl">{value}</div>
      {detail ? <p className="mt-2 text-sm leading-6 text-monastic-1 sm:text-base">{detail}</p> : null}
      {typeof meterValue === "number" ? (
        <div className="monastic-meter mt-5">
          <span style={{ width: `${Math.max(0, Math.min(100, meterValue))}%` }} />
        </div>
      ) : null}
    </SurfaceCard>
  );
}

type HeroPanelProps = React.HTMLAttributes<HTMLDivElement>;

export function HeroPanel({ className, ...props }: HeroPanelProps) {
  return <section className={cn("monastic-hero px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12", className)} {...props} />;
}

type ReadingColumnProps = React.HTMLAttributes<HTMLDivElement>;

export function ReadingColumn({ className, ...props }: ReadingColumnProps) {
  return <div className={cn("monastic-prose", className)} {...props} />;
}
