begin;

-- Reviewed reading context import for plan: ordinary-time-james

-- Plan: ordinary-time-james
-- Day: 1
update public.plan_days pd
set
  reading_context = 'James opens his letter by speaking to Christians who know pressure, testing, and life away from home.',
  previous_reading_summary = null,
  reading_today_preview = 'James tells believers to see trials as occasions where God can form steadfastness. He is not calling pain pleasant, but he is teaching that suffering can bear fruit in faith.',
  reading_watch_for = 'Notice that Christian maturity is formed through endurance, not instant escape from every trial.',
  reading_key_terms = '[{"term":"Dispersion","definition":"God’s people living scattered away from their homeland."},{"term":"Steadfastness","definition":"Faithful endurance that does not give up under pressure."}]'::jsonb,
  reading_context_source_hash = 'ordinary-time-james-day-1-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'ordinary-time-james'
  and pd.day_number = 1;

-- Plan: ordinary-time-james
-- Day: 2
update public.plan_days pd
set
  reading_context = 'James moves from trials to the need for wisdom when a Christian does not know how to walk faithfully.',
  previous_reading_summary = 'James began by teaching that trials can form endurance. The goal is a mature faith that keeps going with God.',
  reading_today_preview = 'James tells Christians to ask God for wisdom with faith. He warns against a divided heart that asks God for help while refusing to trust him.',
  reading_watch_for = 'Notice that wisdom is something to ask from God, not merely something to figure out alone.',
  reading_key_terms = '[{"term":"Wisdom","definition":"God-given judgment for living faithfully."},{"term":"Double-minded","definition":"Divided in heart, trying to trust God and hold back at the same time."}]'::jsonb,
  reading_context_source_hash = 'ordinary-time-james-day-2-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'ordinary-time-james'
  and pd.day_number = 2;

-- Plan: ordinary-time-james
-- Day: 3
update public.plan_days pd
set
  reading_context = 'James now applies faith to poverty, wealth, and the way Christians think about status.',
  previous_reading_summary = 'James taught believers to ask God for wisdom with faith. He warned that a divided heart becomes unstable.',
  reading_today_preview = 'James says the poor and the rich must both see their lives before God. Earthly status is temporary, and wealth cannot make a person secure before the Lord.',
  reading_watch_for = 'Notice how James lowers the power of wealth by placing it under eternity.',
  reading_key_terms = '[{"term":"Lowly","definition":"Poor or humble in worldly standing."},{"term":"Exaltation","definition":"Being lifted up by God, not by worldly status."}]'::jsonb,
  reading_context_source_hash = 'ordinary-time-james-day-3-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'ordinary-time-james'
  and pd.day_number = 3;

-- Plan: ordinary-time-james
-- Day: 4
update public.plan_days pd
set
  reading_context = 'James distinguishes the testing of faith from temptation to sin.',
  previous_reading_summary = 'James reminded Christians that both poverty and wealth must be seen in light of God. What looks permanent in this world passes away.',
  reading_today_preview = 'James promises blessing to the one who endures trial, but he makes clear that God does not tempt anyone to evil. Temptation grows when desire is welcomed and left unchecked.',
  reading_watch_for = 'Notice that James takes responsibility for sin seriously without blaming God.',
  reading_key_terms = '[{"term":"Temptation","definition":"A pull toward sin."},{"term":"Crown of life","definition":"The promised reward for those who love God and endure."}]'::jsonb,
  reading_context_source_hash = 'ordinary-time-james-day-4-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'ordinary-time-james'
  and pd.day_number = 4;

-- Plan: ordinary-time-james
-- Day: 5
update public.plan_days pd
set
  reading_context = 'James turns from temptation to the goodness of God and the way his word must be received.',
  previous_reading_summary = 'James taught that God does not tempt us to evil. Sin grows when desire is allowed to take root and lead the heart away from God.',
  reading_today_preview = 'James says every good gift comes from God, who is steady and faithful. He calls Christians to be quick to hear, slow to speak, slow to anger, and meek before the implanted word.',
  reading_watch_for = 'Notice how receiving God’s word changes speech, anger, and daily conduct.',
  reading_key_terms = '[{"term":"Father of lights","definition":"A title for God emphasizing his goodness and constancy."},{"term":"Meekness","definition":"Humble strength that receives God’s word without pride."},{"term":"Implanted word","definition":"God’s word received deeply into the heart."}]'::jsonb,
  reading_context_source_hash = 'ordinary-time-james-day-5-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'ordinary-time-james'
  and pd.day_number = 5;

