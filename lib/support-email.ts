import "server-only";

type SupportEmailPayload = {
  issueType: string;
  severity: string;
  fromEmail: string | null;
  track: string;
  title: string;
  description: string;
  pageUrl: string | null;
  createdAt: string;
};

function getSupportFromEmail() {
  return process.env.SUPPORT_FROM_EMAIL || "The Narrow Path <onboarding@resend.dev>";
}

export function getMissingSupportEmailEnvVars() {
  return ["SUPPORT_NOTIFY_EMAIL", "RESEND_API_KEY"].filter(
    (name) => !process.env[name]
  );
}

export async function sendSupportRequestEmail(payload: SupportEmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.SUPPORT_NOTIFY_EMAIL;

  if (!apiKey || !notifyEmail) {
    throw new Error(
      `Missing support email environment variable(s): ${getMissingSupportEmailEnvVars().join(", ")}`
    );
  }

  const text = [
    `Type: ${payload.issueType}`,
    `Severity: ${payload.severity}`,
    `From email: ${payload.fromEmail ?? "Unknown"}`,
    `Track: ${payload.track}`,
    `Title: ${payload.title}`,
    "",
    "Description:",
    payload.description,
    "",
    `Page URL: ${payload.pageUrl ?? "Not provided"}`,
    `Created time: ${payload.createdAt}`,
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getSupportFromEmail(),
      to: [notifyEmail],
      subject: `[The Narrow Path] ${payload.severity}: ${payload.title}`,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend email failed with ${response.status}: ${body}`);
  }
}
