import { Resend } from "resend";

const PLACEHOLDER_API_KEY = "re_xxxxxxxxx";

const apiKey = process.env.RESEND_API_KEY?.trim();
const fromEmail =
  process.env.SUPPORT_FROM_EMAIL?.trim() ||
  "The Narrow Path <onboarding@resend.dev>";
const toEmail = process.env.SUPPORT_NOTIFY_EMAIL?.trim() || "lrnester1@gmail.com";

if (!apiKey || apiKey === PLACEHOLDER_API_KEY) {
  console.error(
    "Set RESEND_API_KEY in .env.local. Replace re_xxxxxxxxx with your real Resend API key."
  );
  process.exit(1);
}

const resend = new Resend(apiKey);

const { data, error } = await resend.emails.send({
  from: fromEmail,
  to: toEmail,
  subject: "The Narrow Path Resend test",
  html: `
    <p>This is a test email from <strong>The Narrow Path</strong>.</p>
    <p>If you received this, Resend is configured correctly.</p>
  `,
});

if (error) {
  console.error("Resend test email failed:");
  console.error(error);
  process.exit(1);
}

console.log("Email sent:", data);
console.log(`From: ${fromEmail}`);
console.log(`To: ${toEmail}`);