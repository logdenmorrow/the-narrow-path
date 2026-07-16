begin;

-- Audit finding CRIT-4: profiles.track had no update-restricting trigger,
-- unlike is_admin/is_hidden_from_community. Mirrors the existing
-- prevent_profile_admin_visibility_flag_update pattern in
-- supabase/migrations/20260509094000_add_admin_hidden_and_support_requests.sql
-- (lines 126-153) exactly, scoped to the track column instead.
--
-- NOT RUN AGAINST PRODUCTION. This file has only been written, per
-- explicit instruction, pending review of the CRIT-1 pg_policies result.

create or replace function public.prevent_profile_track_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.role() = 'authenticated'
    and not public.is_app_admin()
    and new.track is distinct from old.track
  then
    raise exception 'Only app admins may update a profile''s track.';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_track
  on public.profiles;
create trigger protect_profile_track
  before update of track
  on public.profiles
  for each row
  execute function public.prevent_profile_track_update();

commit;
