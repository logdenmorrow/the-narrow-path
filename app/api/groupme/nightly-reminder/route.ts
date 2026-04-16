import { NextRequest, NextResponse } from "next/server";
import {
  GroupMeError,
  parseGroupMeTarget,
  postGroupMeMessage,
} from "@/lib/groupme";
import { generateNightlyReminderPreview } from "@/lib/groupme-nightly";
import { authorizeCronRequest } from "@/lib/route-auth";

export async function GET(request: NextRequest) {
  const unauthorizedResponse = authorizeCronRequest(
    request.headers.get("authorization")
  );

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    const { searchParams } = new URL(request.url);
    const target = parseGroupMeTarget(searchParams.get("target"));
    const dryRun = searchParams.get("dryRun") === "1";
    const preview = await generateNightlyReminderPreview();

    if (dryRun) {
      return NextResponse.json({
        target,
        tomorrowDate: preview.tomorrowDate,
        detectedVariants: preview.variants,
        message: preview.message,
        dryRun: true,
      });
    }

    const result = await postGroupMeMessage(target, preview.message);

    return NextResponse.json({
      success: true,
      target,
      tomorrowDate: preview.tomorrowDate,
      detectedVariants: preview.variants,
      message: preview.message,
      status: result.status,
    });
  } catch (error) {
    if (error instanceof GroupMeError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
