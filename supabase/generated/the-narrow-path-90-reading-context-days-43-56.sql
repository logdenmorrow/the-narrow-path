begin;

-- Reviewed reading context import for plan: the-narrow-path-90

-- Plan: the-narrow-path-90
-- Day: 43
update public.plan_days pd
set
  reading_context = 'We return from the Catechism pause to Paul’s synagogue sermon in Antioch of Pisidia.',
  previous_reading_summary = 'Day 42 paused the Acts story to explain the Church’s missionary mandate. It clarified that evangelization belongs to the Church’s identity because Christ sends her to all nations.',
  reading_today_preview = 'Paul proclaims that God has fulfilled his promises by raising Jesus from the dead. He announces forgiveness through Christ and warns his hearers not to reject what God is doing.',
  reading_watch_for = 'Notice that Paul presents the Resurrection as God keeping his promises, not as a break from Israel’s story.',
  reading_key_terms = '[{"term":"Justification","definition":"Being made right with God by his saving grace."},{"term":"Holy One","definition":"A title Paul applies to Jesus in speaking about the Resurrection."},{"term":"David","definition":"Israel’s king whose promises point forward to Christ."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-43-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 43;

-- Plan: the-narrow-path-90
-- Day: 44
update public.plan_days pd
set
  reading_context = 'Paul and Barnabas have finished preaching in the synagogue, and the whole city is stirred by their message.',
  previous_reading_summary = 'Paul announced that God fulfilled his promises by raising Jesus. He offered forgiveness in Christ and warned the people not to reject God’s work.',
  reading_today_preview = 'Many people want to hear more, but jealousy rises when large crowds gather. Paul and Barnabas turn openly toward the Gentiles, who rejoice at the word of the Lord.',
  reading_watch_for = 'Notice how the same gospel brings joy in some hearts and envy in others.',
  reading_key_terms = '[{"term":"Gentiles","definition":"Non-Jewish peoples."},{"term":"Grace of God","definition":"God’s free gift and help."},{"term":"Light for the Gentiles","definition":"A Scripture image for God’s salvation reaching the nations."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-44-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 44;

-- Plan: the-narrow-path-90
-- Day: 45
update public.plan_days pd
set
  reading_context = 'Paul and Barnabas continue their mission through Iconium, Lystra, and the surrounding region.',
  previous_reading_summary = 'The Gentiles rejoiced when Paul and Barnabas preached that salvation was going to the nations. Opposition grew, but the disciples were filled with joy and the Holy Spirit.',
  reading_today_preview = 'Many believe in Iconium, but division and danger force Paul and Barnabas onward. In Lystra, Paul heals a lame man, and the crowd wrongly tries to worship the missionaries as gods.',
  reading_watch_for = 'Notice how Paul and Barnabas refuse attention that belongs only to the living God.',
  reading_key_terms = '[{"term":"Iconium","definition":"A city where Paul and Barnabas preach with boldness."},{"term":"Lystra","definition":"The city where Paul heals a man and is mistaken for a god."},{"term":"Idolatry","definition":"Giving worship to someone or something that is not God."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-45-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 45;

-- Plan: the-narrow-path-90
-- Day: 46
update public.plan_days pd
set
  reading_context = 'The misunderstanding in Lystra turns dangerous as opposition follows Paul from earlier cities.',
  previous_reading_summary = 'Paul healed a lame man in Lystra, but the crowd misunderstood the miracle and tried to worship Paul and Barnabas. The apostles redirected them toward the living God.',
  reading_today_preview = 'Paul is stoned and left for dead, but he gets up and continues the mission. He and Barnabas return through the cities, strengthen the disciples, appoint elders, and report back to Antioch.',
  reading_watch_for = 'Notice that the apostles strengthen new believers by telling them the truth about suffering.',
  reading_key_terms = '[{"term":"Tribulation","definition":"Serious hardship or suffering."},{"term":"Elders","definition":"Leaders appointed to shepherd local churches."},{"term":"Antioch","definition":"The sending church where Paul and Barnabas report what God has done."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-46-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 46;

