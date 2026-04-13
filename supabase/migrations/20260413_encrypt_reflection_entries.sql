-- Add encrypted journal storage fields for app-level reflection privacy.

alter table public.user_reflection_entries
  add column if not exists entry_ciphertext text,
  add column if not exists entry_iv text,
  add column if not exists entry_auth_tag text,
  add column if not exists encryption_version integer;

alter table public.user_reflection_entries
  alter column entry_text drop not null;

alter table public.user_reflection_entries
  drop constraint if exists user_reflection_entries_entry_text_check;

alter table public.user_reflection_entries
  drop constraint if exists user_reflection_entries_encrypted_or_plaintext_check;

alter table public.user_reflection_entries
  add constraint user_reflection_entries_encrypted_or_plaintext_check
  check (
    (
      entry_ciphertext is not null
      and entry_iv is not null
      and entry_auth_tag is not null
      and encryption_version is not null
    )
    or (entry_text is not null and btrim(entry_text) <> '')
  );
