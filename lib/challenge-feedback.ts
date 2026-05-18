import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type ChallengeFeedbackResponse = {
  id: string;
  user_id: string;
  plan_id: number | null;
  plan_day_id: number | null;
  day_number: number;
  liked_text: string | null;
  helped_growth_text: string | null;
  unnecessary_or_confusing_text: string | null;
  too_hard_or_missing_text: string | null;
  suggested_changes_text: string | null;
  general_feedback_text: string | null;
  created_at: string;
  updated_at: string;
};

export type ChallengeFeedbackExportRow = ChallengeFeedbackResponse & {
  user_email: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  track: string | null;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  track: string | null;
};

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export async function readChallengeFeedbackResponses() {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("challenge_feedback_responses")
    .select(
      "id, user_id, plan_id, plan_day_id, day_number, liked_text, helped_growth_text, unnecessary_or_confusing_text, too_hard_or_missing_text, suggested_changes_text, general_feedback_text, created_at, updated_at"
    )
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const responses = (data ?? []) as ChallengeFeedbackResponse[];
  const userIds = [...new Set(responses.map((response) => response.user_id))];

  const { data: profilesData, error: profilesError } = userIds.length
    ? await admin
        .from("profiles")
        .select("id, display_name, first_name, last_name, track")
        .in("id", userIds)
    : { data: [] as ProfileRow[], error: null };

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const profileByUserId = new Map(
    ((profilesData ?? []) as ProfileRow[]).map((profile) => [profile.id, profile])
  );

  const emailByUserId = new Map<string, string | null>();
  try {
    const perPage = 1000;
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const { data: usersData } = await admin.auth.admin.listUsers({
        page,
        perPage,
      });

      for (const authUser of usersData.users) {
        emailByUserId.set(authUser.id, authUser.email ?? null);
      }

      hasMore = usersData.users.length === perPage;
      page += 1;
    }
  } catch {
    // Keep the export useful even if Auth Admin lookup is unavailable.
  }

  return responses.map((response) => {
    const profile = profileByUserId.get(response.user_id);

    return {
      ...response,
      user_email: emailByUserId.get(response.user_id) ?? null,
      display_name: profile?.display_name ?? null,
      first_name: profile?.first_name ?? null,
      last_name: profile?.last_name ?? null,
      track: profile?.track ?? null,
    };
  });
}

export function buildChallengeFeedbackCsv(rows: ChallengeFeedbackExportRow[]) {
  const headers = [
    "submitted_at",
    "updated_at",
    "user_email",
    "display_name",
    "first_name",
    "last_name",
    "track",
    "user_id",
    "plan_id",
    "plan_day_id",
    "day_number",
    "liked_text",
    "helped_growth_text",
    "unnecessary_or_confusing_text",
    "too_hard_or_missing_text",
    "suggested_changes_text",
    "general_feedback_text",
  ];

  const lines = [headers.map(csvCell).join(",")];

  for (const row of rows) {
    lines.push(
      [
        row.created_at,
        row.updated_at,
        row.user_email,
        row.display_name,
        row.first_name,
        row.last_name,
        row.track,
        row.user_id,
        row.plan_id,
        row.plan_day_id,
        row.day_number,
        row.liked_text,
        row.helped_growth_text,
        row.unnecessary_or_confusing_text,
        row.too_hard_or_missing_text,
        row.suggested_changes_text,
        row.general_feedback_text,
      ]
        .map(csvCell)
        .join(",")
    );
  }

  return lines.join("\n");
}
