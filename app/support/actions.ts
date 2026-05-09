"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { sendSupportRequestEmail } from "@/lib/support-email";
import { createClient } from "@/lib/supabase/server";
import { normalizeTrack } from "@/lib/track";

const ISSUE_TYPES = new Set(["bug", "confusing_behavior", "account_issue", "other"]);
const SEVERITIES = new Set(["low", "medium", "high"]);

function cleanText(value: FormDataEntryValue | null, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function normalizeIssueType(value: FormDataEntryValue | null) {
  const issueType = String(value ?? "").trim();
  return ISSUE_TYPES.has(issueType) ? issueType : "";
}

function normalizeSeverity(value: FormDataEntryValue | null) {
  const severity = String(value ?? "medium").trim();
  return SEVERITIES.has(severity) ? severity : "medium";
}

export async function submitSupportRequest(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  const issueType = normalizeIssueType(formData.get("issue_type"));
  const severity = normalizeSeverity(formData.get("severity"));
  const title = cleanText(formData.get("title"), 160);
  const description = cleanText(formData.get("description"), 5000);
  const pageUrl = cleanText(formData.get("page_url"), 500) || null;

  if (!issueType || !title || !description) {
    redirect("/support?error=missing");
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("track")
    .eq("id", user.id)
    .maybeSingle();

  const userTrack = normalizeTrack(profileData?.track);
  const requestHeaders = await headers();
  const userAgent = requestHeaders.get("user-agent");

  const { data: insertedRequest, error: insertError } = await supabase
    .from("support_requests")
    .insert({
      user_id: user.id,
      user_email: user.email ?? null,
      user_track: userTrack,
      issue_type: issueType,
      severity,
      title,
      description,
      page_url: pageUrl,
      user_agent: userAgent,
    })
    .select("id, created_at")
    .single();

  if (insertError || !insertedRequest) {
    console.error("Support request insert failed.", insertError);
    redirect("/support?error=save");
  }

  try {
    await sendSupportRequestEmail({
      issueType,
      severity,
      fromEmail: user.email ?? null,
      track: userTrack,
      title,
      description,
      pageUrl,
      createdAt: insertedRequest.created_at,
    });
  } catch (emailError) {
    console.error("Support request email failed.", emailError);
  }

  redirect("/support?saved=1");
}
