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
import {
  cancelAnnouncementPushSchedule,
  scheduleAnnouncementPush,
  sendAnnouncementPush,
} from "@/lib/push/announcement-broadcasts";
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

export async function sendAnnouncementPushAction(formData: FormData) {
  const user = await requireAdminUser();
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    redirectWithError("Announcement id is required.");
  }

  const admin = createAdminClient();
  const result = await sendAnnouncementPush({
    admin,
    announcementId: id,
    createdBy: user.id,
  });

  if (!result.ok) {
    redirectWithError(result.error ?? result.message);
  }

  revalidateAnnouncementPaths();

  if (result.attempted === 0) {
    redirect("/admin/announcements?push=none");
  }

  redirect(
    `/admin/announcements?push=sent&succeeded=${result.succeeded}&failed=${result.failed}&revoked=${result.revoked}`
  );
}

export async function scheduleAnnouncementPushAction(formData: FormData) {
  const user = await requireAdminUser();
  const id = String(formData.get("id") ?? "").trim();
  const scheduledFor = String(formData.get("scheduled_for") ?? "").trim();

  if (!id) {
    redirectWithError("Announcement id is required.");
  }

  if (!scheduledFor) {
    redirectWithError("Schedule Push At is required.");
  }

  const admin = createAdminClient();
  const result = await scheduleAnnouncementPush({
    admin,
    announcementId: id,
    scheduledFor,
    createdBy: user.id,
  });

  if (!result.ok) {
    redirectWithError(result.error ?? "Scheduled push was not created.");
  }

  revalidateAnnouncementPaths();
  redirect("/admin/announcements?scheduled=1");
}

export async function cancelAnnouncementPushScheduleAction(formData: FormData) {
  await requireAdminUser();
  const scheduleId = String(formData.get("schedule_id") ?? "").trim();

  if (!scheduleId) {
    redirectWithError("Scheduled push id is required.");
  }

  const admin = createAdminClient();
  const result = await cancelAnnouncementPushSchedule({
    admin,
    scheduleId,
  });

  if (!result.ok) {
    redirectWithError(result.error ?? "Scheduled push was not canceled.");
  }

  revalidateAnnouncementPaths();
  redirect("/admin/announcements?canceled=1");
}
