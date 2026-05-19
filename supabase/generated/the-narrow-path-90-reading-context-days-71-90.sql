begin;

-- Reviewed reading context import for plan: the-narrow-path-90

-- Plan: the-narrow-path-90
-- Day: 71
update public.plan_days pd
set
  reading_context = 'We return from the Catechism pause to Paul in Jerusalem after he has submitted to the pastoral request of James and the elders.',
  previous_reading_summary = 'Day 70 paused the Acts story to explain virtue, especially fortitude and justice. It showed that courage and fairness are practical habits for moments of pressure.',
  reading_today_preview = 'Paul is falsely accused in the temple, seized by a mob, and rescued by Roman soldiers. Even while bound, he asks to speak to the people.',
  reading_watch_for = 'Notice that Paul’s obedience does not prevent suffering, but it does shape how he responds to it.',
  reading_key_terms = '[{"term":"Temple","definition":"The central place of Jewish worship in Jerusalem."},{"term":"Tribune","definition":"A Roman military officer responsible for public order."},{"term":"Trophimus","definition":"A Gentile companion of Paul wrongly connected to the accusation."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-71-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 71;

-- Plan: the-narrow-path-90
-- Day: 72
update public.plan_days pd
set
  reading_context = 'Paul stands before the Jerusalem crowd after being rescued from violence by Roman soldiers.',
  previous_reading_summary = 'Paul was seized in the temple under false accusations. Roman soldiers stopped the crowd from killing him, and Paul asked permission to speak.',
  reading_today_preview = 'Paul tells the story of his former zeal, his persecution of Christians, and the Lord’s mercy on the road to Damascus. He explains that Jesus sent him to the Gentiles.',
  reading_watch_for = 'Notice that Paul’s testimony is about God’s action, not Paul making himself impressive.',
  reading_key_terms = '[{"term":"Apologia","definition":"A reasoned defense or explanation."},{"term":"Gamaliel","definition":"A respected Jewish teacher under whom Paul was educated."},{"term":"Gentiles","definition":"Non-Jewish peoples."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-72-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 72;

-- Plan: the-narrow-path-90
-- Day: 73
update public.plan_days pd
set
  reading_context = 'Paul’s speech has angered the crowd again, and the Roman tribune tries to find out what is happening.',
  previous_reading_summary = 'Paul publicly told the story of his conversion and mission. The crowd listened until he said the Lord sent him to the Gentiles.',
  reading_today_preview = 'The tribune orders Paul to be examined by scourging, but Paul reveals that he is a Roman citizen. The soldiers back away, and Paul is brought before the council.',
  reading_watch_for = 'Notice that Paul uses his lawful rights without abandoning his courage.',
  reading_key_terms = '[{"term":"Roman citizen","definition":"A legal status that gave Paul certain protections."},{"term":"Scourging","definition":"A severe Roman beating."},{"term":"Council","definition":"The Jewish ruling assembly before which Paul is brought."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-73-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 73;

-- Plan: the-narrow-path-90
-- Day: 74
update public.plan_days pd
set
  reading_context = 'Paul now stands before the council in Jerusalem, where old divisions quickly surface.',
  previous_reading_summary = 'Paul avoided unlawful scourging by revealing his Roman citizenship. The tribune then brought him before the Jewish council to learn the real charge against him.',
  reading_today_preview = 'Paul speaks of his clear conscience and the hope of the resurrection. The council divides between Pharisees and Sadducees, and the Lord later tells Paul he must also testify in Rome.',
  reading_watch_for = 'Notice that the Resurrection remains central even in a hostile legal setting.',
  reading_key_terms = '[{"term":"Sanhedrin","definition":"The Jewish council before which Paul is examined."},{"term":"Pharisees","definition":"A Jewish group that accepted resurrection, angels, and spirits."},{"term":"Sadducees","definition":"A Jewish group that denied the resurrection of the dead."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-74-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 74;

-- Plan: the-narrow-path-90
-- Day: 75
update public.plan_days pd
set
  reading_context = 'Paul is back under Roman guard after the council becomes violent.',
  previous_reading_summary = 'Paul stood before the council and spoke about conscience and the resurrection. The Lord encouraged him and promised that he would bear witness in Rome.',
  reading_today_preview = 'A group plots to kill Paul, but Paul’s nephew learns of the plan and reports it. The tribune is warned and prepares to protect Paul.',
  reading_watch_for = 'Notice how God’s providence works through a quiet act of courage by someone easy to overlook.',
  reading_key_terms = '[{"term":"Conspiracy","definition":"A secret plan to do wrong."},{"term":"Providence","definition":"God’s wise care and guidance over events."},{"term":"Paul’s nephew","definition":"The young man who reports the plot against Paul."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-75-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 75;

