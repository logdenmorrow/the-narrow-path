begin;

-- Reviewed reading context import for plan: the-narrow-path-90

-- Plan: the-narrow-path-90
-- Day: 29
update public.plan_days pd
set
  reading_context = 'We return from the Catechism pause to Saul after his conversion and baptism in Damascus.',
  previous_reading_summary = 'Day 28 paused the Acts story to connect conversion, sacramental life, and the liturgy through the Catechism. It showed that conversion draws a person back to God and into the Church''s worshiping life.',
  reading_today_preview = 'Saul begins preaching that Jesus is the Son of God, and people are shocked by the change. After danger in Damascus and suspicion in Jerusalem, Barnabas helps the apostles receive him.',
  reading_watch_for = 'Notice that Saul''s conversion still has to be received and tested inside the life of the Church.',
  reading_key_terms = '[{"term":"Barnabas","definition":"A trusted believer who helps Saul be received by the apostles."},{"term":"Damascus","definition":"The city where Saul begins preaching after his conversion."},{"term":"Son of God","definition":"A title for Jesus that points to his divine identity."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-29-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 29;

-- Plan: the-narrow-path-90
-- Day: 30
update public.plan_days pd
set
  reading_context = 'Acts shifts back to Peter as he travels among the believers outside Jerusalem.',
  previous_reading_summary = 'Saul began preaching Christ, escaped danger, and was helped by Barnabas in Jerusalem. The Church then entered a time of peace and growth.',
  reading_today_preview = 'Peter heals Aeneas in Lydda and raises Tabitha in Joppa. Many people turn to the Lord after seeing these signs.',
  reading_watch_for = 'Notice that Peter does not present himself as the healer; he points to Jesus Christ.',
  reading_key_terms = '[{"term":"Aeneas","definition":"A paralyzed man healed through Peter''s ministry."},{"term":"Tabitha","definition":"A disciple known for charity whom Peter raises from death."},{"term":"Joppa","definition":"A coastal city where Peter stays after raising Tabitha."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-30-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 30;

-- Plan: the-narrow-path-90
-- Day: 31
update public.plan_days pd
set
  reading_context = 'Peter is staying in Joppa, while a Gentile soldier named Cornelius is praying in Caesarea.',
  previous_reading_summary = 'Peter healed Aeneas and raised Tabitha, and many people turned to the Lord. These signs showed Christ still acting through his apostolic Church.',
  reading_today_preview = 'Cornelius receives a vision telling him to send for Peter. Meanwhile, Peter receives a strange vision of a sheet filled with animals and hears that what God has cleansed must not be called common.',
  reading_watch_for = 'Notice that God prepares both Cornelius and Peter before bringing them together.',
  reading_key_terms = '[{"term":"Cornelius","definition":"A Gentile centurion who fears God and prays."},{"term":"Centurion","definition":"A Roman officer responsible for a group of soldiers."},{"term":"Gentile","definition":"A person who is not Jewish."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-31-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 31;

-- Plan: the-narrow-path-90
-- Day: 32
update public.plan_days pd
set
  reading_context = 'Peter is still trying to understand his vision when Cornelius''s messengers arrive.',
  previous_reading_summary = 'Cornelius was told by an angel to send for Peter. Peter saw a vision that challenged what he thought was clean or unclean.',
  reading_today_preview = 'The Spirit tells Peter to go with the men without hesitation. Peter enters Cornelius''s house, learns why he was sent for, and sees a Gentile household ready to hear God''s word.',
  reading_watch_for = 'Notice that Peter crosses a real boundary, but only because God leads him.',
  reading_key_terms = '[{"term":"Caesarea","definition":"The city where Cornelius lives."},{"term":"Clean and unclean","definition":"Old Covenant categories that shaped Jewish food and ritual life."},{"term":"Partiality","definition":"Favoring one group unfairly over another."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-32-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 32;

-- Plan: the-narrow-path-90
-- Day: 33
update public.plan_days pd
set
  reading_context = 'Peter is now inside Cornelius''s house with Gentiles gathered to hear what God commanded him to say.',
  previous_reading_summary = 'Peter followed the Spirit''s direction and went to Cornelius. He began to understand that God was opening the door to the Gentiles.',
  reading_today_preview = 'Peter preaches Jesus''s life, death, and Resurrection, and the Holy Spirit falls on the Gentiles. Peter orders them to be baptized in the name of Jesus Christ.',
  reading_watch_for = 'Notice that the same Holy Spirit given at Pentecost now comes upon the Gentiles.',
  reading_key_terms = '[{"term":"Gentile Pentecost","definition":"A way to describe the Spirit falling on Cornelius''s household."},{"term":"No partiality","definition":"Peter''s realization that God is calling people from every nation."},{"term":"Baptized","definition":"Washed and brought into the Church through the sacrament of baptism."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-33-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 33;

