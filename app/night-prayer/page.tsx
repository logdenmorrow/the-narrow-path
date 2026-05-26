import Link from "next/link";
import { redirect } from "next/navigation";
import {
  HeroPanel,
  PageFrame,
  SectionHeader,
  SurfaceCard,
  SurfaceInset,
} from "@/components/monastic-ui";
import { AppActionBar } from "@/components/page-actions";
import { TodayTaskCard } from "@/components/today-task-card";
import { Button } from "@/components/ui/button";
import { getChallengeTiming } from "@/lib/challenge";
import { ORIGINAL_CHALLENGE_PLAN_SLUG } from "@/lib/season-plan";
import { buildPlanDayHref } from "@/lib/plan-day-url";
import {
  getDivineOfficeDateUrl,
  getNightPrayerBlocks,
  type NightPrayerBlock,
} from "@/lib/night-prayer";
import { createClient } from "@/lib/supabase/server";
import { updateLastActiveAt } from "@/lib/last-active";
import { formatReadableDate } from "@/lib/task-progress";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type PlanDayRow = {
  id: number;
  day_number: number;
  title: string | null;
};

type NightPrayerTaskRow = {
  id: number;
  requirement_note: string | null;
  day_date: string | null;
  task_templates:
    | {
        title: string | null;
        slug: string | null;
      }
    | Array<{
        title: string | null;
        slug: string | null;
      }>
    | null;
};

type NightPrayerRow = {
  prayer_date: string;
  source: string;
  source_url: string | null;
  liturgical_day: string | null;
  title: string | null;
  subtitle: string | null;
  content_json: unknown;
  copyright_notice: string | null;
  attribution_html: string | null;
  imported_at: string | null;
  updated_at: string | null;
};

type CompletionRow = {
  id: number;
};

const PAGE_CARD_CLASS = "mx-auto w-full max-w-4xl xl:max-w-5xl";

const HOLY_SPIRIT_EXAMEN_LINES = [
  "Pause quietly and ask the Holy Spirit to reveal the day truthfully.",
  "",
  "Where did I follow God’s grace today?",
  "Where did I resist Him?",
  "Where was I proud, impatient, distracted, uncharitable, impure, lazy, or afraid?",
  "Where did I fail to love God, my neighbor, or my duties?",
  "",
  "Ask for sorrow, receive God’s mercy, and resolve to begin again tomorrow.",
  "",
  "Pause briefly.",
];

const HAIL_MARY_LINES = [
  "Hail Mary, full of grace, the Lord is with thee.",
  "Blessed art thou among women, and blessed is the fruit of thy womb, Jesus.",
  "Holy Mary, Mother of God, pray for us sinners,",
  "now and at the hour of our death. Amen.",
];

const CLOSING_SIGN_OF_THE_CROSS =
  "In the name of the Father, and of the Son, and of the Holy Spirit. Amen.";

function normalizeDayNumber(value: number, totalDays: number) {
  if (!Number.isFinite(value)) return 1;
  const rounded = Math.floor(value);
  if (rounded < 1) return 1;
  if (rounded > totalDays) return totalDays;
  return rounded;
}

function normalizeTaskTemplate(
  relation: NightPrayerTaskRow["task_templates"]
): { title: string; slug: string } {
  const template = Array.isArray(relation) ? relation[0] : relation;

  return {
    title: template?.title ?? "Night Prayer",
    slug: template?.slug ?? "",
  };
}

function splitPrayerBlocks(blocks: NightPrayerBlock[]) {
  const firstPrayerIndex = blocks.findIndex((block) =>
    block.lines.some((line) => /^God,\s+come to my assistance\.?$/i.test(line.trim()))
  );

  if (firstPrayerIndex <= 0) {
    return {
      sourceDetailBlocks: [] as NightPrayerBlock[],
      prayerBlocks: blocks,
    };
  }

  return {
    sourceDetailBlocks: blocks.slice(0, firstPrayerIndex),
    prayerBlocks: blocks.slice(firstPrayerIndex),
  };
}

function isMajorSectionHeading(block: NightPrayerBlock) {
  const firstLine = block.lines[0]?.trim() ?? "";

  return /^(HYMN|PSALMODY|READING|RESPONSORY|Gospel Canticle|Concluding Prayer|Blessing|Antiphon or song in honor of the Blessed Virgin Mary|Antiphon or Song in Honor of the Blessed Virgin Mary)$/i.test(
    firstLine
  );
}

