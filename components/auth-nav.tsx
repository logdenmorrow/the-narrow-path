import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AccountMenu } from "@/components/account-menu";
import SignOutButton from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function AuthNav({ mobile = false }: { mobile?: boolean }) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const isLoggedIn = !error && Boolean(user);

  if (isLoggedIn) {
    return (
      <div
        className={cn(
          "ml-auto flex items-center",
          mobile ? "min-w-0 flex-wrap justify-end gap-1.5" : "gap-3"
        )}
      >
        <AccountMenu
          signOutAction={
            <SignOutButton
              mobile
              className="h-10 w-full justify-start rounded-[0.85rem] px-3 text-[11px] tracking-[0.12em]"
              label="Logout"
              size="sm"
              variant="outline"
            />
          }
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "ml-auto flex items-center",
        mobile ? "min-w-0 flex-wrap justify-end gap-1" : "gap-3"
      )}
    >
      <Button
        asChild
        variant={mobile ? "secondary" : "ghost"}
        size={mobile ? "xs" : "sm"}
        className={mobile ? "h-8 px-2 text-[9px] tracking-[0.06em]" : undefined}
      >
        <Link href="/auth/login">Login</Link>
      </Button>
      <Button
        asChild
        variant="primary"
        size={mobile ? "xs" : "sm"}
        className={mobile ? "h-8 px-2 text-[9px] tracking-[0.06em]" : undefined}
      >
        <Link href="/auth/sign-up">{mobile ? "Start" : "Get Started"}</Link>
      </Button>
    </div>
  );
}
