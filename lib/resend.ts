import "server-only";

import { Resend } from "resend";

const PLACEHOLDER_API_KEY = "re_xxxxxxxxx";

let resend: Resend | null = null;
let cachedApiKey: string | null = null;

export function isMissingResendApiKey(value = process.env.RESEND_API_KEY) {
  return !value || value === PLACEHOLDER_API_KEY;
}

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY ?? "";

  if (isMissingResendApiKey(apiKey)) {
    throw new Error(
      "Missing RESEND_API_KEY. Replace re_xxxxxxxxx in .env.local with your real Resend API key."
    );
  }

  if (!resend || cachedApiKey !== apiKey) {
    resend = new Resend(apiKey);
    cachedApiKey = apiKey;
  }

  return resend;
}