function isSectionHeading(block: NightPrayerBlock, section: string) {
  return block.lines[0]?.trim().toLowerCase() === section.toLowerCase();
}

function isMarianAntiphonHeading(block: NightPrayerBlock) {
  return /^Antiphon or song in honor of the Blessed Virgin Mary$/i.test(
    block.lines[0]?.trim() ?? ""
  );
}

function isAntiphonLine(line: string) {
  return /^Ant\.\s*/i.test(line.trim());
}

function getAntiphonText(line: string) {
  const antiphon = line.trim().replace(/^Ant\.\s*\d*\s*/i, "").trim();
  return antiphon || line.trim();
}

function hasExaminationHeading(block: NightPrayerBlock) {
  return block.lines.some((line) => /^Examination of conscience:?$/i.test(line.trim()));
}

function getLineClassName(line: string) {
  const trimmed = line.trim();

  if (/^[—–-]\s+/.test(trimmed)) {
    return "block pl-6 text-monastic-1";
  }

  if (isAntiphonLine(trimmed)) {
    return "font-medium italic text-[#6f4c2a] dark:text-[#dcc39c]";
  }

  return "";
}

function renderLine(line: string, index: string) {
  if (isAntiphonLine(line)) {
    return (
      <span key={index} className="block">
        <span className="mb-1 block text-[9px] font-semibold uppercase tracking-[0.14em] text-monastic-2 sm:text-[10px] sm:tracking-[0.22em]">
          Antiphon
        </span>
        <span className="font-medium italic text-[#6f4c2a] dark:text-[#dcc39c]">
          {getAntiphonText(line)}
        </span>
      </span>
    );
  }

  return (
    <span key={index} className={getLineClassName(line)}>
      {line}
    </span>
  );
}

function renderBlock(block: NightPrayerBlock, index: number, compact = false) {
  const isMajorHeading = isMajorSectionHeading(block);
  const className = isMajorHeading
    ? "mt-6 border-t border-monastic pt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a5f32] first:mt-0 first:border-t-0 first:pt-0 dark:text-[#d8bd91] sm:mt-8 sm:pt-6 sm:text-xs sm:tracking-[0.24em]"
    : block.type === "heading"
      ? "mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#8a5f32] dark:text-[#d8bd91] sm:mt-5 sm:text-sm sm:tracking-[0.18em]"
      : block.type === "note"
        ? "text-sm leading-6 text-monastic-2 sm:leading-7"
        : compact
          ? "text-sm leading-6 text-monastic-1 sm:leading-7"
          : "text-[0.95rem] leading-7 text-monastic-0 sm:text-base sm:leading-8";

  return (
    <p key={`${block.type}-${index}`} className={className}>
      {block.lines.map((line, lineIndex) => (
        <span key={`${index}-${lineIndex}`}>
          {renderLine(line, `${index}-${lineIndex}`)}
          {lineIndex < block.lines.length - 1 ? <br /> : null}
        </span>
      ))}
    </p>
  );
}

function renderExamenGuide() {
  return (
    <SurfaceInset className="my-4 border-[rgba(86,124,102,0.32)] bg-[rgba(151,186,164,0.08)] sm:my-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5d725f] dark:text-[#a7ccb9] sm:text-xs sm:tracking-[0.22em]">
        Solo Examination Guide
      </p>
      <div className="mt-3 space-y-2.5 text-sm leading-6 text-monastic-1 sm:space-y-3 sm:text-base sm:leading-7">
        {HOLY_SPIRIT_EXAMEN_LINES.map((line, index) =>
          line ? <p key={`examen-${index}`}>{line}</p> : null
        )}
      </div>
    </SurfaceInset>
  );
}

function renderHymnDetails(blocks: NightPrayerBlock[], startIndex: number) {
  return (
    <details
      key={`hymn-${startIndex}`}
      className="mt-6 rounded-xl border border-monastic bg-[rgba(168,129,81,0.05)] px-3.5 py-3.5 sm:mt-8 sm:px-4 sm:py-4"
    >
      <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a5f32] transition hover:text-monastic-0 dark:text-[#d8bd91] sm:text-xs sm:tracking-[0.24em]">
        Hymn
      </summary>
      <p className="mt-2 text-sm leading-6 text-monastic-2">
        Optional when praying this solo.
      </p>
      <div className="mt-4 space-y-4 border-t border-monastic pt-4">
        {blocks.slice(1).map((block, index) => renderBlock(block, startIndex + index, true))}
      </div>
    </details>
  );
}

