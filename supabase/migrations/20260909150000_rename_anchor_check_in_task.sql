-- Retire the user-facing Anchor terminology without changing the task identity.
-- Keeping the existing slug preserves plan assignments and completion history.

begin;

do $$
begin
  if not exists (
    select 1
    from public.task_templates
    where slug = 'check_in_anchor'
  ) then
    raise exception 'Cannot rename check_in_anchor because the task template does not exist.';
  end if;
end;
$$;

update public.task_templates
set
  title = 'Talk About Faith',
  description = 'Talk with a friend about faith, prayer, or something you''re working through.'
where slug = 'check_in_anchor';

commit;
