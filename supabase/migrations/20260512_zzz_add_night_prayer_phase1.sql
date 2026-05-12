begin;

create extension if not exists pgcrypto;

create table if not exists public.night_prayers (
  id uuid primary key default gen_random_uuid(),
  prayer_date date not null unique,
  source text not null default 'divineoffice',
  source_url text,
  liturgical_day text,
  title text,
  subtitle text,
  content_html text,
  content_json jsonb,
  copyright_notice text,
  attribution_html text,
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_night_prayers_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_night_prayers_updated_at
  on public.night_prayers;

create trigger set_night_prayers_updated_at
before update on public.night_prayers
for each row
execute function public.set_night_prayers_updated_at();

alter table public.night_prayers enable row level security;

drop policy if exists "Authenticated users can read night prayers"
  on public.night_prayers;

create policy "Authenticated users can read night prayers"
  on public.night_prayers
  for select
  to authenticated
  using (true);

insert into public.task_templates (
  slug,
  title,
  description,
  cadence,
  weekly_target,
  sort_order,
  audience
)
values (
  'night-prayer',
  'Night Prayer',
  'Pray Compline with the Church before sleep.',
  'daily',
  null,
  120,
  'shared'
)
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  cadence = excluded.cadence,
  weekly_target = excluded.weekly_target,
  sort_order = excluded.sort_order,
  audience = excluded.audience;

with active_plan_days as (
  select
    pd.id as plan_day_id,
    pd.day_number
  from public.challenge_plans cp
  join public.plan_days pd
    on pd.plan_id = cp.id
  where cp.is_active = true
),
night_template as (
  select
    id as task_template_id,
    description as requirement_note,
    coalesce(sort_order, 120) as display_order
  from public.task_templates
  where slug = 'night-prayer'
  limit 1
),
reflection_order as (
  select
    pdt.plan_day_id,
    pdt.sort_order,
    pdt.display_order
  from public.plan_day_tasks pdt
  join public.task_templates tt
    on tt.id = pdt.task_template_id
  where tt.slug = 'reflection'
),
night_tasks as (
  select
    apd.plan_day_id,
    nt.task_template_id,
    (date '2026-04-06' + ((apd.day_number - 1) * interval '1 day'))::date as day_date,
    (
      date '2026-04-06'
      + ((floor((apd.day_number - 1) / 7.0)::int * 7) * interval '1 day')
    )::date as week_start_date,
    date_trunc(
      'month',
      (date '2026-04-06' + ((apd.day_number - 1) * interval '1 day'))::date
    )::date as month_start_date,
    nt.requirement_note,
    coalesce(ro.sort_order + 1, case when ro.plan_day_id is not null then 1000 end, 0) as sort_order,
    coalesce(
      ro.display_order + 10,
      case when ro.plan_day_id is not null then 10010 end,
      nt.display_order
    ) as display_order
  from active_plan_days apd
  cross join night_template nt
  left join reflection_order ro
    on ro.plan_day_id = apd.plan_day_id
)
insert into public.plan_day_tasks (
  plan_day_id,
  task_template_id,
  is_required,
  sort_order,
  day_date,
  week_start_date,
  month_start_date,
  is_optional,
  quota_scope,
  quota_target,
  requirement_note,
  display_order
)
select
  nt.plan_day_id,
  nt.task_template_id,
  true,
  nt.sort_order,
  nt.day_date,
  nt.week_start_date,
  nt.month_start_date,
  false,
  null,
  null,
  nt.requirement_note,
  nt.display_order
from night_tasks nt
where not exists (
  select 1
  from public.plan_day_tasks existing
  where existing.plan_day_id = nt.plan_day_id
    and existing.task_template_id = nt.task_template_id
);

with reflection_order as (
  select
    pdt.plan_day_id,
    pdt.sort_order,
    pdt.display_order
  from public.plan_day_tasks pdt
  join public.task_templates tt
    on tt.id = pdt.task_template_id
  where tt.slug = 'reflection'
),
active_night_tasks as (
  select
    pdt.id as plan_day_task_id,
    (date '2026-04-06' + ((pd.day_number - 1) * interval '1 day'))::date as day_date,
    (
      date '2026-04-06'
      + ((floor((pd.day_number - 1) / 7.0)::int * 7) * interval '1 day')
    )::date as week_start_date,
    date_trunc(
      'month',
      (date '2026-04-06' + ((pd.day_number - 1) * interval '1 day'))::date
    )::date as month_start_date,
    tt.description as requirement_note,
    coalesce(ro.sort_order + 1, pdt.sort_order, 0) as sort_order,
    coalesce(
      ro.display_order + 10,
      case when ro.plan_day_id is not null then 10010 end,
      pdt.display_order,
      tt.sort_order,
      120
    ) as display_order
  from public.challenge_plans cp
  join public.plan_days pd
    on pd.plan_id = cp.id
  join public.plan_day_tasks pdt
    on pdt.plan_day_id = pd.id
  join public.task_templates tt
    on tt.id = pdt.task_template_id
  left join reflection_order ro
    on ro.plan_day_id = pd.id
  where cp.is_active = true
    and tt.slug = 'night-prayer'
)
update public.plan_day_tasks pdt
set
  is_required = true,
  is_optional = false,
  quota_scope = null,
  quota_target = null,
  requirement_note = ant.requirement_note,
  day_date = ant.day_date,
  week_start_date = ant.week_start_date,
  month_start_date = ant.month_start_date,
  sort_order = ant.sort_order,
  display_order = ant.display_order
from active_night_tasks ant
where pdt.id = ant.plan_day_task_id;

commit;
