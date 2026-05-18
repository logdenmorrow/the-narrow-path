import Link from "next/link";
import { redirect } from "next/navigation";
import { AppActionBar } from "@/components/page-actions";
import { ChallengeFeedbackForm } from "@/components/challenge-feedback-form";
import {
  HeroPanel,
  MetricCard,
  PageFrame,
  SectionHeader,
  SurfaceCard,
  SurfaceInset,
} from "@/components/monastic-ui";
import { createClient } from "@/lib/supabase/server";
import { getChallengeTiming } from "@/lib/challenge";
import { isDay90Celebration } from "@/lib/season-plan";
import { updateLastActiveAt } from "@/lib/last-active";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type PlanDayRow = {
  id: number;
  day_number: number;
  title: string | null;
};

type ChallengeFeedbackTaskRow = {
  id: number;
  task_templates:
    | {
        slug: string | null;
      }
    | Array<{
        slug: string | null;
      }>
    | null;
};

type ChallengeFeedbackResponseRow = {
  id: string;
  liked_text: string | null;
  helped_growth_text: string | null;
  unnecessary_or_confusing_text: string | null;
  too_hard_or_missing_text: string | null;
  suggested_changes_text: string | null;
  general_feedback_text: string | null;
};

function normalizeDayNumber(value: number, totalDays: number) {
  if (!Number.isFinite(value)) return 1;
  const rounded = Math.floor(value);
  if (rounded < 1) return 1;
  if (rounded > totalDays) return totalDays;
  return rounded;
}

function getTaskSlug(relation: ChallengeFeedbackTaskRow["task_templates"]) {
  const template = Array.isArray(relation) ? relation[0] : relation;
  return template?.slug ?? null;
}

