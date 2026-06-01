import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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
        <Link
          href="/news"
          className="text-xs font-medium text-monastic-2 underline-offset-4 transition hover:text-monastic-0 hover:underline"
        >
          News
        </Link>
        <Link
          href="/support"
          className="text-xs font-medium text-monastic-2 underline-offset-4 transition hover:text-monastic-0 hover:underline"
        >
          Support
        </Link>
        <SignOutButton mobile={mobile} />
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
