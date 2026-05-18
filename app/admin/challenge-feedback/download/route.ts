import { NextResponse } from "next/server";
import { authorizeAdminRoute } from "@/lib/admin-auth";
import {
  buildChallengeFeedbackCsv,
  readChallengeFeedbackResponses,
} from "@/lib/challenge-feedback";

export async function GET(request: Request) {
  const unauthorizedResponse = await authorizeAdminRoute(request);
  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    const rows = await readChallengeFeedbackResponses();
    const csv = buildChallengeFeedbackCsv(rows);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="challenge-feedback-${new Date()
          .toISOString()
          .replace(/[:.]/g, "-")}.csv"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not export challenge feedback.",
      },
      { status: 500 }
    );
  }
}
