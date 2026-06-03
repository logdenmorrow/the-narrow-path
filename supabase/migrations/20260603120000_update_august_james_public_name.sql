begin;

update public.challenge_plans
set name = 'James: Faith That Works'
where slug = 'ordinary-time-james';

commit;
