import {
  AUGUST_JAMES_PLAN,
  GOSPEL_READING_ORDER,
  SEASON_TIMELINE,
  type SeasonPhase,
} from "@/lib/season-plan";
import { SectionHeader, SurfaceCard, SurfaceInset } from "@/components/monastic-ui";
import { cn } from "@/lib/utils";

type SeasonTimelineProps = {
  currentPhase?: SeasonPhase | null;
  className?: string;
};

export function SeasonTimeline({
  currentPhase,
  className,
}: SeasonTimelineProps) {
  return (
    <SurfaceCard id="whats-next" className={className}>
      <SectionHeader
        kicker="What's Next"
        title="Upcoming Seasons"
        description="The 90-day challenge closes July 4. The app stays open for review, prayer resources, and the next Scripture seasons."
      />

      <div className="mt-5 grid gap-3 sm:mt-6 lg:grid-cols-5">
        {SEASON_TIMELINE.map((item) => {
          const isCurrent = item.phase === currentPhase;

          return (
            <SurfaceInset
              key={item.phase}
              className={cn(
                "flex h-full flex-col gap-3",
                isCurrent &&
                  "border-[rgba(168,129,81,0.46)] bg-[rgba(168,129,81,0.09)]"
              )}
            >
              <div className="section-kicker">{item.dateLabel}</div>
              <div className="text-lg font-semibold text-monastic-0">
                {item.title}
              </div>
              <p className="text-sm leading-6 text-monastic-1">
                {item.description}
              </p>
              <p className="mt-auto text-xs uppercase tracking-[0.14em] text-monastic-2">
                {item.intensity}
              </p>
            </SurfaceInset>
          );
        })}
      </div>
    </SurfaceCard>
  );
}

export function JamesScaffoldingCard() {
  return (
    <SurfaceCard>
      <SectionHeader
        kicker="August"
        title={AUGUST_JAMES_PLAN.title}
        description={AUGUST_JAMES_PLAN.purpose}
      />

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <SurfaceInset>
          <p className="text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7">
            Read through the Letter of James slowly. Keep praying, stay close to
            the sacraments, and prepare for The Gospels in September.
          </p>
          <div className="mt-4 grid gap-2 text-sm leading-6 text-monastic-1">
            <p>Required: {AUGUST_JAMES_PLAN.required.join(", ")}.</p>
            <p>Optional: {AUGUST_JAMES_PLAN.optional.join(", ")}.</p>
            <p>{AUGUST_JAMES_PLAN.dataStatus}</p>
          </div>
        </SurfaceInset>

        <SurfaceInset>
          <div className="section-kicker">Display outline only</div>
          <div className="mt-3 grid gap-2">
            {AUGUST_JAMES_PLAN.displayOutline.map((item) => (
              <p key={item} className="text-sm leading-6 text-monastic-1">
                {item}
              </p>
            ))}
          </div>
        </SurfaceInset>
      </div>
    </SurfaceCard>
  );
}

export function GospelScaffoldingCard() {
  return (
    <SurfaceCard>
      <SectionHeader
        kicker="September to Lent"
        title="The Gospels"
        description="Read through Mark, Matthew, Luke, and John from September to Lent."
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {GOSPEL_READING_ORDER.map((book, index) => (
          <SurfaceInset key={book}>
            <div className="section-kicker">Book {index + 1}</div>
            <p className="mt-2 text-xl font-semibold text-monastic-0">{book}</p>
          </SurfaceInset>
        ))}
      </div>
    </SurfaceCard>
  );
}