-- Plan: the-narrow-path-90
-- Day: 47
update public.plan_days pd
set
  reading_context = 'After the Gentile mission grows, a serious dispute arises over whether Gentile converts must keep the law of Moses.',
  previous_reading_summary = 'Paul suffered violence but continued strengthening the disciples. He and Barnabas appointed elders and returned to Antioch to report how God opened a door of faith to the Gentiles.',
  reading_today_preview = 'Some men claim Gentiles must be circumcised to be saved, so Paul and Barnabas go to Jerusalem. The apostles and elders gather, and Peter reminds them how God gave the Holy Spirit to the Gentiles.',
  reading_watch_for = 'Notice that the Church faces the doctrinal conflict openly through apostolic authority.',
  reading_key_terms = '[{"term":"Circumcision","definition":"The Old Covenant sign given to Abraham’s descendants."},{"term":"Law of Moses","definition":"The commandments and practices given to Israel through Moses."},{"term":"Council of Jerusalem","definition":"The meeting where the apostles and elders address the Gentile question."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-47-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 47;

-- Plan: the-narrow-path-90
-- Day: 48
update public.plan_days pd
set
  reading_context = 'The Council of Jerusalem continues after Peter, Paul, and Barnabas speak about God’s work among the Gentiles.',
  previous_reading_summary = 'The apostles and elders gathered to address whether Gentile converts needed circumcision. Peter testified that God gave the Holy Spirit to Gentiles and purified their hearts by faith.',
  reading_today_preview = 'James reads the Gentile mission in light of Scripture and gives his judgment. He says Gentile converts should not be troubled with the full Mosaic law but should avoid practices tied to idolatry and immorality.',
  reading_watch_for = 'Notice that James seeks both truth and peace for the whole Church.',
  reading_key_terms = '[{"term":"James","definition":"A leading apostle in Jerusalem who gives judgment at the council."},{"term":"Prophets","definition":"Old Testament witnesses James uses to interpret what God is doing."},{"term":"Idols","definition":"False gods or images wrongly treated as divine."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-48-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 48;

-- Plan: the-narrow-path-90
-- Day: 49
update public.plan_days pd
set
  reading_context = 'The plan pauses the Acts narrative to connect the Council of Jerusalem with Catholic teaching on apostolic teaching authority.',
  previous_reading_summary = 'James gave judgment at the council by reading the Gentile mission in light of Scripture and God’s action. The Church sought a faithful decision that protected unity.',
  reading_today_preview = 'The Catechism explains the Magisterium, Tradition, and the faithful reception of the Church’s teaching. It helps name what Acts is showing when the apostles teach and judge together.',
  reading_watch_for = 'Notice that the Church’s teaching authority serves the truth Christ entrusted to her.',
  reading_key_terms = '[{"term":"Magisterium","definition":"The Church’s living teaching office."},{"term":"Tradition","definition":"The faith handed on from the apostles in the life of the Church."},{"term":"Dogma","definition":"A truth of faith definitively taught by the Church."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-49-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 49;

-- Plan: the-narrow-path-90
-- Day: 50
update public.plan_days pd
set
  reading_context = 'We return from the Catechism pause to the Council of Jerusalem sending its decision to the Gentile believers.',
  previous_reading_summary = 'Day 49 paused to explain Magisterium and Tradition. It clarified why the Church can teach with authority while remaining faithful to what Christ gave the apostles.',
  reading_today_preview = 'The apostles and elders send a letter with chosen messengers to Antioch. The Gentile believers receive the decision with encouragement and joy.',
  reading_watch_for = 'Notice that the council’s teaching is communicated clearly for the peace of real communities.',
  reading_key_terms = '[{"term":"Apostolic decree","definition":"The council’s decision sent to Gentile believers."},{"term":"Silas","definition":"A leading believer sent to deliver and confirm the council’s message."},{"term":"Communion","definition":"Shared life and unity in the Church."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-50-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 50;

-- Plan: the-narrow-path-90
-- Day: 51
update public.plan_days pd
set
  reading_context = 'After the Council of Jerusalem, Paul wants to revisit the churches from the first missionary journey.',
  previous_reading_summary = 'The council’s letter was delivered to Antioch, where it brought encouragement. The Church did not leave the Gentile question vague but gave a clear apostolic decision.',
  reading_today_preview = 'Paul and Barnabas separate over John Mark, and Paul continues with Silas. Timothy joins the mission, and Paul receives a vision calling him to Macedonia.',
  reading_watch_for = 'Notice that real conflict does not stop the mission when the Church remains under God’s providence.',
  reading_key_terms = '[{"term":"Timothy","definition":"A young disciple who joins Paul’s missionary work."},{"term":"Macedonia","definition":"A region north of Greece where Paul is called to preach."},{"term":"Providence","definition":"God’s wise care and guidance over events."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-51-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 51;