-- Plan: ordinary-time-james
-- Day: 6
update public.plan_days pd
set
  reading_context = 'James presses the point that hearing God’s word must become visible obedience.',
  previous_reading_summary = 'James taught that God gives good gifts and that his word should be received with humility. He also warned against anger that does not produce righteousness.',
  reading_today_preview = 'James says Christians must be doers of the word, not hearers only. He describes real religion as concrete charity, guarded speech, and purity before God.',
  reading_watch_for = 'Notice that James does not separate worship from charity and moral discipline.',
  reading_key_terms = '[{"term":"Doers of the word","definition":"People who obey God’s word in real life."},{"term":"Bridle the tongue","definition":"To discipline speech instead of letting it run loose."},{"term":"Pure religion","definition":"Faith lived in charity and holiness before God."}]'::jsonb,
  reading_context_source_hash = 'ordinary-time-james-day-6-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'ordinary-time-james'
  and pd.day_number = 6;

-- Plan: ordinary-time-james
-- Day: 7
update public.plan_days pd
set
  reading_context = 'James now turns to partiality, especially the temptation to honor the rich while shaming the poor.',
  previous_reading_summary = 'James taught that hearing the word is not enough. True religion becomes concrete in charity, guarded speech, and a life kept unstained from the world.',
  reading_today_preview = 'James warns Christians not to judge people by appearance, wealth, or usefulness. He shows that favoritism creates sinful divisions inside the community.',
  reading_watch_for = 'Notice that partiality is not just bad manners; James treats it as a contradiction of faith in Christ.',
  reading_key_terms = '[{"term":"Partiality","definition":"Favoring some people unfairly over others."},{"term":"Assembly","definition":"The gathered Christian community."}]'::jsonb,
  reading_context_source_hash = 'ordinary-time-james-day-7-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'ordinary-time-james'
  and pd.day_number = 7;

-- Plan: ordinary-time-james
-- Day: 8
update public.plan_days pd
set
  reading_context = 'James continues correcting the way Christians can dishonor the poor and flatter the powerful.',
  previous_reading_summary = 'James warned against treating people differently based on wealth or appearance. Partiality divides the Church and contradicts faith in Christ.',
  reading_today_preview = 'James reminds believers that God often honors those the world overlooks. He challenges the community for dishonoring the poor while admiring people who may be oppressing them.',
  reading_watch_for = 'Notice how James makes Christians look at the poor through God’s eyes, not through social advantage.',
  reading_key_terms = '[{"term":"Heirs of the kingdom","definition":"Those who receive the life and promises God gives."},{"term":"Dishonor","definition":"To treat someone as less worthy than God says they are."}]'::jsonb,
  reading_context_source_hash = 'ordinary-time-james-day-8-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'ordinary-time-james'
  and pd.day_number = 8;

-- Plan: ordinary-time-james
-- Day: 9
update public.plan_days pd
set
  reading_context = 'James connects partiality with the command to love one’s neighbor and the need for mercy.',
  previous_reading_summary = 'James reminded Christians that God honors the poor and that the Church must not measure people by worldly status. To dishonor the poor is to oppose God’s way of seeing.',
  reading_today_preview = 'James calls love of neighbor the royal law and says partiality breaks that law. He warns that judgment without mercy awaits those who refuse mercy.',
  reading_watch_for = 'Notice that mercy is not soft indifference; it is the way Christians must speak and act under God’s judgment.',
  reading_key_terms = '[{"term":"Royal law","definition":"The command to love your neighbor as yourself."},{"term":"Mercy","definition":"Compassionate love shown to someone in need or fault."}]'::jsonb,
  reading_context_source_hash = 'ordinary-time-james-day-9-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'ordinary-time-james'
  and pd.day_number = 9;

