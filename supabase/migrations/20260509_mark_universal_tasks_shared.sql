update public.task_templates
set audience = 'shared'
where slug in (
  'morning_prayer',
  'scripture_reading',
  'reflection',
  'reading',
  'no_social_media',
  'give_up_alcohol',
  'no_soda_sweet_drinks',
  'no_desserts_sweets',
  'heroic_minute',
  'confession',
  'rosary',
  'attend_mass',
  'adoration',
  'workout',
  'abstain_from_meat',
  'fast',
  'uplifting_audio',
  'check_in_anchor'
);
