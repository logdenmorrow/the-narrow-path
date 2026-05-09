-- Add daily accountability check-ins and prayer requests for the brotherhood.

create table if not exists public.user_daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  day_date date not null,
  status text not null check (status in ('completed', 'struggled', 'missed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, day_date)
);

create index if not exists user_daily_checkins_day_date_idx
  on public.user_daily_checkins (day_date);

create index if not exists user_daily_checkins_user_id_idx
  on public.user_daily_checkins (user_id);

alter table public.user_daily_checkins enable row level security;

drop policy if exists "Users can read own daily check-ins"
  on public.user_daily_checkins;
create policy "Users can read own daily check-ins"
  on public.user_daily_checkins
  for select
  using (auth.uid() = user_id);

drop policy if exists "Signed-in users can read brotherhood daily check-ins"
  on public.user_daily_checkins;
create policy "Signed-in users can read brotherhood daily check-ins"
  on public.user_daily_checkins
  for select
  using (auth.role() = 'authenticated');

drop policy if exists "Users can insert own daily check-ins"
  on public.user_daily_checkins;
create policy "Users can insert own daily check-ins"
  on public.user_daily_checkins
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own daily check-ins"
  on public.user_daily_checkins;
create policy "Users can update own daily check-ins"
  on public.user_daily_checkins
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own daily check-ins"
  on public.user_daily_checkins;
create policy "Users can delete own daily check-ins"
  on public.user_daily_checkins
  for delete
  using (auth.uid() = user_id);

create table if not exists public.user_prayer_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  request_date date not null,
  category text not null check (
    category in (
      'unspoken',
      'spiritual_battle',
      'family',
      'work_school',
      'health',
      'discouragement',
      'temptation',
      'other'
    )
  ),
  note text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, request_date)
);

create index if not exists user_prayer_requests_request_date_idx
  on public.user_prayer_requests (request_date);

create index if not exists user_prayer_requests_user_id_idx
  on public.user_prayer_requests (user_id);

alter table public.user_prayer_requests enable row level security;

drop policy if exists "Users can read own prayer requests"
  on public.user_prayer_requests;
create policy "Users can read own prayer requests"
  on public.user_prayer_requests
  for select
  using (auth.uid() = user_id);

drop policy if exists "Signed-in users can read brotherhood prayer requests"
  on public.user_prayer_requests;
create policy "Signed-in users can read brotherhood prayer requests"
  on public.user_prayer_requests
  for select
  using (auth.role() = 'authenticated');

drop policy if exists "Users can insert own prayer requests"
  on public.user_prayer_requests;
create policy "Users can insert own prayer requests"
  on public.user_prayer_requests
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own prayer requests"
  on public.user_prayer_requests;
create policy "Users can update own prayer requests"
  on public.user_prayer_requests
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own prayer requests"
  on public.user_prayer_requests;
create policy "Users can delete own prayer requests"
  on public.user_prayer_requests
  for delete
  using (auth.uid() = user_id);