-- Plan: ordinary-time-james
-- Day: 10
update public.plan_days pd
set
  reading_context = 'James now turns directly to the relationship between faith and works of charity.',
  previous_reading_summary = 'James taught that partiality violates the command to love one’s neighbor. He told Christians to live as people who will be judged under mercy.',
  reading_today_preview = 'James says faith that does not act for a brother or sister in need is dead. Good words without concrete help do not count as living charity.',
  reading_watch_for = 'Notice that James is not attacking faith; he is attacking faith reduced to empty words.',
  reading_key_terms = '[{"term":"Works","definition":"Concrete acts of obedience and charity that living faith produces."},{"term":"Dead faith","definition":"A claimed faith that does not bear fruit in love."}]'::jsonb,
  reading_context_source_hash = 'ordinary-time-james-day-10-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'ordinary-time-james'
  and pd.day_number = 10;

-- Plan: ordinary-time-james
-- Day: 11
update public.plan_days pd
set
  reading_context = 'James continues insisting that real faith can be seen in the life it produces.',
  previous_reading_summary = 'James said that faith without concrete love is dead. A hungry or poorly clothed person needs real help, not religious phrases alone.',
  reading_today_preview = 'James challenges anyone who tries to separate faith from works. Even demons believe that God is one, but that kind of belief does not save because it does not become obedient love.',
  reading_watch_for = 'Notice that James wants faith to be visible without becoming showy.',
  reading_key_terms = '[{"term":"Demons believe","definition":"James’ warning that bare belief without obedience is not enough."},{"term":"Barren","definition":"Fruitless; producing nothing living."}]'::jsonb,
  reading_context_source_hash = 'ordinary-time-james-day-11-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'ordinary-time-james'
  and pd.day_number = 11;

-- Plan: ordinary-time-james
-- Day: 12
update public.plan_days pd
set
  reading_context = 'James gives examples from Scripture to show that living faith acts in obedience.',
  previous_reading_summary = 'James challenged the idea that faith can be separated from works. He made clear that belief without obedient love is barren.',
  reading_today_preview = 'James points to Abraham and Rahab as examples of faith completed by action. Their trust in God became concrete obedience, not private opinion.',
  reading_watch_for = 'Notice the Catholic clarity here: faith is living when it works through obedience and charity.',
  reading_key_terms = '[{"term":"Abraham","definition":"The father of God’s covenant people."},{"term":"Rahab","definition":"A woman whose risky help showed faith in action."},{"term":"Justified","definition":"Made right with God by grace, with faith becoming living obedience."}]'::jsonb,
  reading_context_source_hash = 'ordinary-time-james-day-12-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'ordinary-time-james'
  and pd.day_number = 12;

-- Plan: ordinary-time-james
-- Day: 13
update public.plan_days pd
set
  reading_context = 'James shifts from faith and works to the responsibility carried by speech and teaching.',
  previous_reading_summary = 'James used Abraham and Rahab to show that faith is completed by works. Living faith becomes obedient action, not words alone.',
  reading_today_preview = 'James warns that teachers will be judged more strictly and that everyone stumbles in speech. He begins a serious section on the power of the tongue.',
  reading_watch_for = 'Notice that James treats words as morally weighty, not casual or harmless.',
  reading_key_terms = '[{"term":"Teacher","definition":"One who instructs others and is accountable for that influence."},{"term":"Stumble","definition":"To fall into sin or failure."}]'::jsonb,
  reading_context_source_hash = 'ordinary-time-james-day-13-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'ordinary-time-james'
  and pd.day_number = 13;

