import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SignOutButtonProps = {
  mobile?: boolean;
  className?: string;
  label?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
};

export default function SignOutButton({
  mobile = false,
  className,
  label = "Logout",
  size,
  variant = "outline",
}: SignOutButtonProps) {
  async function handleLogout() {
    "use server";

    const supabase = await createClient();
    await supabase.auth.signOut();

    redirect("/");
  }

  return (
    <form action={handleLogout}>
      <Button
        type="submit"
        variant={variant}
        size={size ?? (mobile ? "xs" : "sm")}
        className={cn(className)}
      >
        {label}
      </Button>
    </form>
  );
}
