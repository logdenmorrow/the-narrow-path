import "server-only";

import { getResendClient, isMissingResendApiKey } from "@/lib/resend";

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

const ISSUE_TYPE_LABELS: Record<string, string> = {
  bug: "Bug",
  layout_display_issue: "Layout / display issue",
  confusing_behavior: "Confusing behavior",
  account_issue: "Account issue",
  other: "Other",
};

function getSupportFromEmail() {
  return process.env.SUPPORT_FROM_EMAIL || "The Narrow Path <onboarding@resend.dev>";
}

export function getMissingSupportEmailEnvVars() {
  return ["SUPPORT_NOTIFY_EMAIL", "RESEND_API_KEY"].filter(
    (name) =>
      name === "RESEND_API_KEY"
        ? isMissingResendApiKey()
        : !process.env[name]
  );
}

export async function sendSupportRequestEmail(payload: SupportEmailPayload) {
  const notifyEmail = process.env.SUPPORT_NOTIFY_EMAIL;

  if (isMissingResendApiKey() || !notifyEmail) {
    throw new Error(
      `Missing support email environment variable(s): ${getMissingSupportEmailEnvVars().join(", ")}`
    );
  }

  const text = [
    `Type: ${ISSUE_TYPE_LABELS[payload.issueType] ?? payload.issueType}`,
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

  const { error } = await getResendClient().emails.send({
    from: getSupportFromEmail(),
    to: [notifyEmail],
    subject: `[The Narrow Path] ${payload.severity}: ${payload.title}`,
    text,
  });

  if (error) {
    throw new Error(`Resend email failed: ${error.message}`);
  }
}
