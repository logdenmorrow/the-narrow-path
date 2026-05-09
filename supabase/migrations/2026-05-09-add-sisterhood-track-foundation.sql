begin;

-- 1. Add gender and track fields to profiles.
-- gender is descriptive profile data.
-- track is the app logic field that decides Brotherhood vs Sisterhood.
alter table public.profiles
  add column if not exists gender text;

alter table public.profiles
  add column if not exists track text;

-- 2. Default all existing users to Brotherhood.
-- This preserves current behavior for everyone already using the site.
update public.profiles
set track = 'brotherhood'
where track is null;

-- 3. Add safe constraints for future data.
do $$
begin
  alter table public.profiles
    add constraint profiles_gender_check
    check (
      gender is null
      or gender in ('male', 'female')
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.profiles
    add constraint profiles_track_check
    check (
      track in ('brotherhood', 'sisterhood')
    );
exception
  when duplicate_object then null;
end $$;

-- 4. Make track default to Brotherhood for safety.
-- This means old code or old signup paths will not create broken users.
alter table public.profiles
  alter column track set default 'brotherhood';

alter table public.profiles
  alter column track set not null;

-- 5. Add audience to task_templates.
-- This lets tasks eventually be scoped to Brotherhood, Sisterhood, or both.
alter table public.task_templates
  add column if not exists audience text;

-- 6. Default existing tasks to Brotherhood for now.
-- We are intentionally NOT changing men's task behavior yet.
update public.task_templates
set audience = 'brotherhood'
where audience is null;

-- 7. Add constraint for task audience.
do $$
begin
  alter table public.task_templates
    add constraint task_templates_audience_check
    check (
      audience in ('shared', 'brotherhood', 'sisterhood')
    );
exception
  when duplicate_object then null;
end $$;

-- 8. Make audience default to Brotherhood for now.
alter table public.task_templates
  alter column audience set default 'brotherhood';

alter table public.task_templates
  alter column audience set not null;

commit;