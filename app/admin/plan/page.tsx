import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getChallengeTiming } from "@/lib/challenge";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type TaskTemplateCadence = "daily" | "weekly_quota";

type TaskTemplateRow = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  cadence: TaskTemplateCadence;
  weekly_target: number | null;
};

type PlanDayTaskRow = {
  id: number;
  is_required: boolean;
  sort_order: number;
  task_template_id: number;
  task_templates: {
    id: number;
    slug: string;
    title: string;
    description: string | null;
    cadence: TaskTemplateCadence;
    weekly_target: number | null;
  } | null;
};

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isAllowedAdminEmail(email?: string | null) {
  const adminEmails = getAdminEmails();

  if (adminEmails.length === 0) {
    return false;
  }

  if (!email) {
    return false;
  }

  return adminEmails.includes(email.toLowerCase());
}

function normalizeDayNumber(value: number, totalDays: number) {
  if (!Number.isFinite(value)) return 1;
  const rounded = Math.floor(value);
  if (rounded < 1) return 1;
  if (rounded > totalDays) return totalDays;
  return rounded;
}

function normalizeWeekStartDay(value: number, totalDays: number) {
  const normalizedDay = normalizeDayNumber(value, totalDays);
  const weekStart = Math.floor((normalizedDay - 1) / 7) * 7 + 1;
  const maxWeekStart = Math.floor((totalDays - 1) / 7) * 7 + 1;
  return Math.min(weekStart, maxWeekStart);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getAdminKey() {
  return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
}

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getAdminKey();

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createSupabaseAdminClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function parseCadence(value: FormDataEntryValue | null): TaskTemplateCadence {
  return value === "weekly_quota" ? "weekly_quota" : "daily";
}

function resolveWeeklyTarget(
  rawValue: FormDataEntryValue | null,
  cadence: TaskTemplateCadence
) {
  if (cadence === "daily") {
    return null;
  }

  const parsed = Math.floor(Number(rawValue ?? 0));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function cadenceLabel(template?: {
  cadence: TaskTemplateCadence;
  weekly_target: number | null;
} | null) {
  if (!template) {
    return "Daily";
  }

  if (template.cadence === "weekly_quota") {
    return `Weekly quota${template.weekly_target ? ` (${template.weekly_target}x)` : ""}`;
  }

  return "Daily";
}

async function requireAdminUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  if (!isAllowedAdminEmail(user.email)) {
    redirect("/dashboard");
  }

  return user;
}

function revalidateAppPaths() {
  revalidatePath("/admin/plan");
  revalidatePath("/today");
  revalidatePath("/this-week");
  revalidatePath("/dashboard");
  revalidatePath("/brotherhood");
}

async function saveDayDetails(formData: FormData) {
  "use server";

  await requireAdminUser();

  const admin = createAdminClient();

  const planId = Number(formData.get("plan_id"));
  const dayNumber = Number(formData.get("day_number"));
  const title = String(formData.get("title") ?? "").trim();
  const reflectionPrompt = String(formData.get("reflection_prompt") ?? "").trim();

  await admin.from("plan_days").upsert(
    {
      plan_id: planId,
      day_number: dayNumber,
      title: title || null,
      reflection_prompt: reflectionPrompt || null,
    },
    {
      onConflict: "plan_id,day_number",
    }
  );

  revalidateAppPaths();
  redirect(`/admin/plan?day=${dayNumber}`);
}

async function addTaskToDay(formData: FormData) {
  "use server";

  await requireAdminUser();

  const admin = createAdminClient();

  const planId = Number(formData.get("plan_id"));
  const dayNumber = Number(formData.get("day_number"));
  const taskTemplateId = Number(formData.get("task_template_id"));
  const isRequired = formData.get("is_required") === "on";
  const sortOrder = Number(formData.get("sort_order") ?? 0);

  const { data: ensuredDay } = await admin
    .from("plan_days")
    .upsert(
      {
        plan_id: planId,
        day_number: dayNumber,
        title: null,
        reflection_prompt: null,
      },
      {
        onConflict: "plan_id,day_number",
      }
    )
    .select("id")
    .single();

  if (!ensuredDay) {
    throw new Error("Unable to create or load the selected day.");
  }

  await admin.from("plan_day_tasks").upsert(
    {
      plan_day_id: ensuredDay.id,
      task_template_id: taskTemplateId,
      is_required: isRequired,
      sort_order: sortOrder,
    },
    {
      onConflict: "plan_day_id,task_template_id",
    }
  );

  revalidateAppPaths();
  redirect(`/admin/plan?day=${dayNumber}`);
}

async function saveAssignedTask(formData: FormData) {
  "use server";

  await requireAdminUser();

  const admin = createAdminClient();

  const planDayTaskId = Number(formData.get("plan_day_task_id"));
  const dayNumber = Number(formData.get("day_number"));
  const isRequired = formData.get("is_required") === "on";
  const sortOrder = Number(formData.get("sort_order") ?? 0);

  await admin
    .from("plan_day_tasks")
    .update({
      is_required: isRequired,
      sort_order: sortOrder,
    })
    .eq("id", planDayTaskId);

  revalidateAppPaths();
  redirect(`/admin/plan?day=${dayNumber}`);
}

async function removeAssignedTask(formData: FormData) {
  "use server";

  await requireAdminUser();

  const admin = createAdminClient();

  const planDayTaskId = Number(formData.get("plan_day_task_id"));
  const dayNumber = Number(formData.get("day_number"));

  await admin.from("plan_day_tasks").delete().eq("id", planDayTaskId);

  revalidateAppPaths();
  redirect(`/admin/plan?day=${dayNumber}`);
}

async function createTaskTemplate(formData: FormData) {
  "use server";

  await requireAdminUser();

  const admin = createAdminClient();

  const dayNumber = Number(formData.get("day_number"));
  const title = String(formData.get("title") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const cadence = parseCadence(formData.get("cadence"));
  const weeklyTarget = resolveWeeklyTarget(formData.get("weekly_target"), cadence);

  if (!title) {
    revalidateAppPaths();
    redirect(`/admin/plan?day=${dayNumber}`);
  }

  const slug = slugInput ? slugify(slugInput) : slugify(title);

  await admin.from("task_templates").insert({
    title,
    slug,
    description: description || null,
    cadence,
    weekly_target: weeklyTarget,
  });

  revalidateAppPaths();
  redirect(`/admin/plan?day=${dayNumber}`);
}

async function saveTaskTemplate(formData: FormData) {
  "use server";

  await requireAdminUser();

  const admin = createAdminClient();

  const templateId = Number(formData.get("template_id"));
  const dayNumber = Number(formData.get("day_number"));
  const title = String(formData.get("title") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const cadence = parseCadence(formData.get("cadence"));
  const weeklyTarget = resolveWeeklyTarget(formData.get("weekly_target"), cadence);

  if (!title) {
    revalidateAppPaths();
    redirect(`/admin/plan?day=${dayNumber}`);
  }

  const slug = slugInput ? slugify(slugInput) : slugify(title);

  await admin
    .from("task_templates")
    .update({
      title,
      slug,
      description: description || null,
      cadence,
      weekly_target: weeklyTarget,
    })
    .eq("id", templateId);

  revalidateAppPaths();
  redirect(`/admin/plan?day=${dayNumber}`);
}

async function copyDayToDay(formData: FormData) {
  "use server";

  await requireAdminUser();

  const admin = createAdminClient();

  const planId = Number(formData.get("plan_id"));
  const sourceDayNumber = Number(formData.get("source_day_number"));
  const targetDayNumber = Number(formData.get("target_day_number"));
  const returnDayNumber = Number(formData.get("return_day_number"));

  if (
    !Number.isFinite(sourceDayNumber) ||
    !Number.isFinite(targetDayNumber) ||
    sourceDayNumber < 1 ||
    targetDayNumber < 1
  ) {
    redirect(`/admin/plan?day=${returnDayNumber || 1}`);
  }

  if (sourceDayNumber === targetDayNumber) {
    redirect(`/admin/plan?day=${sourceDayNumber}`);
  }

  const { data: sourceDay, error: sourceDayError } = await admin
    .from("plan_days")
    .select("id, title, reflection_prompt")
    .eq("plan_id", planId)
    .eq("day_number", sourceDayNumber)
    .single();

  if (sourceDayError || !sourceDay) {
    throw new Error("Source day was not found.");
  }

  const { data: sourceTasks, error: sourceTasksError } = await admin
    .from("plan_day_tasks")
    .select("task_template_id, is_required, sort_order")
    .eq("plan_day_id", sourceDay.id)
    .order("sort_order", { ascending: true });

  if (sourceTasksError) {
    throw new Error("Unable to load source day tasks.");
  }

  const { data: targetDay, error: targetDayError } = await admin
    .from("plan_days")
    .upsert(
      {
        plan_id: planId,
        day_number: targetDayNumber,
        title: sourceDay.title,
        reflection_prompt: sourceDay.reflection_prompt,
      },
      {
        onConflict: "plan_id,day_number",
      }
    )
    .select("id")
    .single();

  if (targetDayError || !targetDay) {
    throw new Error("Unable to create or update the target day.");
  }

  await admin.from("plan_day_tasks").delete().eq("plan_day_id", targetDay.id);

  if ((sourceTasks ?? []).length > 0) {
    await admin.from("plan_day_tasks").insert(
      sourceTasks.map((task) => ({
        plan_day_id: targetDay.id,
        task_template_id: task.task_template_id,
        is_required: task.is_required,
        sort_order: task.sort_order,
      }))
    );
  }

  revalidateAppPaths();
  redirect(`/admin/plan?day=${targetDayNumber}`);
}

async function copyWeekToWeek(formData: FormData) {
  "use server";

  await requireAdminUser();

  const admin = createAdminClient();

  const planId = Number(formData.get("plan_id"));
  const totalDays = Number(formData.get("total_days"));
  const sourceWeekStartRaw = Number(formData.get("source_week_start_day"));
  const targetWeekStartRaw = Number(formData.get("target_week_start_day"));
  const returnDayNumber = Number(formData.get("return_day_number"));

  const sourceWeekStartDay = normalizeWeekStartDay(sourceWeekStartRaw, totalDays);
  const targetWeekStartDay = normalizeWeekStartDay(targetWeekStartRaw, totalDays);

  if (sourceWeekStartDay === targetWeekStartDay) {
    redirect(`/admin/plan?day=${returnDayNumber || sourceWeekStartDay}`);
  }

  const sourceWeekEndDay = Math.min(sourceWeekStartDay + 6, totalDays);
  const targetWeekEndDay = Math.min(targetWeekStartDay + 6, totalDays);

  const { data: sourceDays, error: sourceDaysError } = await admin
    .from("plan_days")
    .select("id, day_number, title, reflection_prompt")
    .eq("plan_id", planId)
    .gte("day_number", sourceWeekStartDay)
    .lte("day_number", sourceWeekEndDay)
    .order("day_number", { ascending: true });

  if (sourceDaysError) {
    throw new Error("Unable to load the source week.");
  }

  const sourceDayMap = new Map(
    (sourceDays ?? []).map((day) => [day.day_number, day])
  );

  const sourceDayIds = (sourceDays ?? []).map((day) => day.id);

  const { data: sourceWeekTasks, error: sourceWeekTasksError } = sourceDayIds.length
    ? await admin
        .from("plan_day_tasks")
        .select("plan_day_id, task_template_id, is_required, sort_order")
        .in("plan_day_id", sourceDayIds)
        .order("sort_order", { ascending: true })
    : { data: [], error: null };

  if (sourceWeekTasksError) {
    throw new Error("Unable to load source week tasks.");
  }

  const tasksBySourcePlanDayId = new Map<number, typeof sourceWeekTasks>();

  for (const task of sourceWeekTasks ?? []) {
    const existing = tasksBySourcePlanDayId.get(task.plan_day_id) ?? [];
    existing.push(task);
    tasksBySourcePlanDayId.set(task.plan_day_id, existing);
  }

  const daysToCopy = Math.min(
    sourceWeekEndDay - sourceWeekStartDay + 1,
    targetWeekEndDay - targetWeekStartDay + 1
  );

  for (let offset = 0; offset < daysToCopy; offset += 1) {
    const sourceDayNumber = sourceWeekStartDay + offset;
    const targetDayNumber = targetWeekStartDay + offset;
    const sourceDay = sourceDayMap.get(sourceDayNumber);

    if (!sourceDay) {
      continue;
    }

    const { data: targetDay, error: targetDayError } = await admin
      .from("plan_days")
      .upsert(
        {
          plan_id: planId,
          day_number: targetDayNumber,
          title: sourceDay.title,
          reflection_prompt: sourceDay.reflection_prompt,
        },
        {
          onConflict: "plan_id,day_number",
        }
      )
      .select("id")
      .single();

    if (targetDayError || !targetDay) {
      throw new Error(`Unable to create or update Day ${targetDayNumber}.`);
    }

    await admin.from("plan_day_tasks").delete().eq("plan_day_id", targetDay.id);

    const sourceTasksForDay = tasksBySourcePlanDayId.get(sourceDay.id) ?? [];

    if (sourceTasksForDay.length > 0) {
      await admin.from("plan_day_tasks").insert(
        sourceTasksForDay.map((task) => ({
          plan_day_id: targetDay.id,
          task_template_id: task.task_template_id,
          is_required: task.is_required,
          sort_order: task.sort_order,
        }))
      );
    }
  }

  revalidateAppPaths();
  redirect(`/admin/plan?day=${targetWeekStartDay}`);
}

export default async function AdminPlanPage({
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

  if (!isAllowedAdminEmail(user.email)) {
    redirect("/dashboard");
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
              Admin Plan Editor
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

  const resolvedSearchParams = await searchParams;
  const rawDay = Array.isArray(resolvedSearchParams.day)
    ? resolvedSearchParams.day[0]
    : resolvedSearchParams.day;

  const selectedDay = normalizeDayNumber(
    Number(rawDay ?? challenge.currentDayNumber ?? 1),
    activePlan.total_days
  );

  const adminKeyConfigured = Boolean(getAdminKey());
  const adminEmailsConfigured = getAdminEmails().length > 0;

  const { data: planDay } = await supabase
    .from("plan_days")
    .select("id, day_number, title, reflection_prompt")
    .eq("plan_id", activePlan.id)
    .eq("day_number", selectedDay)
    .maybeSingle();

  const { data: taskTemplatesData } = await supabase
    .from("task_templates")
    .select("id, slug, title, description, cadence, weekly_target")
    .order("title", { ascending: true });

  const taskTemplates = (taskTemplatesData ?? []) as TaskTemplateRow[];

  const { data: planDayTasksData } = planDay
    ? await supabase
        .from("plan_day_tasks")
        .select(
          `
            id,
            is_required,
            sort_order,
            task_template_id,
            task_templates (
              id,
              slug,
              title,
              description,
              cadence,
              weekly_target
            )
          `
        )
        .eq("plan_day_id", planDay.id)
        .order("sort_order", { ascending: true })
    : { data: [] };

  const assignedTasks = (planDayTasksData ?? []) as unknown as PlanDayTaskRow[];
  const assignedTemplateIds = new Set(
    assignedTasks.map((task) => task.task_template_id)
  );

  const availableTemplates = taskTemplates.filter(
    (template) => !assignedTemplateIds.has(template.id)
  );

  const previousDay = selectedDay > 1 ? selectedDay - 1 : 1;
  const nextDay =
    selectedDay < activePlan.total_days ? selectedDay + 1 : activePlan.total_days;

  const currentWeekStartDay = challenge.weekStartDay;
  const suggestedTargetWeekStart = normalizeWeekStartDay(
    currentWeekStartDay + 7,
    activePlan.total_days
  );

  const weeklyQuotaTemplates = taskTemplates.filter(
    (template) => template.cadence === "weekly_quota"
  );

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-zinc-400 sm:text-sm">
              {activePlan.name}
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Admin Plan Editor
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-zinc-300 sm:text-base">
              Edit days, assign tasks, and manage daily versus weekly quota
              disciplines without dropping back into SQL.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-auto lg:min-w-[560px]">
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
              View Today
            </Link>
            <Link
              href="/admin/plan/export"
              className="rounded-lg border border-zinc-700 px-4 py-3 text-center font-semibold text-white transition hover:bg-zinc-900"
            >
              Export Completions CSV
            </Link>
          </div>
        </div>

        {!challenge.hasStarted && (
          <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-base font-semibold text-white sm:text-lg">
              Challenge starts on {challenge.startDateLabel}.
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              You&apos;re currently building preview content before launch day.
            </p>
          </div>
        )}

        {challenge.isComplete && (
          <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-base font-semibold text-white sm:text-lg">
              The challenge is complete.
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              Admin preview is currently anchored to the final challenge day and
              final week.
            </p>
          </div>
        )}

        {!adminKeyConfigured && (
          <div className="mb-6 rounded-2xl border border-red-900 bg-red-950/40 p-4 sm:p-6">
            <p className="font-semibold text-red-200">
              Admin writes are not configured yet.
            </p>
            <p className="mt-2 text-sm text-red-100/80 sm:text-base">
              Add SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY to
              .env.local, then restart the dev server.
            </p>
          </div>
        )}

        {!adminEmailsConfigured && (
          <div className="mb-6 rounded-2xl border border-yellow-900 bg-yellow-950/40 p-4 sm:p-6">
            <p className="font-semibold text-yellow-200">
              Admin email lock is not configured yet.
            </p>
            <p className="mt-2 text-sm text-yellow-100/80 sm:text-base">
              Admin access is currently disabled. Add ADMIN_EMAILS to .env.local
              with a comma-separated allowlist, then restart the dev server.
            </p>
          </div>
        )}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-xs uppercase tracking-wide text-zinc-400 sm:text-sm">
              Active Plan
            </p>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              {activePlan.name}
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              {activePlan.total_days} total days
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-xs uppercase tracking-wide text-zinc-400 sm:text-sm">
              Editing
            </p>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              Day {selectedDay}
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              {planDay ? "Day exists" : "Day not created yet"}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-xs uppercase tracking-wide text-zinc-400 sm:text-sm">
              Live Challenge Day
            </p>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              {challenge.hasStarted ? `Day ${challenge.currentDayNumber}` : "Pre-start"}
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              {challenge.startDateLabel}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <p className="text-xs uppercase tracking-wide text-zinc-400 sm:text-sm">
              Weekly Quota Templates
            </p>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              {weeklyQuotaTemplates.length}
            </p>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              Flexible disciplines tracked across a full week.
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href={`/admin/plan?day=${previousDay}`}
              className="rounded-lg border border-zinc-700 px-4 py-3 text-center font-semibold text-white transition hover:bg-zinc-900"
            >
              Previous Day
            </Link>

            <Link
              href={`/admin/plan?day=${nextDay}`}
              className="rounded-lg border border-zinc-700 px-4 py-3 text-center font-semibold text-white transition hover:bg-zinc-900"
            >
              Next Day
            </Link>

            <Link
              href={`/admin/plan?day=${challenge.currentDayNumber}`}
              className="rounded-lg border border-zinc-700 px-4 py-3 text-center font-semibold text-white transition hover:bg-zinc-900"
            >
              Jump to Live Day
            </Link>

            <Link
              href={`/admin/plan?day=${challenge.weekStartDay}`}
              className="rounded-lg border border-zinc-700 px-4 py-3 text-center font-semibold text-white transition hover:bg-zinc-900"
            >
              Jump to Live Week
            </Link>
          </div>

          <form
            action="/admin/plan"
            method="get"
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <label htmlFor="day" className="text-sm text-zinc-400">
              Jump to day
            </label>
            <input
              id="day"
              name="day"
              type="number"
              min={1}
              max={activePlan.total_days}
              defaultValue={selectedDay}
              className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-3 text-white outline-none sm:w-32"
            />
            <button
              type="submit"
              className="rounded-lg bg-white px-4 py-3 font-semibold text-black transition hover:bg-zinc-200 sm:w-auto"
            >
              Go
            </button>
          </form>
        </div>

        <div className="grid gap-6">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-semibold sm:text-2xl">
                Weekly Quota Notes
              </h2>
              <p className="mt-1 text-sm text-zinc-400 sm:text-base">
                A weekly quota task is not meant to be required on a specific
                day. Assign it to the days you want it available, keep those day
                instances optional, and the app will count completions toward the
                week-wide target.
              </p>
            </div>

            {weeklyQuotaTemplates.length === 0 ? (
              <p className="text-sm text-zinc-400 sm:text-base">
                No weekly quota templates exist yet.
              </p>
            ) : (
              <div className="space-y-3">
                {weeklyQuotaTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="rounded-xl border border-zinc-800 bg-black px-4 py-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-white">{template.title}</p>
                        <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
                          {template.description || template.slug}
                        </p>
                      </div>
                      <span className="w-fit rounded-full border border-zinc-700 px-3 py-1 text-[10px] uppercase tracking-wide text-zinc-300 sm:text-xs">
                        {cadenceLabel(template)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-semibold sm:text-2xl">
                Copy Day to Another Day
              </h2>
              <p className="mt-1 text-sm text-zinc-400 sm:text-base">
                This copies the selected day title, reflection prompt, and all
                assigned tasks to another day. The target day is fully replaced.
              </p>
            </div>

            <form action={copyDayToDay} className="grid gap-4 lg:grid-cols-4">
              <input type="hidden" name="plan_id" value={activePlan.id} />
              <input type="hidden" name="return_day_number" value={selectedDay} />

              <div className="grid gap-2">
                <label
                  htmlFor="source_day_number"
                  className="text-sm font-medium text-zinc-300"
                >
                  Source Day
                </label>
                <input
                  id="source_day_number"
                  name="source_day_number"
                  type="number"
                  min={1}
                  max={activePlan.total_days}
                  defaultValue={selectedDay}
                  className="rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white outline-none"
                />
              </div>

              <div className="grid gap-2">
                <label
                  htmlFor="target_day_number"
                  className="text-sm font-medium text-zinc-300"
                >
                  Target Day
                </label>
                <input
                  id="target_day_number"
                  name="target_day_number"
                  type="number"
                  min={1}
                  max={activePlan.total_days}
                  defaultValue={Math.min(selectedDay + 1, activePlan.total_days)}
                  className="rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white outline-none"
                />
              </div>

              <div className="lg:col-span-2 flex items-end">
                <button
                  type="submit"
                  disabled={!adminKeyConfigured}
                  className="w-full rounded-lg bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto"
                >
                  Copy Day
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-semibold sm:text-2xl">
                Copy Week to Another Week
              </h2>
              <p className="mt-1 text-sm text-zinc-400 sm:text-base">
                Copy a full 7-day block. Each target day is replaced with the
                source day&apos;s title, prompt, and tasks.
              </p>
            </div>

            <form action={copyWeekToWeek} className="grid gap-4 lg:grid-cols-4">
              <input type="hidden" name="plan_id" value={activePlan.id} />
              <input type="hidden" name="total_days" value={activePlan.total_days} />
              <input type="hidden" name="return_day_number" value={selectedDay} />

              <div className="grid gap-2">
                <label
                  htmlFor="source_week_start_day"
                  className="text-sm font-medium text-zinc-300"
                >
                  Source Week Start
                </label>
                <input
                  id="source_week_start_day"
                  name="source_week_start_day"
                  type="number"
                  min={1}
                  max={activePlan.total_days}
                  defaultValue={normalizeWeekStartDay(selectedDay, activePlan.total_days)}
                  className="rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white outline-none"
                />
              </div>

              <div className="grid gap-2">
                <label
                  htmlFor="target_week_start_day"
                  className="text-sm font-medium text-zinc-300"
                >
                  Target Week Start
                </label>
                <input
                  id="target_week_start_day"
                  name="target_week_start_day"
                  type="number"
                  min={1}
                  max={activePlan.total_days}
                  defaultValue={suggestedTargetWeekStart}
                  className="rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white outline-none"
                />
              </div>

              <div className="lg:col-span-2 flex items-end">
                <button
                  type="submit"
                  disabled={!adminKeyConfigured}
                  className="w-full rounded-lg bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto"
                >
                  Copy Week
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-semibold sm:text-2xl">Day Details</h2>
              <p className="mt-1 text-sm text-zinc-400 sm:text-base">
                Create or update the selected day title and reflection prompt.
              </p>
            </div>

            <form action={saveDayDetails} className="space-y-4">
              <input type="hidden" name="plan_id" value={activePlan.id} />
              <input type="hidden" name="day_number" value={selectedDay} />

              <div className="grid gap-2">
                <label htmlFor="title" className="text-sm font-medium text-zinc-300">
                  Day Title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  defaultValue={planDay?.title ?? ""}
                  placeholder={`Day ${selectedDay}`}
                  className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white outline-none"
                />
              </div>

              <div className="grid gap-2">
                <label
                  htmlFor="reflection_prompt"
                  className="text-sm font-medium text-zinc-300"
                >
                  Reflection Prompt
                </label>
                <textarea
                  id="reflection_prompt"
                  name="reflection_prompt"
                  rows={4}
                  defaultValue={planDay?.reflection_prompt ?? ""}
                  placeholder="Write the reflection prompt for this day..."
                  className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={!adminKeyConfigured}
                className="w-full rounded-lg bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                Save Day Details
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-semibold sm:text-2xl">Assigned Tasks</h2>
              <p className="mt-1 text-sm text-zinc-400 sm:text-base">
                Reorder tasks, switch between required and optional, or remove
                them from this day.
              </p>
            </div>

            {assignedTasks.length === 0 ? (
              <p className="text-sm text-zinc-400 sm:text-base">
                No tasks are assigned to this day yet.
              </p>
            ) : (
              <div className="space-y-4">
                {assignedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-xl border border-zinc-800 bg-black p-4"
                  >
                    <div className="mb-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-medium text-white">
                          {task.task_templates?.title || "Untitled Task"}
                        </p>
                        <span className="w-fit rounded-full border border-zinc-700 px-3 py-1 text-[10px] uppercase tracking-wide text-zinc-300 sm:text-xs">
                          {cadenceLabel(task.task_templates)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
                        {task.task_templates?.description ||
                          task.task_templates?.slug ||
                          "No description"}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <form
                        action={saveAssignedTask}
                        className="grid gap-3 lg:grid-cols-[auto_auto_1fr]"
                      >
                        <input type="hidden" name="plan_day_task_id" value={task.id} />
                        <input type="hidden" name="day_number" value={selectedDay} />

                        <label className="flex items-center gap-2 text-sm text-zinc-300">
                          <input
                            type="checkbox"
                            name="is_required"
                            defaultChecked={task.is_required}
                            className="h-4 w-4"
                          />
                          Required
                        </label>

                        <div className="grid gap-1">
                          <label
                            htmlFor={`sort-order-${task.id}`}
                            className="text-sm text-zinc-400"
                          >
                            Sort Order
                          </label>
                          <input
                            id={`sort-order-${task.id}`}
                            name="sort_order"
                            type="number"
                            defaultValue={task.sort_order}
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none lg:w-28"
                          />
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                          <button
                            type="submit"
                            disabled={!adminKeyConfigured}
                            className="rounded-lg bg-white px-4 py-2 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Save Task
                          </button>
                        </div>
                      </form>

                      <form action={removeAssignedTask}>
                        <input type="hidden" name="plan_day_task_id" value={task.id} />
                        <input type="hidden" name="day_number" value={selectedDay} />
                        <button
                          type="submit"
                          disabled={!adminKeyConfigured}
                          className="w-full rounded-lg border border-red-800 px-4 py-2 font-semibold text-red-200 transition hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        >
                          Remove
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-semibold sm:text-2xl">
                Add Existing Task
              </h2>
              <p className="mt-1 text-sm text-zinc-400 sm:text-base">
                Assign one of your reusable task templates to this day.
              </p>
            </div>

            {availableTemplates.length === 0 ? (
              <p className="text-sm text-zinc-400 sm:text-base">
                All existing templates are already assigned to this day.
              </p>
            ) : (
              <form action={addTaskToDay} className="grid gap-4 lg:grid-cols-4">
                <input type="hidden" name="plan_id" value={activePlan.id} />
                <input type="hidden" name="day_number" value={selectedDay} />

                <div className="lg:col-span-2 grid gap-2">
                  <label
                    htmlFor="task_template_id"
                    className="text-sm font-medium text-zinc-300"
                  >
                    Task Template
                  </label>
                  <select
                    id="task_template_id"
                    name="task_template_id"
                    className="rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white outline-none"
                    defaultValue={availableTemplates[0]?.id}
                  >
                    {availableTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.title}
                        {template.cadence === "weekly_quota" && template.weekly_target
                          ? ` (weekly ${template.weekly_target}x)`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <label
                    htmlFor="new_task_sort_order"
                    className="text-sm font-medium text-zinc-300"
                  >
                    Sort Order
                  </label>
                  <input
                    id="new_task_sort_order"
                    name="sort_order"
                    type="number"
                    defaultValue={assignedTasks.length + 1}
                    className="rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white outline-none"
                  />
                </div>

                <div className="flex flex-col justify-end gap-3">
                  <label className="flex items-center gap-2 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      name="is_required"
                      defaultChecked
                      className="h-4 w-4"
                    />
                    Required
                  </label>

                  <button
                    type="submit"
                    disabled={!adminKeyConfigured}
                    className="w-full rounded-lg bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Add Task
                  </button>
                </div>
              </form>
            )}
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-semibold sm:text-2xl">
                Edit Task Templates
              </h2>
              <p className="mt-1 text-sm text-zinc-400 sm:text-base">
                Rename templates, choose daily versus weekly quota behavior, and
                set the weekly target where needed.
              </p>
            </div>

            {taskTemplates.length === 0 ? (
              <p className="text-sm text-zinc-400 sm:text-base">
                No task templates exist yet.
              </p>
            ) : (
              <div className="space-y-4">
                {taskTemplates.map((template) => (
                  <form
                    key={template.id}
                    action={saveTaskTemplate}
                    className="rounded-xl border border-zinc-800 bg-black p-4"
                  >
                    <input type="hidden" name="template_id" value={template.id} />
                    <input type="hidden" name="day_number" value={selectedDay} />

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="grid gap-2">
                        <label
                          htmlFor={`template-title-${template.id}`}
                          className="text-sm font-medium text-zinc-300"
                        >
                          Title
                        </label>
                        <input
                          id={`template-title-${template.id}`}
                          name="title"
                          type="text"
                          defaultValue={template.title}
                          className="rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none"
                        />
                      </div>

                      <div className="grid gap-2">
                        <label
                          htmlFor={`template-slug-${template.id}`}
                          className="text-sm font-medium text-zinc-300"
                        >
                          Slug
                        </label>
                        <input
                          id={`template-slug-${template.id}`}
                          name="slug"
                          type="text"
                          defaultValue={template.slug}
                          className="rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none"
                        />
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <div className="grid gap-2">
                        <label
                          htmlFor={`template-cadence-${template.id}`}
                          className="text-sm font-medium text-zinc-300"
                        >
                          Cadence
                        </label>
                        <select
                          id={`template-cadence-${template.id}`}
                          name="cadence"
                          defaultValue={template.cadence}
                          className="rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly_quota">Weekly quota</option>
                        </select>
                      </div>

                      <div className="grid gap-2">
                        <label
                          htmlFor={`template-weekly-target-${template.id}`}
                          className="text-sm font-medium text-zinc-300"
                        >
                          Weekly Target
                        </label>
                        <input
                          id={`template-weekly-target-${template.id}`}
                          name="weekly_target"
                          type="number"
                          min={1}
                          defaultValue={template.weekly_target ?? ""}
                          placeholder="Leave blank for daily tasks"
                          className="rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none"
                        />
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2">
                      <label
                        htmlFor={`template-description-${template.id}`}
                        className="text-sm font-medium text-zinc-300"
                      >
                        Description
                      </label>
                      <textarea
                        id={`template-description-${template.id}`}
                        name="description"
                        rows={3}
                        defaultValue={template.description ?? ""}
                        className="rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none"
                      />
                    </div>

                    <div className="mt-4">
                      <button
                        type="submit"
                        disabled={!adminKeyConfigured}
                        className="w-full rounded-lg bg-white px-4 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                      >
                        Save Template
                      </button>
                    </div>
                  </form>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-semibold sm:text-2xl">
                Create New Task Template
              </h2>
              <p className="mt-1 text-sm text-zinc-400 sm:text-base">
                Add a reusable task definition, choose daily or weekly quota,
                and assign it wherever you want.
              </p>
            </div>

            <form action={createTaskTemplate} className="grid gap-4">
              <input type="hidden" name="day_number" value={selectedDay} />

              <div className="grid gap-2">
                <label htmlFor="new-task-title" className="text-sm font-medium text-zinc-300">
                  Title
                </label>
                <input
                  id="new-task-title"
                  name="title"
                  type="text"
                  placeholder="Abstain from social media"
                  className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white outline-none"
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="new-task-slug" className="text-sm font-medium text-zinc-300">
                  Slug (optional)
                </label>
                <input
                  id="new-task-slug"
                  name="slug"
                  type="text"
                  placeholder="abstain_from_social_media"
                  className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white outline-none"
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="grid gap-2">
                  <label
                    htmlFor="new-task-cadence"
                    className="text-sm font-medium text-zinc-300"
                  >
                    Cadence
                  </label>
                  <select
                    id="new-task-cadence"
                    name="cadence"
                    defaultValue="daily"
                    className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white outline-none"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly_quota">Weekly quota</option>
                  </select>
                </div>

                <div className="grid gap-2">
                  <label
                    htmlFor="new-task-weekly-target"
                    className="text-sm font-medium text-zinc-300"
                  >
                    Weekly Target
                  </label>
                  <input
                    id="new-task-weekly-target"
                    name="weekly_target"
                    type="number"
                    min={1}
                    placeholder="Example: 3"
                    className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label
                  htmlFor="new-task-description"
                  className="text-sm font-medium text-zinc-300"
                >
                  Description
                </label>
                <textarea
                  id="new-task-description"
                  name="description"
                  rows={3}
                  placeholder="Short description for what this task means."
                  className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={!adminKeyConfigured}
                className="w-full rounded-lg bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-fit"
              >
                Create Task Template
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