-- Plan: the-narrow-path-90
-- Day: 34
update public.plan_days pd
set
  reading_context = 'News of Cornelius''s household reaches Jerusalem, and Peter has to explain why he entered a Gentile home.',
  previous_reading_summary = 'Peter preached Christ to Cornelius''s household, and the Holy Spirit came upon the Gentiles. Peter then ordered them to be baptized.',
  reading_today_preview = 'Peter recounts the vision, the Spirit''s command, and what happened in Cornelius''s house. The believers in Jerusalem recognize that God has granted repentance and life to the Gentiles too.',
  reading_watch_for = 'Notice that Peter defends the change by pointing to what God did, not to his own preference.',
  reading_key_terms = '[{"term":"Circumcision party","definition":"Jewish Christians concerned about Peter eating with Gentiles."},{"term":"Repentance unto life","definition":"Turning to God and receiving the life he gives."},{"term":"Apostolic authority","definition":"The authority Christ gave the apostles to teach and guide the Church."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-34-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 34;

-- Plan: the-narrow-path-90
-- Day: 35
update public.plan_days pd
set
  reading_context = 'The plan pauses the Acts narrative to connect Peter''s defense of the Gentile mission with Catholic teaching on the Church.',
  previous_reading_summary = 'Peter explained how God brought Cornelius''s Gentile household into the Church. The believers in Jerusalem glorified God when they saw that this was his work.',
  reading_today_preview = 'The Catechism explains that the Church comes from God''s plan, is formed by Christ, and is sent on mission by the Holy Spirit.',
  reading_watch_for = 'Notice that the Church''s mission begins with Christ''s light, not with human ambition.',
  reading_key_terms = '[{"term":"Church","definition":"The people God gathers in Christ."},{"term":"Mission","definition":"The Church''s call to bring Christ to the world."},{"term":"People of God","definition":"A biblical way to speak of those who belong to God."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-35-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 35;

-- Plan: the-narrow-path-90
-- Day: 36
update public.plan_days pd
set
  reading_context = 'We return from the Catechism pause to the gospel spreading beyond Jerusalem, especially in Antioch.',
  previous_reading_summary = 'Day 35 paused to explain the Church''s origin and mission. It helped connect the Gentile mission in Acts with the Church''s identity in Christ.',
  reading_today_preview = 'Believers scattered by persecution preach in Antioch, and many turn to the Lord. Barnabas brings Saul there, the disciples are first called Christians, and the church sends relief to Judea.',
  reading_watch_for = 'Notice that Antioch grows through teaching, generosity, and readiness for mission.',
  reading_key_terms = '[{"term":"Antioch","definition":"A major city that becomes an important center for Christian mission."},{"term":"Christians","definition":"The name first given to disciples of Jesus in Antioch."},{"term":"Famine","definition":"A severe shortage of food."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-36-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 36;

-- Plan: the-narrow-path-90
-- Day: 37
update public.plan_days pd
set
  reading_context = 'The Church is growing, but King Herod begins attacking its leaders in Jerusalem.',
  previous_reading_summary = 'Antioch became a strong center of teaching and generosity. Barnabas and Saul taught there, and the believers sent help to the Church in Judea.',
  reading_today_preview = 'Herod kills James and imprisons Peter, while the Church prays earnestly. During the night, an angel frees Peter from prison.',
  reading_watch_for = 'Notice that the Church''s prayer continues while Peter is still in chains.',
  reading_key_terms = '[{"term":"Herod","definition":"The ruler who persecutes the Church in this passage."},{"term":"James","definition":"One of the apostles, the brother of John."},{"term":"Passover","definition":"The Jewish feast remembering Israel''s deliverance from Egypt."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-37-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 37;

