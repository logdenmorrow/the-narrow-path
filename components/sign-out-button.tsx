import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default function SignOutButton({ mobile = false }: { mobile?: boolean }) {
  async function handleLogout() {
    "use server";

    const supabase = await createClient();
    await supabase.auth.signOut();

    redirect("/");
  }

  return (
    <form action={handleLogout}>
      <Button type="submit" variant="outline" size={mobile ? "xs" : "sm"}>
        Logout
      </Button>
    </form>
  );
}
