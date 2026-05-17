import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ReminderSlotSummaryRow = {
  reminder_type: "morning_scripture" | "night_prayer";
  enabled: boolean;
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("notification_reminder_slots")
    .select("reminder_type, enabled")
    .eq("user_id", user.id)
    .in("reminder_type", ["morning_scripture", "night_prayer"])
    .returns<ReminderSlotSummaryRow[]>();

  if (error) {
    console.error("Could not read reminder onboarding status.", error);
    return NextResponse.json(
      { error: "Could not read reminder status." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    hasEnabledReminder: Boolean(data?.some((slot) => slot.enabled)),
  });
}
