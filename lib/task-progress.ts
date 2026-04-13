export type TaskTemplateRelation =
  | {
      title: string | null;
      slug: string | null;
    }
  | Array<{
      title: string | null;
      slug: string | null;
    }>
  | null;

export type PlanDayTaskRecord = {
  id: number;
  task_template_id: number;
  is_required: boolean;
  is_optional: boolean;
  quota_scope: string | null;
  quota_target: number | null;
  requirement_note: string | null;
  day_date: string | null;
  week_start_date: string | null;
  month_start_date: string | null;
  display_order: number | null;
  task_templates: TaskTemplateRelation;
};

export type CompletionRecord = {
  user_id: string;
  plan_day_task_id: number;
};

export type TaskViewModel = {
  id: number;
  taskTemplateId: number;
  title: string;
  slug: string;
  isRequired: boolean;
  isOptional: boolean;
  isCompleted: boolean;
  quotaScope: string | null;
  quotaTarget: number | null;
  progressCount: number | null;
  progressLabel: string | null;
  note: string | null;
  dayDate: string | null;
  weekStartDate: string | null;
  monthStartDate: string | null;
  displayOrder: number;
};

function normalizeTaskTemplate(
  relation: TaskTemplateRelation
): { title: string; slug: string } {
  if (Array.isArray(relation)) {
    const first = relation[0];
    return {
      title: first?.title ?? "Untitled Task",
      slug: first?.slug ?? "task",
    };
  }

  return {
    title: relation?.title ?? "Untitled Task",
    slug: relation?.slug ?? "task",
  };
}

function scopeKey(task: PlanDayTaskRecord): string | null {
  if (task.quota_scope === "week") {
    return `week:${task.task_template_id}:${task.week_start_date ?? ""}`;
  }

  if (task.quota_scope === "last_week_of_month") {
    return `month:${task.task_template_id}:${task.month_start_date ?? ""}`;
  }

  return null;
}

export function buildTaskViewModels(
  dayTasks: PlanDayTaskRecord[],
  scopeTasks: PlanDayTaskRecord[],
  completions: CompletionRecord[],
  userId: string,
  completionOverrides?: Map<number, boolean>
): TaskViewModel[] {
  const userCompletions = completions.filter((row) => row.user_id === userId);
  const completedTaskIds = new Set(userCompletions.map((row) => row.plan_day_task_id));

  const scopeTasksById = new Map<number, PlanDayTaskRecord>();
  for (const task of scopeTasks) {
    scopeTasksById.set(task.id, task);
  }

  const scopedCounts = new Map<string, number>();
  for (const completion of userCompletions) {
    const task = scopeTasksById.get(completion.plan_day_task_id);
    if (!task) continue;

    const key = scopeKey(task);
    if (!key) continue;

    scopedCounts.set(key, (scopedCounts.get(key) ?? 0) + 1);
  }

  return [...dayTasks]
    .sort((a, b) => {
      const orderA = a.display_order ?? 9999;
      const orderB = b.display_order ?? 9999;
      if (orderA !== orderB) return orderA - orderB;

      const titleA = normalizeTaskTemplate(a.task_templates).title;
      const titleB = normalizeTaskTemplate(b.task_templates).title;
      return titleA.localeCompare(titleB);
    })
    .map((task) => {
      const template = normalizeTaskTemplate(task.task_templates);
      const key = scopeKey(task);
      const progressCount = key ? (scopedCounts.get(key) ?? 0) : null;

      let progressLabel: string | null = null;
      if (
        task.quota_scope &&
        task.quota_target !== null &&
        task.quota_target !== undefined &&
        progressCount !== null
      ) {
        progressLabel =
          task.quota_scope === "week"
            ? `${progressCount}/${task.quota_target} this week`
            : `${progressCount}/${task.quota_target} this month`;
      }

      return {
        id: task.id,
        taskTemplateId: task.task_template_id,
        title: template.title,
        slug: template.slug,
        isRequired: task.is_required,
        isOptional: task.is_optional,
        isCompleted:
          completionOverrides?.get(task.id) ?? completedTaskIds.has(task.id),
        quotaScope: task.quota_scope,
        quotaTarget: task.quota_target,
        progressCount,
        progressLabel,
        note: task.requirement_note,
        dayDate: task.day_date,
        weekStartDate: task.week_start_date,
        monthStartDate: task.month_start_date,
        displayOrder: task.display_order ?? 9999,
      };
    });
}

export function summarizeRequiredTasks(tasks: TaskViewModel[]) {
  const required = tasks.filter((task) => task.isRequired);
  const done = required.filter((task) => task.isCompleted).length;

  return {
    total: required.length,
    done,
    started: done > 0,
    completedAll: required.length > 0 && done === required.length,
  };
}

export function toShortDisplayName(name: string | null | undefined) {
  if (!name?.trim()) return "Member";

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];

  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase() ?? "";
  return `${first} ${lastInitial}.`;
}

export function formatReadableDate(dateString: string | null | undefined) {
  if (!dateString) return "";

  const date = new Date(`${dateString}T12:00:00`);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
