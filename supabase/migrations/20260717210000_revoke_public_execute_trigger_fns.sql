begin;

-- Follow-up to 20260717180000_batch_security_hardening.sql Part C.
-- Those revokes targeted anon + authenticated, but the three trigger-only
-- functions carry an EXECUTE grant to PUBLIC, which anon/authenticated
-- inherit -- so the role-scoped revokes were a no-op and the advisor kept
-- flagging all three (0028 anon + 0029 authenticated).
--
-- Revoking from PUBLIC is safe: these functions are trigger callbacks only
-- (verified: returns trigger, wired to triggers on auth.users/profiles, no
-- supabase.rpc(...) call in the repo), and triggers fire as the table owner
-- regardless of EXECUTE grants. postgres (owner) and service_role retain
-- EXECUTE.
--
-- APPLIED to production 2026-07-17.

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.prevent_profile_admin_visibility_flag_update() from public;
revoke execute on function public.prevent_profile_track_update() from public;

commit;
