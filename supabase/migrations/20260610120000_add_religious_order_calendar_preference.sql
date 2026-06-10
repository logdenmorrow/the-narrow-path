alter table public.profiles
  add column if not exists religious_order_calendar text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_religious_order_calendar_check'
  ) then
    alter table public.profiles
      add constraint profiles_religious_order_calendar_check
      check (
        religious_order_calendar is null
        or religious_order_calendar in ('dominican')
      );
  end if;
end $$;
