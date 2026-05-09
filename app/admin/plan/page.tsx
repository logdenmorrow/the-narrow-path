import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ReactNode } from "react";
import {
  HeroPanel,
  MetricCard,
  PageFrame,
  SectionHeader,
  SurfaceCard,
  SurfaceInset,
} from "@/components/monastic-ui";
import { AppActionBar } from "@/components/page-actions";
import { StatusPill } from "@/components/task-card";
import { Button } from "@/components/ui/button";
import { getAdminEmails, isAllowedAdminEmail, requireAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
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

const fieldClassName = "monastic-field";
const compactFieldClassName = "monastic-field px-3 py-2";
const labelClassName = "text-sm font-medium text-monastic-1";
const helperTextClassName = "text-sm text-monastic-1 sm:text-base";
const checkboxClassName = "monastic-checkbox";

type AdminSectionProps = {
  kicker: string;
  title: string;
  description: string;
  children: ReactNode;
  action?: ReactNode;
};

function AdminSection({
  kicker,
  title,
  description,
  children,
  action,
}: AdminSectionProps) {
  return (
    <SurfaceCard>
      <SectionHeader
        kicker={kicker}
        title={title}
        description={description}
        action={action}
      />
      <div className="mt-5">{children}</div>
    </SurfaceCard>
  );
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
      <main className="monastic-page">
        <PageFrame className="space-y-6">
          <SurfaceCard>
            <SectionHeader
              kicker="Admin"
              title="Admin Plan Editor"
              description="No active challenge plan was found. Add or activate a plan in Supabase before using this page."
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
    <main className="monastic-page">
      <PageFrame className="space-y-6">
        <HeroPanel className="py-7 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <div className="text-[#f7ebd8]">
              <p className="section-kicker text-[#ead6b0]">{activePlan.name}</p>
              <h1 className="mt-3 text-5xl font-semibold sm:text-6xl">
                Admin Plan Editor
              </h1>
              <p className="mt-3 text-lg leading-8 text-[#ead8bc]">
                Edit days, assign tasks, and manage daily versus weekly quota
                disciplines without dropping back into SQL.
              </p>
            </div>

            <AppActionBar
              className="grid gap-3 border-white/10 bg-[rgba(22,16,13,0.28)] sm:grid-cols-5"
              actions={[
                { href: "/dashboard", label: "Back to Dashboard", variant: "secondary" },
                { href: "/today", label: "View Today", variant: "primary" },
                { href: "/admin/auth-reports", label: "Auth Reports", variant: "outline" },
                { href: "/admin/support", label: "Support", variant: "outline" },
                { href: "/admin/plan/export", label: "Export CSV", variant: "outline" },
              ]}
            />
          </div>
        </HeroPanel>

        {!challenge.hasStarted && (
          <SurfaceCard>
            <p className="text-base font-semibold text-monastic-0 sm:text-lg">
              Challenge starts on {challenge.startDateLabel}.
            </p>
            <p className="mt-2 text-sm text-monastic-1 sm:text-base">
              You&apos;re currently building preview content before launch day.
            </p>
          </SurfaceCard>
        )}

        {challenge.isComplete && (
          <SurfaceCard>
            <p className="text-base font-semibold text-monastic-0 sm:text-lg">
              The challenge is complete.
            </p>
            <p className="mt-2 text-sm text-monastic-1 sm:text-base">
              Admin preview is currently anchored to the final challenge day and
              final week.
            </p>
          </SurfaceCard>
        )}

        {!adminKeyConfigured && (
          <SurfaceCard className="border-[rgba(145,53,53,0.42)] bg-[linear-gradient(180deg,rgba(107,24,24,0.16),rgba(61,15,15,0.08))]">
            <p className="font-semibold text-[#7c1d1d] dark:text-[#fecaca]">
              Admin writes are not configured yet.
            </p>
            <p className="mt-2 text-sm text-[#7f1d1d] dark:text-[#fee2e2] sm:text-base">
              Add SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY to
              .env.local, then restart the dev server.
            </p>
          </SurfaceCard>
        )}

        {!adminEmailsConfigured && (
          <SurfaceCard className="border-[rgba(161,98,7,0.42)] bg-[linear-gradient(180deg,rgba(161,98,7,0.12),rgba(120,53,15,0.08))]">
            <p className="font-semibold text-[#854d0e] dark:text-[#fde68a]">
              Admin email lock is not configured yet.
            </p>
            <p className="mt-2 text-sm text-[#713f12] dark:text-[#fef3c7] sm:text-base">
              Admin access is currently disabled. Add ADMIN_EMAILS to .env.local
              with a comma-separated allowlist, then restart the dev server.
            </p>
          </SurfaceCard>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Active Plan"
            value={activePlan.name}
            detail={`${activePlan.total_days} total days`}
          />
          <MetricCard
            label="Editing"
            value={`Day ${selectedDay}`}
            detail={planDay ? "Day exists" : "Day not created yet"}
          />
          <MetricCard
            label="Live Challenge Day"
            value={challenge.hasStarted ? `Day ${challenge.currentDayNumber}` : "Pre-start"}
            detail={challenge.startDateLabel}
          />
          <MetricCard
            label="Weekly Quota Templates"
            value={`${weeklyQuotaTemplates.length}`}
            detail="Flexible disciplines tracked across a full week."
          />
        </div>

        <SurfaceCard>
          <SectionHeader
            kicker="Navigation"
            title="Move through the plan quickly."
            description="Jump by day, follow the live challenge window, or step day by day."
          />
          <div className="mt-5 flex flex-col gap-4">
            <div className="grid gap-3 rounded-[1.4rem] border border-monastic bg-monastic-panel p-2 shadow-[0_18px_34px_-30px_rgba(42,25,15,0.8)] sm:grid-cols-2 xl:grid-cols-4">
              {[previousDay, nextDay, challenge.currentDayNumber, challenge.weekStartDay].map(
                (day, index) => (
                  <Button
                    key={`${day}-${index}`}
                    asChild
                    variant={index < 2 ? "secondary" : "outline"}
                  >
                    <Link
                      href={`/admin/plan?day=${day}`}
                    >
                      {index === 0
                        ? "Previous Day"
                        : index === 1
                          ? "Next Day"
                          : index === 2
                            ? "Jump to Live Day"
                            : "Jump to Live Week"}
                    </Link>
                  </Button>
                )
              )}
            </div>
            <form
              action="/admin/plan"
              method="get"
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
            >
              <div className="grid gap-2">
                <label htmlFor="day" className={labelClassName}>
                  Jump to day
                </label>
                <input
                  id="day"
                  name="day"
                  type="number"
                  min={1}
                  max={activePlan.total_days}
                  defaultValue={selectedDay}
                  className={`${fieldClassName} sm:w-32`}
                />
              </div>
              <Button type="submit" variant="secondary">
                Go
              </Button>
            </form>
          </div>
        </SurfaceCard>

        <div className="grid gap-6">
          <AdminSection
            kicker="Quota"
            title="Weekly Quota Notes"
            description="A weekly quota task is not meant to be required on a specific day. Assign it to the days you want it available, keep those day instances optional, and the app will count completions toward the week-wide target."
          >
            {weeklyQuotaTemplates.length === 0 ? (
              <p className={helperTextClassName}>No weekly quota templates exist yet.</p>
            ) : (
              <div className="space-y-3">
                {weeklyQuotaTemplates.map((template) => (
                  <SurfaceInset key={template.id}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-monastic-0">{template.title}</p>
                        <p className="mt-1 text-xs text-monastic-2 sm:text-sm">
                          {template.description || template.slug}
                        </p>
                      </div>
                      <StatusPill tone="progress">{cadenceLabel(template)}</StatusPill>
                    </div>
                  </SurfaceInset>
                ))}
              </div>
            )}
          </AdminSection>

          <AdminSection
            kicker="Copy"
            title="Copy Day to Another Day"
            description="This copies the selected day title, reflection prompt, and all assigned tasks to another day. The target day is fully replaced."
          >
            <form action={copyDayToDay} className="grid gap-4 lg:grid-cols-4">
              <input type="hidden" name="plan_id" value={activePlan.id} />
              <input type="hidden" name="return_day_number" value={selectedDay} />

              <div className="grid gap-2">
                <label htmlFor="source_day_number" className={labelClassName}>
                  Source Day
                </label>
                <input
                  id="source_day_number"
                  name="source_day_number"
                  type="number"
                  min={1}
                  max={activePlan.total_days}
                  defaultValue={selectedDay}
                  className={fieldClassName}
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="target_day_number" className={labelClassName}>
                  Target Day
                </label>
                <input
                  id="target_day_number"
                  name="target_day_number"
                  type="number"
                  min={1}
                  max={activePlan.total_days}
                  defaultValue={Math.min(selectedDay + 1, activePlan.total_days)}
                  className={fieldClassName}
                />
              </div>

              <div className="lg:col-span-2 flex items-end">
                <Button type="submit" disabled={!adminKeyConfigured}>
                  Copy Day
                </Button>
              </div>
            </form>
          </AdminSection>

          <AdminSection
            kicker="Copy"
            title="Copy Week to Another Week"
            description="Copy a full 7-day block. Each target day is replaced with the source day&apos;s title, prompt, and tasks."
          >
            <form action={copyWeekToWeek} className="grid gap-4 lg:grid-cols-4">
              <input type="hidden" name="plan_id" value={activePlan.id} />
              <input type="hidden" name="total_days" value={activePlan.total_days} />
              <input type="hidden" name="return_day_number" value={selectedDay} />

              <div className="grid gap-2">
                <label htmlFor="source_week_start_day" className={labelClassName}>
                  Source Week Start
                </label>
                <input
                  id="source_week_start_day"
                  name="source_week_start_day"
                  type="number"
                  min={1}
                  max={activePlan.total_days}
                  defaultValue={normalizeWeekStartDay(selectedDay, activePlan.total_days)}
                  className={fieldClassName}
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="target_week_start_day" className={labelClassName}>
                  Target Week Start
                </label>
                <input
                  id="target_week_start_day"
                  name="target_week_start_day"
                  type="number"
                  min={1}
                  max={activePlan.total_days}
                  defaultValue={suggestedTargetWeekStart}
                  className={fieldClassName}
                />
              </div>

              <div className="lg:col-span-2 flex items-end">
                <Button type="submit" disabled={!adminKeyConfigured}>
                  Copy Week
                </Button>
              </div>
            </form>
          </AdminSection>

          <AdminSection
            kicker="Day"
            title="Day Details"
            description="Create or update the selected day title and reflection prompt."
          >
            <form action={saveDayDetails} className="space-y-4">
              <input type="hidden" name="plan_id" value={activePlan.id} />
              <input type="hidden" name="day_number" value={selectedDay} />

              <div className="grid gap-2">
                <label htmlFor="title" className={labelClassName}>
                  Day Title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  defaultValue={planDay?.title ?? ""}
                  placeholder={`Day ${selectedDay}`}
                  className={fieldClassName}
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="reflection_prompt" className={labelClassName}>
                  Reflection Prompt
                </label>
                <textarea
                  id="reflection_prompt"
                  name="reflection_prompt"
                  rows={4}
                  defaultValue={planDay?.reflection_prompt ?? ""}
                  placeholder="Write the reflection prompt for this day..."
                  className={`${fieldClassName} min-h-32`}
                />
              </div>

              <Button type="submit" disabled={!adminKeyConfigured}>
                Save Day Details
              </Button>
            </form>
          </AdminSection>

          <AdminSection
            kicker="Assignments"
            title="Assigned Tasks"
            description="Reorder tasks, switch between required and optional, or remove them from this day."
          >
            {assignedTasks.length === 0 ? (
              <p className={helperTextClassName}>No tasks are assigned to this day yet.</p>
            ) : (
              <div className="space-y-4">
                {assignedTasks.map((task) => (
                  <SurfaceInset key={task.id}>
                    <div className="mb-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-medium text-monastic-0">
                          {task.task_templates?.title || "Untitled Task"}
                        </p>
                        <StatusPill tone={task.is_required ? "required" : "optional"}>
                          {cadenceLabel(task.task_templates)}
                        </StatusPill>
                      </div>
                      <p className="mt-1 text-xs text-monastic-2 sm:text-sm">
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

                        <label className="flex items-center gap-2 text-sm text-monastic-1">
                          <input
                            type="checkbox"
                            name="is_required"
                            defaultChecked={task.is_required}
                            className={checkboxClassName}
                          />
                          Required
                        </label>

                        <div className="grid gap-1">
                          <label
                            htmlFor={`sort-order-${task.id}`}
                            className={labelClassName}
                          >
                            Sort Order
                          </label>
                          <input
                            id={`sort-order-${task.id}`}
                            name="sort_order"
                            type="number"
                            defaultValue={task.sort_order}
                            className={`${compactFieldClassName} lg:w-28`}
                          />
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                          <Button type="submit" disabled={!adminKeyConfigured} size="sm">
                            Save Task
                          </Button>
                        </div>
                      </form>

                      <form action={removeAssignedTask}>
                        <input type="hidden" name="plan_day_task_id" value={task.id} />
                        <input type="hidden" name="day_number" value={selectedDay} />
                        <Button
                          type="submit"
                          disabled={!adminKeyConfigured}
                          variant="destructive"
                          size="sm"
                        >
                          Remove
                        </Button>
                      </form>
                    </div>
                  </SurfaceInset>
                ))}
              </div>
            )}
          </AdminSection>

          <AdminSection
            kicker="Assignments"
            title="Add Existing Task"
            description="Assign one of your reusable task templates to this day."
          >
            {availableTemplates.length === 0 ? (
              <p className={helperTextClassName}>
                All existing templates are already assigned to this day.
              </p>
            ) : (
              <form action={addTaskToDay} className="grid gap-4 lg:grid-cols-4">
                <input type="hidden" name="plan_id" value={activePlan.id} />
                <input type="hidden" name="day_number" value={selectedDay} />

                <div className="lg:col-span-2 grid gap-2">
                  <label htmlFor="task_template_id" className={labelClassName}>
                    Task Template
                  </label>
                  <select
                    id="task_template_id"
                    name="task_template_id"
                    className={fieldClassName}
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
                  <label htmlFor="new_task_sort_order" className={labelClassName}>
                    Sort Order
                  </label>
                  <input
                    id="new_task_sort_order"
                    name="sort_order"
                    type="number"
                    defaultValue={assignedTasks.length + 1}
                    className={fieldClassName}
                  />
                </div>

                <div className="flex flex-col justify-end gap-3">
                  <label className="flex items-center gap-2 text-sm text-monastic-1">
                    <input
                      type="checkbox"
                      name="is_required"
                      defaultChecked
                      className={checkboxClassName}
                    />
                    Required
                  </label>

                  <Button type="submit" disabled={!adminKeyConfigured}>
                    Add Task
                  </Button>
                </div>
              </form>
            )}
          </AdminSection>

          <AdminSection
            kicker="Templates"
            title="Edit Task Templates"
            description="Rename templates, choose daily versus weekly quota behavior, and set the weekly target where needed."
          >
            {taskTemplates.length === 0 ? (
              <p className={helperTextClassName}>No task templates exist yet.</p>
            ) : (
              <div className="space-y-4">
                {taskTemplates.map((template) => (
                  <SurfaceInset key={template.id}>
                    <form action={saveTaskTemplate} className="space-y-4">
                      <input type="hidden" name="template_id" value={template.id} />
                      <input type="hidden" name="day_number" value={selectedDay} />

                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="grid gap-2">
                          <label htmlFor={`template-title-${template.id}`} className={labelClassName}>
                            Title
                          </label>
                          <input
                            id={`template-title-${template.id}`}
                            name="title"
                            type="text"
                            defaultValue={template.title}
                            className={fieldClassName}
                          />
                        </div>

                        <div className="grid gap-2">
                          <label htmlFor={`template-slug-${template.id}`} className={labelClassName}>
                            Slug
                          </label>
                          <input
                            id={`template-slug-${template.id}`}
                            name="slug"
                            type="text"
                            defaultValue={template.slug}
                            className={fieldClassName}
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <div className="grid gap-2">
                          <label htmlFor={`template-cadence-${template.id}`} className={labelClassName}>
                            Cadence
                          </label>
                          <select
                            id={`template-cadence-${template.id}`}
                            name="cadence"
                            defaultValue={template.cadence}
                            className={fieldClassName}
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly_quota">Weekly quota</option>
                          </select>
                        </div>

                        <div className="grid gap-2">
                          <label htmlFor={`template-weekly-target-${template.id}`} className={labelClassName}>
                            Weekly Target
                          </label>
                          <input
                            id={`template-weekly-target-${template.id}`}
                            name="weekly_target"
                            type="number"
                            min={1}
                            defaultValue={template.weekly_target ?? ""}
                            placeholder="Leave blank for daily tasks"
                            className={fieldClassName}
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2">
                        <label htmlFor={`template-description-${template.id}`} className={labelClassName}>
                          Description
                        </label>
                        <textarea
                          id={`template-description-${template.id}`}
                          name="description"
                          rows={3}
                          defaultValue={template.description ?? ""}
                          className={`${fieldClassName} min-h-28`}
                        />
                      </div>

                      <div className="mt-4">
                        <Button type="submit" disabled={!adminKeyConfigured}>
                          Save Template
                        </Button>
                      </div>
                    </form>
                  </SurfaceInset>
                ))}
              </div>
            )}
          </AdminSection>

          <AdminSection
            kicker="Templates"
            title="Create New Task Template"
            description="Add a reusable task definition, choose daily or weekly quota, and assign it wherever you want."
          >
            <form action={createTaskTemplate} className="grid gap-4">
              <input type="hidden" name="day_number" value={selectedDay} />

              <div className="grid gap-2">
                <label htmlFor="new-task-title" className={labelClassName}>
                  Title
                </label>
                <input
                  id="new-task-title"
                  name="title"
                  type="text"
                  placeholder="Abstain from social media"
                  className={fieldClassName}
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="new-task-slug" className={labelClassName}>
                  Slug (optional)
                </label>
                <input
                  id="new-task-slug"
                  name="slug"
                  type="text"
                  placeholder="abstain_from_social_media"
                  className={fieldClassName}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="grid gap-2">
                  <label htmlFor="new-task-cadence" className={labelClassName}>
                    Cadence
                  </label>
                  <select
                    id="new-task-cadence"
                    name="cadence"
                    defaultValue="daily"
                    className={fieldClassName}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly_quota">Weekly quota</option>
                  </select>
                </div>

                <div className="grid gap-2">
                  <label htmlFor="new-task-weekly-target" className={labelClassName}>
                    Weekly Target
                  </label>
                  <input
                    id="new-task-weekly-target"
                    name="weekly_target"
                    type="number"
                    min={1}
                    placeholder="Example: 3"
                    className={fieldClassName}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label htmlFor="new-task-description" className={labelClassName}>
                  Description
                </label>
                <textarea
                  id="new-task-description"
                  name="description"
                  rows={3}
                  placeholder="Short description for what this task means."
                  className={`${fieldClassName} min-h-28`}
                />
              </div>

              <Button type="submit" disabled={!adminKeyConfigured}>
                Create Task Template
              </Button>
            </form>
          </AdminSection>
        </div>
      </PageFrame>
    </main>
  );
}
