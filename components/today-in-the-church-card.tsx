import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  type LiturgicalCalendarEntry,
  type LiturgicalProperCalendarOverlay,
} from "@/lib/liturgical-calendar";

type TodayInTheChurchCardProps = {
  day: LiturgicalCalendarEntry;
  properOverlays?: LiturgicalProperCalendarOverlay[];
};

export function TodayInTheChurchCard({
  day,
  properOverlays = [],
}: TodayInTheChurchCardProps) {
  const href = `/today-in-the-church?date=${day.date}`;

  return (
    <div className="mt-5 space-y-4">
      <Link
        href={href}
        className="block rounded-[1.1rem] border border-monastic bg-[color:var(--surface-2)] p-4 transition hover:border-[color:var(--line-strong)] hover:bg-[color:var(--surface-3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-monastic-2">
          {day.rank} • {day.liturgical_color}
          {day.season ? ` • ${day.season}` : ""}
        </p>
        <p className="mt-3 text-xl font-semibold leading-7 text-monastic-0">
          {day.title}
        </p>
        <p className="mt-2 text-sm leading-6 text-monastic-1">{day.summary}</p>
        {day.isFallback ? (
          <p className="mt-2 text-sm leading-6 text-monastic-2">
            Detailed calendar information has not been added for this date yet.
          </p>
        ) : null}
      </Link>

      {properOverlays.length > 0 ? (
        <div className="rounded-[1.1rem] border border-monastic bg-[color:var(--surface-1)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-monastic-2">
            Dominican calendar
          </p>
          <div className="mt-3 space-y-3">
            {properOverlays.map((overlay) => (
              <div key={`${overlay.scope}-${overlay.scope_key}-${overlay.title}`}>
                <p className="text-sm font-semibold text-monastic-0">
                  {overlay.title}
                </p>
                <p className="mt-1 text-xs leading-5 text-monastic-2">
                  {overlay.rank}
                  {overlay.liturgical_color
                    ? ` • Color if celebrated: ${overlay.liturgical_color}`
                    : ""}
                </p>
                {overlay.display_note ? (
                  <p className="mt-2 text-sm leading-6 text-monastic-1">
                    {overlay.display_note}
                  </p>
                ) : null}
                {overlay.occurrence_note ? (
                  <p className="mt-2 text-xs leading-5 text-monastic-2">
                    {overlay.occurrence_note}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <Button asChild variant="secondary">
        <Link href={href}>Learn about today</Link>
      </Button>
      <p className="text-xs leading-5 text-monastic-2">
        <Link
          href="/settings#liturgical-calendar"
          className="underline underline-offset-4 transition hover:text-monastic-0"
        >
          Calendar preference
        </Link>
      </p>
    </div>
  );
}
