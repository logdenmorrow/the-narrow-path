import { createCipheriv, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const JOURNAL_ENCRYPTION_VERSION = 1;
const IV_LENGTH_BYTES = 12;

function getJournalKey() {
  const rawKey = process.env.JOURNAL_ENCRYPTION_KEY;

  if (!rawKey) {
    throw new Error(
      "Missing JOURNAL_ENCRYPTION_KEY. Expected a base64-encoded 32-byte key."
    );
  }

  const key = Buffer.from(rawKey, "base64");
  if (key.length !== 32) {
    throw new Error(
      "Invalid JOURNAL_ENCRYPTION_KEY. Expected base64 for exactly 32 bytes (AES-256 key)."
    );
  }

  return key;
}

function encryptJournalEntry(entryText) {
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv("aes-256-gcm", getJournalKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(entryText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    entry_ciphertext: ciphertext.toString("base64"),
    entry_iv: iv.toString("base64"),
    entry_auth_tag: authTag.toString("base64"),
    encryption_version: JOURNAL_ENCRYPTION_VERSION,
  };
}

async function run() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY)."
    );
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: rows, error } = await supabase
    .from("user_reflection_entries")
    .select("id, entry_text, entry_ciphertext")
    .is("entry_ciphertext", null)
    .not("entry_text", "is", null);

  if (error) {
    throw new Error(`Failed to load rows: ${error.message}`);
  }

  const candidates = (rows || []).filter(
    (row) => typeof row.entry_text === "string" && row.entry_text.trim().length > 0
  );

  for (const row of candidates) {
    const encrypted = encryptJournalEntry(row.entry_text);
    const { error: updateError } = await supabase
      .from("user_reflection_entries")
      .update({
        ...encrypted,
        entry_text: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (updateError) {
      throw new Error(`Failed updating row ${row.id}: ${updateError.message}`);
    }
  }

  console.log(`Encrypted ${candidates.length} reflection entr${candidates.length === 1 ? "y" : "ies"}.`);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
