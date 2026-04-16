import { NextRequest, NextResponse } from "next/server";
import { GroupMeError, parseGroupMeTarget, postGroupMeMessage } from "@/lib/groupme";
import { authorizeCronRequest } from "@/lib/route-auth";

type SendRequestBody = {
  text?: unknown;
  target?: unknown;
};

export async function POST(request: NextRequest) {
  const unauthorizedResponse = authorizeCronRequest(
    request.headers.get("authorization")
  );

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    const body = (await request.json()) as SendRequestBody;
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const target = parseGroupMeTarget(
      typeof body.target === "string" ? body.target : undefined
    );

    if (!text) {
      throw new GroupMeError("Request body must include a non-empty text value.", 400);
    }

    const result = await postGroupMeMessage(target, text);

    return NextResponse.json({
      success: true,
      target,
      text,
      status: result.status,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    if (error instanceof GroupMeError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
