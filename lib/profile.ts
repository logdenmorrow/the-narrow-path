import type { SupabaseClient, User } from "@supabase/supabase-js";

function cleanText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
}

export function getProfileFieldsFromUser(user: User) {
  const firstName = cleanText(user.user_metadata?.first_name);
  const lastName = cleanText(user.user_metadata?.last_name);
  const fullNameFromParts = [firstName, lastName].filter(Boolean).join(" ");
  const fullName =
    cleanText(fullNameFromParts) ??
    cleanText(user.user_metadata?.full_name) ??
    cleanText(user.user_metadata?.name) ??
    cleanText(user.email) ??
    "Brother";

  return {
    first_name: firstName,
    last_name: lastName,
    display_name: fullName,
  };
}

export async function ensureProfileForUser(
  supabase: SupabaseClient,
  user: User
) {
  const profileFields = getProfileFieldsFromUser(user);

  await supabase.from("profiles").upsert(
    {
      id: user.id,
      ...profileFields,
    },
    {
      onConflict: "id",
      ignoreDuplicates: false,
    }
  );
}