-- Plan: ordinary-time-james
-- Day: 14
update public.plan_days pd
set
  reading_context = 'James keeps pressing the danger of undisciplined speech with vivid images.',
  previous_reading_summary = 'James warned that speech matters deeply and that teachers carry serious responsibility. Everyone needs humility because everyone stumbles in words.',
  reading_today_preview = 'James compares the tongue to a bit, a rudder, and a fire. Small words can steer a life or burn down what is good.',
  reading_watch_for = 'Notice how something small can still direct or damage something much larger.',
  reading_key_terms = '[{"term":"Tongue","definition":"James’ image for human speech."},{"term":"Rudder","definition":"A small part that steers a ship."}]'::jsonb,
  reading_context_source_hash = 'ordinary-time-james-day-14-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'ordinary-time-james'
  and pd.day_number = 14;

-- Plan: ordinary-time-james
-- Day: 15
update public.plan_days pd
set
  reading_context = 'James continues his teaching on speech by showing how contradictory the mouth can become.',
  previous_reading_summary = 'James compared the tongue to a small fire that can cause great damage. Words can direct a life or set whole relationships ablaze.',
  reading_today_preview = 'James says the same mouth should not bless God and curse people made in God’s likeness. Christian speech must be converted because the person we speak about bears God’s image.',
  reading_watch_for = 'Notice that James ties speech about other people directly to reverence for God.',
  reading_key_terms = '[{"term":"Likeness of God","definition":"The dignity every human person has from being made by God."},{"term":"Blessing and cursing","definition":"Contradictory uses of speech that should not live together."}]'::jsonb,
  reading_context_source_hash = 'ordinary-time-james-day-15-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'ordinary-time-james'
  and pd.day_number = 15;

-- Plan: ordinary-time-james
-- Day: 16
update public.plan_days pd
set
  reading_context = 'James now turns from the tongue to the kind of wisdom that can be seen in a good life.',
  previous_reading_summary = 'James said the same mouth should not bless God and curse people made in God’s likeness. Christian speech must become consistent with worship.',
  reading_today_preview = 'In one compact sentence, James says wisdom is shown by good conduct and meek works. Wisdom is not proved by sounding impressive but by a humble life.',
  reading_watch_for = 'Notice that true wisdom becomes visible in meekness, not self-display.',
  reading_key_terms = '[{"term":"Meekness","definition":"Humble strength under God’s rule."},{"term":"Good life","definition":"A life whose actions match faith."}]'::jsonb,
  reading_context_source_hash = 'ordinary-time-james-day-16-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'ordinary-time-james'
  and pd.day_number = 16;

-- Plan: ordinary-time-james
-- Day: 17
update public.plan_days pd
set
  reading_context = 'James contrasts true wisdom with the false wisdom driven by jealousy and ambition.',
  previous_reading_summary = 'James taught that wisdom is shown through a good life and meek works. The wise person does not need to perform greatness.',
  reading_today_preview = 'James warns that bitter jealousy and selfish ambition create disorder and evil. This kind of wisdom is not from God, even if it sounds clever.',
  reading_watch_for = 'Notice that James judges wisdom by its fruit in the heart and community.',
  reading_key_terms = '[{"term":"Jealousy","definition":"Resentful desire for another’s place, gift, or honor."},{"term":"Selfish ambition","definition":"Seeking one’s own advancement without charity."}]'::jsonb,
  reading_context_source_hash = 'ordinary-time-james-day-17-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'ordinary-time-james'
  and pd.day_number = 17;

-- Plan: ordinary-time-james
-- Day: 18
update public.plan_days pd
set
  reading_context = 'James describes the wisdom that comes from God and the peace it produces.',
  previous_reading_summary = 'James warned that jealousy and selfish ambition lead to disorder. False wisdom may look strong, but it leaves damage behind.',
  reading_today_preview = 'James says wisdom from above is pure, peaceable, gentle, merciful, and sincere. It produces righteousness in peace, not chaos or rivalry.',
  reading_watch_for = 'Notice that God’s wisdom can be tested by the kind of peace and mercy it produces.',
  reading_key_terms = '[{"term":"Wisdom from above","definition":"God-given wisdom that forms peace, mercy, and purity."},{"term":"Righteousness","definition":"Life made right before God and lived according to his will."}]'::jsonb,
  reading_context_source_hash = 'ordinary-time-james-day-18-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'ordinary-time-james'
  and pd.day_number = 18;

