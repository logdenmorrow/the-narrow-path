"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  adminArchiveAnnouncement,
  adminCreateAnnouncement,
  adminPublishAnnouncement,
  adminUpdateAnnouncement,
} from "@/lib/announcements";
import { requireAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

function redirectWithError(message: string) {
  redirect(`/admin/announcements?error=${encodeURIComponent(message)}`);
}

function revalidateAnnouncementPaths() {
  revalidatePath("/admin/announcements");
  revalidatePath("/announcements");
}

export async function createAnnouncementAction(formData: FormData) {
  const user = await requireAdminUser();
  const admin = createAdminClient();
  const result = await adminCreateAnnouncement({
    admin,
    formData,
    userId: user.id,
  });

  if (!result.ok) {
    redirectWithError(result.error ?? "Announcement was not created.");
  }

  revalidateAnnouncementPaths();
  redirect("/admin/announcements?created=1");
}

export async function updateAnnouncementAction(formData: FormData) {
  await requireAdminUser();
  const admin = createAdminClient();
  const result = await adminUpdateAnnouncement({ admin, formData });

  if (!result.ok) {
    redirectWithError(result.error ?? "Announcement was not updated.");
  }

  revalidateAnnouncementPaths();
  redirect("/admin/announcements?updated=1");
}

export async function publishAnnouncementAction(formData: FormData) {
  await requireAdminUser();
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    redirectWithError("Announcement id is required.");
  }

  const admin = createAdminClient();
  const result = await adminPublishAnnouncement({ admin, id });

  if (!result.ok) {
    redirectWithError(result.error ?? "Announcement was not published.");
  }

  revalidateAnnouncementPaths();
  redirect("/admin/announcements?published=1");
}

export async function archiveAnnouncementAction(formData: FormData) {
  await requireAdminUser();
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    redirectWithError("Announcement id is required.");
  }

  const admin = createAdminClient();
  const result = await adminArchiveAnnouncement({ admin, id });

  if (!result.ok) {
    redirectWithError(result.error ?? "Announcement was not archived.");
  }

  revalidateAnnouncementPaths();
  redirect("/admin/announcements?archived=1");
}
