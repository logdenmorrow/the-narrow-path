import { NextRequest, NextResponse } from "next/server";
import { GroupMeError, postGroupMeMessage } from "@/lib/groupme";
import { authorizeCronRequest } from "@/lib/route-auth";

export async function GET(request: NextRequest) {
  const unauthorizedResponse = authorizeCronRequest(
    request.headers.get("authorization")
  );

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    const result = await postGroupMeMessage(
      "test",
      "Test message from Monsignor Ping."
    );

    return NextResponse.json({
      success: true,
      target: "test",
      message: "Test message from Monsignor Ping.",
      status: result.status,
    });
  } catch (error) {
    if (error instanceof GroupMeError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
