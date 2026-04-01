import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getChallengeTiming } from "@/lib/challenge";

type ProfileRow = {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
};

type PlanDayTaskRow = {
  id: number;
  is_required: boolean;
  sort_order: number;
  task_templates: {
    id: number;
    slug: string;
    title: string;
    description: string | null;
  } | null;
};

type UserTaskCompletionRow = {
  id: number;
  user_id: string;
  plan_day_task_id: number;
  completed_at: string | null;
};

type MemberStatusRow = {
  id: string;
  displayName: string;
  fullName: string;
  status: "Not started" | "In progress" | "Completed";
  requiredCompleted: number;
  requiredTotal: number;
  optionalCompleted: number;
  optionalTotal: number;
};

function getBrotherhoodName(profile: ProfileRow) {
  if (profile.first_name && profile.last_name) {
    return `${profile.first_name} ${profile.last_name.charAt(0)}.`;
  }

  if (profile.first_name) {
    return profile.first_name;
  }

  if (profile.display_name) {
    return profile.display_name;
  }

  return "Brother";
}

function getFullName(profile: ProfileRow) {
  if (profile.first_name && profile.last_name) {
    return `${profile.first_name} ${profile.last_name}`;
  }

  if (profile.display_name) {
    return profile.display_name;
  }

  if (profile.first_name) {
    return profile.first_name;
  }

  return "Brother";
}