-- Plan: the-narrow-path-90
-- Day: 76
update public.plan_days pd
set
  reading_context = 'The Roman tribune now moves Paul out of Jerusalem for his protection.',
  previous_reading_summary = 'A plot to kill Paul was exposed by Paul’s nephew. The tribune learned of the danger and acted to prevent the ambush.',
  reading_today_preview = 'Paul is escorted by soldiers to Caesarea and placed under the governor Felix. The Roman letter makes clear that Paul has not been charged with a crime deserving death.',
  reading_watch_for = 'Notice that chains and soldiers do not mean God’s mission has stopped.',
  reading_key_terms = '[{"term":"Caesarea","definition":"The Roman administrative city where Paul is sent."},{"term":"Felix","definition":"The Roman governor who receives Paul’s case."},{"term":"Ambush","definition":"A hidden attack planned against Paul."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-76-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 76;

-- Plan: the-narrow-path-90
-- Day: 77
update public.plan_days pd
set
  reading_context = 'The plan pauses the Acts narrative to connect Paul’s trials and guarded journey with Catholic teaching on divine providence.',
  previous_reading_summary = 'Paul was moved safely to Caesarea under Roman protection. Even custody became part of the path by which he would continue toward Rome.',
  reading_today_preview = 'The Catechism explains that God guides creation and history with concrete care. This helps us read Paul’s delays, protections, and trials without thinking God has lost control.',
  reading_watch_for = 'Notice that providence does not mean everything is easy; it means God remains Lord even in difficulty.',
  reading_key_terms = '[{"term":"Divine providence","definition":"God’s wise and loving care over creation and history."},{"term":"Creation","definition":"All that God has made and sustains."},{"term":"Trust","definition":"Confidence in God’s care even when the path is hard."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-77-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 77;

-- Plan: the-narrow-path-90
-- Day: 78
update public.plan_days pd
set
  reading_context = 'We return from the Catechism pause to Caesarea, where Paul is formally accused before Felix.',
  previous_reading_summary = 'Day 77 paused to explain divine providence. It helped frame Paul’s custody and delays as part of a path God can still govern.',
  reading_today_preview = 'Paul is accused by the high priest’s spokesman, but he answers calmly and factually. He denies wrongdoing and says his hope is in the resurrection.',
  reading_watch_for = 'Notice that Paul’s defense is calm, truthful, and rooted in conscience before God.',
  reading_key_terms = '[{"term":"Felix","definition":"The Roman governor hearing Paul’s case."},{"term":"Tertullus","definition":"The spokesman who presents accusations against Paul."},{"term":"Nazarenes","definition":"A name used here for followers of Jesus of Nazareth."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-78-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 78;

-- Plan: the-narrow-path-90
-- Day: 79
update public.plan_days pd
set
  reading_context = 'Paul remains in custody under Felix after making his defense.',
  previous_reading_summary = 'Paul answered the accusations against him with reason and facts. He made clear that his hope in the resurrection was at the heart of the case.',
  reading_today_preview = 'Felix listens to Paul speak about faith, justice, self-control, and judgment, but he delays responding. Paul remains imprisoned for two years while Felix looks for advantage.',
  reading_watch_for = 'Notice that hearing the truth is not the same as obeying it.',
  reading_key_terms = '[{"term":"Drusilla","definition":"Felix’s wife, who hears Paul speak about faith in Christ."},{"term":"Self-control","definition":"The virtue of governing desires rightly."},{"term":"Judgment","definition":"God’s just accounting of human life."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-79-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 79;

-- Plan: the-narrow-path-90
-- Day: 80
update public.plan_days pd
set
  reading_context = 'Felix is replaced by Festus, and Paul’s case is reopened under a new governor.',
  previous_reading_summary = 'Felix listened to Paul but delayed conversion and justice. He left Paul in prison for two years to please Paul’s accusers.',
  reading_today_preview = 'The leaders again try to move Paul toward danger, but Paul refuses to be sent to Jerusalem. As a Roman citizen, he appeals to Caesar.',
  reading_watch_for = 'Notice that Paul’s appeal is both prudent and part of the road toward Rome.',
  reading_key_terms = '[{"term":"Festus","definition":"The Roman governor who succeeds Felix."},{"term":"Caesar","definition":"The Roman emperor to whom Paul appeals."},{"term":"Appeal","definition":"A request for a higher legal authority to hear a case."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-80-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 80;