-- Plan: the-narrow-path-90
-- Day: 38
update public.plan_days pd
set
  reading_context = 'Peter has just been freed from prison and now goes to the house where believers are praying.',
  previous_reading_summary = 'Herod killed James and imprisoned Peter. The Church prayed for Peter, and an angel led him out of prison during the night.',
  reading_today_preview = 'Peter tells the praying believers how the Lord rescued him. Herod later receives praise as if he were a god, refuses to give glory to God, and dies, while the word of God keeps growing.',
  reading_watch_for = 'Notice the contrast between Peter giving glory to the Lord and Herod receiving glory for himself.',
  reading_key_terms = '[{"term":"Rhoda","definition":"The servant girl who recognizes Peter''s voice at the gate."},{"term":"John Mark","definition":"A believer connected with Barnabas and Saul''s mission."},{"term":"Glory","definition":"Honor that belongs first to God."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-38-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 38;

-- Plan: the-narrow-path-90
-- Day: 39
update public.plan_days pd
set
  reading_context = 'Acts now turns back to Antioch, where Barnabas and Saul are worshiping and fasting with the Church.',
  previous_reading_summary = 'Peter''s rescue showed God''s care for the Church under persecution. Herod''s pride ended in judgment, but God''s word continued to increase.',
  reading_today_preview = 'The Holy Spirit tells the Church to set apart Barnabas and Saul for mission. They are sent out, preach in Cyprus, and confront a false prophet who opposes the gospel.',
  reading_watch_for = 'Notice that mission begins in prayer, fasting, and obedience to the Holy Spirit.',
  reading_key_terms = '[{"term":"Barnabas and Saul","definition":"The two men sent from Antioch for missionary work."},{"term":"Fasting","definition":"Going without food for prayer and spiritual focus."},{"term":"Cyprus","definition":"The island where this missionary journey begins."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-39-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 39;

-- Plan: the-narrow-path-90
-- Day: 40
update public.plan_days pd
set
  reading_context = 'Barnabas and Saul are on mission, and Paul begins speaking in a synagogue in Antioch of Pisidia.',
  previous_reading_summary = 'The Church at Antioch prayed, fasted, and sent Barnabas and Saul. On Cyprus, Paul confronted a false prophet, and a Roman official believed.',
  reading_today_preview = 'Paul begins his sermon by retelling how God chose Israel, brought the people out of Egypt, gave them leaders, and raised up David. He leads the listeners toward Jesus from inside Israel''s story.',
  reading_watch_for = 'Notice that Paul does not begin with himself; he begins with God''s faithfulness.',
  reading_key_terms = '[{"term":"Synagogue","definition":"A Jewish place of prayer, Scripture reading, and teaching."},{"term":"Antioch of Pisidia","definition":"A different Antioch from the sending church in Syria."},{"term":"David","definition":"Israel''s king whose line is tied to the promise of the Messiah."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-40-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 40;

-- Plan: the-narrow-path-90
-- Day: 41
update public.plan_days pd
set
  reading_context = 'Paul continues his synagogue sermon after tracing God''s work through Israel''s history.',
  previous_reading_summary = 'Paul began with God''s care for Israel and the promise connected to David. He was preparing his listeners to see Jesus as the fulfillment of that history.',
  reading_today_preview = 'Paul announces Jesus as the promised Savior and speaks about his rejection, death, and Resurrection. He shows that the message of salvation has now been sent to his hearers.',
  reading_watch_for = 'Notice that Paul treats the death and Resurrection of Jesus as public truth, not private inspiration.',
  reading_key_terms = '[{"term":"John the Baptist","definition":"The prophet who prepared Israel for Jesus."},{"term":"Pilate","definition":"The Roman governor involved in Jesus''s execution."},{"term":"Resurrection","definition":"Jesus rising bodily from the dead."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-41-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 41;

-- Plan: the-narrow-path-90
-- Day: 42
update public.plan_days pd
set
  reading_context = 'The plan pauses the Acts narrative to connect Paul''s missionary preaching with Catholic teaching on the Church''s missionary mandate.',
  previous_reading_summary = 'Paul preached Jesus as the promised Savior from Israel''s history. He centered the message on Jesus''s death and Resurrection.',
  reading_today_preview = 'The Catechism explains that the Church is missionary by nature because she is sent by Christ to the nations. Mission is ordered toward bringing people into communion with God.',
  reading_watch_for = 'Notice that evangelization is not an optional project; it belongs to what the Church is.',
  reading_key_terms = '[{"term":"Missionary mandate","definition":"Christ''s command to make disciples of all nations."},{"term":"Evangelization","definition":"Sharing the gospel of Jesus Christ."},{"term":"Universal","definition":"For all peoples and nations; the word catholic means universal."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-42-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 42;

commit;
