begin;

-- Reviewed reading context import for plan: the-narrow-path-90

-- Plan: the-narrow-path-90
-- Day: 57
update public.plan_days pd
set
  reading_context = 'We return from the Catechism pause to Paul waiting alone in Athens.',
  previous_reading_summary = 'Day 56 paused the Acts story to explain the human desire for God and the need for revelation. It prepared us to see why Paul can speak to religious seekers without pretending their idols are enough.',
  reading_today_preview = 'Paul sees a city full of idols and begins speaking in the synagogue and marketplace. Philosophers bring him to the Areopagus to hear more about his teaching.',
  reading_watch_for = 'Notice that Paul is patient with the Athenians, but not indifferent to their false worship.',
  reading_key_terms = '[{"term":"Athens","definition":"A Greek city known for philosophy, temples, and public debate."},{"term":"Idols","definition":"False gods or images wrongly treated as divine."},{"term":"Areopagus","definition":"A public place in Athens where ideas were discussed and judged."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-57-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 57;

-- Plan: the-narrow-path-90
-- Day: 58
update public.plan_days pd
set
  reading_context = 'Paul now stands before the Athenians at the Areopagus.',
  previous_reading_summary = 'Paul was provoked by the idols in Athens and began speaking about Jesus and the Resurrection. The philosophers wanted to hear this strange teaching more fully.',
  reading_today_preview = 'Paul begins with their altar to an unknown god and proclaims the true God who made all things. He calls them to repent because God will judge the world through the risen Christ.',
  reading_watch_for = 'Notice that Paul begins where they are, but he does not leave them there.',
  reading_key_terms = '[{"term":"Unknown god","definition":"An altar in Athens that Paul uses as a starting point for preaching."},{"term":"Repent","definition":"To turn away from sin and return to God."},{"term":"Resurrection","definition":"Jesus rising bodily from the dead."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-58-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 58;

-- Plan: the-narrow-path-90
-- Day: 59
update public.plan_days pd
set
  reading_context = 'After Athens, Paul moves to Corinth, a major city where he will stay and teach for a long time.',
  previous_reading_summary = 'Paul preached to the Athenians from their search for God toward the true God and the risen Christ. Some mocked, some wanted to hear more, and some believed.',
  reading_today_preview = 'Paul works as a tentmaker with Aquila and Priscilla while teaching in the synagogue. Opposition grows, but the Lord tells Paul not to be afraid and to keep speaking.',
  reading_watch_for = 'Notice that mission can include ordinary work, steady teaching, and perseverance over time.',
  reading_key_terms = '[{"term":"Corinth","definition":"A major Greek city where Paul teaches for an extended time."},{"term":"Aquila and Priscilla","definition":"A married Christian couple who work with Paul."},{"term":"Tentmaker","definition":"Paul’s trade, which he practices while preaching."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-59-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 59;

-- Plan: the-narrow-path-90
-- Day: 60
update public.plan_days pd
set
  reading_context = 'Paul’s mission continues through Corinth, Ephesus, and other cities, while new teachers begin to appear.',
  previous_reading_summary = 'Paul worked and preached steadily in Corinth. The Lord encouraged him to keep speaking because there were many people in the city who would belong to God.',
  reading_today_preview = 'Paul faces an accusation before Gallio and then travels on. Apollos, an eloquent teacher, arrives with zeal but needs fuller instruction from Priscilla and Aquila.',
  reading_watch_for = 'Notice that gifts and zeal are good, but they still need formation in the full truth.',
  reading_key_terms = '[{"term":"Apollos","definition":"A gifted preacher who receives fuller instruction in the faith."},{"term":"Gallio","definition":"A Roman official who refuses to judge the dispute against Paul."},{"term":"Formation","definition":"Being taught and shaped more deeply in the faith."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-60-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 60;

-- Plan: the-narrow-path-90
-- Day: 61
update public.plan_days pd
set
  reading_context = 'Paul arrives in Ephesus and meets disciples whose understanding of baptism is incomplete.',
  previous_reading_summary = 'Apollos was zealous and gifted, but Priscilla and Aquila helped him receive fuller instruction. His story showed that sincere faith can still need deeper teaching.',
  reading_today_preview = 'Paul learns that some disciples only know John’s baptism. They are baptized in the name of Jesus, receive the Holy Spirit through Paul’s laying on of hands, and the word spreads through Ephesus.',
  reading_watch_for = 'Notice that baptism and the gift of the Spirit are not treated as empty symbols, but as real gifts Christ gives through the Church.',
  reading_key_terms = '[{"term":"John’s baptism","definition":"A baptism of repentance that prepared people for Jesus."},{"term":"Ephesus","definition":"A major city where Paul teaches for a long period."},{"term":"The Way","definition":"An early name for the Christian faith."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-61-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 61;

