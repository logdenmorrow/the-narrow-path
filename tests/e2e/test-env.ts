export function mutationTestsEnabled() {
  return process.env.PLAYWRIGHT_ALLOW_MUTATIONS === "true";
}

export function productionMutationsEnabled() {
  return process.env.PLAYWRIGHT_ALLOW_PRODUCTION_MUTATIONS === "true";
}

export function getBaseUrl() {
  return process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
}

export function isLocalBaseUrl(baseUrl = getBaseUrl()) {
  try {
    const host = new URL(baseUrl).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

export function isLikelyDedicatedTestEmail(email = process.env.PLAYWRIGHT_TEST_EMAIL) {
  return Boolean(email && /(playwright|e2e|test)/i.test(email));
}
