import Link from "next/link";
import {
  BookMarked,
  BookOpenText,
  CalendarDays,
  Cross,
  Footprints,
  Pause,
  type LucideIcon,
} from "lucide-react";
import {
  SectionHeader,
  SurfaceCard,
} from "@/components/monastic-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ROADMAP_ITEMS, type RoadmapItem } from "@/lib/season-plan";

type RoadmapTimelineProps = {
  items?: readonly RoadmapItem[];
  variant?: "full" | "compact";
  className?: string;
  showNote?: boolean;
  actionHref?: string;
  actionLabel?: string;
};

const phaseIcons: Record<RoadmapItem["phase"], LucideIcon> = {
  "narrow-path-90": Footprints,
  "july-reset": Pause,
  james: BookOpenText,
  gospels: BookMarked,
  "lent-2027": Cross,
};

export function RoadmapTimeline({
  items = ROADMAP_ITEMS,
  variant = "full",
  className,
  showNote = true,
  actionHref,
  actionLabel = "View roadmap",
}: RoadmapTimelineProps) {
  const isCompact = variant === "compact";

  return (
    <SurfaceCard className={cn("overflow-hidden", className)}>
      <SectionHeader
        kicker="Roadmap"
        title={isCompact ? "What's ahead" : "Roadmap"}
        description={
          isCompact
            ? "A look at what is planned after Narrow Path 90."
            : "A simple look at what is planned after Narrow Path 90."
        }
        action={
          actionHref ? (
            <Button asChild variant="outline" size="sm">
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          ) : null
        }
      />

      <ol
        aria-label="Roadmap timeline"
        className="mt-6 grid gap-5 lg:grid-cols-5"
      >
        {items.map((item, index) => {
          const Icon = phaseIcons[item.phase] ?? CalendarDays;
          const isLast = index === items.length - 1;

          return (
            <li
              key={item.phase}
              className={cn(
                "relative grid min-w-0 grid-cols-[2.75rem_minmax(0,1fr)] gap-3 lg:grid-cols-1 lg:grid-rows-[2.75rem_1fr] lg:gap-4",
                !isLast &&
                  "after:absolute after:left-[1.375rem] after:top-12 after:h-[calc(100%+0.25rem)] after:w-px after:bg-[color:var(--line-soft)] after:content-[''] lg:after:left-1/2 lg:after:top-[1.375rem] lg:after:h-px lg:after:w-full"
              )}
            >
              <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--line-strong)] bg-[color:var(--surface-2)] text-[color:var(--surface-strong)] shadow-[0_10px_24px_-18px_rgba(42,25,15,0.82)] lg:mx-auto">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>

              <div className="relative z-10 min-w-0 rounded-[1rem] border border-monastic bg-[color:var(--surface-2)]/72 p-4 shadow-[0_16px_34px_-30px_rgba(42,25,15,0.8)]">
                <div className="inline-flex max-w-full rounded-full border border-[color:var(--line-soft)] bg-[color:var(--surface-1)] px-2.5 py-1 text-[10px] font-semibold uppercase leading-none tracking-[0.12em] text-monastic-2">
                  <span className="truncate">{item.dateLabel}</span>
                </div>
                <h2
                  className={cn(
                    "mt-3 font-semibold tracking-tight text-monastic-0",
                    isCompact ? "text-lg" : "text-xl"
                  )}
                >
                  {item.title}
                </h2>
                <p
                  className={cn(
                    "mt-2 text-sm leading-6 text-monastic-1",
                    isCompact && "hidden sm:block lg:text-xs lg:leading-5"
                  )}
                >
                  {item.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {showNote ? (
        <p className="mt-6 text-sm leading-6 text-monastic-1">
          Dates and details may be adjusted as plans are finalized.
        </p>
      ) : null}
    </SurfaceCard>
  );
}
