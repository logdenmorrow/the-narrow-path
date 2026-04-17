type NamedCookie = {
  name: string;
};

function isAuthDebugEnabled() {
  return process.env.AUTH_DEBUG === "true";
}

export function getAuthCookieNames(cookies: NamedCookie[]) {
  return cookies
    .filter((cookie) => cookie.name.includes("-auth-token"))
    .map((cookie) => cookie.name)
    .sort();
}

export function logAuthDebug(scope: string, details: Record<string, unknown>) {
  if (!isAuthDebugEnabled()) {
    return;
  }

  console.info(`[auth-debug] ${scope}`, details);
}