-- Plan: ordinary-time-james
-- Day: 19
update public.plan_days pd
set
  reading_context = 'James now turns to conflict and the disordered desires underneath it.',
  previous_reading_summary = 'James described wisdom from above as pure, peaceable, gentle, merciful, and sincere. God’s wisdom bears peaceful fruit rather than rivalry.',
  reading_today_preview = 'James says quarrels often begin with passions at war inside the heart. He also warns that prayer itself can become disordered when it is aimed at selfish desires.',
  reading_watch_for = 'Notice that James looks beneath conflict to what the heart is loving and demanding.',
  reading_key_terms = '[{"term":"Passions","definition":"Strong desires that can become disordered."},{"term":"Ask wrongly","definition":"Praying with selfish motives instead of love for God."}]'::jsonb,
  reading_context_source_hash = 'ordinary-time-james-day-19-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'ordinary-time-james'
  and pd.day_number = 19;

-- Plan: ordinary-time-james
-- Day: 20
update public.plan_days pd
set
  reading_context = 'James confronts friendship with the world and the pride that resists God.',
  previous_reading_summary = 'James traced conflict back to disordered desires. He warned that even prayer can be twisted when it serves selfish passion.',
  reading_today_preview = 'James says friendship with the world makes a person an enemy of God. He also gives hope: God gives more grace and lifts up the humble.',
  reading_watch_for = 'Notice that James is not asking for vague seriousness; he is calling for a clean break with pride.',
  reading_key_terms = '[{"term":"World","definition":"Human life organized against God."},{"term":"Grace","definition":"God’s free help and life given to us."},{"term":"Humble","definition":"Lowly before God and open to his help."}]'::jsonb,
  reading_context_source_hash = 'ordinary-time-james-day-20-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'ordinary-time-james'
  and pd.day_number = 20;

-- Plan: ordinary-time-james
-- Day: 21
update public.plan_days pd
set
  reading_context = 'James gives direct instructions for returning to God in humility.',
  previous_reading_summary = 'James warned against friendship with the world and the pride that resists God. He also promised that God gives more grace to the humble.',
  reading_today_preview = 'James tells Christians to submit to God, resist the devil, draw near, repent, and humble themselves. The movement is not vague improvement but a real return to the Lord.',
  reading_watch_for = 'Notice the order: submit to God, resist evil, and draw near to him.',
  reading_key_terms = '[{"term":"Submit","definition":"To place oneself under God’s authority."},{"term":"Resist the devil","definition":"Reject temptation and stand against evil."},{"term":"Repentance","definition":"Turning away from sin and back to God."}]'::jsonb,
  reading_context_source_hash = 'ordinary-time-james-day-21-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'ordinary-time-james'
  and pd.day_number = 21;

-- Plan: ordinary-time-james
-- Day: 22
update public.plan_days pd
set
  reading_context = 'James applies humility to the way Christians speak about and judge one another.',
  previous_reading_summary = 'James called Christians to submit to God, resist the devil, draw near, and repent. Humility before God is the path to being lifted up by him.',
  reading_today_preview = 'James warns against speaking evil of a brother and acting as if we are the judge. God alone is lawgiver and judge.',
  reading_watch_for = 'Notice that judging others can become a way of placing ourselves above God’s law.',
  reading_key_terms = '[{"term":"Lawgiver","definition":"God, who gives the law and judges rightly."},{"term":"Brother","definition":"A fellow member of the Christian community."}]'::jsonb,
  reading_context_source_hash = 'ordinary-time-james-day-22-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'ordinary-time-james'
  and pd.day_number = 22;

-- Plan: ordinary-time-james
-- Day: 23
update public.plan_days pd
set
  reading_context = 'James turns from judging others to boasting about plans as if life belonged to us.',
  previous_reading_summary = 'James warned against speaking evil of a brother and taking the place of judge. God alone gives the law and judges rightly.',
  reading_today_preview = 'James reminds Christians that life is brief and uncertain. Plans should be made under God’s will, not with arrogant confidence in our own control.',
  reading_watch_for = 'Notice that saying “if the Lord wills” is meant to shape the heart, not become a throwaway phrase.',
  reading_key_terms = '[{"term":"If the Lord wills","definition":"A way of placing plans under God’s rule."},{"term":"Mist","definition":"James’ image for the shortness of human life."}]'::jsonb,
  reading_context_source_hash = 'ordinary-time-james-day-23-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'ordinary-time-james'
  and pd.day_number = 23;