-- Plan: the-narrow-path-90
-- Day: 62
update public.plan_days pd
set
  reading_context = 'Paul’s ministry in Ephesus is powerful, but others try to use Jesus’ name without belonging to him.',
  previous_reading_summary = 'Paul found disciples who only knew John’s baptism and led them into baptism in Jesus’ name. They received the Holy Spirit, and Paul continued teaching in Ephesus.',
  reading_today_preview = 'God works extraordinary miracles through Paul, but the sons of Sceva are exposed when they try to use Jesus’ name like magic. Many believers confess their sins, renounce magic, and burn their books.',
  reading_watch_for = 'Notice that the name of Jesus calls for conversion, not spiritual technique.',
  reading_key_terms = '[{"term":"Seven sons of Sceva","definition":"Men who try to use Jesus’ name without true authority."},{"term":"Exorcism","definition":"The casting out of an evil spirit by God’s authority."},{"term":"Confession","definition":"Openly admitting sin and turning from it."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-62-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 62;

-- Plan: the-narrow-path-90
-- Day: 63
update public.plan_days pd
set
  reading_context = 'The plan pauses the Acts narrative to connect Paul’s leadership and the Church’s visible structure with Catholic teaching on ordained ministry.',
  previous_reading_summary = 'In Ephesus, false spiritual power was exposed and many believers turned away from magic. The word of the Lord grew stronger as people submitted to Christ.',
  reading_today_preview = 'The Catechism explains bishops, priests, and deacons as part of Holy Orders. It helps ordinary readers see that visible leadership belongs to Christ’s plan for the Church.',
  reading_watch_for = 'Notice that Church leadership is meant for service, teaching, and guarding the flock, not personal status.',
  reading_key_terms = '[{"term":"Bishop","definition":"A successor of the apostles who shepherds and teaches the Church."},{"term":"Priest","definition":"An ordained minister who serves with the bishop."},{"term":"Deacon","definition":"An ordained minister called especially to service."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-63-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 63;

-- Plan: the-narrow-path-90
-- Day: 64
update public.plan_days pd
set
  reading_context = 'We return from the Catechism pause to Ephesus, where Paul’s preaching is disturbing the city’s idol business.',
  previous_reading_summary = 'Day 63 paused to explain bishops, priests, deacons, and apostolic continuity. It clarified that visible Church leadership is part of Christ’s care for his people.',
  reading_today_preview = 'A silversmith named Demetrius stirs up a riot because the gospel threatens the trade built around Artemis. The city falls into confusion before the town clerk calms the crowd.',
  reading_watch_for = 'Notice that false worship is often tied to money, pride, and local identity.',
  reading_key_terms = '[{"term":"Artemis","definition":"A pagan goddess worshiped in Ephesus."},{"term":"Demetrius","definition":"A silversmith who profits from making shrines."},{"term":"Idol-driven economy","definition":"Business built around false worship."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-64-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 64;

-- Plan: the-narrow-path-90
-- Day: 65
update public.plan_days pd
set
  reading_context = 'After the riot in Ephesus, Paul travels through the churches and eventually comes to Troas.',
  previous_reading_summary = 'In Ephesus, the gospel threatened the business surrounding Artemis. A riot broke out, showing how deeply false worship can be tied to money and civic pride.',
  reading_today_preview = 'Paul encourages the believers as he travels, then gathers with the Church in Troas to break bread. A young man named Eutychus falls from a window and dies, but Paul raises him.',
  reading_watch_for = 'Notice the mix of worship, teaching, exhaustion, and tenderness in ordinary Church life.',
  reading_key_terms = '[{"term":"Troas","definition":"The city where Eutychus falls during Paul’s long teaching."},{"term":"Eutychus","definition":"A young man whom Paul raises after a fatal fall."},{"term":"Break bread","definition":"An early Christian phrase connected with the Eucharist."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-65-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 65;

