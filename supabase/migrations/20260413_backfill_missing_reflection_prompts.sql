-- Backfill missing plan_days.reflection_prompt values without touching existing prompts.
-- A prompt is considered missing when reflection_prompt is NULL or whitespace-only.

begin;

-- Audit before update.
with missing_before as (
  select id
  from plan_days
  where reflection_prompt is null
    or btrim(reflection_prompt) = ''
)
select count(*) as missing_reflection_prompts_before
from missing_before;

-- Fill only missing prompts.
with targets as (
  select
    id,
    day_number,
    coalesce(nullif(btrim(reading_title), ''), nullif(btrim(title), ''), 'today''s reading') as day_theme
  from plan_days
  where reflection_prompt is null
    or btrim(reflection_prompt) = ''
),
updated as (
  update plan_days pd
  set reflection_prompt = case
    when t.day_number between 1 and 7 then
      'In ' || t.day_theme || ', where is God calling you to repent without delay? Name one concrete act of obedience and complete it today.'
    when t.day_number between 8 and 14 then
      'What in ' || t.day_theme || ' exposes a divided heart in you? Ask for grace to choose fidelity over comfort before this day ends.'
    when t.day_number between 15 and 21 then
      'Through ' || t.day_theme || ', where are you resisting sacrifice? Bring that resistance to prayer, then accept one hidden cost in love.'
    when t.day_number between 22 and 28 then
      'In light of ' || t.day_theme || ', where do you need courage instead of excuse? Take one honest step today, even if it costs your pride.'
    when t.day_number between 29 and 35 then
      'What does ' || t.day_theme || ' require of your speech, habits, and loyalties? Make one concrete correction and keep watch over it tonight.'
    else
      'As you receive ' || t.day_theme || ', what must die in you so Christ can rule more fully? Choose one act of surrender and keep it.'
  end
  from targets t
  where pd.id = t.id
  returning pd.id
)
select count(*) as reflection_prompts_filled
from updated;

-- Audit after update.
with missing_after as (
  select id
  from plan_days
  where reflection_prompt is null
    or btrim(reflection_prompt) = ''
)
select count(*) as missing_reflection_prompts_after
from missing_after;

commit;
