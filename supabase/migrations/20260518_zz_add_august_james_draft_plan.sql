begin;
alter table public.plan_day_tasks
drop constraint if exists plan_day_tasks_quota_scope_check;

alter table public.plan_day_tasks
add constraint plan_day_tasks_quota_scope_check
check (
  quota_scope is null
  or quota_scope in ('week', 'last_week_of_month', 'month')
);

-- Draft-only August James plan data.
-- This creates an inactive plan for admin/data review. Do not mark it active
-- until date-based season/plan resolution replaces the current single active
-- challenge_plans.is_active=true assumption.

do $$
declare
  missing_slugs text[];
begin
  select array_agg(required.slug order by required.slug)
  into missing_slugs
  from (
    values
      ('reading'),
      ('reflection'),
      ('attend_mass'),
      ('adoration'),
      ('confession'),
      ('night-prayer'),
      ('rosary'),
      ('workout'),
      ('check_in_anchor')
  ) as required(slug)
  where not exists (
    select 1
    from public.task_templates tt
    where tt.slug = required.slug
  );

  if missing_slugs is not null then
    raise exception
      'Cannot create August James draft plan. Missing task_templates slugs: %',
      array_to_string(missing_slugs, ', ');
  end if;
end;
$$;

insert into public.challenge_plans (
  slug,
  name,
  total_days,
  is_active
)
select
  'ordinary-time-james',
  'Ordinary Time: James',
  31,
  false
where not exists (
  select 1
  from public.challenge_plans
  where slug = 'ordinary-time-james'
     or name = 'Ordinary Time: James'
);

update public.challenge_plans
set
  slug = 'ordinary-time-james',
  name = 'Ordinary Time: James',
  total_days = 31,
  is_active = false
where slug = 'ordinary-time-james'
   or name = 'Ordinary Time: James';