-- Plan: ordinary-time-james
-- Day: 24
update public.plan_days pd
set
  reading_context = 'James gives a sharp one-sentence warning about refusing known good.',
  previous_reading_summary = 'James taught that life is brief and our plans belong under God’s will. Arrogant self-confidence forgets how dependent we are on the Lord.',
  reading_today_preview = 'James says that knowing the right thing and failing to do it is sin. The Christian life includes responsibility for good left undone.',
  reading_watch_for = 'Notice that sin is not only doing evil; it can also be refusing the good God has made clear.',
  reading_key_terms = '[{"term":"Sin of omission","definition":"Failing to do the good one should do."}]'::jsonb,
  reading_context_source_hash = 'ordinary-time-james-day-24-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'ordinary-time-james'
  and pd.day_number = 24;

-- Plan: ordinary-time-james
-- Day: 25
update public.plan_days pd
set
  reading_context = 'James now speaks a severe warning against wealth used unjustly.',
  previous_reading_summary = 'James warned that it is sin to know the good and refuse it. Discipleship includes responsibility for both actions and omissions.',
  reading_today_preview = 'James condemns the rich who hoard, defraud workers, and live in luxury without justice. He says the cries of the oppressed reach the Lord.',
  reading_watch_for = 'Notice that James treats economic injustice as a spiritual issue before God.',
  reading_key_terms = '[{"term":"Lord of hosts","definition":"A title for God emphasizing his power and justice."},{"term":"Wages","definition":"Pay owed to workers for their labor."},{"term":"Injustice","definition":"Wrongdoing that denies others what they are due."}]'::jsonb,
  reading_context_source_hash = 'ordinary-time-james-day-25-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'ordinary-time-james'
  and pd.day_number = 25;

-- Plan: ordinary-time-james
-- Day: 26
update public.plan_days pd
set
  reading_context = 'After warning the unjust rich, James turns to the faithful who must wait for the Lord.',
  previous_reading_summary = 'James condemned wealth used selfishly and unjustly. He said the cries of defrauded workers reach the Lord of hosts.',
  reading_today_preview = 'James tells Christians to be patient like a farmer waiting for fruit. The Lord is near, so the heart must become steady rather than bitter or frantic.',
  reading_watch_for = 'Notice that Christian patience is active trust, not passive giving up.',
  reading_key_terms = '[{"term":"Patience","definition":"Faithful waiting without giving up or turning bitter."},{"term":"Coming of the Lord","definition":"Christ’s return and final judgment."}]'::jsonb,
  reading_context_source_hash = 'ordinary-time-james-day-26-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'ordinary-time-james'
  and pd.day_number = 26;

-- Plan: ordinary-time-james
-- Day: 27
update public.plan_days pd
set
  reading_context = 'James continues teaching patience by pointing to the prophets and Job.',
  previous_reading_summary = 'James called Christians to patient endurance while waiting for the Lord. He compared this steady hope to a farmer waiting for the harvest.',
  reading_today_preview = 'James warns against grumbling and holds up the prophets and Job as examples of steadfastness. He ends by reminding us that the Lord is compassionate and merciful.',
  reading_watch_for = 'Notice that steadfast suffering is not cold toughness; it rests on the mercy of God.',
  reading_key_terms = '[{"term":"Job","definition":"An Old Testament figure known for suffering and endurance."},{"term":"Prophets","definition":"God’s messengers who often suffered for speaking his word."},{"term":"Compassionate","definition":"Moved with mercy toward those who suffer."}]'::jsonb,
  reading_context_source_hash = 'ordinary-time-james-day-27-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'ordinary-time-james'
  and pd.day_number = 27;

