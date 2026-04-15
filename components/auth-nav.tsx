import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";

export default async function AuthNav({ mobile = false }: { mobile?: boolean }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  const isLoggedIn = !error && !!data?.claims;

  if (isLoggedIn) {
    return (
      <div className="ml-auto flex items-center gap-3">
        <SignOutButton />
      </div>
    );
  }

  return (
    <div className="ml-auto flex items-center gap-3">
      <Button asChild variant={mobile ? "secondary" : "ghost"} size="sm">
        <Link href="/auth/login">Login</Link>
      </Button>
      <Button asChild variant="primary" size="sm">
        <Link href="/auth/sign-up">Get Started</Link>
      </Button>
    </div>
  );
}