with august_plan as (
  select id as plan_id
  from public.challenge_plans
  where slug = 'ordinary-time-james'
     or name = 'Ordinary Time: James'
  order by id
  limit 1
),
content (
  day_number,
  day_date,
  title,
  reading_reference,
  reading_title,
  reading_focus,
  reading_text,
  reflection_prompt
) as (
  values
  (1, date '2026-08-01', 'Trials and Steadfastness', 'James 1:1-4', 'Trials and Steadfastness', 'God can use trials to form steadfast faith.', 'James, a servant of God and of the Lord Jesus Christ, To the twelve tribes in the Dispersion: Greeting. Count it all joy, my brethren, when you meet various trials, for you know that the testing of your faith produces steadfastness. And let steadfastness have its full effect, that you may be perfect and complete, lacking in nothing.', 'Where am I being tested right now, and what would it look like to let God form steadfastness in me instead of only asking Him to remove the trial?'),
  (2, date '2026-08-02', 'Ask God for Wisdom', 'James 1:5-8', 'Ask God for Wisdom', 'Wisdom is received from God with faith, not double-mindedness.', 'If any of you lacks wisdom, let him ask God, who gives to all men generously and without reproaching, and it will be given him. But let him ask in faith, with no doubting, for he who doubts is like a wave of the sea that is driven and tossed by the wind. For that person must not suppose that a double-minded man, unstable in all his ways, will receive anything from the Lord.', 'Where do I need wisdom from God, and where am I still trying to keep one foot in trust and one foot in control?'),
  (3, date '2026-08-03', 'Humility in Every State', 'James 1:9-11', 'Humility in Every State', 'Both poverty and wealth must be seen in light of eternity.', 'Let the lowly brother boast in his exaltation, and the rich in his humiliation, because like the flower of the grass he will pass away. For the sun rises with its scorching heat and withers the grass; its flower falls, and its beauty perishes. So will the rich man fade away in the midst of his pursuits.', 'What worldly status, comfort, or achievement am I tempted to treat as more permanent than it really is?'),
  (4, date '2026-08-04', 'Trial and Temptation', 'James 1:12-15', 'Trial and Temptation', 'Temptation does not come from God; it grows when desire is left unchecked.', 'Blessed is the man who endures trial, for when he has stood the test he will receive the crown of life which God has promised to those who love him. Let no one say when he is tempted, “I am tempted by God”; for God cannot be tempted with evil and he himself tempts no one; but each person is tempted when he is lured and enticed by his own desire. Then desire when it has conceived gives birth to sin; and sin when it is full-grown brings forth death.', 'What desire in me needs to be brought honestly before God before it grows into sin?'),
  (5, date '2026-08-05', 'Receive the Word with Meekness', 'James 1:16-21', 'Receive the Word with Meekness', 'God gives good gifts, and His word must be received with humility.', 'Do not be deceived, my beloved brethren. Every good endowment and every perfect gift is from above, coming down from the Father of lights with whom there is no variation or shadow due to change. Of his own will he brought us forth by the word of truth that we should be a kind of first fruits of his creatures. Know this, my beloved brethren. Let every man be quick to hear, slow to speak, slow to anger, for the anger of man does not work the righteousness of God. Therefore put away all filthiness and rank growth of wickedness and receive with meekness the implanted word, which is able to save your souls.', 'Where do I need to become quicker to listen, slower to speak, or slower to anger?'),
  (6, date '2026-08-06', 'Doers of the Word', 'James 1:22-27', 'Doers of the Word', 'True religion is not hearing only, but living the word with concrete charity and purity.', 'But be doers of the word, and not hearers only, deceiving yourselves. For if any one is a hearer of the word and not a doer, he is like a man who observes his natural face in a mirror; for he observes himself and goes away and at once forgets what he was like. But he who looks into the perfect law, the law of liberty, and perseveres, being no hearer that forgets but a doer that acts, he shall be blessed in his doing. If any one thinks he is religious, and does not bridle his tongue but deceives his heart, this man’s religion is vain. Religion that is pure and undefiled before God and the Father is this: to visit orphans and widows in their affliction, and to keep oneself unstained from the world.', 'What is one concrete way I need to become a doer of the word today, not only a hearer?'),
  (7, date '2026-08-07', 'No Partiality', 'James 2:1-4', 'No Partiality', 'Faith in Christ cannot coexist with judging people by status or appearance.', 'My brethren, show no partiality as you hold the faith of our Lord Jesus Christ, the Lord of glory. For if a man with gold rings and in fine clothing comes into your assembly, and a poor man in shabby clothing also comes in, and you pay attention to the one who wears the fine clothing and say, “Have a seat here, please,” while you say to the poor man, “Stand there,” or, “Sit at my feet,” have you not made distinctions among yourselves, and become judges with evil thoughts?', 'Where do I judge people by appearance, usefulness, popularity, wealth, or status?'),
  (8, date '2026-08-08', 'The Poor and the Kingdom', 'James 2:5-7', 'The Poor and the Kingdom', 'God honors those the world often overlooks.', 'Listen, my beloved brethren. Has not God chosen those who are poor in the world to be rich in faith and heirs of the kingdom which he has promised to those who love him? But you have dishonored the poor man. Is it not the rich who oppress you, is it not they who drag you into court? Is it not they who blaspheme that honorable name by which you are called?', 'Who do I overlook, dismiss, or treat as less important than God does?'),
  (9, date '2026-08-09', 'Mercy Triumphs', 'James 2:8-13', 'Mercy Triumphs', 'The royal law calls us to love our neighbor and show mercy.', 'If you really fulfil the royal law, according to the Scripture, “You shall love your neighbor as yourself,” you do well. But if you show partiality, you commit sin, and are convicted by the law as transgressors. For whoever keeps the whole law but fails in one point has become guilty of all of it. For he who said, “Do not commit adultery,” said also, “Do not kill.” If you do not commit adultery but do kill, you have become a transgressor of the law. So speak and so act as those who are to be judged under the law of liberty. For judgment is without mercy to one who has shown no mercy; yet mercy triumphs over judgment.', 'Where do I need to speak and act with more mercy, especially toward someone I am tempted to judge?'),
  (10, date '2026-08-10', 'Faith Must Act', 'James 2:14-17', 'Faith Must Act', 'Faith without concrete love is dead.', 'What does it profit, my brethren, if a man says he has faith but has not works? Can his faith save him? If a brother or sister is poorly clothed and in lack of daily food, and one of you says to them, “Go in peace, be warmed and filled,” without giving them the things needed for the body, what does it profit? So faith by itself, if it has no works, is dead.', 'Where have I spoken good words without following them with real love or sacrifice?'),
  (11, date '2026-08-11', 'Show Your Faith', 'James 2:18-20', 'Show Your Faith', 'Faith is shown by the life it produces.', 'But some one will say, “You have faith and I have works.” Show me your faith apart from your works, and I by my works will show you my faith. You believe that God is one; you do well. Even the demons believe—and shudder. Do you want to be shown, you foolish fellow, that faith apart from works is barren?', 'If someone looked only at my actions this week, what would they think I believe?'),
  (12, date '2026-08-12', 'Faith Completed by Works', 'James 2:21-26', 'Faith Completed by Works', 'Living faith is active, obedient, and completed in love.', 'Was not Abraham our father justified by works, when he offered his son Isaac upon the altar? You see that faith was active along with his works, and faith was completed by works, and the Scripture was fulfilled which says, “Abraham believed God, and it was reckoned to him as righteousness”; and he was called the friend of God. You see that a man is justified by works and not by faith alone. And in the same way was not also Rahab the harlot justified by works when she received the messengers and sent them out another way? For as the body apart from the spirit is dead, so faith apart from works is dead.', 'What act of obedience is God asking of me that would make my faith more than words?'),
  (13, date '2026-08-13', 'The Weight of Words', 'James 3:1-2', 'The Weight of Words', 'Those who teach and speak are accountable for their words.', 'Let not many of you become teachers, my brethren, for you know that we who teach shall be judged with greater strictness. For we all make many mistakes, and if any one makes no mistakes in what he says he is a perfect man, able to bridle the whole body also.', 'Where do my words need more humility, restraint, or accountability?'),
  (14, date '2026-08-14', 'A Small Fire', 'James 3:3-6', 'A Small Fire', 'Small words can direct or damage an entire life.', 'If we put bits into the mouths of horses that they may obey us, we guide their whole bodies. Look at the ships also; though they are so great and are driven by strong winds, they are guided by a very small rudder wherever the will of the pilot directs. So the tongue is a little member and boasts of great things. How great a forest is set ablaze by a small fire! And the tongue is a fire. The tongue is an unrighteous world among our members, staining the whole body, setting on fire the cycle of nature, and set on fire by hell.', 'What kind of fire do my words tend to start: peace, pride, resentment, gossip, anger, or encouragement?'),
  (15, date '2026-08-15', 'Blessing and Cursing', 'James 3:7-12', 'Blessing and Cursing', 'The same mouth should not bless God and curse those made in His likeness.', 'For every kind of beast and bird, of reptile and sea creature, can be tamed and has been tamed by mankind, but no human being can tame the tongue—a restless evil, full of deadly poison. With it we bless the Lord and Father, and with it we curse men, who are made in the likeness of God. From the same mouth come blessing and cursing. My brethren, this ought not to be so. Does a spring pour forth from the same opening fresh water and brackish? Can a fig tree, my brethren, yield olives, or a grapevine figs? No more can salt water yield fresh.', 'Where have I blessed God with my mouth but cursed, mocked, gossiped about, or belittled someone made in His image?'),
  (16, date '2026-08-16', 'Meekness of Wisdom', 'James 3:13', 'Meekness of Wisdom', 'True wisdom is shown by a good life and meek works.', 'Who is wise and understanding among you? By his good life let him show his works in the meekness of wisdom.', 'What would meek wisdom look like in my actions today?'),
  (17, date '2026-08-17', 'False Wisdom', 'James 3:14-16', 'False Wisdom', 'Jealousy and selfish ambition lead to disorder.', 'But if you have bitter jealousy and selfish ambition in your hearts, do not boast and be false to the truth. This wisdom is not such as comes down from above, but is earthly, unspiritual, devilish. For where jealousy and selfish ambition exist, there will be disorder and every vile practice.', 'Where do jealousy or selfish ambition show up in my heart, even quietly?'),
  (18, date '2026-08-18', 'Wisdom from Above', 'James 3:17-18', 'Wisdom from Above', 'God’s wisdom is pure, peaceable, gentle, merciful, and sincere.', 'But the wisdom from above is first pure, then peaceable, gentle, open to reason, full of mercy and good fruits, without uncertainty or insincerity. And the harvest of righteousness is sown in peace by those who make peace.', 'Which mark of wisdom from above do I most need to grow in right now?'),
  (19, date '2026-08-19', 'Disordered Desires', 'James 4:1-3', 'Disordered Desires', 'Conflict often begins with passions at war within us.', 'What causes wars, and what causes fightings among you? Is it not your passions that are at war in your members? You desire and do not have; so you kill. And you covet and cannot obtain; so you fight and wage war. You do not have, because you do not ask. You ask and do not receive, because you ask wrongly, to spend it on your passions.', 'What conflict in my life might be connected to a disordered desire in me?'),
  (20, date '2026-08-20', 'Friendship with the World', 'James 4:4-6', 'Friendship with the World', 'Pride makes friendship with the world an enemy of God.', 'Unfaithful creatures! Do you not know that friendship with the world is enmity with God? Therefore whoever wishes to be a friend of the world makes himself an enemy of God. Or do you suppose it is in vain that the Scripture says, “He yearns jealously over the spirit which he has made to dwell in us”? But he gives more grace; therefore it says, “God opposes the proud, but gives grace to the humble.”', 'Where am I trying to be friends with the world in a way that pulls me away from God?'),
  (21, date '2026-08-21', 'Draw Near to God', 'James 4:7-10', 'Draw Near to God', 'Humility begins with submission to God and repentance.', 'Submit yourselves therefore to God. Resist the devil and he will flee from you. Draw near to God and he will draw near to you. Cleanse your hands, you sinners, and purify your hearts, you men of double mind. Be wretched and mourn and weep. Let your laughter be turned to mourning and your joy to dejection. Humble yourselves before the Lord and he will exalt you.', 'What step would help me draw near to God today instead of drifting?'),
  (22, date '2026-08-22', 'Do Not Judge Your Brother', 'James 4:11-12', 'Do Not Judge Your Brother', 'God alone is lawgiver and judge.', 'Do not speak evil against one another, brethren. He that speaks evil against a brother or judges his brother, speaks evil against the law and judges the law. But if you judge the law, you are not a doer of the law but a judge. There is one lawgiver and judge, he who is able to save and to destroy. But who are you that you judge your neighbor?', 'Where am I speaking about someone as if I were their judge?'),
  (23, date '2026-08-23', 'If the Lord Wills', 'James 4:13-16', 'If the Lord Wills', 'Life is brief, and our plans belong under God’s will.', 'Come now, you who say, “Today or tomorrow we will go into such and such a town and spend a year there and trade and get gain”; whereas you do not know about tomorrow. What is your life? For you are a mist that appears for a little time and then vanishes. Instead you ought to say, “If the Lord wills, we shall live and we shall do this or that.” As it is, you boast in your arrogance. All such boasting is evil.', 'What plan, ambition, or worry do I need to place under the words, “If the Lord wills”?'),
  (24, date '2026-08-24', 'The Sin of Omission', 'James 4:17', 'The Sin of Omission', 'Knowing the right thing and refusing it is sin.', 'Whoever knows what is right to do and fails to do it, for him it is sin.', 'What good do I already know I should do but keep delaying?'),
  (25, date '2026-08-25', 'Wealth and Injustice', 'James 5:1-6', 'Wealth and Injustice', 'Riches become judgment when they are used selfishly or unjustly.', 'Come now, you rich, weep and howl for the miseries that are coming upon you. Your riches have rotted and your garments are moth-eaten. Your gold and silver have rusted, and their rust will be evidence against you and will eat your flesh like fire. You have laid up treasure for the last days. Behold, the wages of the laborers who mowed your fields, which you kept back by fraud, cry out; and the cries of the harvesters have reached the ears of the Lord of hosts. You have lived on the earth in luxury and in pleasure; you have fattened your hearts in a day of slaughter. You have condemned, you have killed the righteous man; he does not resist you.', 'Where do comfort, money, or convenience make me less attentive to justice and charity?'),
  (26, date '2026-08-26', 'Be Patient', 'James 5:7-8', 'Be Patient', 'The Christian waits for the Lord with a steady heart.', 'Be patient, therefore, brethren, until the coming of the Lord. Behold, the farmer waits for the precious fruit of the earth, being patient over it until it receives the early and the late rain. You also be patient. Establish your hearts, for the coming of the Lord is at hand.', 'Where is God asking me to be patient without becoming passive or bitter?'),
  (27, date '2026-08-27', 'Steadfastness in Suffering', 'James 5:9-11', 'Steadfastness in Suffering', 'The Lord is compassionate and merciful in the suffering of the steadfast.', 'Do not grumble, brethren, against one another, that you may not be judged; behold, the Judge is standing at the doors. As an example of suffering and patience, brethren, take the prophets who spoke in the name of the Lord. Behold, we call those happy who were steadfast. You have heard of the steadfastness of Job, and you have seen the purpose of the Lord, how the Lord is compassionate and merciful.', 'Where do I need to stop grumbling and choose steadfastness?'),
  (28, date '2026-08-28', 'Let Your Yes Be Yes', 'James 5:12', 'Let Your Yes Be Yes', 'A Christian’s speech should be simple, honest, and trustworthy.', 'But above all, my brethren, do not swear, either by heaven or by earth or with any other oath, but let your yes be yes and your no be no, that you may not fall under condemnation.', 'Where does my speech need more honesty, simplicity, or follow-through?'),
  (29, date '2026-08-29', 'Prayer in Suffering and Sickness', 'James 5:13-15', 'Prayer in Suffering and Sickness', 'The Church brings suffering, joy, sickness, and sin before the Lord in prayer.', 'Is any one among you suffering? Let him pray. Is any cheerful? Let him sing praise. Is any among you sick? Let him call for the elders of the Church, and let them pray over him, anointing him with oil in the name of the Lord; and the prayer of faith will save the sick man, and the Lord will raise him up; and if he has committed sins, he will be forgiven.', 'What do I need to bring to prayer instead of carrying alone?'),
  (30, date '2026-08-30', 'Confession and Prayer', 'James 5:16-18', 'Confession and Prayer', 'Prayer and confession are part of healing and restoration.', 'Therefore confess your sins to one another, and pray for one another, that you may be healed. The prayer of a righteous man has great power in its effects. Elijah was a man of like nature with ourselves and he prayed fervently that it might not rain, and for three years and six months it did not rain on the earth. Then he prayed again and the heaven gave rain, and the earth brought forth its fruit.', 'What sin, wound, or burden needs to be brought into the light?'),
  (31, date '2026-08-31', 'Bring Back the Wanderer', 'James 5:19-20', 'Bring Back the Wanderer', 'Charity seeks the return of the one who has wandered from the truth.', 'My brethren, if any one among you wanders from the truth and some one brings him back, let him know that whoever brings back a sinner from the error of his way will save his soul from death and will cover a multitude of sins.', 'Who can I pray for, encourage, or gently help back toward the truth?')
)
insert into public.plan_days (
  plan_id,
  day_number,
  title,
  reading_mission,
  reading_focus,
  reading_title,
  reading_reference,
  reading_notes,
  reading_text,
  reflection_prompt
)
select
  ap.plan_id,
  c.day_number,
  c.title,
  'Read through the Letter of James slowly after the 90-day challenge.',
  c.reading_focus,
  c.reading_title,
  c.reading_reference,
  null,
  c.reading_text,
  c.reflection_prompt
