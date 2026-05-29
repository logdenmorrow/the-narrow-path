begin;

-- Adds reviewed Before You Read context to the inactive Gospel season.
-- This migration intentionally does not activate the plan and does not touch reading text,
-- reading titles, reading references, reflection prompts, or task rows.

do $$
declare
  gospel_plan_id bigint;
  gospel_plan_count integer;
  gospel_plan_day_count integer;
begin
  select count(*)
    into gospel_plan_count
  from public.challenge_plans
  where slug = 'the-gospels-september-lent'
    and is_active = false;

  if gospel_plan_count = 0 then
    raise exception 'Expected inactive Gospel plan with slug the-gospels-september-lent, but none was found.';
  end if;

  if gospel_plan_count > 1 then
    raise exception 'Expected exactly one inactive Gospel plan with slug the-gospels-september-lent, found %.', gospel_plan_count;
  end if;

  select id
    into gospel_plan_id
  from public.challenge_plans
  where slug = 'the-gospels-september-lent'
    and is_active = false;

  select count(*)
    into gospel_plan_day_count
  from public.plan_days
  where plan_id = gospel_plan_id;

  if gospel_plan_day_count <> 162 then
    raise exception 'Expected 162 Gospel plan days for the-gospels-september-lent, found %.', gospel_plan_day_count;
  end if;
end $$;