export default async function ChallengeFeedbackPage({
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
    .select("id, name, total_days")
    .eq("is_active", true)
    .maybeSingle();

  if (activePlanError || !activePlan) {
    return (
      <main className="monastic-page">
        <PageFrame className="max-w-5xl space-y-6">
          <SurfaceCard>
            <SectionHeader
              kicker="Feedback"
              title="Challenge Feedback"
              description="No active challenge plan was found."
            />
          </SurfaceCard>
        </PageFrame>
      </main>
    );
  }

  const challenge = getChallengeTiming(activePlan.total_days);
  const resolvedSearchParams = await searchParams;
  const rawDay = Array.isArray(resolvedSearchParams.day)
    ? resolvedSearchParams.day[0]
    : resolvedSearchParams.day;
  const selectedDay = normalizeDayNumber(
    Number(rawDay ?? (challenge.hasStarted ? challenge.currentDayNumber : 90)),
    activePlan.total_days
  );

  const { data: planDayData, error: planDayError } = await supabase
    .from("plan_days")
    .select("id, day_number, title")
    .eq("plan_id", activePlan.id)
    .eq("day_number", selectedDay)
    .maybeSingle();

  const planDay = (planDayData ?? null) as PlanDayRow | null;

  if (
    planDayError ||
    !planDay ||
    !isDay90Celebration(planDay.day_number, activePlan.total_days)
  ) {
    return (
      <main className="monastic-page">
        <PageFrame className="max-w-5xl space-y-6">
          <SurfaceCard>
            <SectionHeader
              kicker="Feedback"
              title="Challenge Feedback"
              description="Challenge Feedback is only available on Day 90."
            />
            <div className="mt-5">
              <Link
                href="/today?day=90"
                className="inline-flex rounded-[1rem] border border-monastic px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-monastic-0 transition hover:bg-[color:var(--surface-3)] sm:tracking-[0.18em]"
              >
                Review Day 90
              </Link>
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
        task_templates (
          slug
        )
      `
    )
    .eq("plan_day_id", planDay.id);

  const challengeFeedbackTask = ((taskRows ?? []) as ChallengeFeedbackTaskRow[]).find(
    (task) => getTaskSlug(task.task_templates) === "challenge_feedback"
  );

  const { data: feedbackData } = await supabase
    .from("challenge_feedback_responses")
    .select(
      "id, liked_text, helped_growth_text, unnecessary_or_confusing_text, too_hard_or_missing_text, suggested_changes_text, general_feedback_text"
    )
    .eq("user_id", user.id)
    .eq("plan_day_id", planDay.id)
    .maybeSingle();

  const feedback = (feedbackData ?? null) as ChallengeFeedbackResponseRow | null;
  const isLocked = !challenge.hasStarted || planDay.day_number > challenge.currentDayNumber;

  return (
    <main className="monastic-page">
      <PageFrame className="max-w-6xl space-y-5 sm:space-y-6">
        <HeroPanel className="py-7 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <div className="text-[#f7ebd8]">
              <p className="section-kicker text-[#ead6b0]">{activePlan.name}</p>
              <h1 className="mt-3 text-5xl font-semibold sm:text-6xl">
                Challenge Feedback
              </h1>
              <p className="mt-3 text-base leading-7 text-[#ead8bc] sm:text-lg sm:leading-8">
                Day 90 feedback helps shape the next season.
              </p>
            </div>

            <AppActionBar
              className="grid gap-3 border-white/10 bg-[rgba(22,16,13,0.28)] sm:grid-cols-2"
              actions={[
                {
                  href: `/today?day=${planDay.day_number}`,
                  label: "Back to Day 90",
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

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Status"
            value={feedback?.id ? "Saved" : "Open"}
            detail={
              feedback?.id
                ? "Your feedback currently counts as completed."
                : "Save feedback to complete this task."
            }
          />
          <MetricCard
            label="Day"
            value="Day 90"
            detail={planDay.title ?? "Day 90: Celebration"}
          />
          <MetricCard
            label="Editing"
            value={isLocked ? "Locked" : "Available"}
            detail={
              isLocked
                ? "Challenge Feedback opens on Day 90."
                : "You can update and resave your response."
            }
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] xl:items-start">
          <div className="grid gap-6 xl:sticky xl:top-28">
            <SurfaceCard>
              <SectionHeader
                kicker="Prompt"
                title="Challenge Feedback"
                description="What did you think of the challenge? What helped you grow? What felt unnecessary, confusing, too hard, or missing? What would you change to help make The Narrow Path better for the next season?"
              />
            </SurfaceCard>

            <SurfaceCard>
              <SectionHeader kicker="Privacy" title="Who Can Read This" />
              <SurfaceInset className="mt-4">
                <p className="text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7">
                  You can read and update your own response. Other members cannot
                  see it. Admins can export responses to review feedback.
                </p>
              </SurfaceInset>
            </SurfaceCard>
          </div>

          <SurfaceCard>
            <SectionHeader
              kicker="Feedback"
              title="Your Response"
              description="Short answers are fine. Honest feedback is more useful than polished feedback."
            />

            {challengeFeedbackTask ? (
              <ChallengeFeedbackForm
                planDayId={planDay.id}
                dayNumber={planDay.day_number}
                challengeFeedbackTaskId={challengeFeedbackTask.id}
                initialHasSavedFeedback={Boolean(feedback?.id)}
                isLocked={isLocked}
                initialValues={{
                  likedText: feedback?.liked_text ?? "",
                  helpedGrowthText: feedback?.helped_growth_text ?? "",
                  unnecessaryOrConfusingText:
                    feedback?.unnecessary_or_confusing_text ?? "",
                  tooHardOrMissingText: feedback?.too_hard_or_missing_text ?? "",
                  suggestedChangesText: feedback?.suggested_changes_text ?? "",
                  generalFeedbackText: feedback?.general_feedback_text ?? "",
                }}
              />
            ) : (
              <SurfaceInset className="mt-5">
                <p className="text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7">
                  Challenge Feedback is unavailable right now.
                </p>
              </SurfaceInset>
            )}
          </SurfaceCard>
        </div>
      </PageFrame>
    </main>
  );
}
