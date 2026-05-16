"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function closeSupportRequest(formData: FormData) {
  await requireAdminUser();

  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    redirect("/admin/support?error=close");
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("support_requests")
    .update({ status: "closed" })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error("Support request close failed.", error);
    redirect("/admin/support?error=close");
  }

  revalidatePath("/admin/support");
  redirect("/admin/support?closed=1");
}
