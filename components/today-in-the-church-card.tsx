import Link from "next/link";
import { Button } from "@/components/ui/button";
import { type LiturgicalCalendarEntry } from "@/lib/liturgical-calendar";

type TodayInTheChurchCardProps = {
  day: LiturgicalCalendarEntry;
};

export function TodayInTheChurchCard({ day }: TodayInTheChurchCardProps) {
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

      <Button asChild variant="secondary">
        <Link href={href}>Learn about today</Link>
      </Button>
    </div>
  );
}
