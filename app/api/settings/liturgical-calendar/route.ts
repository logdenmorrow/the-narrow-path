import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ReligiousOrderCalendarPreference = "dominican" | null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizePreference(value: unknown): ReligiousOrderCalendarPreference {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value === "dominican") {
    return value;
  }

  throw new Error("Choose a valid liturgical calendar preference.");
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json(
      { error: "Request body must be an object." },
      { status: 400 }
    );
  }

  let preference: ReligiousOrderCalendarPreference;

  try {
    preference = normalizePreference(
      body.religious_order_calendar ?? body.religiousOrderCalendar
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Invalid liturgical calendar preference.",
      },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ religious_order_calendar: preference })
    .eq("id", user.id)
    .select("religious_order_calendar")
    .maybeSingle();

  if (error) {
    console.error("Could not save liturgical calendar preference.", error);
    return NextResponse.json(
      { error: "Could not save calendar preference." },
      { status: 500 }
    );
  }

  revalidatePath("/settings");
  revalidatePath("/today");
  revalidatePath("/today-in-the-church");

  return NextResponse.json({
    success: true,
    religious_order_calendar: data?.religious_order_calendar ?? null,
  });
}