-- Plan: ordinary-time-james
-- Day: 28
update public.plan_days pd
set
  reading_context = 'James returns to speech, now focusing on simple honesty.',
  previous_reading_summary = 'James pointed to the prophets and Job as examples of endurance. He reminded Christians that the Lord is compassionate and merciful.',
  reading_today_preview = 'James tells Christians not to use oaths to prop up unreliable speech. A disciple’s yes and no should be plain, honest, and trustworthy.',
  reading_watch_for = 'Notice that truthful speech should be ordinary for Christians, not a special performance.',
  reading_key_terms = '[{"term":"Oath","definition":"A solemn promise calling on something sacred as witness."},{"term":"Yes be yes","definition":"Simple, truthful speech without manipulation."}]'::jsonb,
  reading_context_source_hash = 'ordinary-time-james-day-28-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'ordinary-time-james'
  and pd.day_number = 28;

-- Plan: ordinary-time-james
-- Day: 29
update public.plan_days pd
set
  reading_context = 'James turns to prayer in the different conditions of Christian life: suffering, joy, sickness, and sin.',
  previous_reading_summary = 'James taught that Christian speech should be simple and trustworthy. A disciple should not need exaggerated oaths to be believed.',
  reading_today_preview = 'James tells the suffering to pray, the cheerful to praise, and the sick to call for the elders of the Church. Prayer, anointing, healing, and forgiveness are held together.',
  reading_watch_for = 'Notice how bodily sickness, spiritual need, and the ministry of the Church are not separated.',
  reading_key_terms = '[{"term":"Elders","definition":"Church leaders called to pray over the sick."},{"term":"Anointing","definition":"Using oil in prayer as a sign of God’s healing grace."},{"term":"Prayer of faith","definition":"Prayer that trusts God’s mercy and power."}]'::jsonb,
  reading_context_source_hash = 'ordinary-time-james-day-29-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'ordinary-time-james'
  and pd.day_number = 29;

-- Plan: ordinary-time-james
-- Day: 30
update public.plan_days pd
set
  reading_context = 'James continues his final teaching on prayer by connecting confession, healing, and intercession.',
  previous_reading_summary = 'James told Christians to bring suffering, joy, sickness, and sin before the Lord. He also showed the Church’s elders praying and anointing the sick.',
  reading_today_preview = 'James calls Christians to confess sins and pray for one another. He points to Elijah to show that the prayer of a righteous person can truly matter.',
  reading_watch_for = 'Notice that healing is not treated as isolated self-improvement; it belongs in prayer, confession, and communion.',
  reading_key_terms = '[{"term":"Confession","definition":"Acknowledging sin honestly before God and, rightly ordered, the Church."},{"term":"Intercession","definition":"Prayer offered for another person."},{"term":"Elijah","definition":"An Old Testament prophet known for powerful prayer."}]'::jsonb,
  reading_context_source_hash = 'ordinary-time-james-day-30-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'ordinary-time-james'
  and pd.day_number = 30;

-- Plan: ordinary-time-james
-- Day: 31
update public.plan_days pd
set
  reading_context = 'James closes his letter by turning outward toward the person who has wandered from the truth.',
  previous_reading_summary = 'James connected confession, prayer, and healing. He reminded Christians that prayer offered in righteousness is powerful before God.',
  reading_today_preview = 'James says that bringing back a sinner from error is an act of saving charity. The letter ends by calling Christians to care about the rescue of souls, not only their own progress.',
  reading_watch_for = 'Notice that charity seeks the return of the wanderer with truth, prayer, and mercy.',
  reading_key_terms = '[{"term":"Wanderer","definition":"Someone who has strayed from the truth."},{"term":"Soul","definition":"The spiritual life of a person before God."},{"term":"Charity","definition":"Love that seeks another person’s good in God."}]'::jsonb,
  reading_context_source_hash = 'ordinary-time-james-day-31-v1'
from public.challenge_plans cp
where cp.id = pd.plan_id
  and cp.slug = 'ordinary-time-james'
  and pd.day_number = 31;

commit;
