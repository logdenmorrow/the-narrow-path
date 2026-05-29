import { NextResponse } from "next/server";
import { isAllowedAdminEmail } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAllowedAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: rows, error } = await supabase
    .from("user_task_completions")
    .select(
      `
      user_id,
      plan_day_task_id,
      completed_at,
      updated_at,
      plan_day_tasks (
        id,
        plan_day_id,
        task_templates (
          title,
          slug
        ),
        plan_days (
          day_number
        )
      )
    `
    )
    .order("completed_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const userIds = [
    ...new Set(
      (rows ?? [])
        .map((row) => row.user_id)
        .filter((userId): userId is string => Boolean(userId))
    ),
  ];
  const displayNameByUserId = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);

    if (profilesError) {
      console.error("Unable to load profile names for completions export.", profilesError);
    } else {
      for (const profile of profiles ?? []) {
        displayNameByUserId.set(profile.id, profile.display_name ?? "");
      }
    }
  }

  const header = [
    "user_id",
    "display_name",
    "day_number",
    "task_title",
    "task_slug",
    "plan_day_task_id",
    "completed_at",
    "updated_at",
  ];

  const lines = [header.join(",")];

  for (const row of rows ?? []) {
    const planDayTask = Array.isArray(row.plan_day_tasks)
      ? row.plan_day_tasks[0]
      : row.plan_day_tasks;

    const taskTemplate = Array.isArray(planDayTask?.task_templates)
      ? planDayTask?.task_templates[0]
      : planDayTask?.task_templates;
    const planDay = Array.isArray(planDayTask?.plan_days)
      ? planDayTask?.plan_days[0]
      : planDayTask?.plan_days;

    const values = [
      row.user_id ?? "",
      row.user_id ? (displayNameByUserId.get(row.user_id) ?? "") : "",
      planDay?.day_number?.toString() ?? "",
      taskTemplate?.title ?? "",
      taskTemplate?.slug ?? "",
      row.plan_day_task_id?.toString() ?? "",
      row.completed_at ?? "",
      row.updated_at ?? "",
    ].map((value) => `"${String(value).replaceAll('"', '""')}"`);

    lines.push(values.join(","));
  }

  const csv = lines.join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="narrow-path-completions.csv"`,
    },
  });
}