-- Day 1: Mark 1:1-13 - The Beginning of the Gospel
update public.plan_days pd
set
  reading_context = $tnp$The season opens at the Jordan and in the wilderness. Mark introduces Jesus as the Son of God and moves quickly into His public mission.$tnp$,
  previous_reading_summary = $tnp$This is the beginning of the Gospel season, so there is no previous day to review.$tnp$,
  reading_today_preview = $tnp$Today, John prepares the way; Jesus is baptized and tempted.$tnp$,
  reading_watch_for = $tnp$Watch how baptism is joined to identity, mission, and the work of the Holy Spirit.$tnp$,
  reading_key_terms = $tnp$[{"term":"Gospel","definition":"The good news of Jesus Christ, the Son of God and Savior."},{"term":"baptism","definition":"The sacrament of new birth in Christ and cleansing from sin."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$c42ba9a3184f4994da37967f290335829d8b9122dbf580f953dc582221d2e108$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 1;

-- Day 2: Mark 1:14-20 - The Kingdom Draws Near
update public.plan_days pd
set
  reading_context = $tnp$Mark's opening ministry shows Jesus acting with urgency and authority. This reading continues that beginning as Jesus announces the Kingdom and calls His first disciples.$tnp$,
  previous_reading_summary = $tnp$Yesterday, John prepares the way; Jesus is baptized and tempted.$tnp$,
  reading_today_preview = $tnp$Today, Jesus announces the Kingdom and calls His first disciples.$tnp$,
  reading_watch_for = $tnp$Notice that disciples are called to be with Jesus before they are sent.$tnp$,
  reading_key_terms = $tnp$[{"term":"Gospel","definition":"The good news of Jesus Christ, the Son of God and Savior."},{"term":"Kingdom of God","definition":"God's saving reign, present in Christ and coming to fulfillment."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$4fc1a42e26c79dde4671b8aff6c6aeca845b9df11e66966bfd1298603d64648b$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 2;

-- Day 3: Mark 1:21-45 - Authority and Mercy
update public.plan_days pd
set
  reading_context = $tnp$Mark's opening ministry shows Jesus acting with urgency and authority. This reading continues that beginning as Jesus teaches, heals, casts out demons, and cleanses a leper.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus announces the Kingdom and calls His first disciples.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches, heals, casts out demons, and cleanses a leper.$tnp$,
  reading_watch_for = $tnp$Watch how mercy restores real people without pretending sin is harmless.$tnp$,
  reading_key_terms = $tnp$[{"term":"Holy Spirit","definition":"The third Person of the Trinity, given by the Father and the Son."},{"term":"mercy","definition":"God's faithful love toward sinners, the suffering, and the lost."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$58a4fae248f476c38279c11925e80a4af409c001386897104f6c6082c5dcdcb6$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 3;

-- Day 4: Mark 2:1-17 - The Physician of Sinners
update public.plan_days pd
set
  reading_context = $tnp$Mark's opening ministry shows Jesus acting with urgency and authority. This reading continues that beginning as Jesus forgives the paralytic and calls Levi.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches, heals, casts out demons, and cleanses a leper.$tnp$,
  reading_today_preview = $tnp$Today, Jesus forgives the paralytic and calls Levi.$tnp$,
  reading_watch_for = $tnp$Watch how mercy restores real people without pretending sin is harmless.$tnp$,
  reading_key_terms = $tnp$[]$tnp$::jsonb,
  reading_context_source_hash = $tnp$716540e1456ec8f8c7bb4b6cd0248ad765fcfd3b8056d6a2cd6d54b8f70a752e$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 4;

-- Day 5: Mark 2:18-3:6 - Lord of the Sabbath
update public.plan_days pd
set
  reading_context = $tnp$Mark's opening ministry shows Jesus acting with urgency and authority. This reading continues that beginning as Jesus answers disputes about fasting, Sabbath, and mercy.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus forgives the paralytic and calls Levi.$tnp$,
  reading_today_preview = $tnp$Today, Jesus answers disputes about fasting, Sabbath, and mercy.$tnp$,
  reading_watch_for = $tnp$Watch how mercy restores real people without pretending sin is harmless.$tnp$,
  reading_key_terms = $tnp$[{"term":"Sabbath","definition":"The holy day of rest and worship given to Israel by God."},{"term":"mercy","definition":"God's faithful love toward sinners, the suffering, and the lost."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$5c14752c3f47a3e32b48add7cebbc0b8292515c146d090d4a4ca98d3bfe05684$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 5;

-- Day 6: CCC 101-104; 125-127; 131-133 - Sacred Scripture and the Gospels
update public.plan_days pd
set
  reading_context = $tnp$This first Sunday grounds the season in the Church's love for Sacred Scripture. Before moving deeper into Mark, the Catechism reminds us that the Gospels are the heart of the Scriptures.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus answers disputes about fasting, Sabbath, and mercy.$tnp$,
  reading_today_preview = $tnp$Today, the Catechism teaches how God speaks through Scripture and why the Gospels hold a privileged place.$tnp$,
  reading_watch_for = $tnp$Notice how the Church receives Scripture as God's living word, not as religious information.$tnp$,
  reading_key_terms = $tnp$[{"term":"Gospel","definition":"The good news of Jesus Christ, the Son of God and Savior."},{"term":"Church","definition":"The people Christ gathers into His Body through faith and the sacraments."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$7926bbde3ed5f7462f42f8b25bb1ef11fb6757046130a4b7d8c62f7a011487dd$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 6;

-- Day 7: Mark 3:7-35 - Called to Be With Him
update public.plan_days pd
set
  reading_context = $tnp$Mark now shows Jesus' authority and mercy spreading through Galilee. This reading continues that witness as Jesus appoints the Twelve and names His true family.$tnp$,
  previous_reading_summary = $tnp$Yesterday's Catechism reading focused on Sacred Scripture and the Gospels.$tnp$,
  reading_today_preview = $tnp$Today, Jesus appoints the Twelve and names His true family.$tnp$,
  reading_watch_for = $tnp$Notice that disciples are called to be with Jesus before they are sent.$tnp$,
  reading_key_terms = $tnp$[{"term":"apostle","definition":"One sent by Christ with authority to witness and serve His Church."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$b65984a184649c367d11a93786dd2d02c96d60b14f33dd60bcea3f2388ea4319$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 7;

-- Day 8: Mark 4:1-20 - The Sower and the Word
update public.plan_days pd
set
  reading_context = $tnp$Mark now shows Jesus' authority and mercy spreading through Galilee. This reading continues that witness as Jesus teaches how the word is received.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus appoints the Twelve and names His true family.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches how the word is received.$tnp$,
  reading_watch_for = $tnp$Notice the concrete images Jesus uses to reveal the Kingdom.$tnp$,
  reading_key_terms = $tnp$[{"term":"parable","definition":"A short teaching story that reveals the Kingdom through familiar images."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$ea1584ff1aeac141e64a6773c244d8d81cfab1776b8e135cec8e974eef14a61b$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 8;

-- Day 9: Mark 4:21-34 - The Hidden Kingdom Grows
update public.plan_days pd
set
  reading_context = $tnp$Mark now shows Jesus' authority and mercy spreading through Galilee. This reading continues that witness as Jesus teaches the lamp, seed, and mustard seed.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches how the word is received.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches the lamp, seed, and mustard seed.$tnp$,
  reading_watch_for = $tnp$Notice the concrete images Jesus uses to reveal the Kingdom.$tnp$,
  reading_key_terms = $tnp$[{"term":"Kingdom of God","definition":"God's saving reign, present in Christ and coming to fulfillment."},{"term":"parable","definition":"A short teaching story that reveals the Kingdom through familiar images."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$b29753eac28fbab6c3b9e5d51392567600e9559df0508cb9e7ebe21f8c754729$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 9;

-- Day 10: Mark 4:35-5:20 - Christ Over Storm and Darkness
update public.plan_days pd
set
  reading_context = $tnp$Mark now shows Jesus' authority and mercy spreading through Galilee. This reading continues that witness as Jesus calms the sea and frees the Gerasene demoniac.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches the lamp, seed, and mustard seed.$tnp$,
  reading_today_preview = $tnp$Today, Jesus calms the sea and frees the Gerasene demoniac.$tnp$,
  reading_watch_for = $tnp$Notice how fear changes when Jesus' authority is seen clearly.$tnp$,
  reading_key_terms = $tnp$[]$tnp$::jsonb,
  reading_context_source_hash = $tnp$e35d50a93fc8544d8861e2789e0f32db84cac3730973ebe18d59a46f1bbb239b$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 10;

-- Day 11: Mark 5:21-43 - Do Not Fear, Only Believe
update public.plan_days pd
set
  reading_context = $tnp$Mark now shows Jesus' authority and mercy spreading through Galilee. This reading continues that witness as Jesus heals the woman and raises Jairus's daughter.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus calms the sea and frees the Gerasene demoniac.$tnp$,
  reading_today_preview = $tnp$Today, Jesus heals the woman and raises Jairus's daughter.$tnp$,
  reading_watch_for = $tnp$Notice how fear changes when Jesus' authority is seen clearly.$tnp$,
  reading_key_terms = $tnp$[{"term":"faith","definition":"Trusting God and receiving what He reveals."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$5864ff39f00570fe061a4a0157b95a7273b99474adef0f1be124a8dfbf878f16$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 11;

-- Day 12: Mark 6:1-29 - Rejection and Witness
update public.plan_days pd
set
  reading_context = $tnp$Mark now shows Jesus' authority and mercy spreading through Galilee. This reading continues that witness as Jesus is rejected, sends the Twelve, and John is killed.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus heals the woman and raises Jairus's daughter.$tnp$,
  reading_today_preview = $tnp$Today, Jesus is rejected, sends the Twelve, and John is killed.$tnp$,
  reading_watch_for = $tnp$Watch how baptism is joined to identity, mission, and the work of the Holy Spirit.$tnp$,
  reading_key_terms = $tnp$[{"term":"baptism","definition":"The sacrament of new birth in Christ and cleansing from sin."},{"term":"apostle","definition":"One sent by Christ with authority to witness and serve His Church."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$5cf26dd6c59ba56c05a121d660988f728b13b4f2170ad71df821346022dd3357$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 12;

-- Day 13: CCC 422-455 - Christ, the Son of God
update public.plan_days pd
set
  reading_context = $tnp$After Mark has shown Jesus teaching and healing with authority, this Sunday names who He is. The Catechism focuses on Christ, Lord, and Son of God.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus is rejected, sends the Twelve, and John is killed.$tnp$,
  reading_today_preview = $tnp$Today, the Catechism explains the Church's confession that Jesus is the Christ and the Son of God.$tnp$,
  reading_watch_for = $tnp$Watch how the titles of Jesus protect the truth of His identity and mission.$tnp$,
  reading_key_terms = $tnp$[{"term":"Messiah","definition":"The anointed one promised by God and fulfilled in Jesus."},{"term":"Son of God","definition":"Jesus' divine identity as the eternal Son of the Father."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$83866cd5c49aa138ee3e5de2b0e29e691c905627353d3ce9fb2f4b2b12753ccd$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 13;

-- Day 14: Mark 6:30-56 - The Shepherd Feeds His People
update public.plan_days pd
set
  reading_context = $tnp$Mark now shows Jesus' authority and mercy spreading through Galilee. This reading continues that witness as Jesus feeds the five thousand and walks on the sea.$tnp$,
  previous_reading_summary = $tnp$Yesterday's Catechism reading focused on Christ, the Son of God.$tnp$,
  reading_today_preview = $tnp$Today, Jesus feeds the five thousand and walks on the sea.$tnp$,
  reading_watch_for = $tnp$Watch the pattern of gift, thanksgiving, and abundance. It points toward sacramental life.$tnp$,
  reading_key_terms = $tnp$[{"term":"Good Shepherd","definition":"Jesus' image for His pastoral care and self-giving love."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$02f58eec7f4a3c79707836d16ab7dacc3c43112af4d2b5afd0f4a9d4b4a584b2$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 14;

-- Day 15: Mark 7:1-30 - The Heart Before God
update public.plan_days pd
set
  reading_context = $tnp$Mark now shows Jesus' authority and mercy spreading through Galilee. This reading continues that witness as Jesus teaches what defiles and answers the Syrophoenician woman.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus feeds the five thousand and walks on the sea.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches what defiles and answers the Syrophoenician woman.$tnp$,
  reading_watch_for = $tnp$Notice how Jesus moves the question from outward appearance to the heart.$tnp$,
  reading_key_terms = $tnp$[{"term":"faith","definition":"Trusting God and receiving what He reveals."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$88b1d415f372c44f85a297bffe63075994c45051f7e1bac098baf52184ae6c10$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 15;

-- Day 16: Mark 7:31-8:10 - Opened Ears and Shared Bread
update public.plan_days pd
set
  reading_context = $tnp$Mark now shows Jesus' authority and mercy spreading through Galilee. This reading continues that witness as Jesus heals a deaf man and feeds four thousand.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches what defiles and answers the Syrophoenician woman.$tnp$,
  reading_today_preview = $tnp$Today, Jesus heals a deaf man and feeds four thousand.$tnp$,
  reading_watch_for = $tnp$Watch the pattern of gift, thanksgiving, and abundance. It points toward sacramental life.$tnp$,
  reading_key_terms = $tnp$[]$tnp$::jsonb,
  reading_context_source_hash = $tnp$c1f6bcedb0d99e080ba04247d1ce1141318f5e006e6d34d988d4a0685fc0153c$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 16;

-- Day 17: Mark 8:11-38 - Who Do You Say That I Am?
update public.plan_days pd
set
  reading_context = $tnp$Mark turns from public wonder toward discipleship and the Cross. This reading continues that turn as Peter confesses Christ and Jesus teaches the cross.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus heals a deaf man and feeds four thousand.$tnp$,
  reading_today_preview = $tnp$Today, Peter confesses Christ and Jesus teaches the cross.$tnp$,
  reading_watch_for = $tnp$Watch how the Resurrection creates witness, worship, and mission.$tnp$,
  reading_key_terms = $tnp$[{"term":"crucifixion","definition":"Jesus' death on the cross, offered in obedience and love."},{"term":"Resurrection","definition":"Jesus' rising from the dead in His glorified body."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$b92b9ff91b67d2d3a60fe297f425f729d392544ca4d36f133e3da1100732f0c6$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 17;

-- Day 18: Mark 9:1-29 - Glory and Faith
update public.plan_days pd
set
  reading_context = $tnp$Mark turns from public wonder toward discipleship and the Cross. This reading continues that turn as Jesus is transfigured and heals a suffering boy.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Peter confesses Christ and Jesus teaches the cross.$tnp$,
  reading_today_preview = $tnp$Today, Jesus is transfigured and heals a suffering boy.$tnp$,
  reading_watch_for = $tnp$Watch how the Holy Spirit is promised as the gift who strengthens and teaches the Church.$tnp$,
  reading_key_terms = $tnp$[{"term":"Holy Spirit","definition":"The third Person of the Trinity, given by the Father and the Son."},{"term":"faith","definition":"Trusting God and receiving what He reveals."},{"term":"Passion","definition":"The suffering and death Jesus freely accepts for our salvation."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$f57d55799abed1f735ba2d6b0eb3aca1f38b77894b787b15ef47c145e9275589$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 18;

-- Day 19: Mark 9:30-50 - The Way of Humility
update public.plan_days pd
set
  reading_context = $tnp$Mark turns from public wonder toward discipleship and the Cross. This reading continues that turn as Jesus teaches greatness, service, and resistance to sin.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus is transfigured and heals a suffering boy.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches greatness, service, and resistance to sin.$tnp$,
  reading_watch_for = $tnp$Watch how the Resurrection creates witness, worship, and mission.$tnp$,
  reading_key_terms = $tnp$[{"term":"Resurrection","definition":"Jesus' rising from the dead in His glorified body."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$f77fa246f84a12bf4b27474f7d160e97a46d1bcc656852f7f64ec3617639e20d$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 19;

-- Day 20: CCC 456-483 - The Incarnation
update public.plan_days pd
set
  reading_context = $tnp$Mark has begun to reveal both the glory and the humility of Jesus. This Sunday pauses to contemplate the mystery that the Son of God truly became man.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches greatness, service, and resistance to sin.$tnp$,
  reading_today_preview = $tnp$Today, the Catechism considers the Incarnation and why the Son of God became man for our salvation.$tnp$,
  reading_watch_for = $tnp$Notice that Catholic faith holds together Christ's true divinity and true humanity.$tnp$,
  reading_key_terms = $tnp$[{"term":"Incarnation","definition":"The eternal Son of God taking on human flesh."},{"term":"Son of God","definition":"Jesus' divine identity as the eternal Son of the Father."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$877855ddc19a2f78fedc46156ea6e96bbc4156d70f4dfef861a0a981e41cc30e$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 20;

-- Day 21: Mark 10:1-31 - Receiving the Kingdom
update public.plan_days pd
set
  reading_context = $tnp$Mark turns from public wonder toward discipleship and the Cross. This reading continues that turn as Jesus teaches on marriage, children, and riches.$tnp$,
  previous_reading_summary = $tnp$Yesterday's Catechism reading focused on the Incarnation.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches on marriage, children, and riches.$tnp$,
  reading_watch_for = $tnp$Watch how Jesus receives the vulnerable and asks freedom from divided loves.$tnp$,
  reading_key_terms = $tnp$[{"term":"Kingdom of God","definition":"God's saving reign, present in Christ and coming to fulfillment."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$5d751ae3914183b012c309ca31b9c114a418497b6112bc4109de142ed55d2a19$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 21;

-- Day 22: Mark 10:32-52 - The Son of Man Serves
update public.plan_days pd
set
  reading_context = $tnp$Mark turns from public wonder toward discipleship and the Cross. This reading continues that turn as Jesus teaches servant love and heals Bartimaeus.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches on marriage, children, and riches.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches servant love and heals Bartimaeus.$tnp$,
  reading_watch_for = $tnp$Watch how the Resurrection creates witness, worship, and mission.$tnp$,
  reading_key_terms = $tnp$[{"term":"Son of Man","definition":"A title Jesus uses that points to His authority, suffering, and glory."},{"term":"Resurrection","definition":"Jesus' rising from the dead in His glorified body."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$53f7949f9efa8c8f024ccf1f8b4498c4a605f145aae327a1b6586447108a6570$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 22;

-- Day 23: Mark 11:1-33 - The King Enters Jerusalem
update public.plan_days pd
set
  reading_context = $tnp$Mark brings Jesus to Jerusalem and into His Passion. This reading continues that final stretch as Jesus enters Jerusalem, cleanses the temple, and faces questions about His authority.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches servant love and heals Bartimaeus.$tnp$,
  reading_today_preview = $tnp$Today, Jesus enters Jerusalem, cleanses the temple, and faces questions about His authority.$tnp$,
  reading_watch_for = $tnp$Notice how Jesus' authority reaches worship, the temple, and the leaders' questions.$tnp$,
  reading_key_terms = $tnp$[{"term":"temple","definition":"The holy place of worship in Jerusalem, where Israel offered sacrifice."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$ec8c14f03c73814a9f2594cf4f8324f66abcfdb894524630a5d3189e04901688$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 23;

-- Day 24: Mark 12:1-44 - Teaching in the Temple
update public.plan_days pd
set
  reading_context = $tnp$Mark brings Jesus to Jerusalem and into His Passion. This reading continues that final stretch as Jesus teaches in the temple, answers challenges, and notices the widow's offering.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus enters Jerusalem, cleanses the temple, and faces questions about His authority.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches in the temple, answers challenges, and notices the widow's offering.$tnp$,
  reading_watch_for = $tnp$Watch how the Resurrection creates witness, worship, and mission.$tnp$,
  reading_key_terms = $tnp$[{"term":"parable","definition":"A short teaching story that reveals the Kingdom through familiar images."},{"term":"temple","definition":"The holy place of worship in Jerusalem, where Israel offered sacrifice."},{"term":"Resurrection","definition":"Jesus' rising from the dead in His glorified body."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$c3f42491709a76816c01e0a659521f5c05539116d00176ffbd779c1a6b39cb7b$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 24;

-- Day 25: Mark 13:1-37 - Watch and Be Faithful
update public.plan_days pd
set
  reading_context = $tnp$Mark brings Jesus to Jerusalem and into His Passion. This reading continues that final stretch as Jesus teaches endurance and watchfulness.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches in the temple, answers challenges, and notices the widow's offering.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches endurance and watchfulness.$tnp$,
  reading_watch_for = $tnp$Notice how Jesus' authority reaches worship, the temple, and the leaders' questions.$tnp$,
  reading_key_terms = $tnp$[{"term":"Son of Man","definition":"A title Jesus uses that points to His authority, suffering, and glory."},{"term":"temple","definition":"The holy place of worship in Jerusalem, where Israel offered sacrifice."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$907366ac692068dbc6bd07f18c2b3c33d23c1a44f7ce5ca48854e7c5b43f6526$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 25;

-- Day 26: Mark 14:1-49 - The Supper, Garden, and Arrest
update public.plan_days pd
set
  reading_context = $tnp$Mark brings Jesus to Jerusalem and into His Passion. This reading continues that final stretch as Jesus is anointed, gives the supper, prays, and is betrayed.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches endurance and watchfulness.$tnp$,
  reading_today_preview = $tnp$Today, Jesus is anointed, gives the supper, prays, and is betrayed.$tnp$,
  reading_watch_for = $tnp$Stay close to Jesus' obedience and silence as He freely enters His Passion.$tnp$,
  reading_key_terms = $tnp$[{"term":"Passover","definition":"Israel's feast of deliverance, fulfilled by Christ in His Passion."},{"term":"Passion","definition":"The suffering and death Jesus freely accepts for our salvation."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$4dda82a9e3f270a384165087567ef0967d0f29b7916ace02fde79bb8ebe75abb$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 26;

-- Day 27: CCC 484-511 - Mary and the Annunciation
update public.plan_days pd
set
  reading_context = $tnp$Before the season moves from Mark's Passion into Matthew, this Sunday turns to Mary's yes. The Catechism shows how the Annunciation belongs to the mystery of Christ.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus is anointed, gives the supper, prays, and is betrayed.$tnp$,
  reading_today_preview = $tnp$Today, the Catechism considers Mary, the Annunciation, and her free consent to God's saving plan.$tnp$,
  reading_watch_for = $tnp$Notice Mary's faith. Her yes receives the Savior rather than controlling the gift.$tnp$,
  reading_key_terms = $tnp$[{"term":"Mary","definition":"The Mother of Jesus and model disciple."},{"term":"Incarnation","definition":"The eternal Son of God taking on human flesh."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$f43cd92f33ad916f61707d6382c8b987f91f44480cdda737201c9dd84b4d77b2$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 27;

-- Day 28: Mark 14:50-15:20 - Condemned and Mocked
update public.plan_days pd
set
  reading_context = $tnp$Mark brings Jesus to Jerusalem and into His Passion. This reading continues that final stretch as Jesus is abandoned, tried, denied, condemned, and mocked.$tnp$,
  previous_reading_summary = $tnp$Yesterday's Catechism reading focused on Mary and the Annunciation.$tnp$,
  reading_today_preview = $tnp$Today, Jesus is abandoned, tried, denied, condemned, and mocked.$tnp$,
  reading_watch_for = $tnp$Stay close to Jesus' obedience and silence as He freely enters His Passion.$tnp$,
  reading_key_terms = $tnp$[{"term":"Passion","definition":"The suffering and death Jesus freely accepts for our salvation."},{"term":"crucifixion","definition":"Jesus' death on the cross, offered in obedience and love."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$c6ba657bc2a8eeaee797f9dc1a3c5fb4822c254c70d9beb81698145754c8bb08$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 28;

-- Day 29: Mark 15:21-16:20 - Crucified and Raised
update public.plan_days pd
set
  reading_context = $tnp$Mark brings Jesus to Jerusalem and into His Passion. This reading continues that final stretch as Jesus is crucified, dies, is buried, and the Resurrection is announced.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus is abandoned, tried, denied, condemned, and mocked.$tnp$,
  reading_today_preview = $tnp$Today, Jesus is crucified, dies, is buried, and the Resurrection is announced.$tnp$,
  reading_watch_for = $tnp$Watch how the Resurrection creates witness, worship, and mission.$tnp$,
  reading_key_terms = $tnp$[{"term":"crucifixion","definition":"Jesus' death on the cross, offered in obedience and love."},{"term":"Resurrection","definition":"Jesus' rising from the dead in His glorified body."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$f59d1f81fa5da83c09559aa5e5b3e63754e5cc851948f49e00031756dea7cac1$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 29;

-- Day 30: Matthew 1:1-17 - The Son of David
update public.plan_days pd
set
  reading_context = $tnp$Matthew begins again at Israel's story, naming Jesus as son of David and son of Abraham. After finishing Mark, the season turns to another Gospel witness to the same Christ.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus is crucified, dies, is buried, and the Resurrection is announced.$tnp$,
  reading_today_preview = $tnp$Today, Matthew traces Jesus' genealogy and shows that God's promises move through real families and history.$tnp$,
  reading_watch_for = $tnp$Notice the names Matthew includes. The Messiah comes through Israel's story, with mercy visible even in a wounded family line.$tnp$,
  reading_key_terms = $tnp$[{"term":"Messiah","definition":"The anointed one promised by God and fulfilled in Jesus."},{"term":"son of David","definition":"A royal title showing Jesus as heir to David's promised kingdom."},{"term":"genealogy","definition":"A family line that shows how God's promises move through history."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$5b8d1c592cd7c11e81aa5d313b0bd957cfadf441cfe74e574699b7c27cbe5918$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 30;

-- Day 31: Matthew 1:18-25 - God With Us
update public.plan_days pd
set
  reading_context = $tnp$Matthew opens with infancy, fulfillment, and the beginning of Jesus' public mission. This reading continues that foundation as Joseph receives the angel's message and obeys.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Matthew begins with Jesus' genealogy.$tnp$,
  reading_today_preview = $tnp$Today, Joseph receives the angel's message and obeys.$tnp$,
  reading_watch_for = $tnp$Notice how the child Jesus is received, protected, and revealed as God with us.$tnp$,
  reading_key_terms = $tnp$[{"term":"Incarnation","definition":"The eternal Son of God taking on human flesh."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$9ad176a33d77a6ff99883ca009edcd04b02020beffdf93755b2979ef2c07c2d7$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 31;

-- Day 32: Matthew 2:1-23 - The Child King
update public.plan_days pd
set
  reading_context = $tnp$Matthew opens with infancy, fulfillment, and the beginning of Jesus' public mission. This reading continues that foundation as the magi worship Jesus and the Holy Family is protected.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Joseph receives the angel's message and obeys.$tnp$,
  reading_today_preview = $tnp$Today, the magi worship Jesus and the Holy Family is protected.$tnp$,
  reading_watch_for = $tnp$Notice how the child Jesus is received, protected, and revealed as God with us.$tnp$,
  reading_key_terms = $tnp$[{"term":"Incarnation","definition":"The eternal Son of God taking on human flesh."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$13ae008d2dfeadfcbda43766e74a8ffd689e0a759026b02e126e75e3911b69ab$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 32;

-- Day 33: Matthew 3:1-17 - The Beloved Son
update public.plan_days pd
set
  reading_context = $tnp$Matthew opens with infancy, fulfillment, and the beginning of Jesus' public mission. This reading continues that foundation as John prepares the way and Jesus is baptized.$tnp$,
  previous_reading_summary = $tnp$Yesterday, the magi worship Jesus and the Holy Family is protected.$tnp$,
  reading_today_preview = $tnp$Today, John prepares the way and Jesus is baptized.$tnp$,
  reading_watch_for = $tnp$Watch how baptism is joined to identity, mission, and the work of the Holy Spirit.$tnp$,
  reading_key_terms = $tnp$[{"term":"baptism","definition":"The sacrament of new birth in Christ and cleansing from sin."},{"term":"Son of God","definition":"Jesus' divine identity as the eternal Son of the Father."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$480c71af46d6b04cb1668dc160bb557e794960f3abcbd1760ed6a1066ab2b65e$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 33;

-- Day 34: CCC 535-540 - Baptism, Temptation, and Mission
update public.plan_days pd
set
  reading_context = $tnp$Matthew has introduced Jesus as Emmanuel and beloved Son. This Sunday gathers the meaning of His baptism, temptation, and public mission.$tnp$,
  previous_reading_summary = $tnp$Yesterday, John prepares the way and Jesus is baptized.$tnp$,
  reading_today_preview = $tnp$Today, the Catechism considers Jesus' baptism, His temptation, and the beginning of His mission.$tnp$,
  reading_watch_for = $tnp$Watch how Jesus enters the waters and the wilderness in solidarity with sinners.$tnp$,
  reading_key_terms = $tnp$[{"term":"baptism","definition":"The sacrament of new birth in Christ and cleansing from sin."},{"term":"Son of God","definition":"Jesus' divine identity as the eternal Son of the Father."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$a30e6f7302b8c371add1bdff3b4c51d0346a3ae082b285426043bf056315e6a1$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 34;

-- Day 35: Matthew 4:1-25 - Tested and Sent
update public.plan_days pd
set
  reading_context = $tnp$Matthew opens with infancy, fulfillment, and the beginning of Jesus' public mission. This reading continues that foundation as Jesus is tempted, preaches, calls disciples, and heals.$tnp$,
  previous_reading_summary = $tnp$Yesterday's Catechism reading focused on Baptism, Temptation, and Mission.$tnp$,
  reading_today_preview = $tnp$Today, Jesus is tempted, preaches, calls disciples, and heals.$tnp$,
  reading_watch_for = $tnp$Notice how testing reveals trust, obedience, and the Father's care.$tnp$,
  reading_key_terms = $tnp$[]$tnp$::jsonb,
  reading_context_source_hash = $tnp$2c82f5b326e5a03dc70dae670f4a2ded130b16a6697f1e69b813a1b10ede8120$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 35;

-- Day 36: Matthew 5:1-20 - The Blessed Life
update public.plan_days pd
set
  reading_context = $tnp$Matthew is showing Jesus as teacher of the Kingdom in word and deed. This reading continues that teaching as Jesus begins the Sermon on the Mount.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus is tempted, preaches, calls disciples, and heals.$tnp$,
  reading_today_preview = $tnp$Today, Jesus begins the Sermon on the Mount.$tnp$,
  reading_watch_for = $tnp$Notice the contrast between physical sight and the deeper sight of faith.$tnp$,
  reading_key_terms = $tnp$[]$tnp$::jsonb,
  reading_context_source_hash = $tnp$9481ceade9f9a0020e3c3f0efe45a74a18b62062e6da0658d44a2749b9666f0d$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 36;

-- Day 37: Matthew 5:21-48 - A Deeper Righteousness
update public.plan_days pd
set
  reading_context = $tnp$Matthew is showing Jesus as teacher of the Kingdom in word and deed. This reading continues that teaching as Jesus teaches conversion of the heart.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus begins the Sermon on the Mount.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches conversion of the heart.$tnp$,
  reading_watch_for = $tnp$Notice how Jesus moves the question from outward appearance to the heart.$tnp$,
  reading_key_terms = $tnp$[{"term":"conversion","definition":"A real turning of heart and life toward God."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$fdc117b196cc24befbbe6cf0cf8d1fcb1a0d02b3ba251c3d94a6477564dae5b6$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 37;

-- Day 38: Matthew 6:1-18 - Prayer Before the Father
update public.plan_days pd
set
  reading_context = $tnp$Matthew is showing Jesus as teacher of the Kingdom in word and deed. This reading continues that teaching as Jesus teaches almsgiving, prayer, fasting, and the Our Father.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches conversion of the heart.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches almsgiving, prayer, fasting, and the Our Father.$tnp$,
  reading_watch_for = $tnp$Watch how Jesus reveals the purpose of worship, mercy, and holy rest.$tnp$,
  reading_key_terms = $tnp$[{"term":"Our Father","definition":"The prayer Jesus teaches His disciples to pray to the Father."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$30e83935b0a4aacb355b440246e6f5585da3757fc2a1285d70fa1b21f0efcfdd$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 38;

-- Day 39: Matthew 6:19-34 - Trusting the Father
update public.plan_days pd
set
  reading_context = $tnp$Matthew is showing Jesus as teacher of the Kingdom in word and deed. This reading continues that teaching as Jesus teaches treasure in heaven and freedom from anxiety.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches almsgiving, prayer, fasting, and the Our Father.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches treasure in heaven and freedom from anxiety.$tnp$,
  reading_watch_for = $tnp$Watch how Jesus receives the vulnerable and asks freedom from divided loves.$tnp$,
  reading_key_terms = $tnp$[]$tnp$::jsonb,
  reading_context_source_hash = $tnp$ad28b3d8d57a85b66dd14436fbf2170287848d786f38eb29e086b26155d569f5$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 39;

-- Day 40: Matthew 7:1-29 - Build on the Rock
update public.plan_days pd
set
  reading_context = $tnp$Matthew is showing Jesus as teacher of the Kingdom in word and deed. This reading continues that teaching as Jesus concludes the Sermon with obedience and trust.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches treasure in heaven and freedom from anxiety.$tnp$,
  reading_today_preview = $tnp$Today, Jesus concludes the Sermon with obedience and trust.$tnp$,
  reading_watch_for = $tnp$Notice that hearing Jesus is meant to become obedience, not admiration alone.$tnp$,
  reading_key_terms = $tnp$[]$tnp$::jsonb,
  reading_context_source_hash = $tnp$e4c8d2d618861ef8c478738403b1663001917d488c6f376cbb32cac6c3fb151b$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 40;

-- Day 41: CCC 541-546 - The Kingdom of God
update public.plan_days pd
set
  reading_context = $tnp$After the Sermon on the Mount, this Sunday names the Kingdom Jesus has been announcing. The Catechism frames His call to conversion and mercy.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus concludes the Sermon with obedience and trust.$tnp$,
  reading_today_preview = $tnp$Today, the Catechism considers the Kingdom of God and Christ's call to sinners.$tnp$,
  reading_watch_for = $tnp$Notice that the Kingdom is not an idea first. It is present in Jesus Himself.$tnp$,
  reading_key_terms = $tnp$[{"term":"Kingdom of God","definition":"God's saving reign, present in Christ and coming to fulfillment."},{"term":"conversion","definition":"A real turning of heart and life toward God."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$8d74fed0abd36b232f3eacbb11da438052f3ec7276d1d6af5a01761461c9326b$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 41;

-- Day 42: Matthew 8:1-17 - He Took Our Infirmities
update public.plan_days pd
set
  reading_context = $tnp$Matthew is showing Jesus as teacher of the Kingdom in word and deed. This reading continues that teaching as Jesus heals the leper, the servant, and many others.$tnp$,
  previous_reading_summary = $tnp$Yesterday's Catechism reading focused on the Kingdom of God.$tnp$,
  reading_today_preview = $tnp$Today, Jesus heals the leper, the servant, and many others.$tnp$,
  reading_watch_for = $tnp$Watch how mercy restores real people without pretending sin is harmless.$tnp$,
  reading_key_terms = $tnp$[]$tnp$::jsonb,
  reading_context_source_hash = $tnp$399d93555adc95dc6207c8e2805e95e17deccdb62f3826bca637dbff8ec1de4a$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 42;

-- Day 43: Matthew 8:18-9:8 - Following the Lord of Mercy
update public.plan_days pd
set
  reading_context = $tnp$Matthew is showing Jesus as teacher of the Kingdom in word and deed. This reading continues that teaching as Jesus teaches the cost of following and forgives the paralytic.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus heals the leper, the servant, and many others.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches the cost of following and forgives the paralytic.$tnp$,
  reading_watch_for = $tnp$Watch how mercy restores real people without pretending sin is harmless.$tnp$,
  reading_key_terms = $tnp$[{"term":"mercy","definition":"God's faithful love toward sinners, the suffering, and the lost."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$557570b371006149c02bc70dfedbfabd41fc1d24ed6761d8622552add531f5f1$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 43;

-- Day 44: Matthew 9:9-38 - Mercy and the Harvest
update public.plan_days pd
set
  reading_context = $tnp$Matthew is showing Jesus as teacher of the Kingdom in word and deed. This reading continues that teaching as Jesus calls Matthew and sees the crowds with compassion.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches the cost of following and forgives the paralytic.$tnp$,
  reading_today_preview = $tnp$Today, Jesus calls Matthew and sees the crowds with compassion.$tnp$,
  reading_watch_for = $tnp$Stay close to Jesus' obedience and silence as He freely enters His Passion.$tnp$,
  reading_key_terms = $tnp$[{"term":"mercy","definition":"God's faithful love toward sinners, the suffering, and the lost."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$804268ee16b2c0a4a3cbcb4e351fbd3ea9770570c254df20c878348d83669a6f$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 44;

-- Day 45: Matthew 10:1-23 - The Twelve Are Sent
update public.plan_days pd
set
  reading_context = $tnp$Matthew now emphasizes mission, parables, and mercy. This reading continues that movement as Jesus names the Twelve and sends them to Israel.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus calls Matthew and sees the crowds with compassion.$tnp$,
  reading_today_preview = $tnp$Today, Jesus names the Twelve and sends them to Israel.$tnp$,
  reading_watch_for = $tnp$Notice that disciples are called to be with Jesus before they are sent.$tnp$,
  reading_key_terms = $tnp$[{"term":"disciple","definition":"One who follows Jesus, learns from Him, and lives under His teaching."},{"term":"apostle","definition":"One sent by Christ with authority to witness and serve His Church."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$21b92ac7669491d2548bf5eb6cd987340255453468347ca520a449cadd123c5b$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 45;

-- Day 46: Matthew 10:24-42 - Courage in Witness
update public.plan_days pd
set
  reading_context = $tnp$Matthew now emphasizes mission, parables, and mercy. This reading continues that movement as Jesus teaches the cost and courage of discipleship.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus names the Twelve and sends them to Israel.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches the cost and courage of discipleship.$tnp$,
  reading_watch_for = $tnp$Stay close to Jesus' obedience and silence as He freely enters His Passion.$tnp$,
  reading_key_terms = $tnp$[{"term":"disciple","definition":"One who follows Jesus, learns from Him, and lives under His teaching."},{"term":"crucifixion","definition":"Jesus' death on the cross, offered in obedience and love."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$e9544f248bbe06da0bd5350d3dbdd0bd9e577d2583e949ed298dc2bb08d2864e$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 46;

-- Day 47: Matthew 11:1-30 - Come to Me
update public.plan_days pd
set
  reading_context = $tnp$Matthew now emphasizes mission, parables, and mercy. This reading continues that movement as Jesus answers John's disciples and invites the burdened to rest.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches the cost and courage of discipleship.$tnp$,
  reading_today_preview = $tnp$Today, Jesus answers John's disciples and invites the burdened to rest.$tnp$,
  reading_watch_for = $tnp$Watch how baptism is joined to identity, mission, and the work of the Holy Spirit.$tnp$,
  reading_key_terms = $tnp$[{"term":"repentance","definition":"Turning away from sin and back toward God."},{"term":"baptism","definition":"The sacrament of new birth in Christ and cleansing from sin."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$707db394c9713e0153eb6ba44312dda54c7cc0c60881eddf9a13e21a969b9788$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 47;

-- Day 48: CCC 547-550 - Miracles and Signs of the Kingdom
update public.plan_days pd
set
  reading_context = $tnp$Matthew has shown Jesus healing and teaching with authority. This Sunday looks at miracles as signs that the Kingdom is truly present in Him.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus answers John's disciples and invites the burdened to rest.$tnp$,
  reading_today_preview = $tnp$Today, the Catechism considers Christ's miracles and signs of the Kingdom.$tnp$,
  reading_watch_for = $tnp$Watch how signs point beyond amazement toward faith in Christ.$tnp$,
  reading_key_terms = $tnp$[{"term":"Kingdom of God","definition":"God's saving reign, present in Christ and coming to fulfillment."},{"term":"faith","definition":"Trusting God and receiving what He reveals."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$f800995cb9970d06d8b3062e989e852548055262adb368a2a3c03b892e6d55da$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 48;

-- Day 49: Matthew 12:1-21 - Mercy on the Sabbath
update public.plan_days pd
set
  reading_context = $tnp$Matthew now emphasizes mission, parables, and mercy. This reading continues that movement as Jesus answers Sabbath accusations and fulfills the servant prophecy.$tnp$,
  previous_reading_summary = $tnp$Yesterday's Catechism reading focused on Miracles and Signs of the Kingdom.$tnp$,
  reading_today_preview = $tnp$Today, Jesus answers Sabbath accusations and fulfills the servant prophecy.$tnp$,
  reading_watch_for = $tnp$Watch how mercy restores real people without pretending sin is harmless.$tnp$,
  reading_key_terms = $tnp$[{"term":"Sabbath","definition":"The holy day of rest and worship given to Israel by God."},{"term":"mercy","definition":"God's faithful love toward sinners, the suffering, and the lost."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$189ad238653bc47a63720c447f3517174d9d24e7982e3f241ef75e11e9f985c5$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 49;

-- Day 50: Matthew 12:22-50 - The Sign and the Family
update public.plan_days pd
set
  reading_context = $tnp$Matthew now emphasizes mission, parables, and mercy. This reading continues that movement as Jesus warns about the heart and names His true family.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus answers Sabbath accusations and fulfills the servant prophecy.$tnp$,
  reading_today_preview = $tnp$Today, Jesus warns about the heart and names His true family.$tnp$,
  reading_watch_for = $tnp$Watch how mercy restores real people without pretending sin is harmless.$tnp$,
  reading_key_terms = $tnp$[{"term":"Holy Spirit","definition":"The third Person of the Trinity, given by the Father and the Son."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$c047826686a36b7f2d98de2355c6b26a9aaaccf5fe0c1d9c9be984738f0c59d3$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 50;

-- Day 51: Matthew 13:1-23 - The Word Sown
update public.plan_days pd
set
  reading_context = $tnp$Matthew now emphasizes mission, parables, and mercy. This reading continues that movement as Jesus tells and explains the parable of the sower.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus warns about the heart and names His true family.$tnp$,
  reading_today_preview = $tnp$Today, Jesus tells and explains the parable of the sower.$tnp$,
  reading_watch_for = $tnp$Notice the concrete images Jesus uses to reveal the Kingdom.$tnp$,
  reading_key_terms = $tnp$[{"term":"parable","definition":"A short teaching story that reveals the Kingdom through familiar images."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$e4794b30d973b56c515ede5746fae13a95be36b3bcf619b838837559bb9b4717$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 51;

-- Day 52: Matthew 13:24-52 - The Kingdom in Parables
update public.plan_days pd
set
  reading_context = $tnp$Matthew now emphasizes mission, parables, and mercy. This reading continues that movement as Jesus teaches wheat and weeds, treasure, pearl, and net.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus tells and explains the parable of the sower.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches wheat and weeds, treasure, pearl, and net.$tnp$,
  reading_watch_for = $tnp$Notice the concrete images Jesus uses to reveal the Kingdom.$tnp$,
  reading_key_terms = $tnp$[{"term":"Kingdom of God","definition":"God's saving reign, present in Christ and coming to fulfillment."},{"term":"parable","definition":"A short teaching story that reveals the Kingdom through familiar images."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$d4819818939afd57a8ef9dacb9be4a35a9a46e483259a1d3dfc5147f7727c160$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 52;

-- Day 53: Matthew 13:53-14:21 - Rejected, Then Moved With Compassion
update public.plan_days pd
set
  reading_context = $tnp$Matthew now emphasizes mission, parables, and mercy. This reading continues that movement as Nazareth rejects Jesus, John dies, and Jesus feeds the crowd.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches wheat and weeds, treasure, pearl, and net.$tnp$,
  reading_today_preview = $tnp$Today, Nazareth rejects Jesus, John dies, and Jesus feeds the crowd.$tnp$,
  reading_watch_for = $tnp$Stay close to Jesus' obedience and silence as He freely enters His Passion.$tnp$,
  reading_key_terms = $tnp$[{"term":"baptism","definition":"The sacrament of new birth in Christ and cleansing from sin."},{"term":"mercy","definition":"God's faithful love toward sinners, the suffering, and the lost."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$380eea6701d9e86104cb73866c492f07f28eec6160a1e82fa0e520b8a6a73a7d$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 53;

-- Day 54: Matthew 14:22-15:20 - Faith, Fear, and the Heart
update public.plan_days pd
set
  reading_context = $tnp$Matthew now emphasizes mission, parables, and mercy. This reading continues that movement as Jesus walks on the sea and teaches what truly defiles.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Nazareth rejects Jesus, John dies, and Jesus feeds the crowd.$tnp$,
  reading_today_preview = $tnp$Today, Jesus walks on the sea and teaches what truly defiles.$tnp$,
  reading_watch_for = $tnp$Notice how fear changes when Jesus' authority is seen clearly.$tnp$,
  reading_key_terms = $tnp$[{"term":"faith","definition":"Trusting God and receiving what He reveals."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$ac5056f8d84cfd50d19cffebf2578bc18e9d89c318c6d10e91b39fe339c7432c$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 54;

-- Day 55: CCC 551-553 - The Disciples and the Twelve
update public.plan_days pd
set
  reading_context = $tnp$As Matthew turns toward confession, correction, and mission, this Sunday focuses on the disciples and the Twelve. The Catechism shows that Jesus forms a people around Himself.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus walks on the sea and teaches what truly defiles.$tnp$,
  reading_today_preview = $tnp$Today, the Catechism considers the disciples, the Twelve, and their share in Christ's mission.$tnp$,
  reading_watch_for = $tnp$Notice that Jesus gathers and sends real men, not an abstract movement.$tnp$,
  reading_key_terms = $tnp$[{"term":"disciple","definition":"One who follows Jesus, learns from Him, and lives under His teaching."},{"term":"apostle","definition":"One sent by Christ with authority to witness and serve His Church."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$7c96d531c8a19c0b2f2851f8bef8fd6cb8d84a59a58cc3a91fce9835a679fabb$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 55;

-- Day 56: Matthew 15:21-39 - Mercy for the Nations
update public.plan_days pd
set
  reading_context = $tnp$Matthew now emphasizes mission, parables, and mercy. This reading continues that movement as Jesus answers the Canaanite woman and feeds four thousand.$tnp$,
  previous_reading_summary = $tnp$Yesterday's Catechism reading focused on the Disciples and the Twelve.$tnp$,
  reading_today_preview = $tnp$Today, Jesus answers the Canaanite woman and feeds four thousand.$tnp$,
  reading_watch_for = $tnp$Watch how mercy restores real people without pretending sin is harmless.$tnp$,
  reading_key_terms = $tnp$[{"term":"faith","definition":"Trusting God and receiving what He reveals."},{"term":"mercy","definition":"God's faithful love toward sinners, the suffering, and the lost."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$ab7e935de8bb94def9731f95592efe14cdbaf787735f8e7b95cbc92c918bd22b$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 56;

-- Day 57: Matthew 16:1-28 - The Christ and His Church
update public.plan_days pd
set
  reading_context = $tnp$Matthew turns toward confession, the Church, forgiveness, and the cost of following Christ. This reading continues that formation as Peter confesses Jesus and receives the keys.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus answers the Canaanite woman and feeds four thousand.$tnp$,
  reading_today_preview = $tnp$Today, Peter confesses Jesus and receives the keys.$tnp$,
  reading_watch_for = $tnp$Watch how the Resurrection creates witness, worship, and mission.$tnp$,
  reading_key_terms = $tnp$[{"term":"crucifixion","definition":"Jesus' death on the cross, offered in obedience and love."},{"term":"Resurrection","definition":"Jesus' rising from the dead in His glorified body."},{"term":"Church","definition":"The people Christ gathers into His Body through faith and the sacraments."},{"term":"keys","definition":"The sign of authority Christ gives to Peter for service in the Church."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$aa90ffa22e1da6f824380ce809acc8e6eaa71143cead314773a691570fdb0be6$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 57;

-- Day 58: Matthew 17:1-27 - Listen to Him
update public.plan_days pd
set
  reading_context = $tnp$Matthew turns toward confession, the Church, forgiveness, and the cost of following Christ. This reading continues that formation as Jesus is transfigured and continues toward the Passion.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Peter confesses Jesus and receives the keys.$tnp$,
  reading_today_preview = $tnp$Today, Jesus is transfigured and continues toward the Passion.$tnp$,
  reading_watch_for = $tnp$Watch how the Resurrection creates witness, worship, and mission.$tnp$,
  reading_key_terms = $tnp$[{"term":"temple","definition":"The holy place of worship in Jerusalem, where Israel offered sacrifice."},{"term":"Passion","definition":"The suffering and death Jesus freely accepts for our salvation."},{"term":"Resurrection","definition":"Jesus' rising from the dead in His glorified body."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$4c255863179c4acab59bff413a2e0e8517f2ac17f39a9351e52f95b94da181e4$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 58;

-- Day 59: Matthew 18:1-20 - Life in the Church
update public.plan_days pd
set
  reading_context = $tnp$Matthew turns toward confession, the Church, forgiveness, and the cost of following Christ. This reading continues that formation as Jesus teaches humility, care, correction, and prayer together.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus is transfigured and continues toward the Passion.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches humility, care, correction, and prayer together.$tnp$,
  reading_watch_for = $tnp$Notice how testing reveals trust, obedience, and the Father's care.$tnp$,
  reading_key_terms = $tnp$[{"term":"parable","definition":"A short teaching story that reveals the Kingdom through familiar images."},{"term":"Church","definition":"The people Christ gathers into His Body through faith and the sacraments."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$e725a3104258d36096154d56a295ec8d474294af15f785158f7a9caa340704ea$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 59;

-- Day 60: Matthew 18:21-19:15 - Forgiveness and Faithfulness
update public.plan_days pd
set
  reading_context = $tnp$Matthew turns toward confession, the Church, forgiveness, and the cost of following Christ. This reading continues that formation as Jesus teaches forgiveness, marriage, and welcomes children.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches humility, care, correction, and prayer together.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches forgiveness, marriage, and welcomes children.$tnp$,
  reading_watch_for = $tnp$Notice the concrete images Jesus uses to reveal the Kingdom.$tnp$,
  reading_key_terms = $tnp$[{"term":"parable","definition":"A short teaching story that reveals the Kingdom through familiar images."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$0cb4d56dee77f6c6014466a9ff8a99f38c9b14a035eb643693b23d84b9cda549$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 60;

-- Day 61: Matthew 19:16-20:16 - Treasure in Heaven
update public.plan_days pd
set
  reading_context = $tnp$Matthew turns toward confession, the Church, forgiveness, and the cost of following Christ. This reading continues that formation as Jesus meets the rich young man and teaches generous grace.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches forgiveness, marriage, and welcomes children.$tnp$,
  reading_today_preview = $tnp$Today, Jesus meets the rich young man and teaches generous grace.$tnp$,
  reading_watch_for = $tnp$Notice the concrete images Jesus uses to reveal the Kingdom.$tnp$,
  reading_key_terms = $tnp$[]$tnp$::jsonb,
  reading_context_source_hash = $tnp$131a033ea4ca18650b5844e6cc5aed15ee0ca5ea3a603fcd2c0466afd20399f8$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 61;

-- Day 62: CCC 552-553; 880-887 - Peter, the Keys, and the Church
update public.plan_days pd
set
  reading_context = $tnp$Matthew has brought us to Peter's confession and the keys. This Sunday considers Peter's office and the Church Christ builds.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus meets the rich young man and teaches generous grace.$tnp$,
  reading_today_preview = $tnp$Today, the Catechism considers Peter, the keys, and the Church's visible unity.$tnp$,
  reading_watch_for = $tnp$Watch how authority is given for service, faith, and unity in the Church.$tnp$,
  reading_key_terms = $tnp$[{"term":"Church","definition":"The people Christ gathers into His Body through faith and the sacraments."},{"term":"apostle","definition":"One sent by Christ with authority to witness and serve His Church."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$6110a878fcd7fb8eda7ab69dff8918a218537c11332cb31a9a4807601cc50909$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 62;

-- Day 63: Matthew 20:17-34 - The Cup and the Servant
update public.plan_days pd
set
  reading_context = $tnp$Matthew turns toward confession, the Church, forgiveness, and the cost of following Christ. This reading continues that formation as Jesus foretells His Passion and heals two blind men.$tnp$,
  previous_reading_summary = $tnp$Yesterday's Catechism reading focused on Peter, the Keys, and the Church.$tnp$,
  reading_today_preview = $tnp$Today, Jesus foretells His Passion and heals two blind men.$tnp$,
  reading_watch_for = $tnp$Watch how the Resurrection creates witness, worship, and mission.$tnp$,
  reading_key_terms = $tnp$[{"term":"Passion","definition":"The suffering and death Jesus freely accepts for our salvation."},{"term":"Resurrection","definition":"Jesus' rising from the dead in His glorified body."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$96d1b12232ef4dcc816db4869abc94e37c493c2ee8c86fb403ea8661f4bb96bf$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 63;

-- Day 64: Matthew 21:1-22 - The King Comes to the Temple
update public.plan_days pd
set
  reading_context = $tnp$Matthew brings Jesus into Jerusalem, conflict, judgment, and the Passion. This reading continues that final movement as Jesus enters Jerusalem and purifies worship.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus foretells His Passion and heals two blind men.$tnp$,
  reading_today_preview = $tnp$Today, Jesus enters Jerusalem and purifies worship.$tnp$,
  reading_watch_for = $tnp$Notice how Jesus' authority reaches worship, the temple, and the leaders' questions.$tnp$,
  reading_key_terms = $tnp$[{"term":"temple","definition":"The holy place of worship in Jerusalem, where Israel offered sacrifice."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$5b47f6eb675ed32ad46de63dd58c17a1182789415e39473cf17bcbf7c51d2be3$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 64;

-- Day 65: Matthew 21:23-22:14 - The Rejected Son
update public.plan_days pd
set
  reading_context = $tnp$Matthew brings Jesus into Jerusalem, conflict, judgment, and the Passion. This reading continues that final movement as Jesus answers authority challenges with parables.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus enters Jerusalem and purifies worship.$tnp$,
  reading_today_preview = $tnp$Today, Jesus answers authority challenges with parables.$tnp$,
  reading_watch_for = $tnp$Notice the concrete images Jesus uses to reveal the Kingdom.$tnp$,
  reading_key_terms = $tnp$[{"term":"parable","definition":"A short teaching story that reveals the Kingdom through familiar images."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$50312915f36cb8462c575a1046bfc84b1f6f4d1d0611297293bfd38031793de8$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 65;

-- Day 66: Matthew 22:15-46 - Questions for the King
update public.plan_days pd
set
  reading_context = $tnp$Matthew brings Jesus into Jerusalem, conflict, judgment, and the Passion. This reading continues that final movement as Jesus answers questions about Caesar, resurrection, and love.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus answers authority challenges with parables.$tnp$,
  reading_today_preview = $tnp$Today, Jesus answers questions about Caesar, resurrection, and love.$tnp$,
  reading_watch_for = $tnp$Watch how the Resurrection creates witness, worship, and mission.$tnp$,
  reading_key_terms = $tnp$[{"term":"Resurrection","definition":"Jesus' rising from the dead in His glorified body."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$60547e16d1717cd2a166b775d407c64671d9ec8913cb4ba5c9b255c827de5990$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 66;

-- Day 67: Matthew 23:1-39 - Woe and Lament
update public.plan_days pd
set
  reading_context = $tnp$Matthew brings Jesus into Jerusalem, conflict, judgment, and the Passion. This reading continues that final movement as Jesus warns against hypocrisy and laments over Jerusalem.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus answers questions about Caesar, resurrection, and love.$tnp$,
  reading_today_preview = $tnp$Today, Jesus warns against hypocrisy and laments over Jerusalem.$tnp$,
  reading_watch_for = $tnp$Watch how Jesus' warnings are severe because He desires true conversion.$tnp$,
  reading_key_terms = $tnp$[]$tnp$::jsonb,
  reading_context_source_hash = $tnp$2dd291aa68abf8ce20487d3ba40472d8273be48f127f458011a36a1abfd07fcc$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 67;

-- Day 68: Matthew 24:1-31 - The Son of Man Will Come
update public.plan_days pd
set
  reading_context = $tnp$Matthew brings Jesus into Jerusalem, conflict, judgment, and the Passion. This reading continues that final movement as Jesus teaches endurance, trial, and His coming.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus warns against hypocrisy and laments over Jerusalem.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches endurance, trial, and His coming.$tnp$,
  reading_watch_for = $tnp$Stay close to Jesus' obedience and silence as He freely enters His Passion.$tnp$,
  reading_key_terms = $tnp$[{"term":"Son of Man","definition":"A title Jesus uses that points to His authority, suffering, and glory."},{"term":"temple","definition":"The holy place of worship in Jerusalem, where Israel offered sacrifice."},{"term":"Passion","definition":"The suffering and death Jesus freely accepts for our salvation."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$5bbcc7fb0f849805884be44275e3a06c4bf233a533d259704f8332f8a08432f5$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 68;

-- Day 69: CCC 554-556 - The Transfiguration
update public.plan_days pd
set
  reading_context = $tnp$Before Matthew's final teaching and Passion, this Sunday returns to the Transfiguration. The Catechism shows how glory prepares the disciples for the scandal of the Cross.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches endurance, trial, and His coming.$tnp$,
  reading_today_preview = $tnp$Today, the Catechism considers the Transfiguration and its place on the road to the Passion.$tnp$,
  reading_watch_for = $tnp$Notice how glory and the Cross belong together in Christ.$tnp$,
  reading_key_terms = $tnp$[{"term":"Passion","definition":"The suffering and death Jesus freely accepts for our salvation."},{"term":"Son of God","definition":"Jesus' divine identity as the eternal Son of the Father."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$0c5a4ed7be9be2dcbe891d2aa1aa2913e9b20058dd554bbaac5d620e8815d595$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 69;

-- Day 70: Matthew 24:32-25:13 - Keep Watch
update public.plan_days pd
set
  reading_context = $tnp$Matthew brings Jesus into Jerusalem, conflict, judgment, and the Passion. This reading continues that final movement as Jesus teaches readiness through the faithful servant and the wise virgins.$tnp$,
  previous_reading_summary = $tnp$Yesterday's Catechism reading focused on the Transfiguration.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches readiness through the faithful servant and the wise virgins.$tnp$,
  reading_watch_for = $tnp$Notice the concrete images Jesus uses to reveal the Kingdom.$tnp$,
  reading_key_terms = $tnp$[{"term":"parable","definition":"A short teaching story that reveals the Kingdom through familiar images."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$0dd462c1b38afc865f3dfc1322da4f2f0579ce1436f1722d486ed8458ddddabe$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 70;

-- Day 71: Matthew 25:14-26:16 - Talents, the Least, and the Plot
update public.plan_days pd
set
  reading_context = $tnp$Matthew brings Jesus into Jerusalem, conflict, judgment, and the Passion. This reading continues that final movement as Jesus teaches talents and judgment, then the Passion plot begins.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches readiness through the faithful servant and the wise virgins.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches talents and judgment, then the Passion plot begins.$tnp$,
  reading_watch_for = $tnp$Stay close to Jesus' obedience and silence as He freely enters His Passion.$tnp$,
  reading_key_terms = $tnp$[{"term":"parable","definition":"A short teaching story that reveals the Kingdom through familiar images."},{"term":"Passion","definition":"The suffering and death Jesus freely accepts for our salvation."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$454833856865018886dacd416dd60dc6e93d00492694dcdbb91122703ee6064f$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 71;

-- Day 72: Matthew 26:17-65 - The Supper, the Garden, and the Trial
update public.plan_days pd
set
  reading_context = $tnp$Matthew brings Jesus into Jerusalem, conflict, judgment, and the Passion. This reading continues that final movement as Jesus gives the supper, prays, is arrested, and stands before the high priest.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches talents and judgment, then the Passion plot begins.$tnp$,
  reading_today_preview = $tnp$Today, Jesus gives the supper, prays, is arrested, and stands before the high priest.$tnp$,
  reading_watch_for = $tnp$Stay close to Jesus' obedience and silence as He freely enters His Passion.$tnp$,
  reading_key_terms = $tnp$[{"term":"Passover","definition":"Israel's feast of deliverance, fulfilled by Christ in His Passion."},{"term":"Passion","definition":"The suffering and death Jesus freely accepts for our salvation."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$609cf727e064a8ab797ea9aa1c28977ed3540135ebbf809ed1245957733a91a8$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 72;

-- Day 73: Matthew 26:66-27:37 - Denied, Condemned, and Crucified
update public.plan_days pd
set
  reading_context = $tnp$Matthew brings Jesus into Jerusalem, conflict, judgment, and the Passion. This reading continues that final movement as Jesus is mocked, Peter denies Him, and Pilate hands Him over to be crucified.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus gives the supper, prays, is arrested, and stands before the high priest.$tnp$,
  reading_today_preview = $tnp$Today, Jesus is mocked, Peter denies Him, and Pilate hands Him over to be crucified.$tnp$,
  reading_watch_for = $tnp$Stay close to Jesus' obedience and silence as He freely enters His Passion.$tnp$,
  reading_key_terms = $tnp$[{"term":"Passion","definition":"The suffering and death Jesus freely accepts for our salvation."},{"term":"crucifixion","definition":"Jesus' death on the cross, offered in obedience and love."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$1ba95c591da87e4a420b1d321360b1039fedbe9e1d0b3bd3027915ddc6dcdc99$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 73;

-- Day 74: Matthew 27:38-28:20 - Crucified and Risen
update public.plan_days pd
set
  reading_context = $tnp$Matthew brings Jesus into Jerusalem, conflict, judgment, and the Passion. This reading continues that final movement as Jesus dies, is buried, rises, and sends the disciples.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus is mocked, Peter denies Him, and Pilate hands Him over to be crucified.$tnp$,
  reading_today_preview = $tnp$Today, Jesus dies, is buried, rises, and sends the disciples.$tnp$,
  reading_watch_for = $tnp$Watch how the Resurrection creates witness, worship, and mission.$tnp$,
  reading_key_terms = $tnp$[{"term":"crucifixion","definition":"Jesus' death on the cross, offered in obedience and love."},{"term":"Resurrection","definition":"Jesus' rising from the dead in His glorified body."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$52603d35e90bae47b84808bd4c62248a3adeb707a54e1746e20602472fb0a7de$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 74;

-- Day 75: Luke 1:1-25 - The Promise to Zechariah
update public.plan_days pd
set
  reading_context = $tnp$Luke begins with an orderly account rooted in promise, prayer, and the temple. The story opens before Jesus' birth with Zechariah and Elizabeth.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus dies, is buried, rises, and sends the disciples.$tnp$,
  reading_today_preview = $tnp$Today, the angel announces John's birth while Zechariah is serving in the temple.$tnp$,
  reading_watch_for = $tnp$Notice how God begins quietly, through prayer, barrenness, and a promise that asks for trust.$tnp$,
  reading_key_terms = $tnp$[{"term":"temple","definition":"The holy place of worship in Jerusalem, where Israel offered sacrifice."},{"term":"angel","definition":"A spiritual messenger sent by God."},{"term":"covenant","definition":"A sacred bond God establishes with His people."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$e9fbd2e8af96bf635a3c5d91fd9203a9e9d1a87007bf6e9c058ed67cf798d077$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 75;

-- Day 76: CCC 574-594 - Jesus and Israel
update public.plan_days pd
set
  reading_context = $tnp$After Matthew's death and Resurrection narrative, this Sunday considers Jesus and Israel. The Catechism helps us read the opposition to Jesus without losing sight of fulfillment.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Luke begins with prayer, promise, and waiting.$tnp$,
  reading_today_preview = $tnp$Today, the Catechism considers Jesus' relationship to Israel, the law, the temple, and faith.$tnp$,
  reading_watch_for = $tnp$Notice that Jesus fulfills Israel's hope while exposing hardened hearts.$tnp$,
  reading_key_terms = $tnp$[{"term":"temple","definition":"The holy place of worship in Jerusalem, where Israel offered sacrifice."},{"term":"faith","definition":"Trusting God and receiving what He reveals."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$54ad476aebed561f852c6f684a96e03ad29e268dd2effb15928e4e9645cb1cd6$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 76;

-- Day 77: Luke 1:26-56 - The Annunciation and Visitation
update public.plan_days pd
set
  reading_context = $tnp$Luke begins with infancy, promise, prayer, and preparation. This reading continues that beginning as Mary receives the angel's word and visits Elizabeth.$tnp$,
  previous_reading_summary = $tnp$Yesterday's Catechism reading focused on Jesus and Israel.$tnp$,
  reading_today_preview = $tnp$Today, Mary receives the angel's word and visits Elizabeth.$tnp$,
  reading_watch_for = $tnp$Notice how the child Jesus is received, protected, and revealed as God with us.$tnp$,
  reading_key_terms = $tnp$[{"term":"Incarnation","definition":"The eternal Son of God taking on human flesh."},{"term":"Annunciation","definition":"The angel's announcement to Mary and her faithful consent to God's plan."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$5ede46580de7cdcf9a46eb1a6de89a4307cb062dc718127edaea25cf094b20bd$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 77;

-- Day 78: Luke 1:57-80 - The Birth of John
update public.plan_days pd
set
  reading_context = $tnp$Luke begins with infancy, promise, prayer, and preparation. This reading continues that beginning as John is born and Zechariah blesses God.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Mary receives the angel's word and visits Elizabeth.$tnp$,
  reading_today_preview = $tnp$Today, John is born and Zechariah blesses God.$tnp$,
  reading_watch_for = $tnp$Watch how baptism is joined to identity, mission, and the work of the Holy Spirit.$tnp$,
  reading_key_terms = $tnp$[{"term":"baptism","definition":"The sacrament of new birth in Christ and cleansing from sin."},{"term":"Incarnation","definition":"The eternal Son of God taking on human flesh."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$1e827bfdfd2712e61b428374c8cbbbbf22f17b77c79fdf012acb4b78d5844a86$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 78;

-- Day 79: Luke 2:1-20 - The Savior Is Born
update public.plan_days pd
set
  reading_context = $tnp$Luke begins with infancy, promise, prayer, and preparation. This reading continues that beginning as Jesus is born in Bethlehem and shepherds hear the good news.$tnp$,
  previous_reading_summary = $tnp$Yesterday, John is born and Zechariah blesses God.$tnp$,
  reading_today_preview = $tnp$Today, Jesus is born in Bethlehem and shepherds hear the good news.$tnp$,
  reading_watch_for = $tnp$Notice how the child Jesus is received, protected, and revealed as God with us.$tnp$,
  reading_key_terms = $tnp$[{"term":"Incarnation","definition":"The eternal Son of God taking on human flesh."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$865369a8acbff978cc828420e913e0378b7445fe04d281dba0db09224bfdf815$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 79;

-- Day 80: Luke 2:21-52 - Presented to the Lord
update public.plan_days pd
set
  reading_context = $tnp$Luke begins with infancy, promise, prayer, and preparation. This reading continues that beginning as Jesus is presented in the temple and found in His Father's house.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus is born in Bethlehem and shepherds hear the good news.$tnp$,
  reading_today_preview = $tnp$Today, Jesus is presented in the temple and found in His Father's house.$tnp$,
  reading_watch_for = $tnp$Notice that disciples are called to be with Jesus before they are sent.$tnp$,
  reading_key_terms = $tnp$[{"term":"temple","definition":"The holy place of worship in Jerusalem, where Israel offered sacrifice."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$b4f68bcf9729ac835aeae03569774dc90dc7311f7b2c9dd696a0f6191d6e65fa$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 80;

-- Day 81: Luke 3:1-22 - Prepare the Way
update public.plan_days pd
set
  reading_context = $tnp$Luke begins with infancy, promise, prayer, and preparation. This reading continues that beginning as John preaches repentance and Jesus is baptized.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus is presented in the temple and found in His Father's house.$tnp$,
  reading_today_preview = $tnp$Today, John preaches repentance and Jesus is baptized.$tnp$,
  reading_watch_for = $tnp$Watch how baptism is joined to identity, mission, and the work of the Holy Spirit.$tnp$,
  reading_key_terms = $tnp$[{"term":"repentance","definition":"Turning away from sin and back toward God."},{"term":"baptism","definition":"The sacrament of new birth in Christ and cleansing from sin."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$868b2830331e46413c5a4269aa327bb0336717cdb577c1747f3d5515b5f58f3a$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 81;

-- Day 82: Luke 3:23-4:13 - The Son Tested in the Desert
update public.plan_days pd
set
  reading_context = $tnp$Luke begins with infancy, promise, prayer, and preparation. This reading continues that beginning as Jesus' genealogy leads into His temptation.$tnp$,
  previous_reading_summary = $tnp$Yesterday, John preaches repentance and Jesus is baptized.$tnp$,
  reading_today_preview = $tnp$Today, Jesus' genealogy leads into His temptation.$tnp$,
  reading_watch_for = $tnp$Notice how testing reveals trust, obedience, and the Father's care.$tnp$,
  reading_key_terms = $tnp$[]$tnp$::jsonb,
  reading_context_source_hash = $tnp$bb653f0d7a88e5affb06d701a7a27da8600edb720d72f8992833b9bc5326e6b7$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 82;

-- Day 83: CCC 595-618 - The Passion of Christ
update public.plan_days pd
set
  reading_context = $tnp$Luke has introduced Jesus as Son and Messiah. This Sunday turns directly to the Passion Christ freely accepts for sinners.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus' genealogy leads into His temptation.$tnp$,
  reading_today_preview = $tnp$Today, the Catechism considers the Passion of Christ and His saving death.$tnp$,
  reading_watch_for = $tnp$Watch how the Church speaks of the Passion as both human sin and Christ's free love.$tnp$,
  reading_key_terms = $tnp$[{"term":"Passion","definition":"The suffering and death Jesus freely accepts for our salvation."},{"term":"crucifixion","definition":"Jesus' death on the cross, offered in obedience and love."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$5c45cda96490ec669069f337838bf5f4e3111c8278214f52f0612123736137eb$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 83;

-- Day 84: Luke 4:14-44 - Good News for the Poor
update public.plan_days pd
set
  reading_context = $tnp$Luke shows Jesus' Galilee ministry through mercy, teaching, and signs of the Kingdom. This reading continues that ministry as Jesus announces His mission, heals, and preaches the Kingdom.$tnp$,
  previous_reading_summary = $tnp$Yesterday's Catechism reading focused on the Passion of Christ.$tnp$,
  reading_today_preview = $tnp$Today, Jesus announces His mission, heals, and preaches the Kingdom.$tnp$,
  reading_watch_for = $tnp$Watch how mercy restores real people without pretending sin is harmless.$tnp$,
  reading_key_terms = $tnp$[{"term":"Kingdom of God","definition":"God's saving reign, present in Christ and coming to fulfillment."},{"term":"Holy Spirit","definition":"The third Person of the Trinity, given by the Father and the Son."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$d524530d356ec16f3fbe29b7a8ba426d271d991d06d596292e68221b4021904d$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 84;

-- Day 85: Luke 5:1-16 - Put Out Into the Deep
update public.plan_days pd
set
  reading_context = $tnp$Luke shows Jesus' Galilee ministry through mercy, teaching, and signs of the Kingdom. This reading continues that ministry as Jesus calls the fishermen and cleanses a leper.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus announces His mission, heals, and preaches the Kingdom.$tnp$,
  reading_today_preview = $tnp$Today, Jesus calls the fishermen and cleanses a leper.$tnp$,
  reading_watch_for = $tnp$Watch how mercy restores real people without pretending sin is harmless.$tnp$,
  reading_key_terms = $tnp$[]$tnp$::jsonb,
  reading_context_source_hash = $tnp$d39c1595c07b4c717e07447570bb3d6496d847f15982597584678b31a4e608ad$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 85;

-- Day 86: Luke 5:17-39 - Forgiveness and New Wine
update public.plan_days pd
set
  reading_context = $tnp$Luke shows Jesus' Galilee ministry through mercy, teaching, and signs of the Kingdom. This reading continues that ministry as Jesus forgives, calls Levi, and answers fasting questions.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus calls the fishermen and cleanses a leper.$tnp$,
  reading_today_preview = $tnp$Today, Jesus forgives, calls Levi, and answers fasting questions.$tnp$,
  reading_watch_for = $tnp$Watch how mercy restores real people without pretending sin is harmless.$tnp$,
  reading_key_terms = $tnp$[]$tnp$::jsonb,
  reading_context_source_hash = $tnp$16e493fe232ed3558292ffabae6d12bf2d90de7739dc2acaade53b10cdf090ce$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 86;

-- Day 87: Luke 6:1-16 - Lord of the Sabbath
update public.plan_days pd
set
  reading_context = $tnp$Luke shows Jesus' Galilee ministry through mercy, teaching, and signs of the Kingdom. This reading continues that ministry as Jesus answers Sabbath disputes and chooses the Twelve.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus forgives, calls Levi, and answers fasting questions.$tnp$,
  reading_today_preview = $tnp$Today, Jesus answers Sabbath disputes and chooses the Twelve.$tnp$,
  reading_watch_for = $tnp$Watch how Jesus reveals the purpose of worship, mercy, and holy rest.$tnp$,
  reading_key_terms = $tnp$[{"term":"apostle","definition":"One sent by Christ with authority to witness and serve His Church."},{"term":"Sabbath","definition":"The holy day of rest and worship given to Israel by God."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$358c75be2db1a6cf5e94da3c74737d555ad627c376373a35f0b61ceb66c4bb5d$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 87;

-- Day 88: Luke 6:17-49 - The Plain Teaching of the Kingdom
update public.plan_days pd
set
  reading_context = $tnp$Luke shows Jesus' Galilee ministry through mercy, teaching, and signs of the Kingdom. This reading continues that ministry as Jesus teaches blessings, mercy, and obedience.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus answers Sabbath disputes and chooses the Twelve.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches blessings, mercy, and obedience.$tnp$,
  reading_watch_for = $tnp$Watch how mercy restores real people without pretending sin is harmless.$tnp$,
  reading_key_terms = $tnp$[{"term":"Kingdom of God","definition":"God's saving reign, present in Christ and coming to fulfillment."},{"term":"mercy","definition":"God's faithful love toward sinners, the suffering, and the lost."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$bd11ddd24e64de32dd309e3c36d65c8a62aa1bcb516e8f22fdbd793a32707d32$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 88;

-- Day 89: Luke 7:1-17 - Faith and Compassion
update public.plan_days pd
set
  reading_context = $tnp$Jesus is still revealing the Kingdom through mercy and authority in Galilee. The crowds see His power reach a Gentile household and a grieving widow.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches blessings, mercy, and obedience.$tnp$,
  reading_today_preview = $tnp$Today, Jesus heals the centurion's servant and raises a widow's son.$tnp$,
  reading_watch_for = $tnp$Notice the centurion's humility and the Lord's compassion for the widow.$tnp$,
  reading_key_terms = $tnp$[{"term":"faith","definition":"Trusting God and receiving what He reveals."},{"term":"mercy","definition":"God's faithful love toward sinners, the suffering, and the lost."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$1471f4acb091335b574e8e2124c275c71d56a29f0c1d20f9b59aa83cbbfea213$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 89;

-- Day 90: CCC 624-630 - Christ's Death and Burial
update public.plan_days pd
set
  reading_context = $tnp$After Luke shows Jesus giving life to the widow's son, this Sunday contemplates Christ's real death and burial. The Catechism keeps the mystery concrete.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus heals the centurion's servant and raises a widow's son.$tnp$,
  reading_today_preview = $tnp$Today, the Catechism considers Christ's death, burial, and descent among the dead.$tnp$,
  reading_watch_for = $tnp$Notice that Jesus truly enters death. Christian hope does not skip the tomb.$tnp$,
  reading_key_terms = $tnp$[{"term":"Passion","definition":"The suffering and death Jesus freely accepts for our salvation."},{"term":"Resurrection","definition":"Jesus' rising from the dead in His glorified body."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$c426a4699e544a5c2fa3138f49b4162be4710e3adc9d26215234a70ce09fc898$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 90;

-- Day 91: Luke 7:18-35 - The Works of the Messiah
update public.plan_days pd
set
  reading_context = $tnp$After Sunday's Catechism reading on Christ's death and burial, Luke returns to Jesus' public signs. John the Baptist's messengers bring the question directly to Jesus.$tnp$,
  previous_reading_summary = $tnp$Yesterday's Catechism reading focused on Christ's Death and Burial.$tnp$,
  reading_today_preview = $tnp$Today, Jesus answers John's messengers by pointing to the works of the Messiah.$tnp$,
  reading_watch_for = $tnp$Notice that Jesus answers with deeds: healing, good news, and mercy reveal who He is.$tnp$,
  reading_key_terms = $tnp$[{"term":"Messiah","definition":"The anointed one promised by God and fulfilled in Jesus."},{"term":"mercy","definition":"God's faithful love toward sinners, the suffering, and the lost."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$23022de59ebc1960a68a31ce78a31ba417b5af3b4e2fe280f00effb3123dc20b$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 91;

-- Day 92: Luke 7:36-8:3 - Much Love and Mercy
update public.plan_days pd
set
  reading_context = $tnp$Luke shows Jesus' Galilee ministry through mercy, teaching, and signs of the Kingdom. This reading continues that ministry as A forgiven woman anoints Jesus and women accompany Him.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus answers John's messengers.$tnp$,
  reading_today_preview = $tnp$Today, A forgiven woman anoints Jesus and women accompany Him.$tnp$,
  reading_watch_for = $tnp$Watch how mercy restores real people without pretending sin is harmless.$tnp$,
  reading_key_terms = $tnp$[{"term":"mercy","definition":"God's faithful love toward sinners, the suffering, and the lost."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$a6cb8ac15f5deafba05aa2492a4a5d82fac3722dc9fe84573dc81343ba7e2fad$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 92;

-- Day 93: Luke 8:4-21 - Hearing the Word
update public.plan_days pd
set
  reading_context = $tnp$Luke shows Jesus' Galilee ministry through mercy, teaching, and signs of the Kingdom. This reading continues that ministry as Jesus teaches the sower, the lamp, and His true family.$tnp$,
  previous_reading_summary = $tnp$Yesterday, A forgiven woman anoints Jesus and women accompany Him.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches the sower, the lamp, and His true family.$tnp$,
  reading_watch_for = $tnp$Notice the concrete images Jesus uses to reveal the Kingdom.$tnp$,
  reading_key_terms = $tnp$[{"term":"parable","definition":"A short teaching story that reveals the Kingdom through familiar images."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$a482ceb9fe66f42e18b83282466b8833d9e8569017b453e5bd08a0fd0baf82c8$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 93;

-- Day 94: Luke 8:22-56 - Fear Meets the Lord
update public.plan_days pd
set
  reading_context = $tnp$Luke shows Jesus' Galilee ministry through mercy, teaching, and signs of the Kingdom. This reading continues that ministry as Jesus calms, frees, heals, and raises.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches the sower, the lamp, and His true family.$tnp$,
  reading_today_preview = $tnp$Today, Jesus calms, frees, heals, and raises.$tnp$,
  reading_watch_for = $tnp$Notice how fear changes when Jesus' authority is seen clearly.$tnp$,
  reading_key_terms = $tnp$[]$tnp$::jsonb,
  reading_context_source_hash = $tnp$88f50f4f9eb9508ff905bed92a9d9efb465d9b8a83ddd83378f145c3037a0910$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 94;

-- Day 95: Luke 9:1-17 - Sent and Fed
update public.plan_days pd
set
  reading_context = $tnp$Luke shows Jesus' Galilee ministry through mercy, teaching, and signs of the Kingdom. This reading continues that ministry as Jesus sends the Twelve and feeds the five thousand.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus calms, frees, heals, and raises.$tnp$,
  reading_today_preview = $tnp$Today, Jesus sends the Twelve and feeds the five thousand.$tnp$,
  reading_watch_for = $tnp$Notice that disciples are called to be with Jesus before they are sent.$tnp$,
  reading_key_terms = $tnp$[{"term":"apostle","definition":"One sent by Christ with authority to witness and serve His Church."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$d09e4bd194e3af3645b1612515c6231de4d656032c5b47efc7eb0b571b25b625$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 95;

-- Day 96: Luke 9:18-36 - Confession, Cross, and Glory
update public.plan_days pd
set
  reading_context = $tnp$Luke shows Jesus' Galilee ministry through mercy, teaching, and signs of the Kingdom. This reading continues that ministry as Peter confesses Jesus and Jesus is transfigured.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus sends the Twelve and feeds the five thousand.$tnp$,
  reading_today_preview = $tnp$Today, Peter confesses Jesus and Jesus is transfigured.$tnp$,
  reading_watch_for = $tnp$Stay close to Jesus' obedience and silence as He freely enters His Passion.$tnp$,
  reading_key_terms = $tnp$[{"term":"crucifixion","definition":"Jesus' death on the cross, offered in obedience and love."},{"term":"confession","definition":"The sacrament where sins are confessed and forgiven through Christ's mercy."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$ac50da01fcb0ddb563c3c80f62e5f2ee8775d25966f1db71b26d569af4fcb4aa$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 96;

-- Day 97: CCC 638-658 - The Resurrection
update public.plan_days pd
set
  reading_context = $tnp$As Luke moves toward the road to Jerusalem, this Sunday turns to the Resurrection. The Catechism names it as a real event and the heart of Christian faith.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Peter confesses Jesus and Jesus is transfigured.$tnp$,
  reading_today_preview = $tnp$Today, the Catechism considers the Resurrection and the risen life of Christ.$tnp$,
  reading_watch_for = $tnp$Watch how the Resurrection is both historical and more than a return to ordinary life.$tnp$,
  reading_key_terms = $tnp$[{"term":"Resurrection","definition":"Jesus' rising from the dead in His glorified body."},{"term":"faith","definition":"Trusting God and receiving what He reveals."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$eb313881f9c9f8b4ccc53f7643cff624ba3b156b97204b181453abc72fb2cba7$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 97;

-- Day 98: Luke 9:37-50 - Humility After Glory
update public.plan_days pd
set
  reading_context = $tnp$Luke shows Jesus' Galilee ministry through mercy, teaching, and signs of the Kingdom. This reading continues that ministry as Jesus heals a boy and corrects rivalry.$tnp$,
  previous_reading_summary = $tnp$Yesterday's Catechism reading focused on the Resurrection.$tnp$,
  reading_today_preview = $tnp$Today, Jesus heals a boy and corrects rivalry.$tnp$,
  reading_watch_for = $tnp$Notice how Jesus corrects ambition by drawing disciples toward humility.$tnp$,
  reading_key_terms = $tnp$[]$tnp$::jsonb,
  reading_context_source_hash = $tnp$75c50ab701a1dd6b841947c0cab881076e939873014da7b7fcc69d7825af82a9$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 98;

-- Day 99: Luke 9:51-10:24 - On the Road to Jerusalem
update public.plan_days pd
set
  reading_context = $tnp$Luke follows Jesus on the road with lessons in mercy, prayer, and discipleship. This reading continues that journey as Jesus sets His face toward Jerusalem and sends the seventy-two.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus heals a boy and corrects rivalry.$tnp$,
  reading_today_preview = $tnp$Today, Jesus sets His face toward Jerusalem and sends the seventy-two.$tnp$,
  reading_watch_for = $tnp$Watch how Jesus' warnings are severe because He desires true conversion.$tnp$,
  reading_key_terms = $tnp$[{"term":"repentance","definition":"Turning away from sin and back toward God."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$152ed93c31ad12b275dcec7e977661ba4f2e966bb000a924f53fffc58dbc78a9$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 99;

-- Day 100: Luke 10:25-42 - Neighbor and Disciple
update public.plan_days pd
set
  reading_context = $tnp$Luke follows Jesus on the road with lessons in mercy, prayer, and discipleship. This reading continues that journey as Jesus tells the Good Samaritan and visits Martha and Mary.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus sets His face toward Jerusalem and sends the seventy-two.$tnp$,
  reading_today_preview = $tnp$Today, Jesus tells the Good Samaritan and visits Martha and Mary.$tnp$,
  reading_watch_for = $tnp$Notice the concrete images Jesus uses to reveal the Kingdom.$tnp$,
  reading_key_terms = $tnp$[{"term":"parable","definition":"A short teaching story that reveals the Kingdom through familiar images."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$2873b401667b180bd7e350e5f827475bbe2455dcdfcf1c4eeb5de2cb4718fa3f$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 100;

-- Day 101: Luke 11:1-28 - Teach Us to Pray
update public.plan_days pd
set
  reading_context = $tnp$Luke follows Jesus on the road with lessons in mercy, prayer, and discipleship. This reading continues that journey as Jesus gives the Lord's Prayer and teaches persistence.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus tells the Good Samaritan and visits Martha and Mary.$tnp$,
  reading_today_preview = $tnp$Today, Jesus gives the Lord's Prayer and teaches persistence.$tnp$,
  reading_watch_for = $tnp$Watch how mercy restores real people without pretending sin is harmless.$tnp$,
  reading_key_terms = $tnp$[{"term":"Holy Spirit","definition":"The third Person of the Trinity, given by the Father and the Son."},{"term":"Our Father","definition":"The prayer Jesus teaches His disciples to pray to the Father."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$1d9f0472546111798a14b00693aadc34ad431a65f8646ce186869bda396f1b38$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 101;

-- Day 102: Luke 11:29-54 - Light and Warning
update public.plan_days pd
set
  reading_context = $tnp$Luke follows Jesus on the road with lessons in mercy, prayer, and discipleship. This reading continues that journey as Jesus warns against blindness and hypocrisy.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus gives the Lord's Prayer and teaches persistence.$tnp$,
  reading_today_preview = $tnp$Today, Jesus warns against blindness and hypocrisy.$tnp$,
  reading_watch_for = $tnp$Watch how Jesus' warnings are severe because He desires true conversion.$tnp$,
  reading_key_terms = $tnp$[]$tnp$::jsonb,
  reading_context_source_hash = $tnp$c0cb194f1ce49a457fa01d06bfa821f7108e5641dd9130316221cb9b7b5a309e$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 102;

-- Day 103: Luke 12:1-34 - Fear the Father, Not the World
update public.plan_days pd
set
  reading_context = $tnp$Luke follows Jesus on the road with lessons in mercy, prayer, and discipleship. This reading continues that journey as Jesus teaches against hypocrisy, greed, and anxiety.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus warns against blindness and hypocrisy.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches against hypocrisy, greed, and anxiety.$tnp$,
  reading_watch_for = $tnp$Notice the concrete images Jesus uses to reveal the Kingdom.$tnp$,
  reading_key_terms = $tnp$[{"term":"parable","definition":"A short teaching story that reveals the Kingdom through familiar images."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$1c7e347c75dd9a2b4efcb48b27aa25a882522f09aec54762873b2c1e3ea22c3c$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 103;

-- Day 104: CCC 659-667 - The Ascension and Christ's Reign
update public.plan_days pd
set
  reading_context = $tnp$Luke's Gospel keeps moving toward Jerusalem and the Father's plan. This Sunday considers Christ's return to the Father and His reign.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches against hypocrisy, greed, and anxiety.$tnp$,
  reading_today_preview = $tnp$Today, the Catechism considers Christ's return to the Father and His reign at the Father's right hand.$tnp$,
  reading_watch_for = $tnp$Notice that the risen Christ reigns and intercedes; He has not withdrawn from His Church.$tnp$,
  reading_key_terms = $tnp$[{"term":"Resurrection","definition":"Jesus' rising from the dead in His glorified body."},{"term":"Church","definition":"The people Christ gathers into His Body through faith and the sacraments."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$939b4080ec368dc049d85c37d5b5575ace2906d30d7f3b254d454a2882b97c5e$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 104;

-- Day 105: Luke 12:35-59 - Ready for the Master
update public.plan_days pd
set
  reading_context = $tnp$Luke follows Jesus on the road with lessons in mercy, prayer, and discipleship. This reading continues that journey as Jesus teaches watchfulness and conversion.$tnp$,
  previous_reading_summary = $tnp$Yesterday's Catechism reading focused on Christ's return to the Father and His reign.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches watchfulness and conversion.$tnp$,
  reading_watch_for = $tnp$Notice that disciples are called to be with Jesus before they are sent.$tnp$,
  reading_key_terms = $tnp$[{"term":"conversion","definition":"A real turning of heart and life toward God."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$d2d692ae8ca15ecfdc59aceeac7329c372b85a49c6eec18bdde84f3dc944e0ba$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 105;

-- Day 106: Luke 13:1-21 - Repentance and Small Beginnings
update public.plan_days pd
set
  reading_context = $tnp$Luke follows Jesus on the road with lessons in mercy, prayer, and discipleship. This reading continues that journey as Jesus calls for repentance and teaches Kingdom growth.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches watchfulness and conversion.$tnp$,
  reading_today_preview = $tnp$Today, Jesus calls for repentance and teaches Kingdom growth.$tnp$,
  reading_watch_for = $tnp$Notice the concrete images Jesus uses to reveal the Kingdom.$tnp$,
  reading_key_terms = $tnp$[{"term":"repentance","definition":"Turning away from sin and back toward God."},{"term":"Kingdom of God","definition":"God's saving reign, present in Christ and coming to fulfillment."},{"term":"parable","definition":"A short teaching story that reveals the Kingdom through familiar images."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$457353e0715cd4cae0d255332fa9e0864b6190ac92c23e853de42cecc83f4525$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 106;

-- Day 107: Luke 13:22-35 - The Narrow Door
update public.plan_days pd
set
  reading_context = $tnp$Luke follows Jesus on the road with lessons in mercy, prayer, and discipleship. This reading continues that journey as Jesus teaches urgency and laments over Jerusalem.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus calls for repentance and teaches Kingdom growth.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches urgency and laments over Jerusalem.$tnp$,
  reading_watch_for = $tnp$Watch the urgency in Jesus' words. Faithfulness is concrete, not vague intention.$tnp$,
  reading_key_terms = $tnp$[]$tnp$::jsonb,
  reading_context_source_hash = $tnp$97956b2e52530b2962ae5b9cd530f2405ffe2edae7a7fca705e7caaa40c1bcdc$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 107;

-- Day 108: Luke 14:1-35 - The Humble Place
update public.plan_days pd
set
  reading_context = $tnp$Luke follows Jesus on the road with lessons in mercy, prayer, and discipleship. This reading continues that journey as Jesus teaches humility, the banquet, and the cost of discipleship.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches urgency and laments over Jerusalem.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches humility, the banquet, and the cost of discipleship.$tnp$,
  reading_watch_for = $tnp$Notice the concrete images Jesus uses to reveal the Kingdom.$tnp$,
  reading_key_terms = $tnp$[{"term":"disciple","definition":"One who follows Jesus, learns from Him, and lives under His teaching."},{"term":"Sabbath","definition":"The holy day of rest and worship given to Israel by God."},{"term":"parable","definition":"A short teaching story that reveals the Kingdom through familiar images."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$d447c257f39d55e773e8ec879eabca1cbe152d10c7aab830730e7d08c50b6a26$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 108;

-- Day 109: Luke 15:1-32 - The Mercy of the Father
update public.plan_days pd
set
  reading_context = $tnp$Luke follows Jesus on the road with lessons in mercy, prayer, and discipleship. This reading continues that journey as Jesus tells the lost sheep, lost coin, and lost son.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches humility, the banquet, and the cost of discipleship.$tnp$,
  reading_today_preview = $tnp$Today, Jesus tells the lost sheep, lost coin, and lost son.$tnp$,
  reading_watch_for = $tnp$Notice the concrete images Jesus uses to reveal the Kingdom.$tnp$,
  reading_key_terms = $tnp$[{"term":"parable","definition":"A short teaching story that reveals the Kingdom through familiar images."},{"term":"mercy","definition":"God's faithful love toward sinners, the suffering, and the lost."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$32256ffd170e6c09be54527cf120f0692cfc0d9d89883467441693a639cf23cb$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 109;

-- Day 110: Luke 16:1-31 - Faithful With What Is Given
update public.plan_days pd
set
  reading_context = $tnp$Luke follows Jesus on the road with lessons in mercy, prayer, and discipleship. This reading continues that journey as Jesus teaches stewardship, wealth, and Lazarus at the gate.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus tells the lost sheep, lost coin, and lost son.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches stewardship, wealth, and Lazarus at the gate.$tnp$,
  reading_watch_for = $tnp$Notice the concrete images Jesus uses to reveal the Kingdom.$tnp$,
  reading_key_terms = $tnp$[{"term":"Kingdom of God","definition":"God's saving reign, present in Christ and coming to fulfillment."},{"term":"parable","definition":"A short teaching story that reveals the Kingdom through familiar images."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$a6eba7edb2f096bf0bc3f4369dc8dfa3d22de32360bddbfbacbb57b521e57bb6$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 110;

-- Day 111: CCC 751-780 - The Church in God's Plan
update public.plan_days pd
set
  reading_context = $tnp$Luke has been showing mercy, repentance, and the gathering of the lost. This Sunday considers the Church in God's saving plan.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches stewardship, wealth, and Lazarus at the gate.$tnp$,
  reading_today_preview = $tnp$Today, the Catechism considers the Church as part of God's plan to gather His people in Christ.$tnp$,
  reading_watch_for = $tnp$Notice that the Church begins in God's initiative, not in human organization alone.$tnp$,
  reading_key_terms = $tnp$[{"term":"Church","definition":"The people Christ gathers into His Body through faith and the sacraments."},{"term":"Kingdom of God","definition":"God's saving reign, present in Christ and coming to fulfillment."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$e28a3a80a704cabf0143d6227f5699ae14596073bd1a26c8abb440dcd88d4788$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 111;

-- Day 112: Luke 17:1-19 - Faith, Duty, and Gratitude
update public.plan_days pd
set
  reading_context = $tnp$Luke follows Jesus on the road with lessons in mercy, prayer, and discipleship. This reading continues that journey as Jesus teaches forgiveness and heals ten lepers.$tnp$,
  previous_reading_summary = $tnp$Yesterday's Catechism reading focused on the Church in God's Plan.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches forgiveness and heals ten lepers.$tnp$,
  reading_watch_for = $tnp$Watch how mercy restores real people without pretending sin is harmless.$tnp$,
  reading_key_terms = $tnp$[{"term":"faith","definition":"Trusting God and receiving what He reveals."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$3ceaa0e3906c53aaf076f9566ebd6c0766ae5bbc2fc92eac5c5880cceb3a7483$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 112;

-- Day 113: Luke 17:20-18:14 - The Kingdom and Humble Prayer
update public.plan_days pd
set
  reading_context = $tnp$Luke follows Jesus on the road with lessons in mercy, prayer, and discipleship. This reading continues that journey as Jesus teaches the Kingdom, perseverance, and humble prayer.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches forgiveness and heals ten lepers.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches the Kingdom, perseverance, and humble prayer.$tnp$,
  reading_watch_for = $tnp$Notice the concrete images Jesus uses to reveal the Kingdom.$tnp$,
  reading_key_terms = $tnp$[{"term":"Kingdom of God","definition":"God's saving reign, present in Christ and coming to fulfillment."},{"term":"parable","definition":"A short teaching story that reveals the Kingdom through familiar images."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$6f713ca68e33d57ec76cc8eb54418bae54fd810795c4bb31ffbbec19893a19a9$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 113;

-- Day 114: Luke 18:15-43 - Receive Like a Child
update public.plan_days pd
set
  reading_context = $tnp$Luke follows Jesus on the road with lessons in mercy, prayer, and discipleship. This reading continues that journey as Jesus welcomes children, warns about riches, and heals a blind man.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches the Kingdom, perseverance, and humble prayer.$tnp$,
  reading_today_preview = $tnp$Today, Jesus welcomes children, warns about riches, and heals a blind man.$tnp$,
  reading_watch_for = $tnp$Watch how the Resurrection creates witness, worship, and mission.$tnp$,
  reading_key_terms = $tnp$[{"term":"Resurrection","definition":"Jesus' rising from the dead in His glorified body."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$bec210c5a7a544b51b5de876e94ca6227172990b36d8d5fac1c7ad719045ea88$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 114;

-- Day 115: Luke 19:1-27 - Salvation Comes to This House
update public.plan_days pd
set
  reading_context = $tnp$Luke follows Jesus on the road with lessons in mercy, prayer, and discipleship. This reading continues that journey as Jesus meets Zacchaeus and teaches stewardship.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus welcomes children, warns about riches, and heals a blind man.$tnp$,
  reading_today_preview = $tnp$Today, Jesus meets Zacchaeus and teaches stewardship.$tnp$,
  reading_watch_for = $tnp$Notice the concrete images Jesus uses to reveal the Kingdom.$tnp$,
  reading_key_terms = $tnp$[{"term":"parable","definition":"A short teaching story that reveals the Kingdom through familiar images."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$254cbb89e3aac4e12013d88330ab8a6f892b5000870abab4b192e5bca1e4e2f9$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 115;

-- Day 116: Luke 19:28-48 - The King Weeps and Cleanses
update public.plan_days pd
set
  reading_context = $tnp$Luke brings Jesus to Jerusalem, the Cross, and the joy of the Resurrection. This reading continues that final movement as Jesus enters Jerusalem, weeps, and cleanses the temple.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus meets Zacchaeus and teaches stewardship.$tnp$,
  reading_today_preview = $tnp$Today, Jesus enters Jerusalem, weeps, and cleanses the temple.$tnp$,
  reading_watch_for = $tnp$Notice how Jesus' authority reaches worship, the temple, and the leaders' questions.$tnp$,
  reading_key_terms = $tnp$[{"term":"temple","definition":"The holy place of worship in Jerusalem, where Israel offered sacrifice."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$16ea573489bb89760e2161995e75e80fbe9c447fd57fed5d38a693a78473d512$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 116;

-- Day 117: Luke 20:1-26 - The Beloved Son Rejected
update public.plan_days pd
set
  reading_context = $tnp$Luke brings Jesus to Jerusalem, the Cross, and the joy of the Resurrection. This reading continues that final movement as Jesus answers authority questions and teaches about Caesar.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus enters Jerusalem, weeps, and cleanses the temple.$tnp$,
  reading_today_preview = $tnp$Today, Jesus answers authority questions and teaches about Caesar.$tnp$,
  reading_watch_for = $tnp$Notice the concrete images Jesus uses to reveal the Kingdom.$tnp$,
  reading_key_terms = $tnp$[{"term":"Son of God","definition":"Jesus' divine identity as the eternal Son of the Father."},{"term":"parable","definition":"A short teaching story that reveals the Kingdom through familiar images."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$dd0e627e304d9d7cc5bc9676628bbe9b21a493035e1411d3d5d4808b7c85d031$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 117;

-- Day 118: CCC 787-796 - The Body of Christ
update public.plan_days pd
set
  reading_context = $tnp$As Luke approaches Jerusalem, this Sunday considers the Church as the Body of Christ. The doctrine helps us read discipleship as communion with Jesus.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus answers authority questions and teaches about Caesar.$tnp$,
  reading_today_preview = $tnp$Today, the Catechism considers the Church as Christ's Body.$tnp$,
  reading_watch_for = $tnp$Watch how union with Christ is personal and communal at the same time.$tnp$,
  reading_key_terms = $tnp$[{"term":"Church","definition":"The people Christ gathers into His Body through faith and the sacraments."},{"term":"disciple","definition":"One who follows Jesus, learns from Him, and lives under His teaching."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$dd0d81d3b1e0fadfe1a7283318df805acfc111926e703236780cc7d18f24faf9$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 118;

-- Day 119: Luke 20:27-21:4 - The Living God and the Widow's Gift
update public.plan_days pd
set
  reading_context = $tnp$Luke brings Jesus to Jerusalem, the Cross, and the joy of the Resurrection. This reading continues that final movement as Jesus teaches resurrection and sees the widow's offering.$tnp$,
  previous_reading_summary = $tnp$Yesterday's Catechism reading focused on the Body of Christ.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches resurrection and sees the widow's offering.$tnp$,
  reading_watch_for = $tnp$Watch how the Resurrection creates witness, worship, and mission.$tnp$,
  reading_key_terms = $tnp$[{"term":"Resurrection","definition":"Jesus' rising from the dead in His glorified body."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$204e8efd7bdcebd872b9828c53f300dd88a4b8a209636a4b8795d76ea5aab574$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 119;

-- Day 120: Luke 21:5-38 - Stand Before the Son of Man
update public.plan_days pd
set
  reading_context = $tnp$Luke brings Jesus to Jerusalem, the Cross, and the joy of the Resurrection. This reading continues that final movement as Jesus teaches trial, Jerusalem, and watchfulness.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches resurrection and sees the widow's offering.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches trial, Jerusalem, and watchfulness.$tnp$,
  reading_watch_for = $tnp$Stay close to Jesus' obedience and silence as He freely enters His Passion.$tnp$,
  reading_key_terms = $tnp$[{"term":"Son of Man","definition":"A title Jesus uses that points to His authority, suffering, and glory."},{"term":"temple","definition":"The holy place of worship in Jerusalem, where Israel offered sacrifice."},{"term":"Passion","definition":"The suffering and death Jesus freely accepts for our salvation."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$b0ed99400e7d101ff95dc95e37fc86db84c19ecdcac0a15e42141897016f8ce4$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 120;

-- Day 121: Luke 22:1-48 - The Supper, Agony, and Betrayal
update public.plan_days pd
set
  reading_context = $tnp$Luke brings Jesus to Jerusalem, the Cross, and the joy of the Resurrection. This reading continues that final movement as Judas betrays, Jesus gives the Passover meal, prays, and is betrayed with a kiss.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches trial, Jerusalem, and watchfulness.$tnp$,
  reading_today_preview = $tnp$Today, Judas betrays, Jesus gives the Passover meal, prays, and is betrayed with a kiss.$tnp$,
  reading_watch_for = $tnp$Stay close to Jesus' obedience and silence as He freely enters His Passion.$tnp$,
  reading_key_terms = $tnp$[{"term":"Passover","definition":"Israel's feast of deliverance, fulfilled by Christ in His Passion."},{"term":"Passion","definition":"The suffering and death Jesus freely accepts for our salvation."},{"term":"Eucharist","definition":"The sacrament of Christ's Body and Blood, source and summit of Christian life."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$6cedb14f8a4d09110f352467e15224ed2c7d5a13d477564697cbc573b23a781c$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 121;

-- Day 122: Luke 22:49-23:25 - Arrested and Condemned
update public.plan_days pd
set
  reading_context = $tnp$Luke brings Jesus to Jerusalem, the Cross, and the joy of the Resurrection. This reading continues that final movement as Jesus is seized, denied, mocked, tried, and handed over.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Judas betrays, Jesus gives the Passover meal, prays, and is betrayed with a kiss.$tnp$,
  reading_today_preview = $tnp$Today, Jesus is seized, denied, mocked, tried, and handed over.$tnp$,
  reading_watch_for = $tnp$Stay close to Jesus' obedience and silence as He freely enters His Passion.$tnp$,
  reading_key_terms = $tnp$[{"term":"Passion","definition":"The suffering and death Jesus freely accepts for our salvation."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$acda382e3b96533657b3b0a6fa43ee4075b7ae316bc38c2ebdfd39fe8342343c$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 122;

-- Day 123: Luke 23:26-24:12 - The Cross and the Empty Tomb
update public.plan_days pd
set
  reading_context = $tnp$Luke brings Jesus to Jerusalem, the Cross, and the joy of the Resurrection. This reading continues that final movement as Jesus is crucified, dies, is buried, and the women find the empty tomb.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus is seized, denied, mocked, tried, and handed over.$tnp$,
  reading_today_preview = $tnp$Today, Jesus is crucified, dies, is buried, and the women find the empty tomb.$tnp$,
  reading_watch_for = $tnp$Watch how the Resurrection creates witness, worship, and mission.$tnp$,
  reading_key_terms = $tnp$[{"term":"crucifixion","definition":"Jesus' death on the cross, offered in obedience and love."},{"term":"Resurrection","definition":"Jesus' rising from the dead in His glorified body."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$184847d7affde95b4c7eb0db2d83b012455ae04e3b5fd6d2dd7899114aa47223$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 123;

-- Day 124: Luke 24:13-53 - He Opened the Scriptures
update public.plan_days pd
set
  reading_context = $tnp$Luke closes with the risen Jesus meeting disciples on the road, opening the Scriptures, and blessing them. The Gospel ends in worship and mission.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus is crucified, dies, is buried, and the women find the empty tomb.$tnp$,
  reading_today_preview = $tnp$Today, Jesus walks with the disciples, opens Scripture, appears to them, blesses them, and sends them as witnesses.$tnp$,
  reading_watch_for = $tnp$Notice how the risen Lord opens both Scripture and hearts before sending His disciples.$tnp$,
  reading_key_terms = $tnp$[{"term":"Resurrection","definition":"Jesus' rising from the dead in His glorified body."},{"term":"witness","definition":"One who testifies to what God has done."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$1a93b1fbfc5652e865991b9921c1db8abc382fc92109686487f8aab93fd52072$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 124;

-- Day 125: CCC 811-812; 813-816; 823-829; 830-835; 857-865 - One, Holy, Catholic, and Apostolic
update public.plan_days pd
set
  reading_context = $tnp$Luke has ended with opened Scriptures, blessing, and mission. Before John begins, this Sunday names the marks Christ gives His Church.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus walks with the disciples, opens Scripture, appears, blesses, and ascends.$tnp$,
  reading_today_preview = $tnp$Today, the Catechism considers the Church as one, holy, catholic, and apostolic.$tnp$,
  reading_watch_for = $tnp$Notice that the Church's marks come from Christ before they become our responsibility.$tnp$,
  reading_key_terms = $tnp$[{"term":"Church","definition":"The people Christ gathers into His Body through faith and the sacraments."},{"term":"apostle","definition":"One sent by Christ with authority to witness and serve His Church."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$0045d359f4ce750f00015e25272dfb75097f819a69755a19a7663062e58c7265$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 125;

-- Day 126: John 1:1-18 - The Word Became Flesh
update public.plan_days pd
set
  reading_context = $tnp$John begins before creation, with the eternal Word who is with God and is God. The final Gospel opens by naming the mystery behind everything Jesus does.$tnp$,
  previous_reading_summary = $tnp$Yesterday's Catechism reading focused on One, Holy, Catholic, and Apostolic.$tnp$,
  reading_today_preview = $tnp$Today, John proclaims that the Word became flesh and dwelt among us.$tnp$,
  reading_watch_for = $tnp$Notice the movement from light and life to the flesh of Christ. John wants belief to become communion with God.$tnp$,
  reading_key_terms = $tnp$[{"term":"Word","definition":"The eternal Son through whom the Father creates and reveals Himself."},{"term":"Incarnation","definition":"The eternal Son of God taking on human flesh."},{"term":"grace","definition":"God's free gift of divine life and help."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$d6064e938e456165a2b6aca943a45dc0ff58b0a2d9d76ade239f096e58e554d2$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 126;

-- Day 127: John 1:19-51 - Come and See
update public.plan_days pd
set
  reading_context = $tnp$John opens with the Word made flesh and early signs that invite belief. This reading continues that witness as John bears witness and the first disciples come to Jesus.$tnp$,
  previous_reading_summary = $tnp$Yesterday, John reveals the eternal Word who became flesh.$tnp$,
  reading_today_preview = $tnp$Today, John bears witness and the first disciples come to Jesus.$tnp$,
  reading_watch_for = $tnp$Watch how baptism is joined to identity, mission, and the work of the Holy Spirit.$tnp$,
  reading_key_terms = $tnp$[{"term":"baptism","definition":"The sacrament of new birth in Christ and cleansing from sin."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$72ce0cf1361ee838f490b77e87a5c639166ffd999aa64d4304af1e2d3516bc3c$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 127;

-- Day 128: John 2:1-25 - Signs of Glory
update public.plan_days pd
set
  reading_context = $tnp$John opens with the Word made flesh and early signs that invite belief. This reading continues that witness as Jesus changes water into wine and cleanses the temple.$tnp$,
  previous_reading_summary = $tnp$Yesterday, John bears witness and the first disciples come to Jesus.$tnp$,
  reading_today_preview = $tnp$Today, Jesus changes water into wine and cleanses the temple.$tnp$,
  reading_watch_for = $tnp$Watch the pattern of gift, thanksgiving, and abundance. It points toward sacramental life.$tnp$,
  reading_key_terms = $tnp$[{"term":"temple","definition":"The holy place of worship in Jerusalem, where Israel offered sacrifice."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$4656301ab570b9c5b9f46fd1e480fe4999dc43491b547d9116a8d659e95342f0$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 128;

-- Day 129: John 3:1-21 - Born From Above
update public.plan_days pd
set
  reading_context = $tnp$John opens with the Word made flesh and early signs that invite belief. This reading continues that witness as Jesus teaches Nicodemus new birth and God's love.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus changes water into wine and cleanses the temple.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches Nicodemus new birth and God's love.$tnp$,
  reading_watch_for = $tnp$Notice how the child Jesus is received, protected, and revealed as God with us.$tnp$,
  reading_key_terms = $tnp$[{"term":"Incarnation","definition":"The eternal Son of God taking on human flesh."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$79088517456cd41b6a60e99f17ba7afede0d762dc2828861b85e87b1c8fba3e4$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 129;

-- Day 130: John 3:22-36 - He Must Increase
update public.plan_days pd
set
  reading_context = $tnp$John opens with the Word made flesh and early signs that invite belief. This reading continues that witness as John rejoices as Jesus' ministry grows.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches Nicodemus new birth and God's love.$tnp$,
  reading_today_preview = $tnp$Today, John rejoices as Jesus' ministry grows.$tnp$,
  reading_watch_for = $tnp$Watch how baptism is joined to identity, mission, and the work of the Holy Spirit.$tnp$,
  reading_key_terms = $tnp$[{"term":"baptism","definition":"The sacrament of new birth in Christ and cleansing from sin."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$c463d1051aefe1303b43046de0ba9bd9f60c69bed2c67ba7dff267196094e7f1$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 130;

-- Day 131: John 4:1-42 - Living Water
update public.plan_days pd
set
  reading_context = $tnp$John opens with the Word made flesh and early signs that invite belief. This reading continues that witness as Jesus meets the Samaritan woman and her town believes.$tnp$,
  previous_reading_summary = $tnp$Yesterday, John rejoices as Jesus' ministry grows.$tnp$,
  reading_today_preview = $tnp$Today, Jesus meets the Samaritan woman and her town believes.$tnp$,
  reading_watch_for = $tnp$Watch how Jesus leads the Samaritan woman from thirst to faith and witness.$tnp$,
  reading_key_terms = $tnp$[{"term":"living water","definition":"Jesus' image for the life of grace given by the Spirit."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$afa760fdaf6c8f4c9dc1d42562cebee4fec15aa4554f0072f81e8f6f28dea33c$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 131;

-- Day 132: CCC 963-975 - Mary, Mother of Christ and Mother of the Church
update public.plan_days pd
set
  reading_context = $tnp$John has begun with the Word made flesh and the gift of living water. This Sunday considers Mary's motherhood in relation to Christ and His Church.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus meets the Samaritan woman and her town believes.$tnp$,
  reading_today_preview = $tnp$Today, the Catechism considers Mary as Mother of Christ and Mother of the Church.$tnp$,
  reading_watch_for = $tnp$Notice how Mary's role always points to Christ and serves His people.$tnp$,
  reading_key_terms = $tnp$[{"term":"Mary","definition":"The Mother of Jesus and model disciple."},{"term":"Church","definition":"The people Christ gathers into His Body through faith and the sacraments."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$401381fa473034f8555c97b5c7547fd2cc38d786cbc18e432fd1fbf2cd945642$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 132;

-- Day 133: John 4:43-54 - The Official's Son
update public.plan_days pd
set
  reading_context = $tnp$John opens with the Word made flesh and early signs that invite belief. This reading continues that witness as Jesus heals through a word that must be trusted.$tnp$,
  previous_reading_summary = $tnp$Yesterday's Catechism reading focused on Mary, Mother of Christ and Mother of the Church.$tnp$,
  reading_today_preview = $tnp$Today, Jesus heals through a word that must be trusted.$tnp$,
  reading_watch_for = $tnp$Watch how trust is asked for before the whole outcome can be seen.$tnp$,
  reading_key_terms = $tnp$[]$tnp$::jsonb,
  reading_context_source_hash = $tnp$6d96f1397e3726e9993f45d66385b2c601caf5b0283ddc6e858f685d3a4375c2$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 133;

-- Day 134: John 5:1-18 - Rise, Take Up Your Mat
update public.plan_days pd
set
  reading_context = $tnp$John opens with the Word made flesh and early signs that invite belief. This reading continues that witness as Jesus heals at the pool on the Sabbath.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus heals through a word that must be trusted.$tnp$,
  reading_today_preview = $tnp$Today, Jesus heals at the pool on the Sabbath.$tnp$,
  reading_watch_for = $tnp$Watch how Jesus reveals the purpose of worship, mercy, and holy rest.$tnp$,
  reading_key_terms = $tnp$[{"term":"Sabbath","definition":"The holy day of rest and worship given to Israel by God."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$78b444ec04907288d860db5c573f7b7305488fc5ddb4f5bfacc2648e26907657$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 134;

-- Day 135: John 5:19-47 - The Son and the Father
update public.plan_days pd
set
  reading_context = $tnp$John opens with the Word made flesh and early signs that invite belief. This reading continues that witness as Jesus teaches His unity with the Father.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus heals at the pool on the Sabbath.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches His unity with the Father.$tnp$,
  reading_watch_for = $tnp$Notice how prayer reveals trust in the Father and forms the disciple's heart.$tnp$,
  reading_key_terms = $tnp$[]$tnp$::jsonb,
  reading_context_source_hash = $tnp$efc5118d920da0f4b41e85f5ba9997581766b8b54b28953f81545b0e17c55e61$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 135;

-- Day 136: John 6:1-21 - Bread and the Sea
update public.plan_days pd
set
  reading_context = $tnp$John opens with the Word made flesh and early signs that invite belief. This reading continues that witness as Jesus feeds the crowd and comes on the water.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches His unity with the Father.$tnp$,
  reading_today_preview = $tnp$Today, Jesus feeds the crowd and comes on the water.$tnp$,
  reading_watch_for = $tnp$Watch the pattern of gift, thanksgiving, and abundance. It points toward sacramental life.$tnp$,
  reading_key_terms = $tnp$[]$tnp$::jsonb,
  reading_context_source_hash = $tnp$a28d611c6ab1b64449b187286013ddbab0e619822b0fa34c23152c0e5e5541dc$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 136;

-- Day 137: John 6:22-59 - The Bread of Life
update public.plan_days pd
set
  reading_context = $tnp$John now unfolds themes of bread, water, light, feasts, and shepherding. This reading continues those signs as Jesus teaches the bread from heaven and His flesh for life.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus feeds the crowd and comes on the water.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches the bread from heaven and His flesh for life.$tnp$,
  reading_watch_for = $tnp$Watch the pattern of gift, thanksgiving, and abundance. It points toward sacramental life.$tnp$,
  reading_key_terms = $tnp$[{"term":"Eucharist","definition":"The sacrament of Christ's Body and Blood, source and summit of Christian life."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$40c12ceab6cd5041b51a078d861de1e5d8bc6b38820f73398a89263d965e69b0$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 137;

-- Day 138: John 6:60-71 - To Whom Shall We Go?
update public.plan_days pd
set
  reading_context = $tnp$John now unfolds themes of bread, water, light, feasts, and shepherding. This reading continues those signs as Many leave and Peter remains with Jesus.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches the bread from heaven and His flesh for life.$tnp$,
  reading_today_preview = $tnp$Today, Many leave and Peter remains with Jesus.$tnp$,
  reading_watch_for = $tnp$Watch how Jesus gives real pastoral responsibility for the good of His Church.$tnp$,
  reading_key_terms = $tnp$[]$tnp$::jsonb,
  reading_context_source_hash = $tnp$f54b20678a0f22f01b676b4c40681e62fddcee549a7696f81ff40e312486278f$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 138;

-- Day 139: CCC 1213-1228; 1262-1274; 1275-1284 - Baptism and New Life
update public.plan_days pd
set
  reading_context = $tnp$After John 6 and the call to remain with Jesus, this Sunday considers Baptism and new life. The Catechism names the grace that begins Christian life.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Many leave and Peter remains with Jesus.$tnp$,
  reading_today_preview = $tnp$Today, the Catechism considers Baptism, new birth, and life in Christ.$tnp$,
  reading_watch_for = $tnp$Watch how Baptism is gift, cleansing, belonging, and mission.$tnp$,
  reading_key_terms = $tnp$[{"term":"baptism","definition":"The sacrament of new birth in Christ and cleansing from sin."},{"term":"grace","definition":"God's free gift of divine life and help."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$4e6e493d0e416b55f00baed9574fc3c8649d247ea95fd1cea11bafc51c586993$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 139;

-- Day 140: John 7:1-24 - At the Feast
update public.plan_days pd
set
  reading_context = $tnp$John now unfolds themes of bread, water, light, feasts, and shepherding. This reading continues those signs as Jesus goes to the feast and teaches in the temple.$tnp$,
  previous_reading_summary = $tnp$Yesterday's Catechism reading focused on Baptism and New Life.$tnp$,
  reading_today_preview = $tnp$Today, Jesus goes to the feast and teaches in the temple.$tnp$,
  reading_watch_for = $tnp$Notice how Jesus' authority reaches worship, the temple, and the leaders' questions.$tnp$,
  reading_key_terms = $tnp$[{"term":"temple","definition":"The holy place of worship in Jerusalem, where Israel offered sacrifice."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$c6073c2480fb81dca7cb826d902985d95dd755527b5e0fd5bb20634a058cb268$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 140;

-- Day 141: John 7:25-52 - Rivers of Living Water
update public.plan_days pd
set
  reading_context = $tnp$John now unfolds themes of bread, water, light, feasts, and shepherding. This reading continues those signs as the crowd is divided and Jesus promises living water.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus goes to the feast and teaches in the temple.$tnp$,
  reading_today_preview = $tnp$Today, the crowd is divided and Jesus promises living water.$tnp$,
  reading_watch_for = $tnp$Stay close to Jesus' obedience and silence as He freely enters His Passion.$tnp$,
  reading_key_terms = $tnp$[{"term":"Passion","definition":"The suffering and death Jesus freely accepts for our salvation."},{"term":"living water","definition":"Jesus' image for the life of grace given by the Spirit."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$d2f6d08124f991c21f2e1c5c90936644f7426a4dd0975232c2de19a6b8c99c6c$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 141;

-- Day 142: John 7:53-8:11 - Mercy for the Accused Woman
update public.plan_days pd
set
  reading_context = $tnp$John now unfolds themes of bread, water, light, feasts, and shepherding. This reading continues those signs as Jesus shows mercy and calls the woman away from sin.$tnp$,
  previous_reading_summary = $tnp$Yesterday, the crowd is divided and Jesus promises living water.$tnp$,
  reading_today_preview = $tnp$Today, Jesus shows mercy and calls the woman away from sin.$tnp$,
  reading_watch_for = $tnp$Watch how mercy restores real people without pretending sin is harmless.$tnp$,
  reading_key_terms = $tnp$[{"term":"mercy","definition":"God's faithful love toward sinners, the suffering, and the lost."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$cea984fcf477309135f881303bd25c2674997bfd176730e06a066276209aacd3$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 142;

-- Day 143: John 8:12-59 - Light, Freedom, and I AM
update public.plan_days pd
set
  reading_context = $tnp$John now unfolds themes of bread, water, light, feasts, and shepherding. This reading continues those signs as Jesus declares Himself the light of the world and reveals freedom, sonship, Abraham, and His divine identity.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus shows mercy and calls the woman away from sin.$tnp$,
  reading_today_preview = $tnp$Today, Jesus declares Himself the light of the world and reveals freedom, sonship, Abraham, and His divine identity.$tnp$,
  reading_watch_for = $tnp$Notice that disciples are called to be with Jesus before they are sent.$tnp$,
  reading_key_terms = $tnp$[]$tnp$::jsonb,
  reading_context_source_hash = $tnp$3d349fa8e4409e02515f22d6adcaeba268e562272ff78e6c025b90a1afc7aa44$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 143;

-- Day 144: John 9:1-41 - The Man Born Blind
update public.plan_days pd
set
  reading_context = $tnp$John now unfolds themes of bread, water, light, feasts, and shepherding. This reading continues those signs as Jesus heals blindness and exposes spiritual blindness.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus declares Himself the light of the world and reveals freedom, sonship, Abraham, and His divine identity.$tnp$,
  reading_today_preview = $tnp$Today, Jesus heals blindness and exposes spiritual blindness.$tnp$,
  reading_watch_for = $tnp$Watch how the Holy Spirit is promised as the gift who strengthens and teaches the Church.$tnp$,
  reading_key_terms = $tnp$[]$tnp$::jsonb,
  reading_context_source_hash = $tnp$63fd163d7cbdb6d7f3e79021b089c1a0cf94d51892039be98bbeb115b7bee349$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 144;

-- Day 145: John 10:1-21 - The Good Shepherd
update public.plan_days pd
set
  reading_context = $tnp$John now unfolds themes of bread, water, light, feasts, and shepherding. This reading continues those signs as Jesus is the shepherd who lays down His life.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus heals blindness and exposes spiritual blindness.$tnp$,
  reading_today_preview = $tnp$Today, Jesus is the shepherd who lays down His life.$tnp$,
  reading_watch_for = $tnp$Watch how Jesus describes His care as personal, sacrificial, and protective.$tnp$,
  reading_key_terms = $tnp$[{"term":"Good Shepherd","definition":"Jesus' image for His pastoral care and self-giving love."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$1d0033035154f91f204b976cce003044606ca4437c328e2cc02d35b16f1d1c74$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 145;

-- Day 146: CCC 1322-1327; 1337-1344; 1362-1372; 1373-1381 - The Eucharist
update public.plan_days pd
set
  reading_context = $tnp$John has shown Jesus as shepherd and giver of life. This Sunday turns to the Eucharist, the sacrament of Christ's Body and Blood.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus is the shepherd who lays down His life.$tnp$,
  reading_today_preview = $tnp$Today, the Catechism considers the Eucharist as the source and summit of Christian life.$tnp$,
  reading_watch_for = $tnp$Notice how the Eucharist gathers sacrifice, presence, thanksgiving, and communion.$tnp$,
  reading_key_terms = $tnp$[{"term":"Eucharist","definition":"The sacrament of Christ's Body and Blood, source and summit of Christian life."},{"term":"Church","definition":"The people Christ gathers into His Body through faith and the sacraments."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$66dd278bcdafc54b7c4a6f268bd522648b8582537d453e972bb9ad5879ab700e$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 146;

-- Day 147: John 10:22-42 - One With the Father
update public.plan_days pd
set
  reading_context = $tnp$John now unfolds themes of bread, water, light, feasts, and shepherding. This reading continues those signs as Jesus speaks plainly of His unity with the Father.$tnp$,
  previous_reading_summary = $tnp$Yesterday's Catechism reading focused on the Eucharist.$tnp$,
  reading_today_preview = $tnp$Today, Jesus speaks plainly of His unity with the Father.$tnp$,
  reading_watch_for = $tnp$Notice how prayer reveals trust in the Father and forms the disciple's heart.$tnp$,
  reading_key_terms = $tnp$[]$tnp$::jsonb,
  reading_context_source_hash = $tnp$966c1eca145dcc8af8ca32af3c5aa2da5e1674f4002ec0af7facc4cfe6e675af$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 147;

-- Day 148: John 11:1-44 - The Resurrection and the Life
update public.plan_days pd
set
  reading_context = $tnp$John turns toward Jesus' hour through friendship, anointing, service, and the new commandment. This reading continues that turn as Jesus raises Lazarus from the dead.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus speaks plainly of His unity with the Father.$tnp$,
  reading_today_preview = $tnp$Today, Jesus raises Lazarus from the dead.$tnp$,
  reading_watch_for = $tnp$Watch how the Resurrection creates witness, worship, and mission.$tnp$,
  reading_key_terms = $tnp$[{"term":"Resurrection","definition":"Jesus' rising from the dead in His glorified body."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$15848e7620a6397b6da3a6d9449121dadbe62d6af77f84cffb6c4fb34a57d904$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 148;

-- Day 149: John 11:45-12:11 - The Hour Draws Near
update public.plan_days pd
set
  reading_context = $tnp$John turns toward Jesus' hour through friendship, anointing, service, and the new commandment. This reading continues that turn as the leaders plot and Mary anoints Jesus.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus raises Lazarus from the dead.$tnp$,
  reading_today_preview = $tnp$Today, the leaders plot and Mary anoints Jesus.$tnp$,
  reading_watch_for = $tnp$Notice Mary's faithful response and how grace moves through humble obedience.$tnp$,
  reading_key_terms = $tnp$[]$tnp$::jsonb,
  reading_context_source_hash = $tnp$a1b2869f39b06a7856ecf2671a284129d981b1d36670d11f39584be9c503319f$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 149;

-- Day 150: John 12:12-50 - Lifted Up for the World
update public.plan_days pd
set
  reading_context = $tnp$John turns toward Jesus' hour through friendship, anointing, service, and the new commandment. This reading continues that turn as Jesus enters Jerusalem and speaks of His hour.$tnp$,
  previous_reading_summary = $tnp$Yesterday, the leaders plot and Mary anoints Jesus.$tnp$,
  reading_today_preview = $tnp$Today, Jesus enters Jerusalem and speaks of His hour.$tnp$,
  reading_watch_for = $tnp$Notice how Jesus' authority reaches worship, the temple, and the leaders' questions.$tnp$,
  reading_key_terms = $tnp$[]$tnp$::jsonb,
  reading_context_source_hash = $tnp$34ef9355556fe43dd82a0abbd2311ee7dae3f2f667f58a65ce5dbd093f4c62cf$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 150;

-- Day 151: John 13:1-30 - He Loved Them to the End
update public.plan_days pd
set
  reading_context = $tnp$John turns toward Jesus' hour through friendship, anointing, service, and the new commandment. This reading continues that turn as Jesus washes feet and identifies His betrayer.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus enters Jerusalem and speaks of His hour.$tnp$,
  reading_today_preview = $tnp$Today, Jesus washes feet and identifies His betrayer.$tnp$,
  reading_watch_for = $tnp$Notice that disciples are called to be with Jesus before they are sent.$tnp$,
  reading_key_terms = $tnp$[]$tnp$::jsonb,
  reading_context_source_hash = $tnp$0b242728ab477159e3aee7723ce49868df0d33be4211e85a11d9b893a81a2dbf$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 151;

-- Day 152: John 13:31-14:14 - The Way to the Father
update public.plan_days pd
set
  reading_context = $tnp$John turns toward Jesus' hour through friendship, anointing, service, and the new commandment. This reading continues that turn as Jesus gives the new commandment and reveals the way.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus washes feet and identifies His betrayer.$tnp$,
  reading_today_preview = $tnp$Today, Jesus gives the new commandment and reveals the way.$tnp$,
  reading_watch_for = $tnp$Watch how Jesus gives real pastoral responsibility for the good of His Church.$tnp$,
  reading_key_terms = $tnp$[]$tnp$::jsonb,
  reading_context_source_hash = $tnp$b381e4eb47516f878d4c1ad8437fa543c278fa89e6cdd5445dd4fe8aecd2a824$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 152;

-- Day 153: CCC 2599-2606; 2607-2616; 2759-2764; 2777-2785 - The Prayer of Jesus and the Lord's Prayer
update public.plan_days pd
set
  reading_context = $tnp$John's farewell discourse has led into Jesus' words about the Father. This Sunday considers the prayer of Jesus and the prayer He gives His disciples.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus gives the new commandment and reveals the way.$tnp$,
  reading_today_preview = $tnp$Today, the Catechism considers Jesus' prayer and the Lord's Prayer.$tnp$,
  reading_watch_for = $tnp$Notice how Christian prayer begins with Jesus' own relationship to the Father.$tnp$,
  reading_key_terms = $tnp$[{"term":"faith","definition":"Trusting God and receiving what He reveals."},{"term":"disciple","definition":"One who follows Jesus, learns from Him, and lives under His teaching."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$b2a5a7456522d60efee76637f5a3df6e44ad5e566ce259872004071a24587956$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 153;

-- Day 154: John 14:15-31 - The Spirit and Peace
update public.plan_days pd
set
  reading_context = $tnp$John's farewell discourse prepares the disciples for the Cross, the Spirit, and mission. This reading continues that preparation as Jesus promises the Advocate and gives His peace.$tnp$,
  previous_reading_summary = $tnp$Yesterday's Catechism reading focused on the Prayer of Jesus and the Lord's Prayer.$tnp$,
  reading_today_preview = $tnp$Today, Jesus promises the Advocate and gives His peace.$tnp$,
  reading_watch_for = $tnp$Watch how the Holy Spirit is promised as the gift who strengthens and teaches the Church.$tnp$,
  reading_key_terms = $tnp$[{"term":"Holy Spirit","definition":"The third Person of the Trinity, given by the Father and the Son."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$4d2b38cb6da7276773890dd6aeeadbf18620787149951ae2a5283f8ee382ed42$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 154;

-- Day 155: John 15:1-27 - Abide in Me
update public.plan_days pd
set
  reading_context = $tnp$John's farewell discourse prepares the disciples for the Cross, the Spirit, and mission. This reading continues that preparation as Jesus teaches the vine, love, friendship, and witness.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus promises the Advocate and gives His peace.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches the vine, love, friendship, and witness.$tnp$,
  reading_watch_for = $tnp$Watch the word abide. Jesus describes discipleship as living communion with Him.$tnp$,
  reading_key_terms = $tnp$[]$tnp$::jsonb,
  reading_context_source_hash = $tnp$ec2717b40e77f291f94d4e5bfcd6e6da386b807b748abc59bf58dcb6efd791f1$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 155;

-- Day 156: John 16:1-33 - Sorrow Turned to Joy
update public.plan_days pd
set
  reading_context = $tnp$Jesus is still speaking to the disciples before His Passion. He prepares them for sorrow, the Spirit's help, and the peace that remains in Him.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches the vine, love, friendship, and witness.$tnp$,
  reading_today_preview = $tnp$Today, Jesus teaches about the Spirit, coming sorrow, prayer, and His victory over the world.$tnp$,
  reading_watch_for = $tnp$Notice that Jesus does not deny tribulation. He gives peace from within His victory.$tnp$,
  reading_key_terms = $tnp$[{"term":"Holy Spirit","definition":"The third Person of the Trinity, given by the Father and the Son."},{"term":"faith","definition":"Trusting God and receiving what He reveals."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$f8d5df124d87f23d47bb6d66bdc055d595367c9efaffecf459b790c3f13e7a82$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 156;

-- Day 157: John 17:1-26 - The Prayer of Jesus
update public.plan_days pd
set
  reading_context = $tnp$The farewell discourse becomes prayer. Jesus turns to the Father and prays for His disciples and for those who will believe through their word.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus teaches the Spirit, prayer, and His victory.$tnp$,
  reading_today_preview = $tnp$Today, Jesus prays to the Father for glory, unity, holiness, and the mission of His disciples.$tnp$,
  reading_watch_for = $tnp$Notice that Jesus prays before He suffers. His prayer reveals His love for the Father and His people.$tnp$,
  reading_key_terms = $tnp$[{"term":"disciple","definition":"One who follows Jesus, learns from Him, and lives under His teaching."},{"term":"Church","definition":"The people Christ gathers into His Body through faith and the sacraments."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$24a02fd10d8c522860a08f292d577256ff4cfd08cd9abde6aca8ea30f633b131$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 157;

-- Day 158: John 18:1-27 - Arrested and Denied
update public.plan_days pd
set
  reading_context = $tnp$John brings the Gospel to Jesus' Passion and Resurrection. This reading continues that final witness as Jesus is arrested and Peter denies Him.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus prays to the Father for His disciples.$tnp$,
  reading_today_preview = $tnp$Today, Jesus is arrested and Peter denies Him.$tnp$,
  reading_watch_for = $tnp$Stay close to Jesus' obedience and silence as He freely enters His Passion.$tnp$,
  reading_key_terms = $tnp$[{"term":"Passion","definition":"The suffering and death Jesus freely accepts for our salvation."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$bb6822efe2baa7081fcad262f8a9608c256403f42c74cd79f7e66fe9befc5fd3$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 158;

-- Day 159: John 18:28-19:16 - Behold the Man
update public.plan_days pd
set
  reading_context = $tnp$Jesus stands before Pilate as the Passion moves toward the Cross. Human judgment is confused, but Christ remains faithful.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus is arrested and Peter denies Him.$tnp$,
  reading_today_preview = $tnp$Today, Jesus is questioned, mocked, presented to the crowd, and handed over to be crucified.$tnp$,
  reading_watch_for = $tnp$Notice the words "Behold the man." John shows Jesus' kingship through suffering and humiliation.$tnp$,
  reading_key_terms = $tnp$[{"term":"Passion","definition":"The suffering and death Jesus freely accepts for our salvation."},{"term":"kingship","definition":"Christ's royal authority, revealed through humility and the Cross."},{"term":"crucifixion","definition":"Jesus' death on the cross, offered in obedience and love."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$1bd3ab5930a8826356f1c3adbd1045dcaf57d528ecc00470e77766b1982e615b$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 159;

-- Day 160: CCC 1422-1433; 1440-1449; 1450-1460; 1480-1484 - Conversion, Penance, and Preparing for Lent
update public.plan_days pd
set
  reading_context = $tnp$This final Sunday before Lent turns from John's Passion narrative toward conversion. The Catechism prepares the season to close with penance, confession, and mercy.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus stands before Pilate and is handed over.$tnp$,
  reading_today_preview = $tnp$Today, the Catechism considers conversion, penance, confession, and preparing for Lent.$tnp$,
  reading_watch_for = $tnp$Notice that penance is not self-punishment. It is a return to the Father through Christ's mercy.$tnp$,
  reading_key_terms = $tnp$[{"term":"conversion","definition":"A real turning of heart and life toward God."},{"term":"confession","definition":"The sacrament where sins are confessed and forgiven through Christ's mercy."},{"term":"mercy","definition":"God's faithful love toward sinners, the suffering, and the lost."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$715bb29e35de51f93f81235bb1a25a64e2983a32c9d8511dee4c7195cb04defa$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 160;

-- Day 161: John 19:17-20:18 - It Is Finished and He Is Risen
update public.plan_days pd
set
  reading_context = $tnp$The season reaches the Cross, the tomb, and the first Easter witness. John shows Jesus' death, burial, and appearance to Mary Magdalene.$tnp$,
  previous_reading_summary = $tnp$Yesterday's Catechism reading focused on Conversion, Penance, and Preparing for Lent.$tnp$,
  reading_today_preview = $tnp$Today, Jesus is crucified, dies, is buried, and appears to Mary Magdalene at the empty tomb.$tnp$,
  reading_watch_for = $tnp$Watch the movement from "It is finished" to Mary's name being spoken by the risen Lord.$tnp$,
  reading_key_terms = $tnp$[{"term":"Passion","definition":"The suffering and death Jesus freely accepts for our salvation."},{"term":"crucifixion","definition":"Jesus' death on the cross, offered in obedience and love."},{"term":"Resurrection","definition":"Jesus' rising from the dead in His glorified body."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$4a7710e11a7e6570c16d3f38cc8d3afcaecab8394d9c2622528b6859bf435aec$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 161;

-- Day 162: John 20:19-21:25 - Peace, Thomas, and Peter
update public.plan_days pd
set
  reading_context = $tnp$The season closes with the risen Jesus giving peace, mercy, and mission. John ends by restoring faith, Peter's love, and the witness of the beloved disciple.$tnp$,
  previous_reading_summary = $tnp$Yesterday, Jesus is crucified, dies, is buried, and appears to Mary Magdalene.$tnp$,
  reading_today_preview = $tnp$Today, Jesus appears to the disciples, gives the authority to forgive sins, meets Thomas' doubt, and restores Peter.$tnp$,
  reading_watch_for = $tnp$Notice how the wounds of Christ remain visible after the Resurrection. Peace, mercy, and mission all flow from the risen Lord.$tnp$,
  reading_key_terms = $tnp$[{"term":"Resurrection","definition":"Jesus' rising from the dead in His glorified body."},{"term":"forgiveness of sins","definition":"Christ's mercy freeing sinners from guilt and restoring communion with God."},{"term":"witness","definition":"One who testifies to what God has done."}]$tnp$::jsonb,
  reading_context_source_hash = $tnp$6711c04cb6f7d6066e9df080e209e762bc14df79438f1530704f6d4e6f01010d$tnp$
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = $tnp$the-gospels-september-lent$tnp$
  and cp.is_active = false
  and pd.day_number = 162;


commit;
