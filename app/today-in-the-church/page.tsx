import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  PageFrame,
  SectionHeader,
  SurfaceCard,
  SurfaceInset,
} from "@/components/monastic-ui";
import {
  addDaysToIsoDate,
  formatLiturgicalDate,
  getEasternDateIso,
  getLiturgicalCalendarDay,
  isIsoDate,
} from "@/lib/liturgical-calendar";

type TodayInTheChurchSearchParams = Promise<{
  date?: string | string[];
}>;

export default async function TodayInTheChurchPage({
  searchParams,
}: {
  searchParams: TodayInTheChurchSearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const rawDate = Array.isArray(resolvedSearchParams.date)
    ? resolvedSearchParams.date[0]
    : resolvedSearchParams.date;
  const dateIso = isIsoDate(rawDate) ? rawDate : getEasternDateIso();
  const day = getLiturgicalCalendarDay(dateIso);
  const previousDate = addDaysToIsoDate(dateIso, -1);
  const nextDate = addDaysToIsoDate(dateIso, 1);

  return (
    <main className="monastic-page">
      <PageFrame className="max-w-5xl space-y-5 sm:space-y-6">
        <SurfaceCard>
          <SectionHeader
            kicker={formatLiturgicalDate(dateIso)}
            title={day.title}
            description={`${day.rank} • ${day.liturgical_color} • ${day.season}`}
            action={
              <Button asChild variant="secondary">
                <Link href="/today">Back to Today</Link>
              </Button>
            }
          />
          {day.isFallback ? (
            <SurfaceInset className="mt-5 border-[rgba(168,129,81,0.34)] bg-[rgba(168,129,81,0.08)]">
              <p className="text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7">
                Detailed calendar information has not been added for this date
                yet.
              </p>
            </SurfaceInset>
          ) : null}
        </SurfaceCard>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.34fr)]">
          <div className="grid gap-5">
            <SurfaceCard>
              <SectionHeader kicker="Overview" title="Why this day matters" />
              <p className="mt-5 text-base leading-7 text-monastic-1">
                {day.summary}
              </p>
            </SurfaceCard>

            <SurfaceCard>
              <SectionHeader
                kicker="About"
                title="About this day"
              />
              <p className="mt-5 text-base leading-7 text-monastic-1">
                {day.description}
              </p>
            </SurfaceCard>

            <SurfaceCard>
              <SectionHeader kicker="Catholic connection" title="Catholic connection" />
              <p className="mt-5 text-base leading-7 text-monastic-1">
                {day.catholic_connection}
              </p>
            </SurfaceCard>
          </div>

          <aside className="grid gap-5 self-start">
            <SurfaceCard>
              <SectionHeader kicker="Calendar" title="Date" />
              <div className="mt-5 grid gap-3">
                <SurfaceInset>
                  <div className="section-kicker">Rank</div>
                  <p className="mt-2 text-lg font-semibold text-monastic-0">
                    {day.rank}
                  </p>
                </SurfaceInset>
                <SurfaceInset>
                  <div className="section-kicker">Color</div>
                  <p className="mt-2 text-lg font-semibold text-monastic-0">
                    {day.liturgical_color}
                  </p>
                </SurfaceInset>
                <SurfaceInset>
                  <div className="section-kicker">Season</div>
                  <p className="mt-2 text-lg font-semibold text-monastic-0">
                    {day.season}
                  </p>
                </SurfaceInset>
              </div>
            </SurfaceCard>

            <SurfaceCard>
              <SectionHeader kicker="Move" title="Other dates" />
              <div className="mt-5 grid gap-3">
                <Button asChild variant="secondary" className="w-full">
                  <Link href={`/today-in-the-church?date=${previousDate}`}>
                    Previous Date
                  </Link>
                </Button>
                <Button asChild variant="secondary" className="w-full">
                  <Link href={`/today-in-the-church?date=${nextDate}`}>
                    Next Date
                  </Link>
                </Button>
              </div>
            </SurfaceCard>

            <SurfaceCard>
              <SectionHeader kicker="Sources" title="Learn more" />
              <div className="mt-5 grid gap-3 text-sm leading-6 text-monastic-1">
                {day.sources.map((source) => (
                  <a
                    key={`${source.label}-${source.url}`}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-4 transition hover:text-monastic-0"
                  >
                    {source.label}
                  </a>
                ))}
              </div>
            </SurfaceCard>
          </aside>
        </div>
      </PageFrame>
    </main>
  );
}
