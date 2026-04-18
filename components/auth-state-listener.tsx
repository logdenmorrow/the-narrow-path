"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { appendAuthLog, fetchAuthServerSnapshot, isAuthDebugEnabled } from "@/lib/auth-log";
import { createClient } from "@/lib/supabase/client";

export default function AuthStateListener() {
  const router = useRouter();
  const pathname = usePathname();
  const refreshCountRef = useRef(0);
  const mountedAtRef = useRef(Date.now());

  useEffect(() => {
    if (pathname.startsWith("/auth")) {
      return;
    }

    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      const shouldRefresh =
        event === "SIGNED_OUT" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED";

      if (shouldRefresh) {
        refreshCountRef.current += 1;
      }

      appendAuthLog({
        scope: "auth-listener",
        event: "auth_listener.event",
        pathname,
        details: {
          authEvent: event,
          refreshTriggered: shouldRefresh,
          refreshCount: refreshCountRef.current,
          sinceMountedMs: Date.now() - mountedAtRef.current,
        },
      });

      if (
        shouldRefresh
      ) {
        router.refresh();
      }

      if (isAuthDebugEnabled()) {
        void fetchAuthServerSnapshot(`auth_listener:${event}`);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  return null;
}
