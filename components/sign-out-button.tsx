import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default function SignOutButton() {
  async function handleLogout() {
    "use server";

    const supabase = await createClient();
    await supabase.auth.signOut();

    redirect("/");
  }

  return (
    <form action={handleLogout}>
      <button
        type="submit"
        className="text-sm text-muted-foreground transition hover:text-fg"
      >
        Logout
      </button>
    </form>
  );
}