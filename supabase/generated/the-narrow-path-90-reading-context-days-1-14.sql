begin;

-- Reviewed reading context import for plan: the-narrow-path-90

-- Plan: the-narrow-path-90
-- Day: 1
update public.plan_days pd
set
  reading_context = 'Acts begins after Jesus has risen from the dead, as he prepares the apostles for life without seeing him in the same way.',
  previous_reading_summary = null,
  reading_today_preview = 'Jesus tells the apostles to stay in Jerusalem until the Holy Spirit comes. Then he is taken up into heaven, and they are told he will return.',
  reading_watch_for = 'Notice that Jesus gives the apostles a mission before they feel ready.',
  reading_key_terms = '[{"term":"Theophilus","definition":"The person Luke addresses at the beginning of Acts."},{"term":"Ascension","definition":"Jesus being taken up into heaven after his Resurrection."},{"term":"Holy Spirit","definition":"The third Person of the Trinity, promised by Jesus to strengthen the Church."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-1-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 1;

-- Plan: the-narrow-path-90
-- Day: 2
update public.plan_days pd
set
  reading_context = 'The apostles are back in Jerusalem after the Ascension, gathered in prayer with Mary and the first believers.',
  previous_reading_summary = 'Jesus promised the Holy Spirit and told the apostles they would be his witnesses. Then he ascended into heaven.',
  reading_today_preview = 'Peter leads the group in choosing someone to take the place of Judas. Matthias is added to the apostles.',
  reading_watch_for = 'Notice that the early Church prays, uses Scripture, and acts together when making an important decision.',
  reading_key_terms = '[{"term":"Upper room","definition":"The place where the apostles and other believers gathered in prayer."},{"term":"Apostle","definition":"One sent by Christ with authority to witness to his Resurrection."},{"term":"Matthias","definition":"The man chosen to take Judas''s place among the apostles."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-2-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 2;

-- Plan: the-narrow-path-90
-- Day: 3
update public.plan_days pd
set
  reading_context = 'The apostles are still gathered in Jerusalem, waiting for the Holy Spirit Jesus promised.',
  previous_reading_summary = 'Peter led the believers in replacing Judas with Matthias. The apostolic group was made whole again before the public mission began.',
  reading_today_preview = 'The Holy Spirit comes at Pentecost with wind and fire, and the apostles begin speaking so people from many nations can understand. Some are amazed, while others mock them.',
  reading_watch_for = 'Notice that the Spirit sends the Church outward, toward real people and real languages.',
  reading_key_terms = '[{"term":"Pentecost","definition":"The feast when the Holy Spirit came upon the apostles."},{"term":"Tongues","definition":"Languages given by the Spirit so the message could be heard."},{"term":"Galileans","definition":"People from Galilee; the crowd is surprised that they speak to many nations."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-3-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 3;

-- Plan: the-narrow-path-90
-- Day: 4
update public.plan_days pd
set
  reading_context = 'A crowd has gathered in Jerusalem after hearing the apostles speak by the power of the Holy Spirit.',
  previous_reading_summary = 'The Holy Spirit came upon the apostles at Pentecost. People from many places heard the mighty works of God in their own languages.',
  reading_today_preview = 'Peter stands up and explains that Pentecost fulfills what God promised through the prophets. He proclaims that Jesus was crucified, raised, exalted, and made Lord and Christ.',
  reading_watch_for = 'Notice how Peter explains Jesus through Scripture instead of speaking from opinion.',
  reading_key_terms = '[{"term":"Kerygma","definition":"The basic proclamation of Jesus''s death, Resurrection, and lordship."},{"term":"Prophet Joel","definition":"An Old Testament prophet Peter quotes to explain the coming of the Spirit."},{"term":"Christ","definition":"The Anointed One, the promised Messiah."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-4-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 4;

