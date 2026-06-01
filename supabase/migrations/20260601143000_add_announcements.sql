begin;

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  slug text not null unique check (
    slug = lower(trim(slug))
    and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  summary text,
  body text not null check (length(trim(body)) > 0),
  category text not null default 'general' check (
    category in ('general', 'season', 'reminder', 'feature', 'maintenance', 'reflection')
  ),
  audience text not null default 'all' check (
    audience in ('all', 'brotherhood', 'sisterhood')
  ),
  status text not null default 'draft' check (
    status in ('draft', 'published', 'archived')
  ),
  is_pinned boolean not null default false,
  published_at timestamptz,
  expires_at timestamptz,
  cta_label text,
  cta_href text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint announcements_summary_length check (
    summary is null or char_length(summary) <= 500
  ),
  constraint announcements_cta_pair check (
    (cta_label is null and cta_href is null)
    or (cta_label is not null and cta_href is not null)
  ),
  constraint announcements_cta_href_safe check (
    cta_href is null
    or (
      char_length(cta_href) <= 2048
      and (
        (cta_href like '/%' and cta_href not like '//%')
        or cta_href like 'https://%'
      )
    )
  )
);

create table if not exists public.announcement_reads (
  announcement_id uuid not null references public.announcements (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (announcement_id, user_id)
);

create index if not exists announcements_published_visible_idx
  on public.announcements (status, audience, is_pinned desc, published_at desc)
  where status = 'published';

create index if not exists announcements_slug_status_idx
  on public.announcements (slug, status);

create index if not exists announcement_reads_user_id_idx
  on public.announcement_reads (user_id, read_at desc);

create or replace function public.set_announcements_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_announcements_updated_at
  on public.announcements;
create trigger set_announcements_updated_at
before update on public.announcements
for each row
execute function public.set_announcements_updated_at();

alter table public.announcements enable row level security;
alter table public.announcement_reads enable row level security;

revoke all on table public.announcements from anon;
revoke all on table public.announcement_reads from anon;

revoke all on table public.announcements from authenticated;
revoke all on table public.announcement_reads from authenticated;

grant select, insert, update, delete on table public.announcements
  to authenticated;

grant select, insert, update, delete on table public.announcement_reads
  to authenticated;

grant select, insert, update, delete on table public.announcements
  to service_role;

grant select, insert, update, delete on table public.announcement_reads
  to service_role;

drop policy if exists "Signed-in users can read visible announcements"
  on public.announcements;
create policy "Signed-in users can read visible announcements"
  on public.announcements
  for select
  to authenticated
  using (
    public.is_app_admin()
    or (
      status = 'published'
      and published_at is not null
      and published_at <= now()
      and (expires_at is null or expires_at > now())
      and (
        audience = 'all'
        or exists (
          select 1
          from public.profiles as viewer
          where viewer.id = auth.uid()
            and viewer.track = announcements.audience
        )
      )
    )
  );

drop policy if exists "Admins can manage announcements"
  on public.announcements;
create policy "Admins can manage announcements"
  on public.announcements
  for all
  to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

drop policy if exists "Users can read own announcement reads"
  on public.announcement_reads;
create policy "Users can read own announcement reads"
  on public.announcement_reads
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own announcement reads"
  on public.announcement_reads;
create policy "Users can insert own announcement reads"
  on public.announcement_reads
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.announcements announcement
      where announcement.id = announcement_reads.announcement_id
        and (
          public.is_app_admin()
          or (
            announcement.status = 'published'
            and announcement.published_at is not null
            and announcement.published_at <= now()
            and (announcement.expires_at is null or announcement.expires_at > now())
            and (
              announcement.audience = 'all'
              or exists (
                select 1
                from public.profiles as viewer
                where viewer.id = auth.uid()
                  and viewer.track = announcement.audience
              )
            )
          )
        )
    )
  );

drop policy if exists "Users can update own announcement reads"
  on public.announcement_reads;
create policy "Users can update own announcement reads"
  on public.announcement_reads
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own announcement reads"
  on public.announcement_reads;
create policy "Users can delete own announcement reads"
  on public.announcement_reads
  for delete
  to authenticated
  using (auth.uid() = user_id);

commit;
