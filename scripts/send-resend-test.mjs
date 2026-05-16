import { Resend } from "resend";

const PLACEHOLDER_API_KEY = "re_xxxxxxxxx";
const apiKey = process.env.RESEND_API_KEY;

if (!apiKey || apiKey === PLACEHOLDER_API_KEY) {
  console.error(
    "Set RESEND_API_KEY in .env.local. Replace re_xxxxxxxxx with your real Resend API key."
  );
  process.exit(1);
}

const resend = new Resend(apiKey);

const { data, error } = await resend.emails.send({
  from: process.env.SUPPORT_FROM_EMAIL || "The Narrow Path <onboarding@resend.dev>",
  to: "lrnester1@gmail.com",
  subject: "Hello World",
  html: "<p>Congrats on sending your <strong>first email</strong>!</p>",
});

if (error) {
  console.error(error);
  process.exit(1);
}

console.log("Email sent:", data);
