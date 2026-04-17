type AuthDebugDetails = Record<string, unknown>;

function isClientAuthDebugEnabled() {
  return process.env.NEXT_PUBLIC_AUTH_DEBUG === "true";
}

function isServerAuthDebugEnabled() {
  return (
    process.env.AUTH_DEBUG === "true" ||
    process.env.NEXT_PUBLIC_AUTH_DEBUG === "true"
  );
}

export function logAuthDebug(
  scope: "client" | "server",
  message: string,
  details: AuthDebugDetails
) {
  const enabled =
    scope === "client"
      ? isClientAuthDebugEnabled()
      : isServerAuthDebugEnabled();

  if (!enabled) {
    return;
  }

  console.info(`[auth-debug:${scope}] ${message}`, details);
}
