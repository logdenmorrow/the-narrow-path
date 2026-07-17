begin;

-- Batch security hardening (2026-07-17), addressing Supabase security
-- advisor WARNs surfaced after the CRIT-1/CRIT-4 remediation. DB-only,
-- no application/schema behavior change intended.
--
-- Trust boundary: SQL / function-privilege + search_path layer. No RLS
-- policy changes here.
--
-- Scope was verified read-only against production before writing (pg_proc,
-- pg_trigger, information_schema.role_routine_grants) and against the repo
-- (lib/last-active.ts). Function bodies below are transcribed verbatim from
-- production pg_get_functiondef output, changed ONLY by adding
-- `set search_path = ''`. Every body uses pg_catalog built-ins only, so an
-- empty search_path is safe (pg_catalog is always implicitly searched).
--
-- NOT RUN AGAINST PRODUCTION. File only, pending explicit go-ahead.

------------------------------------------------------------------------
-- Part A — Pin search_path on the 11 mutable-search_path functions.
--   CREATE OR REPLACE preserves each function's oid (trigger wiring
--   intact) and existing EXECUTE grants; it only redefines the body +
--   adds the search_path pin. Language (plpgsql), volatility (volatile),
--   and security model (security invoker) are unchanged.
------------------------------------------------------------------------

create or replace function public.set_notification_reminder_preferences_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_notification_reminder_sends_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_announcements_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_challenge_feedback_responses_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.set_night_prayers_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_push_subscriptions_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_notification_broadcasts_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_notification_deliveries_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_notification_reminder_slots_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_announcement_push_schedules_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.hook_require_invite_code(event jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  submitted_code text;
begin
  submitted_code := lower(trim(coalesce(event->'user'->'user_metadata'->>'invite_code', '')));

  if submitted_code = 'deusvult' then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object(
      'message', 'Invalid invite code.',
      'http_code', 403
    )
  );
end;
$$;

------------------------------------------------------------------------
-- Part B — Revoke EXECUTE from anon on can_view_community_profile.
--   SECURITY DEFINER helper invoked inside RLS USING clauses, so
--   authenticated MUST retain EXECUTE (RLS evaluation requires it) and is
--   left untouched, as is service_role. anon has no legitimate RPC use of
--   it; revoking closes that /rest/v1/rpc surface with zero app impact.
------------------------------------------------------------------------

revoke execute on function public.can_view_community_profile(uuid) from anon;

------------------------------------------------------------------------
-- Part C — Revoke EXECUTE from anon + authenticated on the trigger-only
--   functions. Triggers fire as the table owner regardless of EXECUTE
--   grants, so this removes the unnecessary /rest/v1/rpc surface without
--   affecting trigger behavior.
--
--   Verified trigger-only (returns trigger, wired to a trigger, no
--   supabase.rpc(...) call anywhere in the repo):
--     - handle_new_user()                          -> trigger on auth.users
--     - prevent_profile_admin_visibility_flag_update() -> trigger on profiles
--     - prevent_profile_track_update()             -> trigger on profiles
--
--   DELIBERATELY EXCLUDED: public.touch_last_active_at().
--     Phase 1 inventory showed it returns `void` (not trigger), is wired
--     to NO trigger, and is called directly by authenticated users via
--     supabase.rpc("touch_last_active_at") in lib/last-active.ts:17.
--     Revoking EXECUTE from authenticated would break last-active
--     tracking, so it is left exactly as-is. Its advisor WARN will
--     legitimately persist because authenticated must keep EXECUTE.
------------------------------------------------------------------------

revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;

revoke execute on function public.prevent_profile_admin_visibility_flag_update() from anon;
revoke execute on function public.prevent_profile_admin_visibility_flag_update() from authenticated;

revoke execute on function public.prevent_profile_track_update() from anon;
revoke execute on function public.prevent_profile_track_update() from authenticated;

commit;

------------------------------------------------------------------------
-- Post-apply verification (read-only; run separately after applying)
------------------------------------------------------------------------
--
-- verify: search_path pinned on all 11 functions
--   proconfig should contain 'search_path=' for each row.
--   select proname, proconfig
--   from pg_proc
--   where proname in (
--     'set_notification_reminder_preferences_updated_at',
--     'set_notification_reminder_sends_updated_at',
--     'set_announcements_updated_at',
--     'set_challenge_feedback_responses_updated_at',
--     'set_night_prayers_updated_at',
--     'set_push_subscriptions_updated_at',
--     'set_notification_broadcasts_updated_at',
--     'set_notification_deliveries_updated_at',
--     'set_notification_reminder_slots_updated_at',
--     'set_announcement_push_schedules_updated_at',
--     'hook_require_invite_code'
--   )
--   order by proname;
--
-- verify: anon cannot execute can_view_community_profile
--   (authenticated + service_role should remain)
--   select grantee, privilege_type
--   from information_schema.role_routine_grants
--   where routine_schema = 'public'
--     and routine_name = 'can_view_community_profile'
--   order by grantee;
--
-- verify: anon + authenticated cannot execute the 3 revoked trigger fns
--   (touch_last_active_at intentionally still executable by authenticated)
--   select routine_name, grantee, privilege_type
--   from information_schema.role_routine_grants
--   where routine_schema = 'public'
--     and routine_name in (
--       'handle_new_user',
--       'prevent_profile_admin_visibility_flag_update',
--       'prevent_profile_track_update',
--       'touch_last_active_at'
--     )
--   order by routine_name, grantee;
