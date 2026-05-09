import { NextRequest, NextResponse } from "next/server";
import { GroupMeError, postGroupMeMessage } from "@/lib/groupme";
import { generateWeeklyRecapPreview } from "@/lib/groupme-weekly";
import { authorizeCronRequest } from "@/lib/route-auth";

export async function POST(request: NextRequest) {
  const unauthorizedResponse = authorizeCronRequest(
    request.headers.get("authorization")
  );

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    const { searchParams } = new URL(request.url);
    const dryRun = searchParams.get("dryRun") === "1";
    const preview = await generateWeeklyRecapPreview();

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        ...preview,
      });
    }

    const result = await postGroupMeMessage("prod", preview.message);

    return NextResponse.json({
      success: true,
      status: result.status,
      ...preview,
    });
  } catch (error) {
    if (error instanceof GroupMeError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
