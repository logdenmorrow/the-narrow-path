begin;

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  content_encoding text not null default 'aes128gcm',
  user_agent text,
  device_label text,
  platform text,
  app_display_mode text,
  permission_state text not null default 'default' check (
    permission_state in ('default', 'granted', 'denied')
  ),
  is_active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  last_success_at timestamptz,
  last_failure_at timestamptz,
  failure_count integer not null default 0 check (failure_count >= 0),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_subscriptions_endpoint_not_blank check (length(trim(endpoint)) > 0),
  constraint push_subscriptions_p256dh_not_blank check (length(trim(p256dh)) > 0),
  constraint push_subscriptions_auth_not_blank check (length(trim(auth)) > 0)
);

create unique index if not exists push_subscriptions_endpoint_key
  on public.push_subscriptions (endpoint);

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

create index if not exists push_subscriptions_active_idx
  on public.push_subscriptions (user_id, last_seen_at desc)
  where is_active = true;

create or replace function public.set_push_subscriptions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_push_subscriptions_updated_at
  on public.push_subscriptions;
create trigger set_push_subscriptions_updated_at
before update on public.push_subscriptions
for each row
execute function public.set_push_subscriptions_updated_at();

create table if not exists public.notification_broadcasts (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users (id) on delete set null,
  title text not null check (
    length(trim(title)) > 0
    and char_length(title) <= 120
  ),
  body text not null check (
    length(trim(body)) > 0
    and char_length(body) <= 500
  ),
  target_url text not null default '/today' check (
    char_length(target_url) <= 2048
    and target_url like '/%'
    and target_url not like '//%'
  ),
  audience text not null default 'all_active' check (
    audience in ('all_active', 'admin_test')
  ),
  status text not null default 'draft' check (
    status in ('draft', 'sending', 'sent', 'failed', 'cancelled')
  ),
  attempted_count integer not null default 0 check (attempted_count >= 0),
  success_count integer not null default 0 check (success_count >= 0),
  failure_count integer not null default 0 check (failure_count >= 0),
  revoked_count integer not null default 0 check (revoked_count >= 0),
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notification_broadcasts_status_created_at_idx
  on public.notification_broadcasts (status, created_at desc);

create or replace function public.set_notification_broadcasts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_notification_broadcasts_updated_at
  on public.notification_broadcasts;
create trigger set_notification_broadcasts_updated_at
before update on public.notification_broadcasts
for each row
execute function public.set_notification_broadcasts_updated_at();

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  broadcast_id uuid not null references public.notification_broadcasts (id) on delete cascade,
  subscription_id uuid references public.push_subscriptions (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,
  status text not null default 'pending' check (
    status in ('pending', 'sent', 'failed', 'revoked', 'skipped')
  ),
  http_status integer check (
    http_status is null
    or (http_status >= 100 and http_status <= 599)
  ),
  error_code text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notification_deliveries_broadcast_status_idx
  on public.notification_deliveries (broadcast_id, status);

create index if not exists notification_deliveries_subscription_id_idx
  on public.notification_deliveries (subscription_id);

create index if not exists notification_deliveries_user_id_idx
  on public.notification_deliveries (user_id);

create unique index if not exists notification_deliveries_broadcast_subscription_uidx
  on public.notification_deliveries (broadcast_id, subscription_id)
  where subscription_id is not null;

create or replace function public.set_notification_deliveries_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_notification_deliveries_updated_at
  on public.notification_deliveries;
create trigger set_notification_deliveries_updated_at
before update on public.notification_deliveries
for each row
execute function public.set_notification_deliveries_updated_at();

alter table public.push_subscriptions enable row level security;
alter table public.notification_broadcasts enable row level security;
alter table public.notification_deliveries enable row level security;

revoke all on table public.push_subscriptions from anon;
revoke all on table public.notification_broadcasts from anon;
revoke all on table public.notification_deliveries from anon;

revoke all on table public.push_subscriptions from authenticated;
revoke all on table public.notification_broadcasts from authenticated;
revoke all on table public.notification_deliveries from authenticated;

grant select, insert, update, delete on table public.push_subscriptions to authenticated;
grant select, insert, update, delete on table public.notification_broadcasts to authenticated;
grant select, insert, update, delete on table public.notification_deliveries to authenticated;

grant select, insert, update, delete on table public.push_subscriptions to service_role;
grant select, insert, update, delete on table public.notification_broadcasts to service_role;
grant select, insert, update, delete on table public.notification_deliveries to service_role;

drop policy if exists "Users can read own push subscriptions"
  on public.push_subscriptions;
create policy "Users can read own push subscriptions"
  on public.push_subscriptions
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own push subscriptions"
  on public.push_subscriptions;
create policy "Users can insert own push subscriptions"
  on public.push_subscriptions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own push subscriptions"
  on public.push_subscriptions;
create policy "Users can update own push subscriptions"
  on public.push_subscriptions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own push subscriptions"
  on public.push_subscriptions;
create policy "Users can delete own push subscriptions"
  on public.push_subscriptions
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Admins can read push subscriptions"
  on public.push_subscriptions;
create policy "Admins can read push subscriptions"
  on public.push_subscriptions
  for select
  to authenticated
  using (public.is_app_admin());

drop policy if exists "Admins can manage notification broadcasts"
  on public.notification_broadcasts;
create policy "Admins can manage notification broadcasts"
  on public.notification_broadcasts
  for all
  to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

drop policy if exists "Admins can manage notification deliveries"
  on public.notification_deliveries;
create policy "Admins can manage notification deliveries"
  on public.notification_deliveries
  for all
  to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

commit;
