begin;

alter table public.plan_days
  add column if not exists reading_context text,
  add column if not exists previous_reading_summary text,
  add column if not exists reading_today_preview text,
  add column if not exists reading_watch_for text,
  add column if not exists reading_key_terms jsonb,
  add column if not exists reading_context_source_hash text;

commit;
