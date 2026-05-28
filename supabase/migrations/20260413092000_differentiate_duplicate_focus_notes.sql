-- Differentiate plan_days.reading_focus and plan_days.reading_notes when they are duplicate/near-duplicate.
-- Keeps schema unchanged and preserves Catechism day behavior.

begin;

create temporary table _focus_note_affected on commit drop as
with normalized as (
  select
    id,
    day_number,
    reading_reference,
    btrim(coalesce(reading_focus, '')) as focus_raw,
    btrim(coalesce(reading_notes, '')) as notes_raw,
    lower(regexp_replace(coalesce(reading_focus, ''), '\s+', ' ', 'g')) as focus_ws,
    lower(regexp_replace(coalesce(reading_notes, ''), '\s+', ' ', 'g')) as notes_ws,
    lower(regexp_replace(coalesce(reading_focus, ''), '[^a-z0-9]+', '', 'g')) as focus_compact,
    lower(regexp_replace(coalesce(reading_notes, ''), '[^a-z0-9]+', '', 'g')) as notes_compact
  from plan_days
)
select
  id,
  day_number,
  reading_reference,
  focus_raw as reading_focus_before,
  notes_raw as reading_notes_before
from normalized
where focus_raw <> ''
  and notes_raw <> ''
  and (
    focus_compact = notes_compact
    or focus_ws like notes_ws || '%'
    or notes_ws like focus_ws || '%'
    or split_part(focus_ws, '.', 1) = split_part(notes_ws, '.', 1)
  );

select count(*) as duplicate_or_near_duplicate_days_before
from _focus_note_affected;

with updated as (
  update plan_days pd
  set reading_notes = case
    when pd.reading_reference ~* '^\s*CCC\b' then
      'Catholic Companion: These Catechism paragraphs present the Church''s authoritative teaching. Receive them as formation for mind and heart, then choose one concrete act of prayer, sacramental preparation, or charity today.'
    else
      'Catholic Companion: Build on today''s focus by reading this passage with the Church''s apostolic faith. Let grace move you from insight to action through repentance, prayer, and faithful participation in the sacramental life.'
  end
  from _focus_note_affected a
  where pd.id = a.id
  returning pd.id
)
select count(*) as duplicate_or_near_duplicate_days_fixed
from updated;

with normalized as (
  select
    id,
    btrim(coalesce(reading_focus, '')) as focus_raw,
    btrim(coalesce(reading_notes, '')) as notes_raw,
    lower(regexp_replace(coalesce(reading_focus, ''), '\s+', ' ', 'g')) as focus_ws,
    lower(regexp_replace(coalesce(reading_notes, ''), '\s+', ' ', 'g')) as notes_ws,
    lower(regexp_replace(coalesce(reading_focus, ''), '[^a-z0-9]+', '', 'g')) as focus_compact,
    lower(regexp_replace(coalesce(reading_notes, ''), '[^a-z0-9]+', '', 'g')) as notes_compact
  from plan_days
),
remaining as (
  select id
  from normalized
  where focus_raw <> ''
    and notes_raw <> ''
    and (
      focus_compact = notes_compact
      or focus_ws like notes_ws || '%'
      or notes_ws like focus_ws || '%'
      or split_part(focus_ws, '.', 1) = split_part(notes_ws, '.', 1)
    )
)
select count(*) as duplicate_or_near_duplicate_days_after
from remaining;

-- Five before/after examples from this migration run for QA notes.
select
  day_number,
  reading_reference,
  reading_focus_before,
  reading_notes_before,
  case
    when reading_reference ~* '^\s*CCC\b' then
      'Catholic Companion: These Catechism paragraphs present the Church''s authoritative teaching. Receive them as formation for mind and heart, then choose one concrete act of prayer, sacramental preparation, or charity today.'
    else
      'Catholic Companion: Build on today''s focus by reading this passage with the Church''s apostolic faith. Let grace move you from insight to action through repentance, prayer, and faithful participation in the sacramental life.'
  end as reading_notes_after
from _focus_note_affected
order by day_number
limit 5;

commit;
