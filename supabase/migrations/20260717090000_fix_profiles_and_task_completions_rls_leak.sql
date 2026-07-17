begin;

-- Audit finding CRIT-1 (RLS leak): profiles and user_task_completions each
-- carry a PERMISSIVE, qual=true SELECT policy ("Authenticated users can
-- view all profiles" / "Authenticated users can view all task
-- completions") with no track scoping, alongside separate correctly-
-- scoped narrow policies. Postgres OR's same-command PERMISSIVE policies
-- together, so the qual=true policy makes the narrow ones meaningless:
-- any authenticated user can currently read every profile and every task
-- completion across both tracks via direct Supabase REST API access.
--
-- Trust boundary: SQL / RLS layer. Cross-track. Affects Brotherhood and
-- Sisterhood equally and symmetrically -- neither track is singled out.
--
-- Intended behavior (confirmed by product owner): same-track community
-- visibility for accountability (Brotherhood sees Brotherhood, Sisterhood
-- sees Sisterhood), respecting is_hidden_from_community, plus admins
-- seeing everyone. This mirrors the same-track visibility already in
-- production for user_daily_checkins and user_prayer_requests
-- (20260509094000_add_admin_hidden_and_support_requests.sql).
--
-- IMPORTANT: that existing pattern queries public.profiles directly
-- inside a USING clause, which is safe there because those policies live
-- on a DIFFERENT table (user_daily_checkins / user_prayer_requests).
-- Doing the same thing inline in a policy defined ON public.profiles
-- would query profiles from within a profiles policy and trigger
-- "infinite recursion detected in policy for relation profiles" in
-- Postgres. Instead, this migration follows the public.is_app_admin()
-- convention (20260509094000_add_admin_hidden_and_support_requests.sql,
-- lines 20-36): a SECURITY DEFINER helper function. It runs as its owner
-- rather than as the querying role, so its internal profiles lookups are
-- not subject to the profiles RLS policy at all and the cycle never
-- forms.
--
-- Scope: profiles and user_task_completions only.
--   NOT touched: user_prayer_requests (its cross-track "shared"
--   visibility is a separate, deliberate product decision).
--   NOT touched: challenge_plans, task_templates, plan_days,
--   plan_day_tasks (content tables, flagged as a follow-up).
--   NOT touched: any other existing policy on profiles or
--   user_task_completions, including redundant-looking duplicate pairs
--   -- flagged as cleanup candidates in the report, not modified here.
--
-- NOT RUN AGAINST PRODUCTION. This file has only been written, per
-- explicit instruction, pending review of the Phase 0 column-inventory
-- and grants checks.

create or replace function public.can_view_community_profile(subject_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    auth.uid() = subject_id
    or public.is_app_admin()
    or exists (
      select 1
      from public.profiles as viewer
      join public.profiles as subject
        on subject.id = subject_id
      where viewer.id = auth.uid()
        and viewer.track = subject.track
        and viewer.is_hidden_from_community = false
        and subject.is_hidden_from_community = false
    );
$$;

revoke all on function public.can_view_community_profile(uuid) from public;
grant execute on function public.can_view_community_profile(uuid) to authenticated;

drop policy if exists "Authenticated users can view all profiles"
  on public.profiles;
create policy "Signed-in users can read same-track visible profiles"
  on public.profiles
  for select
  using (public.can_view_community_profile(profiles.id));

drop policy if exists "Authenticated users can view all task completions"
  on public.user_task_completions;
create policy "Signed-in users can read same-track visible task completions"
  on public.user_task_completions
  for select
  using (public.can_view_community_profile(user_task_completions.user_id));

commit;
