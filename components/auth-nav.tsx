import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/sign-out-button";

export default async function AuthNav() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  const isLoggedIn = !error && !!data?.claims;

  if (isLoggedIn) {
    return (
      <div className="ml-auto flex items-center gap-6">
        <SignOutButton />
      </div>
    );
  }

  return (
    <div className="ml-auto flex items-center gap-6">
      <Link href="/auth/login" className="transition hover:text-white">
        Login
      </Link>
      <Link href="/auth/sign-up" className="transition hover:text-white">
        Sign Up
      </Link>
    </div>
  );
}