-- Plan: the-narrow-path-90
-- Day: 81
update public.plan_days pd
set
  reading_context = 'Paul has appealed to Caesar, but Festus still needs to explain the case clearly.',
  previous_reading_summary = 'Paul refused a risky transfer to Jerusalem and appealed to Caesar. His lawful appeal became part of the path toward Rome.',
  reading_today_preview = 'Festus explains Paul’s case to King Agrippa and admits the dispute centers on Jesus, who died and whom Paul says is alive. Agrippa agrees to hear Paul himself.',
  reading_watch_for = 'Notice how the Resurrection keeps appearing as the real issue beneath the politics.',
  reading_key_terms = '[{"term":"Agrippa","definition":"A king familiar with Jewish customs who hears Paul’s case."},{"term":"Festus","definition":"The governor trying to summarize Paul’s case for Caesar."},{"term":"Emperor","definition":"The Roman ruler also called Caesar."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-81-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 81;

-- Plan: the-narrow-path-90
-- Day: 82
update public.plan_days pd
set
  reading_context = 'Paul now speaks before King Agrippa, Festus, and a formal audience.',
  previous_reading_summary = 'Festus admitted that Paul’s case was not about ordinary crimes, but about Jesus and the claim that he is alive. Agrippa asked to hear Paul.',
  reading_today_preview = 'Paul recounts his strict Jewish background, his persecution of Christians, and the risen Lord’s appearance on the road. Jesus commissions him to open eyes and turn people from darkness to light.',
  reading_watch_for = 'Notice that Paul’s conversion immediately becomes a mission.',
  reading_key_terms = '[{"term":"Pharisee","definition":"A Jewish group known for strict observance of the law."},{"term":"Commission","definition":"A mission or task entrusted by authority."},{"term":"Darkness to light","definition":"An image for conversion from sin to God."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-82-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 82;

-- Plan: the-narrow-path-90
-- Day: 83
update public.plan_days pd
set
  reading_context = 'Paul continues his testimony before Agrippa after describing the Lord’s commission to him.',
  previous_reading_summary = 'Paul told Agrippa how he once persecuted Christians and then met the risen Jesus. The Lord sent him to bring people from darkness to light.',
  reading_today_preview = 'Paul says he obeyed the heavenly vision and preached repentance to Jews and Gentiles. Festus calls him mad, but Paul insists he is speaking sober truth.',
  reading_watch_for = 'Notice that Paul calls for repentance that bears fruit in action.',
  reading_key_terms = '[{"term":"Heavenly vision","definition":"Paul’s encounter with the risen Jesus."},{"term":"Repentance","definition":"Turning away from sin and toward God."},{"term":"Sober truth","definition":"Truth spoken plainly and seriously, not wild imagination."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-83-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 83;

-- Plan: the-narrow-path-90
-- Day: 84
update public.plan_days pd
set
  reading_context = 'The plan pauses the Acts narrative to connect Paul’s witness before rulers with Catholic teaching that the Church is apostolic.',
  previous_reading_summary = 'Paul defended his obedience to the risen Christ before Agrippa and Festus. He proclaimed repentance, the Resurrection, and light for both Israel and the Gentiles.',
  reading_today_preview = 'The Catechism explains that the Church is founded on the apostles, preserves their teaching, and continues their mission through their successors.',
  reading_watch_for = 'Notice that apostolic faith is not only about the past; it is handed on and guarded in the Church today.',
  reading_key_terms = '[{"term":"Apostolic","definition":"Founded on the apostles and faithful to their teaching and mission."},{"term":"Successors","definition":"Bishops who continue the apostles’ pastoral office."},{"term":"Good deposit","definition":"The apostolic faith entrusted to the Church."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-84-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 84;

-- Plan: the-narrow-path-90
-- Day: 85
update public.plan_days pd
set
  reading_context = 'We return from the Catechism pause to Paul being sent by sea toward Rome.',
  previous_reading_summary = 'Day 84 paused to explain the Church as apostolic. It connected Paul’s witness before rulers with the apostolic mission Christ entrusted to the Church.',
  reading_today_preview = 'Paul begins the voyage to Italy under Roman guard. The trip becomes difficult, and Paul warns that continuing will bring serious loss.',
  reading_watch_for = 'Notice that prudence matters even when God’s larger promise is still secure.',
  reading_key_terms = '[{"term":"Julius","definition":"The Roman centurion responsible for Paul on the voyage."},{"term":"Rome","definition":"The city where Paul is being sent to appeal before Caesar."},{"term":"Prudence","definition":"The virtue of judging and choosing wisely."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-85-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 85;

