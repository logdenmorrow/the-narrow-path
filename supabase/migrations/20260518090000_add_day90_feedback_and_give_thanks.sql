begin;

create extension if not exists pgcrypto;

create table if not exists public.challenge_feedback_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id bigint references public.challenge_plans (id) on delete set null,
  plan_day_id bigint references public.plan_days (id) on delete set null,
  day_number integer not null default 90,
  liked_text text,
  helped_growth_text text,
  unnecessary_or_confusing_text text,
  too_hard_or_missing_text text,
  suggested_changes_text text,
  general_feedback_text text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, plan_day_id)
);

create index if not exists challenge_feedback_responses_plan_day_idx
  on public.challenge_feedback_responses (plan_id, day_number, updated_at desc);

create or replace function public.set_challenge_feedback_responses_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_challenge_feedback_responses_updated_at
  on public.challenge_feedback_responses;

create trigger set_challenge_feedback_responses_updated_at
before update on public.challenge_feedback_responses
for each row
execute function public.set_challenge_feedback_responses_updated_at();

alter table public.challenge_feedback_responses enable row level security;

drop policy if exists "Users can read their own challenge feedback"
  on public.challenge_feedback_responses;
create policy "Users can read their own challenge feedback"
  on public.challenge_feedback_responses
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own challenge feedback"
  on public.challenge_feedback_responses;
create policy "Users can insert their own challenge feedback"
  on public.challenge_feedback_responses
  for insert
  to authenticated
  with check (auth.uid() = user_id and day_number = 90);

drop policy if exists "Users can update their own challenge feedback"
  on public.challenge_feedback_responses;
create policy "Users can update their own challenge feedback"
  on public.challenge_feedback_responses
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and day_number = 90);

insert into public.task_templates (
  slug,
  title,
  description,
  cadence,
  weekly_target,
  sort_order,
  audience
)
values
  (
    'challenge_feedback',
    'Challenge Feedback',
    'Submit feedback about what helped, what was confusing or too hard, and what should change for the next season.',
    'daily',
    null,
    92,
    'shared'
  ),
  (
    'give_thanks',
    'Give Thanks',
    'Give thanks to God for the blessings of freedom, faith, and country. Read a short reflection based on Dignitatis Humanae on religious freedom, and remember Christians around the world who cannot practice the faith freely.',
    'daily',
    null,
    94,
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

-- Admin note: final Give Thanks reading text still needs to be supplied
-- manually before production use.

with day_90 as (
  select
    cp.id as plan_id,
    pd.id as plan_day_id,
    pd.day_number,
    date '2026-07-04' as day_date,
    date '2026-06-29' as week_start_date,
    date '2026-07-01' as month_start_date
  from public.challenge_plans cp
  join public.plan_days pd
    on pd.plan_id = cp.id
  where cp.is_active = true
    and cp.total_days = 90
    and pd.day_number = 90
),
required_templates as (
  select
    tt.id as task_template_id,
    tt.slug,
    tt.description,
    coalesce(tt.sort_order, 999) as display_order
  from public.task_templates tt
  where tt.slug in (
    'morning_prayer',
    'scripture_reading',
    'reading',
    'reflection',
    'challenge_feedback',
    'give_thanks',
    'check_in_anchor'
  )
    and (
      tt.slug <> 'scripture_reading'
      or not exists (
        select 1
        from public.task_templates reading_template
        where reading_template.slug = 'reading'
      )
    )
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
  d90.plan_day_id,
  rt.task_template_id,
  true,
  rt.display_order,
  d90.day_date,
  d90.week_start_date,
  d90.month_start_date,
  false,
  null,
  null,
  rt.description,
  rt.display_order
from day_90 d90
cross join required_templates rt
where not exists (
  select 1
  from public.plan_day_tasks existing
  where existing.plan_day_id = d90.plan_day_id
    and existing.task_template_id = rt.task_template_id
);

with day_90 as (
  select
    pd.id as plan_day_id,
    date '2026-07-04' as day_date,
    date '2026-06-29' as week_start_date,
    date '2026-07-01' as month_start_date
  from public.challenge_plans cp
  join public.plan_days pd
    on pd.plan_id = cp.id
  where cp.is_active = true
    and cp.total_days = 90
    and pd.day_number = 90
)
update public.plan_day_tasks pdt
set
  is_required = true,
  is_optional = false,
  quota_scope = null,
  quota_target = null,
  day_date = d90.day_date,
  week_start_date = d90.week_start_date,
  month_start_date = d90.month_start_date,
  requirement_note = tt.description,
  display_order = coalesce(tt.sort_order, pdt.display_order, pdt.sort_order)
from day_90 d90
cross join public.task_templates tt
where pdt.plan_day_id = d90.plan_day_id
  and tt.id = pdt.task_template_id
  and tt.slug in (
    'morning_prayer',
    'scripture_reading',
    'reading',
    'reflection',
    'challenge_feedback',
    'give_thanks',
    'check_in_anchor'
  );

with day_90 as (
  select
    pd.id as plan_day_id,
    date '2026-07-04' as day_date,
    date '2026-06-29' as week_start_date,
    date '2026-07-01' as month_start_date
  from public.challenge_plans cp
  join public.plan_days pd
    on pd.plan_id = cp.id
  where cp.is_active = true
    and cp.total_days = 90
    and pd.day_number = 90
)
update public.plan_day_tasks pdt
set
  is_required = false,
  is_optional = true,
  day_date = d90.day_date,
  week_start_date = d90.week_start_date,
  month_start_date = d90.month_start_date,
  requirement_note = case tt.slug
    when 'attend_mass' then 'Optional today if you attend the Sunday vigil.'
    when 'night-prayer' then 'Optional tonight.'
    when 'give_up_alcohol' then 'Food and drink restrictions are relaxed today. Keep moderation.'
    when 'no_desserts_sweets' then 'Food and drink restrictions are relaxed today. Keep moderation.'
    when 'no_soda_sweet_drinks' then 'Food and drink restrictions are relaxed today. Keep moderation.'
    when 'no_social_media' then 'Relaxed today. Use moderation.'
    when 'heroic_minute' then 'Optional today. Morning Prayer remains required.'
    else coalesce(pdt.requirement_note, tt.description)
  end
from day_90 d90
cross join public.task_templates tt
where pdt.plan_day_id = d90.plan_day_id
  and tt.id = pdt.task_template_id
  and tt.slug in (
    'attend_mass',
    'night-prayer',
    'rosary',
    'workout',
    'heroic_minute',
    'give_up_alcohol',
    'no_desserts_sweets',
    'no_soda_sweet_drinks',
    'no_social_media'
  );

with day_90 as (
  select pd.id as plan_day_id
  from public.challenge_plans cp
  join public.plan_days pd
    on pd.plan_id = cp.id
  where cp.is_active = true
    and cp.total_days = 90
    and pd.day_number = 90
)
update public.plan_day_tasks pdt
set
  is_required = false,
  is_optional = false,
  quota_scope = null,
  quota_target = null,
  requirement_note = 'Not applicable on Day 90: Celebration.'
from day_90 d90
cross join public.task_templates tt
where pdt.plan_day_id = d90.plan_day_id
  and tt.id = pdt.task_template_id
  and tt.slug in (
    'fast',
    'cold-shower',
    'cold_shower',
    'abstain_from_meat'
  );

commit;