function renderResponsory(blocks: NightPrayerBlock[], startIndex: number) {
  return (
    <div
      key={`responsory-${startIndex}`}
      className="mt-6 rounded-xl border border-monastic bg-[rgba(42,25,15,0.04)] px-3.5 py-3.5 sm:mt-8 sm:px-4 sm:py-4"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a5f32] dark:text-[#d8bd91] sm:text-xs sm:tracking-[0.24em]">
        Responsory
      </p>
      <p className="mt-2 text-sm leading-6 text-monastic-2">
        When praying alone, read both the line and response.
      </p>
      <div className="mt-4 space-y-3">
        {blocks.slice(1).map((block, index) => renderBlock(block, startIndex + index, true))}
      </div>
    </div>
  );
}

function getSeasonalMarianBlocks(blocks: NightPrayerBlock[]) {
  const [headingBlock, ...restBlocks] = blocks;
  const headingRemainder = headingBlock
    ? {
        ...headingBlock,
        lines: headingBlock.lines.slice(1).filter((line) => line.trim()),
      }
    : null;

  return [
    ...(headingRemainder?.lines.length ? [headingRemainder] : []),
    ...restBlocks,
  ].filter((block) => block.lines.some((line) => line.trim()));
}

function normalizePrayerText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getBlocksText(blocks: NightPrayerBlock[]) {
  return blocks
    .flatMap((block) => block.lines)
    .join(" ");
}

function isImportedHailMaryOrAveMaria(blocks: NightPrayerBlock[]) {
  const normalized = normalizePrayerText(getBlocksText(blocks));
  if (!normalized) return false;

  const englishHailMary =
    normalized.includes("hail mary") &&
    normalized.includes("full of grace") &&
    (normalized.includes("fruit of your womb") ||
      normalized.includes("fruit of thy womb"));

  if (englishHailMary) return true;

  const latinMarkers = [
    "ave maria",
    "gratia plena",
    "dominus tecum",
    "benedicta tu",
    "fructus ventris",
  ];
  const latinMarkerCount = latinMarkers.filter((marker) =>
    normalized.includes(marker)
  ).length;
  const latinJesusPresent =
    normalized.includes("iesus") || normalized.includes("jesus");

  return latinMarkerCount >= 3 && latinJesusPresent;
}

