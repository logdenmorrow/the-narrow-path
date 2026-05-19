begin;

-- Reviewed reading context import for plan: example-plan-slug

-- Plan: example-plan-slug
-- Day: 1
update public.plan_days pd
set
  reading_context = 'Example only: Acts begins with Luke addressing Theophilus and returning to the work of Jesus after the Resurrection.',
  previous_reading_summary = null,
  reading_today_preview = 'Example only: Jesus prepares the apostles for the coming of the Holy Spirit and their mission as witnesses.',
  reading_watch_for = 'Example only: Notice the promise of power from the Holy Spirit before the public mission begins.',
  reading_key_terms = '[{"term":"Theophilus","definition":"The person Luke addresses at the beginning of Acts."},{"term":"Witness","definition":"One who testifies to what Christ has done."}]'::jsonb,
  reading_context_source_hash = 'example-only-day-1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'example-plan-slug'
  and pd.day_number = 1;

-- Plan: example-plan-slug
-- Day: 2
update public.plan_days pd
set
  reading_context = 'Example only: The apostles are gathered in Jerusalem after the Ascension, waiting in prayer.',
  previous_reading_summary = 'Example only: Jesus promised the Holy Spirit and sent the apostles to be His witnesses.',
  reading_today_preview = 'Example only: The apostles address the empty place left by Judas and choose Matthias.',
  reading_watch_for = 'Example only: Watch how prayer and apostolic office stay connected.',
  reading_key_terms = '[{"term":"Apostle","definition":"One sent by Christ with authority to witness and serve the Church."},{"term":"Matthias","definition":"The man chosen to take the place of Judas among the Twelve."}]'::jsonb,
  reading_context_source_hash = 'example-only-day-2'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'example-plan-slug'
  and pd.day_number = 2;

commit;
