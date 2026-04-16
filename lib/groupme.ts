import "server-only";

export type GroupMeTarget = "test" | "prod";

type GroupMePostResponse = {
  meta?: {
    code?: number;
    errors?: string[];
  };
  response?: unknown;
};

const GROUPME_BOT_ENV_BY_TARGET: Record<GroupMeTarget, string> = {
  test: "GROUPME_BOT_ID_TEST",
  prod: "GROUPME_BOT_ID_PROD",
};

export class GroupMeError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "GroupMeError";
    this.status = status;
  }
}

export function parseGroupMeTarget(value: string | null | undefined): GroupMeTarget {
  if (!value || value === "test") {
    return "test";
  }

  if (value === "prod") {
    return "prod";
  }

  throw new GroupMeError("Invalid target. Expected 'test' or 'prod'.", 400);
}

export function getGroupMeBotId(target: GroupMeTarget) {
  const envName = GROUPME_BOT_ENV_BY_TARGET[target];
  const botId = process.env[envName];

  if (!botId?.trim()) {
    throw new GroupMeError(`Missing ${envName} environment variable.`, 500);
  }

  return botId.trim();
}

export async function postGroupMeMessage(target: GroupMeTarget, text: string) {
  const trimmedText = text.trim();

  if (!trimmedText) {
    throw new GroupMeError("Message text is required.", 400);
  }

  const response = await fetch("https://api.groupme.com/v3/bots/post", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      bot_id: getGroupMeBotId(target),
      text: trimmedText,
    }),
    cache: "no-store",
  });

  let payload: GroupMePostResponse | null = null;

  try {
    payload = (await response.json()) as GroupMePostResponse;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const apiMessage =
      payload?.meta?.errors?.join(", ") ||
      `GroupMe request failed with status ${response.status}.`;

    throw new GroupMeError(apiMessage, response.status);
  }

  return {
    ok: true,
    status: response.status,
    response: payload?.response ?? null,
  };
}