-- Plan: the-narrow-path-90
-- Day: 86
update public.plan_days pd
set
  reading_context = 'Paul’s ship has continued despite warning signs, and the voyage now turns dangerous.',
  previous_reading_summary = 'Paul was placed on a ship for Rome and treated with some kindness by Julius. As sailing became dangerous, Paul warned against continuing, but others ignored him.',
  reading_today_preview = 'A violent storm traps the ship, and all hope of survival begins to fade. Paul tells the men that God has promised their lives will be spared, though the ship will be lost.',
  reading_watch_for = 'Notice that Paul’s hope is not optimism; it rests on God’s word.',
  reading_key_terms = '[{"term":"Storm","definition":"The dangerous weather threatening the ship."},{"term":"Angel","definition":"A messenger from God who speaks to Paul."},{"term":"Take heart","definition":"A call to courage based on God’s promise."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-86-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 86;

-- Plan: the-narrow-path-90
-- Day: 87
update public.plan_days pd
set
  reading_context = 'The ship is still caught in the storm, and land is finally near.',
  previous_reading_summary = 'Paul told the men that God had promised their lives would be spared. The ship would be lost, but God’s word would stand.',
  reading_today_preview = 'Paul urges everyone to stay together, eat, and take courage. The ship breaks apart, but every person reaches land safely.',
  reading_watch_for = 'Notice that God’s promise is fulfilled through obedience, courage, and practical action.',
  reading_key_terms = '[{"term":"Shipwreck","definition":"The destruction of the ship before the people reach land."},{"term":"Centurion","definition":"A Roman officer responsible for soldiers and prisoners."},{"term":"Give thanks","definition":"Paul’s public act of thanking God before eating."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-87-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 87;

-- Plan: the-narrow-path-90
-- Day: 88
update public.plan_days pd
set
  reading_context = 'After the shipwreck, Paul and the others are safe on the island of Malta.',
  previous_reading_summary = 'The ship broke apart, but everyone reached land alive just as God had promised. Paul helped steady the group through trust and practical courage.',
  reading_today_preview = 'Paul survives a dangerous bite, and the islanders change their view of him. He then prays for the sick, and many people on Malta are healed.',
  reading_watch_for = 'Notice that mission continues even after disaster and exhaustion.',
  reading_key_terms = '[{"term":"Malta","definition":"The island where the shipwreck survivors land."},{"term":"Publius","definition":"A leading man on Malta who receives Paul and the others."},{"term":"Healing","definition":"God’s restoration of the sick through Paul’s prayer."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-88-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 88;

-- Plan: the-narrow-path-90
-- Day: 89
update public.plan_days pd
set
  reading_context = 'After wintering on Malta, Paul resumes the journey toward Rome.',
  previous_reading_summary = 'On Malta, Paul survived danger and became a source of healing. The mission did not stop because the setting was unexpected.',
  reading_today_preview = 'Paul travels by sea and finally reaches Rome. Local Christians come out to meet him, and their presence helps him thank God and take courage.',
  reading_watch_for = 'Notice that God’s promise is fulfilled through a long, ordinary road of endurance.',
  reading_key_terms = '[{"term":"Puteoli","definition":"A port city in Italy where Paul finds believers."},{"term":"Forum of Appius","definition":"A place where Roman Christians come to meet Paul."},{"term":"Rome","definition":"The capital city where Paul will continue his witness."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-89-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 89;

-- Plan: the-narrow-path-90
-- Day: 90
update public.plan_days pd
set
  reading_context = 'Acts ends with Paul in Rome, still guarded, but still free to preach the kingdom of God.',
  previous_reading_summary = 'Paul finally arrived in Rome after trials, delays, shipwreck, and help from other Christians. Seeing the brethren gave him courage.',
  reading_today_preview = 'Paul explains the hope of Israel to Jewish leaders and teaches about Jesus from the Scriptures. Some believe and others reject him, but he continues preaching openly and unhindered.',
  reading_watch_for = 'Notice that Acts ends with the gospel still moving forward; the Church’s mission continues beyond the last page.',
  reading_key_terms = '[{"term":"Hope of Israel","definition":"God’s promises fulfilled in Christ."},{"term":"Kingdom of God","definition":"God’s reign made present through Christ."},{"term":"Unhindered","definition":"Not stopped; Acts ends with the word still going forward."}]'::jsonb,
  reading_context_source_hash = 'the-narrow-path-90-day-90-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'the-narrow-path-90'
  and pd.day_number = 90;

commit;
