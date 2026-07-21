import Link from "next/link";
import { redirect } from "next/navigation";
import {
  HeroPanel,
  PageFrame,
  SectionHeader,
  SurfaceCard,
} from "@/components/monastic-ui";
import { StatusPill } from "@/components/task-card";
import { Button } from "@/components/ui/button";
import { CHALLENGE_TIME_ZONE } from "@/lib/challenge";
import { getSeasonTimingForPlan } from "@/lib/season-plan";
import { loadActivePlan } from "@/lib/active-plan";
import {
  VALID_HOURS,
  getHourDisplayName,
  getHourKicker,
  getHourTaskSlug,
  type LiturgicalHour,
} from "@/lib/hours";
import { createClient } from "@/lib/supabase/server";
import { updateLastActiveAt } from "@/lib/last-active";

type PlanDayTaskRow = {
  id: number;
  task_template_id: number;
};

type CompletionRow = {
  plan_day_task_id: number;
};

// TODO: these cutoff times (10am / 5pm local) are approximate defaults and
// could be made configurable later.
function resolveCurrentHourByTimeOfDay(): LiturgicalHour {
  const localHour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: CHALLENGE_TIME_ZONE,
      hour: "numeric",
      hourCycle: "h23",
    }).format(new Date())
  );

  if (localHour < 10) return "lauds";
  if (localHour < 17) return "vespers";
  return "compline";
}

export default async function HoursPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  await updateLastActiveAt(supabase);

  const currentHour = resolveCurrentHourByTimeOfDay();
  const activePlanLookup = await loadActivePlan(supabase);
  const activePlan = activePlanLookup.plan;

  if (activePlanLookup.status !== "single" || !activePlan) {
    return (
      <main className="monastic-page">
        <PageFrame className="max-w-4xl space-y-5 sm:space-y-6">
          <HeroPanel className="py-6 sm:py-7">
            <p className="section-kicker text-[#ead6b0]">The Church&apos;s daily prayer</p>
            <h1 className="mt-2 text-4xl font-semibold text-[#f7ebd8] sm:text-5xl">
              Liturgy of the Hours
            </h1>
          </HeroPanel>
          <SurfaceCard>
            <SectionHeader
              kicker="Liturgy of the Hours"
              title="No active challenge plan was found."
              description="Hours will appear here once an active plan is available."
            />
          </SurfaceCard>
        </PageFrame>
      </main>
    );
  }

  const challenge = getSeasonTimingForPlan(activePlan);
  const selectedDay = challenge.hasStarted ? challenge.currentDayNumber : 1;

  const { data: planDayData } = await supabase
    .from("plan_days")
    .select("id")
    .eq("plan_id", activePlan.id)
    .eq("day_number", selectedDay)
    .maybeSingle();

  const planDayId = planDayData?.id ?? null;

  const { data: hourTemplateRows } = await supabase
    .from("task_templates")
    .select("id, slug")
    .in(
      "slug",
      VALID_HOURS.map((hour) => getHourTaskSlug(hour))
    );

  const templateIdBySlug = new Map<string, number>(
    (hourTemplateRows ?? []).map((row) => [row.slug as string, row.id as number])
  );
  const hourTemplateIds = [...templateIdBySlug.values()];

  const { data: taskRows } = planDayId && hourTemplateIds.length
    ? await supabase
        .from("plan_day_tasks")
        .select("id, task_template_id")
        .eq("plan_day_id", planDayId)
        .in("task_template_id", hourTemplateIds)
    : { data: [] as PlanDayTaskRow[] };

  const typedTaskRows = (taskRows ?? []) as PlanDayTaskRow[];
  const taskIdByTemplateId = new Map(
    typedTaskRows.map((row) => [row.task_template_id, row.id])
  );

  const hourTaskIds = VALID_HOURS.map((hour) => {
    const templateId = templateIdBySlug.get(getHourTaskSlug(hour));
    return templateId ? (taskIdByTemplateId.get(templateId) ?? null) : null;
  }).filter((id): id is number => id !== null);

  const { data: completionRows } = hourTaskIds.length
    ? await supabase
        .from("user_task_completions")
        .select("plan_day_task_id")
        .eq("user_id", user.id)
        .in("plan_day_task_id", hourTaskIds)
    : { data: [] as CompletionRow[] };

  const completedTaskIds = new Set(
    ((completionRows ?? []) as CompletionRow[]).map((row) => row.plan_day_task_id)
  );

  function getHourCardState(hour: LiturgicalHour) {
    const templateId = templateIdBySlug.get(getHourTaskSlug(hour));
    const taskId = templateId ? (taskIdByTemplateId.get(templateId) ?? null) : null;

    return {
      exists: taskId !== null,
      completed: taskId !== null && completedTaskIds.has(taskId),
    };
  }

  return (
    <main className="monastic-page">
      <PageFrame className="max-w-4xl space-y-5 sm:space-y-6">
        <HeroPanel className="py-6 sm:py-7">
          <p className="section-kicker text-[#ead6b0]">The Church&apos;s daily prayer</p>
          <h1 className="mt-2 text-4xl font-semibold text-[#f7ebd8] sm:text-5xl">
            Liturgy of the Hours
          </h1>
        </HeroPanel>

        <SurfaceCard>
          <p className="section-kicker">Right Now</p>
          <p className="mt-3 text-lg font-semibold text-monastic-0 sm:text-xl">
            The Church is currently praying {getHourDisplayName(currentHour)}.
          </p>
          {!challenge.hasStarted ? (
            <p className="mt-2 text-sm leading-6 text-monastic-1 sm:text-base">
              The challenge begins on {challenge.startDateLabel}. Hours are available
              to preview now, but completion stays locked until launch.
            </p>
          ) : null}
          <div className="mt-4">
            <Button asChild variant="default">
              <Link href={`/hours/${currentHour}`}>
                Open {getHourDisplayName(currentHour)}
              </Link>
            </Button>
          </div>
        </SurfaceCard>

        <div className="grid gap-4 sm:grid-cols-3">
          {VALID_HOURS.map((hour) => {
            const state = getHourCardState(hour);

            return (
              <SurfaceCard key={hour}>
                <p className="section-kicker">{getHourKicker(hour)}</p>
                <h2 className="mt-2 text-xl font-semibold text-monastic-0 sm:text-2xl">
                  {getHourDisplayName(hour)}
                </h2>

                <div className="mt-3">
                  {state.exists ? (
                    state.completed ? (
                      <StatusPill tone="done">Completed</StatusPill>
                    ) : (
                      <StatusPill tone="optional">Optional</StatusPill>
                    )
                  ) : (
                    <p className="text-sm leading-6 text-monastic-2">
                      Not available today.
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <Button asChild variant="secondary" className="w-full">
                    <Link href={`/hours/${hour}`}>
                      Open {getHourDisplayName(hour)}
                    </Link>
                  </Button>
                </div>
              </SurfaceCard>
            );
          })}
        </div>
      </PageFrame>
    </main>
  );
}
