import "server-only";

export function getAppBaseUrl() {
  const rawValue =
    process.env.APP_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    "https://thenarrowpath.xyz";

  return rawValue.replace(/\/+$/, "");
}

export function getCronSecret() {
  return process.env.CRON_SECRET ?? "";
}