-- Plan: the-narrow-path-90
-- Day: 52
update public.plan_days pd
set
  reading_context = 'Paul and his companions cross into Macedonia and arrive at Philippi.',
  previous_reading_summary = 'Paul and Barnabas separated, but the mission continued. Timothy joined Paul, and a vision led the missionaries toward Macedonia.',
  reading_today_preview = 'Lydia hears Paul by the riverside, the Lord opens her heart, and she is baptized with her household. Later, Paul casts a spirit out of a slave girl, and he and Silas are beaten and imprisoned.',
  reading_watch_for = 'Notice that the gospel meets both a receptive heart and spiritual opposition in the same city.',
  reading_key_terms = '[{"term":"Philippi","definition":"A Roman colony in Macedonia where Paul begins preaching."},{"term":"Lydia","definition":"A worshiper of God whose household is baptized."},{"term":"Exorcism","definition":"The casting out of an evil spirit by God’s authority."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-52-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 52;

-- Plan: the-narrow-path-90
-- Day: 53
update public.plan_days pd
set
  reading_context = 'Paul and Silas are in the inner prison at Philippi after being beaten for freeing the slave girl.',
  previous_reading_summary = 'Lydia received the gospel and was baptized with her household. Paul then cast out a spirit from a slave girl, which led to anger, public beating, and prison.',
  reading_today_preview = 'Paul and Silas pray and sing in prison, and an earthquake opens the doors. The jailer asks how to be saved, hears the word of the Lord, and is baptized with his household.',
  reading_watch_for = 'Notice that Paul protects the jailer’s life before preaching to him.',
  reading_key_terms = '[{"term":"Jailer","definition":"The prison guard who asks Paul and Silas how to be saved."},{"term":"Household","definition":"A family or home community gathered into the faith together."},{"term":"Baptism","definition":"The sacrament by which a person is washed, forgiven, and brought into the Church."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-53-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 53;

-- Plan: the-narrow-path-90
-- Day: 54
update public.plan_days pd
set
  reading_context = 'The morning after the jailer’s baptism, the officials in Philippi try to release Paul and Silas quietly.',
  previous_reading_summary = 'Paul and Silas prayed in prison, and God opened the doors. The jailer and his household heard the gospel, were baptized, and rejoiced.',
  reading_today_preview = 'Paul reveals that he and Silas are Roman citizens who were beaten without trial. The officials apologize, and Paul and Silas encourage the believers before leaving.',
  reading_watch_for = 'Notice that Christian humility can still insist on justice when the truth and the Church’s good require it.',
  reading_key_terms = '[{"term":"Roman citizen","definition":"A legal status that gave Paul certain rights under Roman law."},{"term":"Magistrates","definition":"Local officials responsible for public order."},{"term":"Vindication","definition":"A public clearing or defense after wrongdoing."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-54-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 54;

-- Plan: the-narrow-path-90
-- Day: 55
update public.plan_days pd
set
  reading_context = 'Paul and Silas leave Philippi and continue preaching in the cities of Thessalonica and Beroea.',
  previous_reading_summary = 'Paul used his Roman citizenship to require public accountability from the officials in Philippi. He and Silas encouraged the believers before departing.',
  reading_today_preview = 'In Thessalonica, some believe while others stir up a mob against the Christians. In Beroea, the people receive the word eagerly and examine the Scriptures, though opposition follows Paul there too.',
  reading_watch_for = 'Notice the difference between rejecting the word through jealousy and testing it with a sincere desire for truth.',
  reading_key_terms = '[{"term":"Thessalonica","definition":"A city where Paul preaches and faces mob opposition."},{"term":"Beroea","definition":"A city where people receive the word eagerly and search the Scriptures."},{"term":"Scriptures","definition":"The sacred writings of God’s word."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-55-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 55;

-- Plan: the-narrow-path-90
-- Day: 56
update public.plan_days pd
set
  reading_context = 'The plan pauses the Acts narrative to prepare for Paul’s coming dialogue with the people of Athens.',
  previous_reading_summary = 'Paul preached in Thessalonica and Beroea, where the word was received differently in each city. Some opposed him with jealousy, while others searched the Scriptures with eagerness.',
  reading_today_preview = 'The Catechism explains that the desire for God is written in the human heart and that people can know God in real ways. This prepares us to understand Paul’s approach to religious seekers in Athens.',
  reading_watch_for = 'Notice that the human search for God is real, but it still needs the light of Christ.',
  reading_key_terms = '[{"term":"Desire for God","definition":"The human longing for truth, happiness, and communion with God."},{"term":"Reason","definition":"The human ability to seek and recognize truth."},{"term":"Revelation","definition":"God making himself known to us."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-56-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 56;

commit;