-- Plan: the-narrow-path-90
-- Day: 5
update public.plan_days pd
set
  reading_context = 'Peter has just preached openly to the crowd in Jerusalem about Jesus''s death and Resurrection.',
  previous_reading_summary = 'Peter explained Pentecost through Scripture and announced Jesus as Lord and Christ. His preaching placed the crowd before a real choice.',
  reading_today_preview = 'The people ask what they should do, and Peter calls them to repentance and baptism. The first Christian community begins to live a shared life of teaching, prayer, worship, and generosity.',
  reading_watch_for = 'Notice that faith becomes a concrete way of life, not only a private belief.',
  reading_key_terms = '[{"term":"Repent","definition":"To turn away from sin and return to God."},{"term":"Baptism","definition":"The sacrament by which a person is washed, forgiven, and brought into the Church."},{"term":"Breaking of the bread","definition":"An early Christian phrase connected with the Eucharist."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-5-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 5;

-- Plan: the-narrow-path-90
-- Day: 6
update public.plan_days pd
set
  reading_context = 'The new Christian community is forming in Jerusalem, and Peter and John are still going to the temple to pray.',
  previous_reading_summary = 'Many people received Peter''s preaching, were baptized, and joined the believers. The Church''s common life began to take shape in worship, teaching, fellowship, and care for one another.',
  reading_today_preview = 'Peter and John meet a man who has been lame from birth. Instead of giving him money, Peter heals him in the name of Jesus.',
  reading_watch_for = 'Notice that the miracle points beyond Peter to the power of Jesus.',
  reading_key_terms = '[{"term":"Beautiful Gate","definition":"A gate of the temple where the lame man was placed to ask for help."},{"term":"Alms","definition":"Money or help given to someone in need."},{"term":"Name of Jesus","definition":"Jesus''s authority and power, not a magic formula."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-6-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 6;

-- Plan: the-narrow-path-90
-- Day: 7
update public.plan_days pd
set
  reading_context = 'The plan pauses the Acts narrative to connect Pentecost and baptism with Catholic teaching on the Holy Spirit.',
  previous_reading_summary = 'Yesterday, Peter healed a lame man in Jesus''s name. That miracle showed that the risen Christ is still acting through his apostles.',
  reading_today_preview = 'The Catechism explains how the Holy Spirit reveals Christ, works in the Church, and gives new life through baptism.',
  reading_watch_for = 'Notice that baptism is not treated as a bare symbol here, but as part of the Spirit’s real work of giving new life in the Church.',
  reading_key_terms = '[{"term":"Catechism","definition":"A trusted summary of Catholic teaching."},{"term":"Paraclete","definition":"A title for the Holy Spirit meaning advocate or helper."},{"term":"Sacrament","definition":"An outward sign instituted by Christ that gives grace."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-7-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 7;

-- Plan: the-narrow-path-90
-- Day: 8
update public.plan_days pd
set
  reading_context = 'We return to the temple in Jerusalem, where the healed man is clinging to Peter and John and the crowd is amazed.',
  previous_reading_summary = 'The Catechism pause clarified the Holy Spirit''s work and the meaning of baptism. It helped connect Pentecost with how Catholics understand new life in the Church.',
  reading_today_preview = 'Peter refuses to let the crowd treat the healing as a display of human power. He points them to Jesus and calls them to repent and be refreshed by God.',
  reading_watch_for = 'Notice that a miracle becomes an invitation to conversion.',
  reading_key_terms = '[{"term":"Solomon''s Portico","definition":"A covered area of the temple where people gathered."},{"term":"Author of life","definition":"Peter''s title for Jesus, who was killed and raised."},{"term":"Conversion","definition":"A turning of the heart and life back to God."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-8-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 8;

-- Plan: the-narrow-path-90
-- Day: 9
update public.plan_days pd
set
  reading_context = 'Peter and John are still speaking after the temple healing, but the religious authorities now step in.',
  previous_reading_summary = 'Peter explained that the healed man''s strength came through Jesus. He called the people to repent so their sins could be wiped away.',
  reading_today_preview = 'Peter and John are arrested and questioned about the power behind the healing. Peter answers plainly that salvation is found in Jesus Christ.',
  reading_watch_for = 'Notice Peter''s clarity when he is under pressure.',
  reading_key_terms = '[{"term":"Sadducees","definition":"A Jewish group that denied the resurrection of the dead."},{"term":"Council","definition":"The ruling assembly questioning Peter and John."},{"term":"Cornerstone","definition":"The stone that gives a building its foundation and alignment; Peter applies this image to Jesus."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-9-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 9;