export default async function BrotherhoodPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  const { data: activePlan, error: activePlanError } = await supabase
    .from("challenge_plans")
    .select("id, name, total_days")
    .eq("is_active", true)
    .maybeSingle();

  if (activePlanError || !activePlan) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Brotherhood
            </h1>
            <p className="mt-4 text-sm text-zinc-300 sm:text-base">
              No active challenge plan was found. Add or activate a plan in
              Supabase before using this page.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const challenge = getChallengeTiming(activePlan.total_days);
  const currentDayNumber = challenge.currentDayNumber;

  const { data: planDay, error: planDayError } = await supabase
    .from("plan_days")
    .select("id, day_number, title")
    .eq("plan_id", activePlan.id)
    .eq("day_number", currentDayNumber)
    .maybeSingle();

  if (planDayError || !planDay) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Brotherhood
            </h1>
            <p className="mt-4 text-sm text-zinc-300 sm:text-base">
              Day {currentDayNumber} has not been created for the active plan
              yet.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const { data: rawTasks, error: tasksError } = await supabase
    .from("plan_day_tasks")
    .select(
      `
        id,
        is_required,
        sort_order,
        task_templates (
          id,
          slug,
          title,
          description
        )
      `
    )
    .eq("plan_day_id", planDay.id)
    .order("sort_order", { ascending: true });

  if (tasksError) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Brotherhood
            </h1>
            <p className="mt-4 text-sm text-zinc-300 sm:text-base">
              There was a problem loading today&apos;s tasks.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const tasks = (rawTasks ?? []) as unknown as PlanDayTaskRow[];
  const requiredTaskIds = tasks
    .filter((task) => task.is_required)
    .map((task) => task.id);
  const optionalTaskIds = tasks
    .filter((task) => !task.is_required)
    .map((task) => task.id);
  const allTaskIds = tasks.map((task) => task.id);

  const { data: rawProfiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, display_name, first_name, last_name")
    .order("first_name", { ascending: true });

  if (profilesError) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Brotherhood
            </h1>
            <p className="mt-4 text-sm text-zinc-300 sm:text-base">
              There was a problem loading the brotherhood.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const profiles = (rawProfiles ?? []) as ProfileRow[];

  if (profiles.length === 0) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-zinc-400 sm:text-sm">
              {activePlan.name}
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Brotherhood
            </h1>
            <p className="mt-4 text-sm text-zinc-300 sm:text-base">
              No members are showing yet because no profiles have been created.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const profileIds = profiles.map((profile) => profile.id);

  const { data: rawCompletions, error: completionsError } =
    profileIds.length > 0 && allTaskIds.length > 0
      ? await supabase
          .from("user_task_completions")
          .select("id, user_id, plan_day_task_id, completed_at")
          .in("user_id", profileIds)
          .in("plan_day_task_id", allTaskIds)
      : { data: [], error: null };

  if (completionsError) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Brotherhood
            </h1>
            <p className="mt-4 text-sm text-zinc-300 sm:text-base">
              There was a problem loading member completion data.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const completions = (rawCompletions ?? []) as UserTaskCompletionRow[];

  const members: MemberStatusRow[] = profiles.map((profile) => {
    const memberCompletions = completions.filter(
      (completion) => completion.user_id === profile.id && completion.completed_at
    );

    const completedTaskIds = new Set(
      memberCompletions.map((completion) => completion.plan_day_task_id)
    );

    const requiredCompleted = requiredTaskIds.filter((taskId) =>
      completedTaskIds.has(taskId)
    ).length;

    const optionalCompleted = optionalTaskIds.filter((taskId) =>
      completedTaskIds.has(taskId)
    ).length;

    let status: "Not started" | "In progress" | "Completed" = "Not started";

    if (requiredTaskIds.length > 0 && requiredCompleted === requiredTaskIds.length) {
      status = "Completed";
    } else if (requiredCompleted > 0 || optionalCompleted > 0) {
      status = "In progress";
    }

    if (!challenge.hasStarted) {
      status = "Not started";
    }

    return {
      id: profile.id,
      displayName: getBrotherhoodName(profile),
      fullName: getFullName(profile),
      status,
      requiredCompleted: challenge.hasStarted ? requiredCompleted : 0,
      requiredTotal: requiredTaskIds.length,
      optionalCompleted: challenge.hasStarted ? optionalCompleted : 0,
      optionalTotal: optionalTaskIds.length,
    };
  });

  const startedToday = members.filter(
    (member) => member.status !== "Not started"
  ).length;
  const completedToday = members.filter(
    (member) => member.status === "Completed"
  ).length;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {!challenge.hasStarted && (
          <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-base font-semibold text-white sm:text-lg">
              The challenge begins on {challenge.startDateLabel}.
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              Brotherhood statuses will go live on launch day. For now,
              everyone is shown as pre-start.
            </p>
          </div>
        )}

        {challenge.isComplete && (
          <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-base font-semibold text-white sm:text-lg">
              The 90-day challenge is complete.
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              You&apos;re viewing final-day accountability.
            </p>
          </div>
        )}

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-zinc-400 sm:text-sm">
              {activePlan.name}
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Brotherhood
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-zinc-300 sm:text-base">
              Keep track of one another and see who has started, who is in
              progress, and who has completed today.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[360px]">
            <Link
              href="/dashboard"
              className="rounded-lg border border-zinc-700 px-4 py-3 text-center font-semibold text-white transition hover:bg-zinc-900"
            >
              Back to Dashboard
            </Link>
            <Link
              href="/today"
              className="rounded-lg bg-white px-4 py-3 text-center font-semibold text-black transition hover:bg-zinc-200"
            >
              Go to Today
            </Link>
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-xs uppercase tracking-wide text-zinc-400 sm:text-sm">
              Current Day
            </p>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              Day {planDay.day_number}
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              {!challenge.hasStarted
                ? `${planDay.title || `Day ${planDay.day_number}`} Preview`
                : planDay.title || `Day ${planDay.day_number}`}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-xs uppercase tracking-wide text-zinc-400 sm:text-sm">
              Members
            </p>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              {members.length}
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              Men currently in the brotherhood.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-xs uppercase tracking-wide text-zinc-400 sm:text-sm">
              Started Today
            </p>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              {startedToday}
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              Men who have begun today&apos;s disciplines.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-xs uppercase tracking-wide text-zinc-400 sm:text-sm">
              Completed Today
            </p>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              {completedToday}
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              Men who finished all required tasks.
            </p>
          </div>
        </div>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold sm:text-2xl">
              Today&apos;s Member Status
            </h2>
            <p className="mt-1 text-sm text-zinc-400 sm:text-base">
              First name plus last initial for clarity while keeping things
              clean.
            </p>
          </div>

          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="rounded-xl border border-zinc-800 bg-black px-4 py-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">
                      {member.displayName}
                    </p>
                    <p className="mt-1 break-words text-xs text-zinc-500 sm:text-sm">
                      {member.fullName}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                    <span className="w-fit rounded-full border border-zinc-700 px-3 py-1 text-[10px] uppercase tracking-wide text-zinc-300 sm:text-xs">
                      {member.status}
                    </span>
                    <span className="text-xs text-zinc-300 sm:text-sm">
                      Required: {member.requiredCompleted}/{member.requiredTotal}
                    </span>
                    <span className="text-xs text-zinc-500 sm:text-sm">
                      Optional: {member.optionalCompleted}/{member.optionalTotal}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}