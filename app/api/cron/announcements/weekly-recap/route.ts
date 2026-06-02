import { NextRequest, NextResponse } from "next/server";
import { generateWeeklyRecapAnnouncements } from "@/lib/announcements-weekly-recap";
import { authorizeCronRequest } from "@/lib/route-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const unauthorizedResponse = authorizeCronRequest(
    request.headers.get("authorization")
  );

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const { searchParams } = new URL(request.url);
  const dryRun = searchParams.get("dryRun") === "1";
  const asOf = searchParams.get("asOf");
  const admin = createAdminClient();

  try {
    const result = await generateWeeklyRecapAnnouncements({
      admin,
      dryRun,
      asOf,
    });

    return NextResponse.json(result, {
      status: result.errors.length > 0 ? 500 : 200,
    });
  } catch (error) {
    return NextResponse.json(
      {
        dryRun,
        error:
          error instanceof Error
            ? error.message
            : "Weekly recap generation failed.",
      },
      { status: 500 }
    );
  }
}