function renderMarianPrayerEnding(blocks: NightPrayerBlock[], startIndex: number) {
  const seasonalBlocks = getSeasonalMarianBlocks(blocks);
  const importedIsHailMary = isImportedHailMaryOrAveMaria(seasonalBlocks);

  return (
    <div key={`marian-prayer-${startIndex}`} className="mt-6 border-t border-monastic pt-5 sm:mt-8 sm:pt-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a5f32] dark:text-[#d8bd91] sm:text-xs sm:tracking-[0.24em]">
        Marian Prayer
      </p>
      {importedIsHailMary ? (
        <div className="mt-4 space-y-2">
          {seasonalBlocks.map((block, index) => renderBlock(block, startIndex + index))}
        </div>
      ) : (
        <div className="mt-4 space-y-2 text-[0.95rem] leading-7 text-monastic-0 sm:text-base sm:leading-8">
          {HAIL_MARY_LINES.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      )}

      {seasonalBlocks.length > 0 && !importedIsHailMary ? (
        <details className="mt-5 rounded-xl border border-monastic bg-[rgba(168,129,81,0.05)] px-4 py-4">
          <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-[0.16em] text-monastic-1 transition hover:text-monastic-0 sm:text-xs sm:tracking-[0.22em]">
            Seasonal Marian Antiphon
          </summary>
          <div className="mt-4 space-y-3 border-t border-monastic pt-4">
            {seasonalBlocks.map((block, index) =>
              renderSourceDetailBlock(block, startIndex + index)
            )}
          </div>
        </details>
      ) : null}

      <p className="mt-5 text-[0.95rem] font-medium leading-7 text-monastic-0 sm:mt-6 sm:text-base sm:leading-8">
        {CLOSING_SIGN_OF_THE_CROSS}
      </p>
    </div>
  );
}

function hasOpeningSignOfTheCross(blocks: NightPrayerBlock[]) {
  return blocks
    .slice(0, 3)
    .some((block) =>
      block.lines.some(
        (line) =>
          line.trim().toLowerCase() === CLOSING_SIGN_OF_THE_CROSS.toLowerCase()
      )
    );
}

function renderOpeningSignOfTheCross() {
  return (
    <p key="opening-sign-of-the-cross" className="text-[0.95rem] font-medium leading-7 text-monastic-0 sm:text-base sm:leading-8">
      {CLOSING_SIGN_OF_THE_CROSS}
    </p>
  );
}

function renderPrayerBlocks(blocks: NightPrayerBlock[]) {
  const rendered = hasOpeningSignOfTheCross(blocks)
    ? []
    : [renderOpeningSignOfTheCross()];
  let index = 0;
  let renderedMarianEnding = false;

  while (index < blocks.length) {
    const block = blocks[index];

    if (isSectionHeading(block, "HYMN")) {
      const endIndex = blocks.findIndex(
        (candidate, candidateIndex) =>
          candidateIndex > index && isMajorSectionHeading(candidate)
      );
      const hymnBlocks = blocks.slice(index, endIndex === -1 ? blocks.length : endIndex);
      rendered.push(renderHymnDetails(hymnBlocks, index));
      index = endIndex === -1 ? blocks.length : endIndex;
      continue;
    }

    if (isSectionHeading(block, "RESPONSORY")) {
      const endIndex = blocks.findIndex(
        (candidate, candidateIndex) =>
          candidateIndex > index && isMajorSectionHeading(candidate)
      );
      const responsoryBlocks = blocks.slice(
        index,
        endIndex === -1 ? blocks.length : endIndex
      );
      rendered.push(renderResponsory(responsoryBlocks, index));
      index = endIndex === -1 ? blocks.length : endIndex;
      continue;
    }

    if (isMarianAntiphonHeading(block)) {
      const endIndex = blocks.findIndex(
        (candidate, candidateIndex) =>
          candidateIndex > index && isMajorSectionHeading(candidate)
      );
      const marianBlocks = blocks.slice(index, endIndex === -1 ? blocks.length : endIndex);
      rendered.push(renderMarianPrayerEnding(marianBlocks, index));
      renderedMarianEnding = true;
      index = endIndex === -1 ? blocks.length : endIndex;
      continue;
    }

    rendered.push(renderBlock(block, index));

    if (hasExaminationHeading(block)) {
      rendered.push(<div key="holy-spirit-examen">{renderExamenGuide()}</div>);
    }

    index += 1;
  }

  if (!renderedMarianEnding) {
    rendered.push(renderMarianPrayerEnding([], blocks.length));
  }

  return rendered;
}

function renderSourceDetailBlock(block: NightPrayerBlock, index: number) {
  return (
    <p key={`source-${block.type}-${index}`} className="text-sm leading-7 text-monastic-2">
      {block.lines.map((line, lineIndex) => (
        <span key={`source-${index}-${lineIndex}`}>
          {line}
          {lineIndex < block.lines.length - 1 ? <br /> : null}
        </span>
      ))}
    </p>
  );
}

export default async function NightPrayerPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  await updateLastActiveAt(supabase);

  const { data: activePlan, error: activePlanError } = await supabase
    .from("challenge_plans")
    .select("id, slug, name, total_days")
    .eq("is_active", true)
    .maybeSingle();

  if (activePlanError || !activePlan) {
    return (
      <main className="monastic-page">
        <PageFrame className="max-w-4xl">
          <SurfaceCard>
            <SectionHeader
              kicker="Night Prayer"
              title="No active challenge plan was found."
              description="Compline will appear here once an active plan is available."
            />
          </SurfaceCard>
        </PageFrame>
      </main>
    );
  }

  const challenge = getChallengeTiming(activePlan.total_days);
  const activePlanSlug = activePlan.slug ?? ORIGINAL_CHALLENGE_PLAN_SLUG;
  const resolvedSearchParams = await searchParams;
  const rawDay = Array.isArray(resolvedSearchParams.day)
    ? resolvedSearchParams.day[0]
    : resolvedSearchParams.day;
  const selectedDay = normalizeDayNumber(
    Number(rawDay ?? (challenge.hasStarted ? challenge.currentDayNumber : 1)),
    activePlan.total_days
  );

  const { data: planDayData } = await supabase
    .from("plan_days")
    .select("id, day_number, title")
    .eq("plan_id", activePlan.id)
    .eq("day_number", selectedDay)
    .maybeSingle();

  const planDay = (planDayData ?? null) as PlanDayRow | null;

  if (!planDay) {
    return (
      <main className="monastic-page">
        <PageFrame className="max-w-4xl">
          <SurfaceCard>
            <SectionHeader
              kicker="Night Prayer"
              title={`Day ${selectedDay} was not found.`}
              description="Return to Today and choose another challenge day."
            />
            <div className="mt-5">
              <Button asChild variant="secondary">
                <Link href="/today">Back to Today</Link>
              </Button>
            </div>
          </SurfaceCard>
        </PageFrame>
      </main>
    );
  }

  const { data: taskRows } = await supabase
    .from("plan_day_tasks")
    .select(
      `
        id,
        requirement_note,
        day_date,
        task_templates (
          title,
          slug
        )
      `
    )
    .eq("plan_day_id", planDay.id);

  const nightPrayerTask = ((taskRows ?? []) as NightPrayerTaskRow[]).find((task) => {
    const template = normalizeTaskTemplate(task.task_templates);
    return template.slug === "night-prayer";
  });

  const prayerDate = nightPrayerTask?.day_date ?? null;
  const { data: nightPrayerData } = prayerDate
    ? await supabase
        .from("night_prayers")
        .select(
          "prayer_date, source, source_url, liturgical_day, title, subtitle, content_json, copyright_notice, attribution_html, imported_at, updated_at"
        )
        .eq("prayer_date", prayerDate)
        .maybeSingle()
    : { data: null };

  const nightPrayer = (nightPrayerData ?? null) as NightPrayerRow | null;
  const blocks = getNightPrayerBlocks(nightPrayer?.content_json);
  const { sourceDetailBlocks, prayerBlocks } = splitPrayerBlocks(blocks);
  const hasImportedContent = blocks.length > 0;
  const { data: completionData } = nightPrayerTask
    ? await supabase
        .from("user_task_completions")
        .select("id")
        .eq("user_id", user.id)
        .eq("plan_day_task_id", nightPrayerTask.id)
        .maybeSingle()
    : { data: null };

  const completion = (completionData ?? null) as CompletionRow | null;
  const selectedDateLabel = formatReadableDate(prayerDate);
  const previousDay = selectedDay > 1 ? selectedDay - 1 : 1;
  const nextDay =
    selectedDay < activePlan.total_days ? selectedDay + 1 : activePlan.total_days;
  const isLocked = !challenge.hasStarted || selectedDay > challenge.currentDayNumber;
  const sourceUrl =
    nightPrayer?.source_url ??
    (prayerDate ? getDivineOfficeDateUrl(prayerDate) : "https://divineoffice.org/");
  const title = nightPrayer?.title?.trim() || "Night Prayer";
  const subtitle =
    nightPrayer?.subtitle?.trim() ||
    nightPrayer?.liturgical_day?.trim() ||
    planDay.title ||
    `Day ${selectedDay}`;
  const sourceLabel =
    nightPrayer?.source === "divineoffice" || !nightPrayer?.source
      ? "DivineOffice"
      : nightPrayer.source;
  const metadataParts = [
    `Day ${selectedDay}`,
    selectedDateLabel,
    subtitle,
    `Source: ${sourceLabel}`,
  ].filter(Boolean);

  return (
    <main className="monastic-page">
      <PageFrame className="max-w-6xl space-y-5 sm:space-y-6">
        {!challenge.hasStarted && (
          <SurfaceCard>
            <p className="text-base font-semibold text-monastic-0 sm:text-lg">
              The challenge begins on {challenge.startDateLabel}.
            </p>
            <p className="mt-2 text-sm text-monastic-1 sm:text-base">
              Night Prayer is available in preview mode, but completion stays locked until launch.
            </p>
          </SurfaceCard>
        )}

        <HeroPanel className="py-6 sm:py-7">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="text-[#f7ebd8]">
              <p className="section-kicker text-[#ead6b0]">
                Day {selectedDay} {selectedDateLabel ? `- ${selectedDateLabel}` : ""}
              </p>
              <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">Night Prayer</h1>
              <p className="mt-2 text-base leading-7 text-[#ead8bc] sm:text-lg">
                Pray Compline with the Church before sleep.
              </p>
              <h2 className="mt-5 text-2xl font-semibold text-white sm:text-3xl">
                {title}
              </h2>
              <p className="mt-2 text-base leading-7 text-[#ead8bc] sm:text-lg">
                {subtitle}
              </p>
            </div>

            <AppActionBar
              className="grid gap-3 border-white/10 bg-[rgba(22,16,13,0.28)] sm:grid-cols-2"
              actions={[
                {
                  href: buildPlanDayHref("/today", activePlanSlug, selectedDay),
                  label: "Back to Today",
                  variant: "secondary",
                },
                {
                  href: "/dashboard",
                  label: "Dashboard",
                  variant: "outline",
                },
              ]}
            />
          </div>
        </HeroPanel>

        <AppActionBar
          className="flex-col sm:flex-row sm:items-center sm:justify-between"
          actions={[
            {
              href: `/night-prayer?day=${previousDay}`,
              label: "Previous Day",
              variant: "outline",
            },
            {
              href: `/night-prayer?day=${challenge.currentDayNumber}`,
              label: "Jump to Current Day",
              variant: "secondary",
            },
            {
              href: `/night-prayer?day=${nextDay}`,
              label: "Next Day",
              variant: "outline",
            },
          ]}
        />

        <p className="mx-auto max-w-4xl text-center text-xs font-medium uppercase tracking-[0.18em] text-monastic-2 sm:text-sm">
          {metadataParts.join(" • ")}
        </p>

        <SurfaceCard className={PAGE_CARD_CLASS}>
          <div className="mx-auto max-w-3xl text-center">
            <p className="section-kicker">Compline</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-monastic-0 sm:text-4xl">
              {hasImportedContent
                ? "Pray Night Prayer"
                : "Night Prayer has not been imported for this date yet."}
            </h2>
            <p className="mt-3 text-sm leading-6 text-monastic-1 sm:text-lg sm:leading-7">
              {hasImportedContent
                ? "Pray both the main line and the response when praying alone."
                : "Run the one-day importer for this prayer date, then refresh this page."}
            </p>
          </div>

          {hasImportedContent ? (
            <SurfaceInset className="mt-5 px-4 py-5 sm:mt-6 sm:px-8 sm:py-8">
              <article className="mx-auto max-w-2xl space-y-3.5 sm:space-y-4">
                {renderPrayerBlocks(prayerBlocks)}
              </article>
            </SurfaceInset>
          ) : (
            <SurfaceInset className="mt-5 sm:mt-6">
              <p className="text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7">
                Night Prayer has not been imported for this date yet.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild variant="default">
                  <a href={sourceUrl} target="_blank" rel="noreferrer">
                    Open DivineOffice.org
                  </a>
                </Button>
                <Button asChild variant="secondary">
                  <Link href={buildPlanDayHref("/today", activePlanSlug, selectedDay)}>
                    Back to Today
                  </Link>
                </Button>
              </div>
            </SurfaceInset>
          )}
        </SurfaceCard>

        {nightPrayerTask ? (
          <SurfaceCard className={PAGE_CARD_CLASS}>
            <SectionHeader
              kicker="Completion"
              title={completion?.id ? "Night Prayer completed." : "Mark Night Prayer complete."}
              description="Mark this complete after praying Compline."
            />
            <div className="mt-5">
              <TodayTaskCard
                planDayTaskId={nightPrayerTask.id}
                title={normalizeTaskTemplate(nightPrayerTask.task_templates).title}
                note={nightPrayerTask.requirement_note}
                isRequired
                isOptional={false}
                completed={Boolean(completion?.id)}
                locked={isLocked}
                lockedLabel={!challenge.hasStarted ? "Locked Until Launch" : "Future Day Locked"}
                planSlug={activePlanSlug}
              />
            </div>
          </SurfaceCard>
        ) : (
          <SurfaceCard className={PAGE_CARD_CLASS}>
            <SectionHeader
              kicker="Completion"
              title="Night Prayer is not assigned to this day yet."
              description="Apply the Phase 1 migration to backfill the task onto active plan days."
            />
          </SurfaceCard>
        )}

        {sourceDetailBlocks.length > 0 ? (
          <SurfaceCard className={`${PAGE_CARD_CLASS} py-4 sm:py-5`}>
            <details>
              <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-[0.16em] text-monastic-1 transition hover:text-monastic-0 sm:text-xs sm:tracking-[0.22em]">
                Source details / book reference
              </summary>
              <div className="mt-4 space-y-3 border-t border-monastic pt-4">
                {sourceDetailBlocks.map(renderSourceDetailBlock)}
              </div>
            </details>
          </SurfaceCard>
        ) : null}
      </PageFrame>
    </main>
  );
}
