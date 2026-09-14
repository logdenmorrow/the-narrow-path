-- Keep the dedicated production Playwright account available for release QA,
-- but exclude it from member directories, community counts, and accountability
-- summaries. This is intentionally scoped to the known automation profile ID.

begin;

update public.profiles
set is_hidden_from_community = true
where id = 'd5e12208-69dc-4911-b8b0-0e602bb697a8'
  and display_name = 'playwright-test';

do $$
begin
  if exists (
    select 1
    from public.profiles
    where id = 'd5e12208-69dc-4911-b8b0-0e602bb697a8'
      and is_hidden_from_community = false
  ) then
    raise exception 'The Playwright test profile is still visible to the community.';
  end if;
end
$$;

commit;
