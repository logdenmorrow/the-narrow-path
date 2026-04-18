"use client";

import { useEffect } from "react";
import { clearPendingLoginRedirect } from "@/lib/auth-log";

export function DashboardLoginRedirectClear() {
  useEffect(() => {
    clearPendingLoginRedirect();
  }, []);

  return null;
}