from august_plan ap
cross join content c
on conflict (plan_id, day_number) do update
set
  title = excluded.title,
  reading_mission = excluded.reading_mission,
  reading_focus = excluded.reading_focus,
  reading_title = excluded.reading_title,
  reading_reference = excluded.reading_reference,
  reading_notes = excluded.reading_notes,
  reading_text = excluded.reading_text,
  reflection_prompt = excluded.reflection_prompt;

with august_plan_days as (
  select
    pd.id as plan_day_id,
    pd.day_number,
    (date '2026-08-01' + ((pd.day_number - 1) * interval '1 day'))::date as day_date
  from public.challenge_plans cp
  join public.plan_days pd
    on pd.plan_id = cp.id
  where (
    cp.slug = 'ordinary-time-james'
    or cp.name = 'Ordinary Time: James'
  )
),
august_day_metadata as (
  select
    apd.plan_day_id,
    apd.day_number,
    apd.day_date,
    (
      apd.day_date
      - ((extract(isodow from apd.day_date)::int - 1) * interval '1 day')
    )::date as week_start_date,
    date '2026-08-01' as month_start_date,
    extract(isodow from apd.day_date)::int as iso_weekday
  from august_plan_days apd
),
task_rules (
  slug,
  applies_on,
  is_required,
  is_optional,
  quota_scope,
  quota_target,
  fallback_display_order,
  requirement_note
) as (
  values
    ('reading', 'daily', true, false, null, null, 10, 'Read the assigned passage from James.'),
    ('reflection', 'daily', true, false, null, null, 20, 'Save a short reflection based on today''s James reading.'),
    ('attend_mass', 'sunday', true, false, null, null, 40, 'Sunday Mass is expected for this season.'),
    ('adoration', 'daily', false, true, 'week', 1, 50, 'Required once per Monday-Sunday week. Complete it on any day that works.'),
    ('confession', 'daily', false, true, 'month', 1, 60, 'Required once during August. Complete it on any day that works.'),
    ('night-prayer', 'daily', false, true, null, null, 70, 'Optional every night.'),
    ('rosary', 'daily', false, true, null, null, 80, 'Optional every day.'),
    ('workout', 'daily', false, true, null, null, 90, 'Optional.'),
    ('check_in_anchor', 'daily', false, true, null, null, 100, 'Optional.')
),
tasks_to_insert as (
  select
    adm.plan_day_id,
    tt.id as task_template_id,
    tr.is_required,
    coalesce(tt.sort_order, tr.fallback_display_order) as sort_order,
    adm.day_date,
    adm.week_start_date,
    adm.month_start_date,
    tr.is_optional,
    tr.quota_scope,
    tr.quota_target,
    tr.requirement_note,
    coalesce(tt.sort_order, tr.fallback_display_order) as display_order
  from august_day_metadata adm
  join task_rules tr
    on tr.applies_on = 'daily'
    or (tr.applies_on = 'sunday' and adm.iso_weekday = 7)
  join public.task_templates tt
    on tt.slug = tr.slug
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
from tasks_to_insert
on conflict (plan_day_id, task_template_id) do update
set
  is_required = excluded.is_required,
  sort_order = excluded.sort_order,
  day_date = excluded.day_date,
  week_start_date = excluded.week_start_date,
  month_start_date = excluded.month_start_date,
  is_optional = excluded.is_optional,
  quota_scope = excluded.quota_scope,
  quota_target = excluded.quota_target,
  requirement_note = excluded.requirement_note,
  display_order = excluded.display_order;

with august_plan_tasks as (
  select pdt.id
  from public.challenge_plans cp
  join public.plan_days pd
    on pd.plan_id = cp.id
  join public.plan_day_tasks pdt
    on pdt.plan_day_id = pd.id
  join public.task_templates tt
    on tt.id = pdt.task_template_id
  where (
    cp.slug = 'ordinary-time-james'
    or cp.name = 'Ordinary Time: James'
  )
    and tt.slug in (
      'scripture_reading',
      'give_up_alcohol',
      'no_desserts_sweets',
      'no_soda_sweet_drinks',
      'cold_shower',
      'cold-shower',
      'no_social_media',
      'fast',
      'abstain_from_meat',
      'heroic_minute'
    )
)
delete from public.plan_day_tasks pdt
using august_plan_tasks apt
where pdt.id = apt.id;

rollback;
