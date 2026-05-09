import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";

export default async function AuthNav({ mobile = false }: { mobile?: boolean }) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const isLoggedIn = !error && Boolean(user);

  if (isLoggedIn) {
    return (
      <div className={`ml-auto flex items-center ${mobile ? "gap-2" : "gap-3"}`}>
        {mobile ? (
          <Button asChild variant="ghost" size="xs">
            <Link href="/support">Support</Link>
          </Button>
        ) : null}
        <SignOutButton mobile={mobile} />
      </div>
    );
  }

  return (
    <div className={`ml-auto flex items-center ${mobile ? "gap-2" : "gap-3"}`}>
      <Button asChild variant={mobile ? "secondary" : "ghost"} size={mobile ? "xs" : "sm"}>
        <Link href="/auth/login">Login</Link>
      </Button>
      <Button asChild variant="primary" size={mobile ? "xs" : "sm"}>
        <Link href="/auth/sign-up">Get Started</Link>
      </Button>
    </div>
  );
}
