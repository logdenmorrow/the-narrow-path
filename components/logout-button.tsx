"use client";

import { createClient } from "@/lib/supabase/client";
import { appendAuthLog, fetchAuthServerSnapshot, isAuthDebugEnabled } from "@/lib/auth-log";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();

    appendAuthLog({
      scope: "logout",
      event: "logout.started",
      details: {
        source: "logout_button",
      },
    });

    await supabase.auth.signOut();

    appendAuthLog({
      scope: "logout",
      event: "logout.completed",
      details: {
        source: "logout_button",
      },
    });

    if (isAuthDebugEnabled()) {
      void fetchAuthServerSnapshot("logout.completed");
    }

    router.push("/auth/login");
  };

  return <Button onClick={logout}>Logout</Button>;
}
