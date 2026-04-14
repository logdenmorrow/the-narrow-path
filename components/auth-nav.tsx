import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/sign-out-button";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default async function AuthNav() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  const isLoggedIn = !error && !!data?.claims;

  if (isLoggedIn) {
    return (
      <div className="ml-auto flex items-center gap-4">
        <ThemeSwitcher />
        <SignOutButton />
      </div>
    );
  }

  return (
    <div className="ml-auto flex items-center gap-4 text-sm">
      <ThemeSwitcher />
      <Link href="/auth/login" className="transition hover:text-fg">
        Login
      </Link>
      <Link href="/auth/sign-up" className="transition hover:text-fg">
        Sign Up
      </Link>
    </div>
  );
}
