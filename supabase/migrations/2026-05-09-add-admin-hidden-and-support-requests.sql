begin;

create table if not exists public.app_admins (
  email text primary key check (
    email = lower(trim(email))
    and email <> ''
  ),
  created_at timestamptz not null default now()
);

insert into public.app_admins (email)
values ('lrnester1+admin@gmail.com')
on conflict (email) do nothing;

alter table public.app_admins enable row level security;

revoke all on table public.app_admins from anon;
revoke all on table public.app_admins from authenticated;

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.app_admins
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_app_admin() from public;
grant execute on function public.is_app_admin() to authenticated;
grant execute on function public.is_app_admin() to service_role;

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

alter table public.profiles
  add column if not exists is_hidden_from_community boolean not null default false;

create index if not exists profiles_track_visible_idx
  on public.profiles (track, is_hidden_from_community);

update public.profiles as profile
set
  is_admin = true,
  is_hidden_from_community = true
from auth.users as auth_user
where profile.id = auth_user.id
  and lower(auth_user.email) = 'lrnester1+admin@gmail.com';

create or replace function public.handle_new_user()
 returns trigger
 language plpgsql
 security definer
 set search_path = ''
as $function$
declare
  normalized_email text := lower(coalesce(new.email, ''));
  new_user_is_admin boolean;
begin
  select exists (
    select 1
    from public.app_admins
    where email = normalized_email
  )
  into new_user_is_admin;

  insert into public.profiles (
    id,
    first_name,
    last_name,
    display_name,
    gender,
    track,
    is_admin,
    is_hidden_from_community
  )
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'first_name', ''),
    nullif(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(
      nullif(
        trim(
          concat_ws(
            ' ',
            new.raw_user_meta_data ->> 'first_name',
            new.raw_user_meta_data ->> 'last_name'
          )
        ),
        ''
      ),
      split_part(new.email, '@', 1)
    ),
    case
      when new.raw_user_meta_data ->> 'gender' in ('male', 'female')
        then new.raw_user_meta_data ->> 'gender'
      else null
    end,
    case
      when new.raw_user_meta_data ->> 'track' in ('brotherhood', 'sisterhood')
        then new.raw_user_meta_data ->> 'track'
      else 'brotherhood'
    end,
    new_user_is_admin,
    new_user_is_admin
  )
  on conflict (id) do update
  set
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    display_name = excluded.display_name,
    gender = excluded.gender,
    track = excluded.track,
    is_admin = excluded.is_admin,
    is_hidden_from_community = excluded.is_hidden_from_community;

  return new;
end;
$function$;

create or replace function public.prevent_profile_admin_visibility_flag_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.role() = 'authenticated'
    and not public.is_app_admin()
    and (
      new.is_admin is distinct from old.is_admin
      or new.is_hidden_from_community is distinct from old.is_hidden_from_community
    )
  then
    raise exception 'Only app admins may update profile admin or community visibility flags.';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_admin_visibility_flags
  on public.profiles;
create trigger protect_profile_admin_visibility_flags
  before update of is_admin, is_hidden_from_community
  on public.profiles
  for each row
  execute function public.prevent_profile_admin_visibility_flag_update();

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  user_email text,
  user_track text,
  issue_type text not null check (
    issue_type in ('bug', 'confusing_behavior', 'account_issue', 'other')
  ),
  severity text not null default 'medium' check (
    severity in ('low', 'medium', 'high')
  ),
  title text not null check (char_length(title) <= 160),
  description text not null check (char_length(description) <= 5000),
  page_url text,
  user_agent text,
  status text not null default 'open' check (
    status in ('open', 'reviewing', 'closed')
  ),
  created_at timestamptz not null default now()
);

create index if not exists support_requests_user_id_idx
  on public.support_requests (user_id);

create index if not exists support_requests_created_at_idx
  on public.support_requests (created_at desc);

create index if not exists support_requests_status_idx
  on public.support_requests (status);

alter table public.support_requests enable row level security;

drop policy if exists "Users can insert own support requests"
  on public.support_requests;
create policy "Users can insert own support requests"
  on public.support_requests
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own support requests"
  on public.support_requests;
create policy "Users can read own support requests"
  on public.support_requests
  for select
  using (auth.uid() = user_id);

drop policy if exists "Admins can read all support requests"
  on public.support_requests;
create policy "Admins can read all support requests"
  on public.support_requests
  for select
  using (public.is_app_admin());

drop policy if exists "Signed-in users can read brotherhood daily check-ins"
  on public.user_daily_checkins;
drop policy if exists "Signed-in users can read same-track visible daily check-ins"
  on public.user_daily_checkins;
create policy "Signed-in users can read same-track visible daily check-ins"
  on public.user_daily_checkins
  for select
  using (
    auth.uid() = user_id
    or public.is_app_admin()
    or exists (
      select 1
      from public.profiles as viewer
      join public.profiles as subject
        on subject.id = user_daily_checkins.user_id
      where viewer.id = auth.uid()
        and viewer.track = subject.track
        and viewer.is_hidden_from_community = false
        and subject.is_hidden_from_community = false
    )
  );

drop policy if exists "Signed-in users can read brotherhood prayer requests"
  on public.user_prayer_requests;
drop policy if exists "Signed-in users can read same-track visible prayer requests"
  on public.user_prayer_requests;
create policy "Signed-in users can read same-track visible prayer requests"
  on public.user_prayer_requests
  for select
  using (
    auth.uid() = user_id
    or public.is_app_admin()
    or exists (
      select 1
      from public.profiles as viewer
      join public.profiles as subject
        on subject.id = user_prayer_requests.user_id
      where viewer.id = auth.uid()
        and viewer.track = subject.track
        and viewer.is_hidden_from_community = false
        and subject.is_hidden_from_community = false
    )
  );

commit;