-- Plan: the-narrow-path-90
-- Day: 66
update public.plan_days pd
set
  reading_context = 'Paul is traveling toward Jerusalem and calls the elders of Ephesus to meet him at Miletus.',
  previous_reading_summary = 'Paul traveled through the churches, encouraged the disciples, and gathered with believers in Troas. When Eutychus died after falling, Paul raised him and comforted the community.',
  reading_today_preview = 'Paul reviews his ministry among the Ephesians, marked by humility, tears, public teaching, and courage. He says the Holy Spirit warns him that imprisonment and suffering await.',
  reading_watch_for = 'Notice that Paul measures his life by completing the mission Christ gave him.',
  reading_key_terms = '[{"term":"Miletus","definition":"The city where Paul meets the elders from Ephesus."},{"term":"Elders","definition":"Leaders entrusted with shepherding the Church."},{"term":"Repentance","definition":"Turning away from sin and toward God."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-66-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 66;

-- Plan: the-narrow-path-90
-- Day: 67
update public.plan_days pd
set
  reading_context = 'Paul continues his farewell charge to the elders of Ephesus.',
  previous_reading_summary = 'Paul reminded the elders how he had served with humility, tears, and courage. He told them he was going to Jerusalem even though suffering awaited him.',
  reading_today_preview = 'Paul tells the elders to guard themselves and the flock because danger will come from outside and inside. He commends them to God, prays with them, and says goodbye with tears.',
  reading_watch_for = 'Notice that shepherding the Church means protecting real people from real spiritual danger.',
  reading_key_terms = '[{"term":"Flock","definition":"A biblical image for God’s people under shepherding care."},{"term":"Guardians","definition":"Leaders charged with watching over the Church."},{"term":"Whole counsel of God","definition":"The full teaching God entrusted to be proclaimed."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-67-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 67;

-- Plan: the-narrow-path-90
-- Day: 68
update public.plan_days pd
set
  reading_context = 'Paul continues toward Jerusalem, and believers along the way sense that suffering is ahead.',
  previous_reading_summary = 'Paul charged the Ephesian elders to guard the flock and stay alert. He warned that dangers would come and entrusted them to God’s grace.',
  reading_today_preview = 'Paul visits disciples in several places, prays with them, and hears warnings about what awaits him. Even when Agabus foretells his arrest, Paul says he is ready to suffer and die for the name of Jesus.',
  reading_watch_for = 'Notice that Paul’s courage is not recklessness; it is obedience with open eyes.',
  reading_key_terms = '[{"term":"Agabus","definition":"A prophet who warns Paul about his coming arrest."},{"term":"Jerusalem","definition":"The city Paul is determined to reach despite danger."},{"term":"Name of Jesus","definition":"Jesus’ authority, identity, and saving mission."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-68-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 68;

-- Plan: the-narrow-path-90
-- Day: 69
update public.plan_days pd
set
  reading_context = 'Paul arrives in Jerusalem and meets James and the elders of the Church.',
  previous_reading_summary = 'Paul traveled toward Jerusalem despite repeated warnings. He accepted the suffering ahead because fidelity to Jesus mattered more than safety.',
  reading_today_preview = 'Paul reports what God has done among the Gentiles, and the leaders glorify God. To preserve peace with Jewish believers, they ask Paul to take part in a purification rite, and he agrees.',
  reading_watch_for = 'Notice that Paul’s courage includes humble cooperation with Church leaders.',
  reading_key_terms = '[{"term":"James","definition":"A leading apostle in Jerusalem."},{"term":"Purification","definition":"A Jewish ritual practice connected with temple worship."},{"term":"Pastoral request","definition":"A practical request made for the good and peace of the Church."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-69-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 69;

-- Plan: the-narrow-path-90
-- Day: 70
update public.plan_days pd
set
  reading_context = 'The plan pauses the Acts narrative to connect Paul’s courage and integrity with Catholic teaching on virtue.',
  previous_reading_summary = 'Paul met James and the elders in Jerusalem and submitted to a difficult request for the sake of unity. His strength showed itself in obedience, not self-importance.',
  reading_today_preview = 'The Catechism explains the virtues, especially fortitude and justice. These virtues help Christians do the good with courage, steadiness, and fairness in real situations.',
  reading_watch_for = 'Notice that virtue is practical: it forms what a person actually chooses under pressure.',
  reading_key_terms = '[{"term":"Virtue","definition":"A firm habit of doing the good."},{"term":"Fortitude","definition":"Courage and steadiness in difficulty."},{"term":"Justice","definition":"Giving God and neighbor what is due."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-70-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 70;

commit;