-- Plan: the-narrow-path-90
-- Day: 10
update public.plan_days pd
set
  reading_context = 'Peter and John are standing before the same kind of authorities who opposed Jesus.',
  previous_reading_summary = 'The authorities arrested Peter and John and demanded an explanation. Peter answered that the man was healed by Jesus, and that salvation comes through no other name.',
  reading_today_preview = 'The rulers recognize Peter and John as ordinary men who had been with Jesus. They cannot deny the healing, but they order the apostles to stop speaking in Jesus''s name.',
  reading_watch_for = 'Notice the difference between seeing the truth and surrendering to it.',
  reading_key_terms = '[{"term":"Boldness","definition":"Courage to speak the truth without pretending the danger is gone."},{"term":"Name","definition":"In this passage, Jesus''s authority and saving power."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-10-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 10;

-- Plan: the-narrow-path-90
-- Day: 11
update public.plan_days pd
set
  reading_context = 'Peter and John have been released, but the threat against preaching in Jesus''s name remains.',
  previous_reading_summary = 'The rulers could not deny the healed man, but they still ordered Peter and John to stop teaching about Jesus. The apostles refused to obey that command.',
  reading_today_preview = 'The believers gather and pray together. They ask God for boldness, and the place where they are gathered is shaken.',
  reading_watch_for = 'Notice that the Church asks for courage more than comfort.',
  reading_key_terms = '[{"term":"Anointed","definition":"Chosen and consecrated by God; the word is connected to Christ."},{"term":"Servant","definition":"A biblical title used here for Jesus, who fulfills God''s saving plan."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-11-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 11;

-- Plan: the-narrow-path-90
-- Day: 12
update public.plan_days pd
set
  reading_context = 'The Jerusalem Church is growing under pressure, and the believers are learning to live as one body.',
  previous_reading_summary = 'After being threatened, the believers prayed together for boldness. God strengthened them, and they continued to speak his word.',
  reading_today_preview = 'Acts shows the believers sharing their goods so no one among them is in need. Barnabas is introduced as a generous man who encourages the Church.',
  reading_watch_for = 'Notice that Christian unity reaches into money, property, and care for the poor.',
  reading_key_terms = '[{"term":"One heart and soul","definition":"A phrase showing deep unity among the believers."},{"term":"Barnabas","definition":"A believer whose name means son of encouragement."},{"term":"Levite","definition":"A member of Israel''s priestly tribe."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-12-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 12;

-- Plan: the-narrow-path-90
-- Day: 13
update public.plan_days pd
set
  reading_context = 'The Church''s generosity has just been shown through Barnabas, but Acts now shows a false version of that same generosity.',
  previous_reading_summary = 'The believers were united and shared what they had. Barnabas gave generously, and the apostles distributed help to those in need.',
  reading_today_preview = 'Ananias and Sapphira sell property but lie about what they give. Peter exposes the lie as a sin against the Holy Spirit.',
  reading_watch_for = 'Notice that the issue is not the amount of money but the lie before God and the Church.',
  reading_key_terms = '[{"term":"Ananias and Sapphira","definition":"A married couple who lied about their gift to the Church."},{"term":"Hypocrisy","definition":"Pretending to be holy while hiding a false heart."},{"term":"Fear of the Lord","definition":"Reverent awe before God''s holiness."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-13-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 13;

-- Plan: the-narrow-path-90
-- Day: 14
update public.plan_days pd
set
  reading_context = 'The plan pauses the Acts narrative to connect the Church''s shared life and truthful witness with Catholic teaching.',
  previous_reading_summary = 'Yesterday, Ananias and Sapphira showed how serious dishonesty is inside the Church. Their story follows the genuine generosity of Barnabas and the first believers.',
  reading_today_preview = 'The Catechism explains the communion of saints and the call to witness to the truth. It helps name what Acts has been showing in the Church''s life.',
  reading_watch_for = 'Notice that communion and truth belong together: Christian unity cannot be built on pretending.',
  reading_key_terms = '[{"term":"Communion of saints","definition":"The shared life of all who belong to Christ."},{"term":"Martyr","definition":"A witness to Christ, especially one who suffers or dies for the faith."},{"term":"Witness","definition":"Someone who testifies to the truth by word and life."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-14-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 14;

commit;
