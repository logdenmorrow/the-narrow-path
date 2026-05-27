import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const SCHEDULE_PATH = "content/gospels/the-gospels-september-lent-reading-plan-draft.json";
const OUTPUT_PATH = "content/gospels/the-gospels-september-lent-gospel-days-draft.json";
const AUDIT_PATH = "docs/GOSPELS_SEASON_GOSPEL_TEXT_AUDIT.md";

const SOURCE_PATHS = {
  Matthew: "content/gospels/source/matthew-rsv2ce-ascension.json",
  Mark: "content/gospels/source/mark-rsv2ce-ascension.json",
  Luke: "content/gospels/source/luke-rsv2ce-ascension.json",
  John: "content/gospels/source/john-rsv2ce-ascension.json",
};

const EXPECTED_COUNTS = {
  totalDays: 162,
  gospelDays: 139,
  catechismDays: 23,
  byBook: {
    Mark: 25,
    Matthew: 39,
    Luke: 43,
    John: 32,
  },
};

const BOOK_ORDER = ["Mark", "Matthew", "Luke", "John"];

const GOSPEL_PROMPTS = new Map([
  [1, "Ask Christ to make repentance concrete today; name one wilderness where you need to prepare His way."],
  [2, "Where is Jesus saying 'Follow me' today, and what net needs to be left behind?"],
  [3, "Bring one wounded place to Jesus' authority, then make one act of mercy toward someone nearby."],
  [4, "Where do you need Christ's forgiveness more than outward fixing? Take one honest step toward Him."],
  [5, "Let Jesus reorder your Sabbath: choose one act of worship, mercy, or rest without legalism."],
  [7, "Ask Jesus to call you closer to Himself before any work He asks you to do."],
  [8, "What soil is your heart today? Remove one thorn that keeps the Word from bearing fruit."],
  [9, "Choose one hidden act of faithfulness, trusting the Kingdom to grow quietly under Christ's care."],
  [10, "Name one storm or darkness to Jesus, then tell one person what His mercy has done."],
  [11, "Pray with the words 'Do not fear'; entrust one impossible need to Jesus today."],
  [12, "Where does fear of rejection silence you? Ask for courage to witness without needing approval."],
  [14, "Offer Jesus what seems too small, and serve someone from the compassion He shows the crowd."],
  [15, "Ask Christ to purify your heart, then practice humble persistence in one difficult prayer."],
  [16, "Where do you need to be opened by Jesus? Listen, receive, and share one gift today."],
  [17, "Answer Jesus plainly: who is He to you? Let that confession shape one sacrifice today."],
  [18, "Ask for faith that says, 'Help my unbelief,' especially where prayer has felt powerless."],
  [19, "Choose the lower place today, and cut off one habit that leads you away from Christ."],
  [21, "Where are riches, comfort, or control competing with the Kingdom? Make one act of detachment."],
  [22, "Ask Jesus, 'Master, let me see,' then serve someone without seeking the place of honor."],
  [23, "Let Christ cleanse one corner of your worship; forgive someone before asking for more."],
  [24, "Give God what bears His image: your heart, your attention, and one hidden sacrifice."],
  [25, "Practice watchfulness today: resist one distraction that dulls your readiness for Christ."],
  [26, "Stay with Jesus in Gethsemane for ten minutes, and surrender one hard thing to the Father."],
  [28, "Stand near the condemned Christ; repent of one denial, compromise, or fear of being known as His."],
  [29, "Thank Jesus for His Cross and Resurrection, then speak one word of hope to someone."],
  [30, "Thank God for the real history of salvation, and entrust your family story to Christ."],
  [31, "Imitate Joseph's obedience: do the next right thing God has made clear."],
  [32, "Offer Christ your best gift today, and turn away from any path that protects comfort over obedience."],
  [33, "Renew your baptismal repentance; ask the beloved Son to make one crooked path straight."],
  [35, "Meet temptation with obedience: choose one Scripture, prayer, or fast against a real temptation today."],
  [36, "Pick one Beatitude to practice concretely, asking Jesus to form His poverty or mercy in you."],
  [37, "Seek reconciliation where you can, and let Christ convert one resentment, look, or word."],
  [38, "Pray the Our Father slowly, then give alms, pray, or fast without seeking notice."],
  [39, "Move one worry into the Father's hands, and make one choice for treasure in heaven."],
  [40, "Build on the rock today by obeying one command of Jesus you already know."],
  [42, "Bring Jesus one infirmity, yours or another's, and ask how mercy should move your hands."],
  [43, "Follow Christ without bargaining; receive His forgiveness and forgive one debt owed to you."],
  [44, "Let Jesus look on the crowd through your eyes; serve one person who seems spiritually tired."],
  [45, "Ask Christ to send you simply; speak peace and truth without overpacking your own security."],
  [46, "Do not fear those who oppose the Gospel; make one quiet act of loyalty to Christ."],
  [47, "Bring your burden to Jesus, then lay down one false expectation He is not asking you to carry."],
  [49, "Choose mercy over self-justification, especially in one place where rules are easier than love."],
  [50, "Ask the Holy Spirit to guard your speech, your repentance, and your belonging to Christ's family."],
  [51, "Protect the Word sown in you today by removing one distraction before it takes root."],
  [52, "Seek the Kingdom like treasure; give up one lesser thing gladly for Christ."],
  [53, "Let rejection make you compassionate, not hard; feed someone with patience, prayer, or practical help."],
  [54, "When fear rises, look at Jesus on the water and take one obedient step toward Him."],
  [56, "Pray with the Canaanite woman's humility; ask boldly for mercy without demanding control."],
  [57, "Renew your confession that Jesus is the Christ, and pray for Peter's successor and the Church."],
  [58, "Listen to the beloved Son before reacting today; let His voice correct one fear."],
  [59, "Practice Church life concretely: humility, correction, forgiveness, or prayer with another person."],
  [60, "Forgive from the heart in one specific case, and honor faithfulness in your closest duties."],
  [61, "Ask what you must loosen your grip on so heavenly treasure can matter more."],
  [63, "Drink the chalice of service today by accepting one costly act of love."],
  [64, "Welcome Christ the King into your habits; let Him purify one place of prayer."],
  [65, "Do not dodge Jesus' authority; answer Him with obedience in one decision."],
  [66, "Love God and neighbor in a concrete pair: one act of worship, one act of charity."],
  [67, "Ask Jesus to expose hypocrisy gently; choose one hidden act that matches your words."],
  [68, "Persevere without panic; entrust one trial to Christ who will come in glory."],
  [70, "Keep oil in your lamp today through prayer, confession of sin, and readiness to serve."],
  [71, "Use one talent for Christ and recognize Him in one hungry, lonely, or overlooked person."],
  [72, "Stay awake with Jesus; receive His gift with gratitude and surrender one fear in prayer."],
  [73, "Look at Peter and Pilate honestly; repent of one cowardice and stand nearer to Christ."],
  [74, "Go and make disciples begins with you: believe the Resurrection and witness to one person."],
  [75, "Wait with Zechariah; let silence, prayer, or patience make room for God's promise."],
  [77, "Say Mary's yes in one concrete duty, then carry Christ's charity to someone else."],
  [78, "Bless God for His mercy, and name one way He is preparing you to serve."],
  [79, "Receive the Savior in humility; make room for Him in one ordinary, poor place."],
  [80, "Present yourself to the Father today, and ponder one word of Christ like Mary."],
  [81, "Bear fruit worthy of repentance: repair one wrong, share with someone, or pray honestly."],
  [82, "When tempted to prove yourself, answer as a beloved child and choose obedience."],
  [84, "Let Jesus announce good news to your poverty; bring Him one captive or blind place."],
  [85, "Put out into the deep by obeying one invitation from Jesus that feels inconvenient."],
  [86, "Receive forgiveness like the paralytic, then make room for the new wine of grace."],
  [87, "Let Jesus be Lord of your time; choose mercy over scrutiny in one encounter."],
  [88, "Practice one hard teaching from the plain: bless, forgive, give, or build on rock."],
  [89, "Approach Jesus with the centurion's trust; intercede for someone who cannot ask."],
  [91, "Look for the works of the Messiah today: mercy, healing, good news, and humble faith."],
  [92, "Love much because you have been forgiven; make one act of gratitude without self-defense."],
  [93, "Hear the Word and keep it: let one sentence from Jesus govern your day."],
  [94, "Place fear before Jesus' feet, and let His authority restore your peace."],
  [95, "Let Christ send and feed you; share what little you have after prayer."],
  [96, "Confess Christ, take up today's cross, and listen to Him in prayer."],
  [98, "Choose the childlike place when rivalry appears; welcome someone who cannot repay you."],
  [99, "Set your face with Jesus toward the Father's will, and bless one household with peace."],
  [100, "Be neighbor before being busy; choose the better part and one concrete mercy."],
  [101, "Ask, seek, knock with perseverance, then forgive someone as you pray Our Father."],
  [102, "Let Christ's light judge your motives; repent of one hidden hypocrisy."],
  [103, "Store treasure with God today by refusing greed, fear, or anxious control."],
  [105, "Be ready for the Master: reconcile, pray, or settle one unfinished duty today."],
  [106, "Repent without delay, and trust one small mustard-seed obedience to grow."],
  [107, "Enter by the narrow door through one concrete act of humility and conversion."],
  [108, "Take the humble place; count the cost of discipleship in one real attachment."],
  [109, "Return to the Father like the lost son, or seek the lost like the shepherd."],
  [110, "Use money, time, and attention as a steward who will answer to God."],
  [112, "Ask for faith enough to forgive; then thank Christ for one undeserved mercy."],
  [113, "Pray like the widow and the tax collector: persistent, humble, and honest before God."],
  [114, "Receive the Kingdom like a child, and ask what possession or pride blocks you."],
  [115, "Welcome Jesus into your house; make one concrete restitution, generosity, or faithful use of gifts."],
  [116, "Let Christ weep over what is unconverted in you, then cleanse one habit of prayer."],
  [117, "Give to Caesar what is Caesar's, but give God your obedience without reservation."],
  [119, "Trust the God of the living, and offer one small gift from real poverty."],
  [120, "Stand before the Son of Man by watching your heart and praying through fear."],
  [121, "Receive the chalice and the table with reverence; stay awake with Jesus in temptation."],
  [122, "When accused or afraid, remain close to Jesus and refuse one denial."],
  [123, "At the Cross, forgive, hope, and entrust yourself to the Father with Jesus."],
  [124, "Ask Jesus to open the Scriptures, then share the joy of the risen Lord."],
  [126, "Adore the Word made flesh, and receive one person today with His grace and truth."],
  [127, "Come and see, then invite one person toward Christ by witness rather than pressure."],
  [128, "Let Jesus purify your worship and bless ordinary life with His hidden glory."],
  [129, "Ask to be born from above; bring one dark habit into Christ's light."],
  [130, "Say with John, 'He must increase'; decrease one demand for attention or control."],
  [131, "Ask Jesus for living water where you are ashamed, thirsty, or divided."],
  [133, "Trust Christ's word before seeing results; pray for one person who needs healing."],
  [134, "Rise at Jesus' command; leave behind one excuse that keeps you spiritually stuck."],
  [135, "Listen to the Son's voice, and honor the Father through one act of obedience."],
  [136, "Give Jesus your few loaves; let Him meet fear on the waters today."],
  [137, "Receive the Bread of Life with faith; ask for deeper hunger for the Eucharist."],
  [138, "When discipleship feels hard, tell Jesus, 'You have the words of eternal life.'"],
  [140, "Seek the Father's glory, not your own timing, in one hidden choice today."],
  [141, "Ask for the Spirit's living water, and refuse the crowd's pressure to judge by appearances."],
  [142, "Receive mercy and leave sin; show the same merciful truth to someone else."],
  [143, "Walk in Christ's light by rejecting one lie that keeps you from freedom."],
  [144, "Ask Jesus to heal spiritual blindness; defend the truth even when it costs approval."],
  [145, "Listen for the Shepherd's voice, and lay down one self-protective habit."],
  [147, "Trust the Son who is one with the Father; cling to His works when faith is tested."],
  [148, "Bring Jesus the tomb you fear opening; believe He is Resurrection and Life."],
  [149, "Offer costly love like Mary, and let Christ's approaching hour reorder your priorities."],
  [150, "Let yourself be drawn to the lifted-up Christ; die to one grain-of-wheat attachment."],
  [151, "Let Jesus wash your feet; serve someone lowly without announcing it."],
  [152, "Follow the Way today through love, trust, and one obedient work in Christ's name."],
  [154, "Ask the Advocate to teach you obedience, and receive Christ's peace where you are troubled."],
  [155, "Abide in the vine by keeping one commandment of love when it costs you."],
  [156, "Bring sorrow to Jesus and pray in His name with confidence in His victory."],
  [157, "Rest inside Jesus' prayer to the Father, and pray for unity with one difficult person."],
  [158, "Stand with Jesus when He is bound; repent of one quiet denial."],
  [159, "Behold the suffering King, and surrender one fear of earthly power or approval."],
  [161, "Stay at the Cross and run to the tomb; announce hope where grief has been heavy."],
  [162, "Receive Christ's peace, bring Him your doubts, and let love restore your mission."],
]);

function readJson(path) {
  return JSON.parse(readFileSync(resolve(path), "utf8"));
}

function writeJson(path, data) {
  mkdirSync(dirname(resolve(path)), { recursive: true });
  writeFileSync(resolve(path), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function writeText(path, text) {
  mkdirSync(dirname(resolve(path)), { recursive: true });
  writeFileSync(resolve(path), text, "utf8");
}

function parseReference(reference) {
  const match = reference.match(/^(Matthew|Mark|Luke|John) (\d+):(\d+)-(?:(\d+):)?(\d+)$/);
  if (!match) {
    throw new Error(`Unsupported Gospel reference: ${reference}`);
  }

  const [, book, startChapter, startVerse, endChapter, endVerse] = match;
  return {
    book,
    startChapter: Number(startChapter),
    startVerse: Number(startVerse),
    endChapter: endChapter ? Number(endChapter) : Number(startChapter),
    endVerse: Number(endVerse),
  };
}

function buildSourceIndex(source) {
  const chapters = new Map();
  for (const chapter of source.chapters) {
    chapters.set(chapter.chapter, {
      ...chapter,
      versesByNumber: new Map(chapter.verses.map((verse) => [verse.verseNumber, verse])),
    });
  }

  return {
    book: source.book,
    diagnostics: source.diagnostics,
    chapters,
  };
}

function verseInRange({ chapter, verseNumber, reference }) {
  if (chapter < reference.startChapter || chapter > reference.endChapter) return false;
  if (chapter === reference.startChapter && verseNumber < reference.startVerse) return false;
  if (chapter === reference.endChapter && verseNumber > reference.endVerse) return false;
  return true;
}

function omittedLabelsInRange({ sourceIndex, reference }) {
  const omitted = [];

  for (let chapterNumber = reference.startChapter; chapterNumber <= reference.endChapter; chapterNumber += 1) {
    const chapter = sourceIndex.chapters.get(chapterNumber);
    if (!chapter) continue;

    for (const verseNumber of chapter.omittedVerseNumbers) {
      if (verseInRange({ chapter: chapterNumber, verseNumber, reference })) {
        omitted.push(`${reference.book} ${chapterNumber}:${verseNumber}`);
      }
    }
  }

  return omitted;
}

function sourceArtifactsInRange({ sourceIndex, reference }) {
  const artifacts = [];

  for (let chapterNumber = reference.startChapter; chapterNumber <= reference.endChapter; chapterNumber += 1) {
    const chapter = sourceIndex.chapters.get(chapterNumber);
    if (!chapter) continue;

    for (const verseNumber of chapter.duplicateVerseNumbers ?? []) {
      if (verseInRange({ chapter: chapterNumber, verseNumber, reference })) {
        artifacts.push(`${reference.book} ${chapterNumber}:${verseNumber} duplicate source block`);
      }
    }

    for (const artifact of chapter.artifacts ?? []) {
      const artifactRefs = [
        ...String(artifact).matchAll(new RegExp(`${reference.book} ${chapterNumber}:(\\d+)`, "g")),
      ].map((match) => Number.parseInt(match[1], 10));

      if (
        artifactRefs.some((verseNumber) =>
          verseInRange({ chapter: chapterNumber, verseNumber, reference })
        )
      ) {
        artifacts.push(`${reference.book} ${chapterNumber}: ${artifact}`);
      }
    }
  }

  return [...new Set(artifacts)];
}

function sliceReading({ sourceIndex, reference }) {
  const blocks = [];
  const omittedLabels = omittedLabelsInRange({ sourceIndex, reference });
  const sourceArtifacts = sourceArtifactsInRange({ sourceIndex, reference });
  const warnings = [];
  let verseCount = 0;

  for (let chapterNumber = reference.startChapter; chapterNumber <= reference.endChapter; chapterNumber += 1) {
    const chapter = sourceIndex.chapters.get(chapterNumber);
    if (!chapter) {
      warnings.push(`Missing source chapter: ${reference.book} ${chapterNumber}`);
      continue;
    }

    const verses = chapter.verses.filter((verse) =>
      verseInRange({ chapter: chapterNumber, verseNumber: verse.verseNumber, reference })
    );

    if (verses.length === 0) {
      warnings.push(`No source verses found in ${reference.book} ${chapterNumber} for ${formatReference(reference)}.`);
      continue;
    }

    verseCount += verses.length;
    blocks.push({
      book: reference.book,
      chapter: chapterNumber,
      sourceUrl: chapter.sourceUrl,
      verses,
    });
  }

  return {
    blocks,
    omittedLabels,
    sourceArtifacts,
    warnings,
    verseCount,
  };
}

function formatReference(reference) {
  if (reference.startChapter === reference.endChapter) {
    return `${reference.book} ${reference.startChapter}:${reference.startVerse}-${reference.endVerse}`;
  }

  return `${reference.book} ${reference.startChapter}:${reference.startVerse}-${reference.endChapter}:${reference.endVerse}`;
}

function formatReadingText({ reference, sliced }) {
  const lines = [];
  const includeChapterHeadings = sliced.blocks.length > 1;

  for (const block of sliced.blocks) {
    if (includeChapterHeadings) {
      lines.push(`## ${block.book} ${block.chapter}`, "");
    }

    let lastHeading = null;
    for (const verse of block.verses) {
      if (verse.heading && verse.heading !== lastHeading) {
        lines.push(`### ${verse.heading}`, "");
        lastHeading = verse.heading;
      }

      lines.push(`**${verse.verseNumber}.** ${verse.text}`, "");
    }
  }

  const text = lines.join("\n").trim();
  if (!text) {
    throw new Error(`Empty reading text for ${formatReference(reference)}`);
  }

  return text;
}

function reflectionPromptFor(day) {
  const prompt = GOSPEL_PROMPTS.get(day.dayNumber);
  if (!prompt) {
    throw new Error(`Missing Gospel reflection prompt for Day ${day.dayNumber}.`);
  }

  return prompt;
}

function buildOutput() {
  const schedule = readJson(SCHEDULE_PATH);
  const sources = Object.fromEntries(
    Object.entries(SOURCE_PATHS).map(([book, path]) => [book, buildSourceIndex(readJson(path))])
  );
  const audit = {
    totalDaysProcessed: schedule.days.length,
    gospelDaysPopulated: 0,
    catechismDaysDeferred: 0,
    readingTextPopulatedCount: 0,
    reflectionPromptPopulatedCount: 0,
    countPerGospel: Object.fromEntries(BOOK_ORDER.map((book) => [book, 0])),
    omittedLabelsInAssignedRanges: [],
    sourceArtifactsInAssignedRanges: [],
    sourceScheduleMismatches: [],
    emptyReadingTextDays: [],
    missingReflectionPromptDays: [],
    validationWarnings: [],
  };

  const days = schedule.days.map((day) => {
    if (day.dayType === "catechism") {
      audit.catechismDaysDeferred += 1;
      return {
        ...day,
        readingText: null,
        reflectionPrompt: null,
        contentStatus: "catechism-deferred",
        contentNote: "Sunday Catechism reading text and prompt are deferred to a later pass.",
      };
    }

    const reference = parseReference(day.readingReference);
    const sourceIndex = sources[reference.book];

    if (!sourceIndex) {
      audit.sourceScheduleMismatches.push(`No source index found for ${day.readingReference}.`);
      return day;
    }

    const sliced = sliceReading({ sourceIndex, reference });
    const readingText = formatReadingText({ reference, sliced });
    const reflectionPrompt = reflectionPromptFor(day);
    const sourceMetadata = {
      provider: "Ascension Web App",
      translation: "RSV2CE",
      book: reference.book,
      reference: day.readingReference,
      start: {
        chapter: reference.startChapter,
        verse: reference.startVerse,
      },
      end: {
        chapter: reference.endChapter,
        verse: reference.endVerse,
      },
      sourceUrls: sliced.blocks.map((block) => block.sourceUrl),
      sourceVerseCount: sliced.verseCount,
      omittedSourceVerseLabelsInRange: sliced.omittedLabels,
      sourceArtifactsInRange: sliced.sourceArtifacts,
    };

    audit.gospelDaysPopulated += 1;
    audit.readingTextPopulatedCount += readingText ? 1 : 0;
    audit.reflectionPromptPopulatedCount += reflectionPrompt ? 1 : 0;
    audit.countPerGospel[reference.book] += 1;

    if (sliced.omittedLabels.length > 0) {
      audit.omittedLabelsInAssignedRanges.push({
        dayNumber: day.dayNumber,
        reference: day.readingReference,
        omittedLabels: sliced.omittedLabels,
      });
    }

    if (sliced.sourceArtifacts.length > 0) {
      audit.sourceArtifactsInAssignedRanges.push({
        dayNumber: day.dayNumber,
        reference: day.readingReference,
        sourceArtifacts: sliced.sourceArtifacts,
      });
    }

    for (const warning of sliced.warnings) {
      audit.sourceScheduleMismatches.push(`Day ${day.dayNumber}: ${warning}`);
    }

    return {
      ...day,
      readingText,
      reflectionPrompt,
      sourceMetadata,
    };
  });

  const output = {
    ...schedule,
    note:
      "Gospel-days-only import-preparation review artifact. Gospel readingText and Gospel reflectionPrompt are populated from reviewed Ascension source artifacts; Sunday Catechism content remains deferred. This is not SQL, not a migration, and not active app data.",
    artifactType: "gospel-days-import-preparation-draft",
    sourceSchedulePath: SCHEDULE_PATH,
    sourceArtifacts: SOURCE_PATHS,
    generatedAt: new Date().toISOString(),
    days,
  };

  validateOutput({ output, audit });
  return { output, audit };
}

function validateOutput({ output, audit }) {
  const days = output.days;
  const gospelDays = days.filter((day) => day.dayType === "gospel");
  const catechismDays = days.filter((day) => day.dayType === "catechism");

  if (days.length !== EXPECTED_COUNTS.totalDays) {
    audit.validationWarnings.push(`Expected 162 day objects, found ${days.length}.`);
  }

  if (gospelDays.length !== EXPECTED_COUNTS.gospelDays) {
    audit.validationWarnings.push(`Expected 139 Gospel days, found ${gospelDays.length}.`);
  }

  if (catechismDays.length !== EXPECTED_COUNTS.catechismDays) {
    audit.validationWarnings.push(`Expected 23 Catechism days, found ${catechismDays.length}.`);
  }

  for (const day of days) {
    if (day.weekday === "Sunday" && day.dayType === "gospel") {
      audit.validationWarnings.push(`Sunday Gospel day found: Day ${day.dayNumber}.`);
    }

    if (day.weekday !== "Sunday" && day.dayType === "catechism") {
      audit.validationWarnings.push(`Non-Sunday Catechism day found: Day ${day.dayNumber}.`);
    }
  }

  for (const day of gospelDays) {
    if (!day.readingText) audit.emptyReadingTextDays.push(day.dayNumber);
    if (!day.reflectionPrompt) audit.missingReflectionPromptDays.push(day.dayNumber);
  }

  const populatedReadingText = gospelDays.filter((day) => typeof day.readingText === "string" && day.readingText.trim()).length;
  const populatedPrompts = gospelDays.filter((day) => typeof day.reflectionPrompt === "string" && day.reflectionPrompt.trim()).length;
  const deferredCatechismText = catechismDays.filter((day) => day.readingText === null).length;
  const deferredCatechismPrompts = catechismDays.filter((day) => day.reflectionPrompt === null).length;

  if (populatedReadingText !== EXPECTED_COUNTS.gospelDays) {
    audit.validationWarnings.push(`Expected 139 populated Gospel readingText values, found ${populatedReadingText}.`);
  }

  if (populatedPrompts !== EXPECTED_COUNTS.gospelDays) {
    audit.validationWarnings.push(`Expected 139 populated Gospel reflectionPrompt values, found ${populatedPrompts}.`);
  }

  if (deferredCatechismText !== EXPECTED_COUNTS.catechismDays) {
    audit.validationWarnings.push(`Expected 23 deferred Catechism readingText values, found ${deferredCatechismText}.`);
  }

  if (deferredCatechismPrompts !== EXPECTED_COUNTS.catechismDays) {
    audit.validationWarnings.push(`Expected 23 deferred Catechism reflectionPrompt values, found ${deferredCatechismPrompts}.`);
  }

  const gospelSequence = [...new Set(gospelDays.map((day) => day.gospelBook))].join(" -> ");
  if (gospelSequence !== BOOK_ORDER.join(" -> ")) {
    audit.validationWarnings.push(`Expected Gospel sequence ${BOOK_ORDER.join(" -> ")}, found ${gospelSequence}.`);
  }

  for (const [book, expectedCount] of Object.entries(EXPECTED_COUNTS.byBook)) {
    if (audit.countPerGospel[book] !== expectedCount) {
      audit.validationWarnings.push(`Expected ${expectedCount} ${book} Gospel days, found ${audit.countPerGospel[book]}.`);
    }
  }
}

function formatList(items) {
  if (items.length === 0) return "None.";
  return items.map((item) => `- ${item}`).join("\n");
}

function buildAuditMarkdown(audit) {
  const lines = [
    "# Gospels Season Gospel Text Audit",
    "",
    "Audit for `content/gospels/the-gospels-september-lent-gospel-days-draft.json`.",
    "",
    "Status: Gospel-days import-preparation review artifact only. This is not SQL, not a migration, not Supabase data, not app behavior, and not Before You Read context.",
    "",
    "## Counts",
    "",
    `- Total days processed: ${audit.totalDaysProcessed}`,
    `- Gospel days populated: ${audit.gospelDaysPopulated}`,
    `- Catechism days deferred: ${audit.catechismDaysDeferred}`,
    `- readingText populated count: ${audit.readingTextPopulatedCount}`,
    `- reflectionPrompt populated count: ${audit.reflectionPromptPopulatedCount}`,
    "",
    "## Count Per Gospel",
    "",
    "| Gospel | Days |",
    "| --- | ---: |",
    ...BOOK_ORDER.map((book) => `| ${book} | ${audit.countPerGospel[book]} |`),
    "",
    "## Omitted Source Verse Labels Inside Assigned Ranges",
    "",
  ];

  if (audit.omittedLabelsInAssignedRanges.length === 0) {
    lines.push("None.", "");
  } else {
    lines.push("| Day | Reference | Omitted labels |", "| ---: | --- | --- |");
    for (const item of audit.omittedLabelsInAssignedRanges) {
      lines.push(`| ${item.dayNumber} | ${item.reference} | ${item.omittedLabels.join(", ")} |`);
    }
    lines.push("");
  }

  lines.push("## Source Artifacts Inside Assigned Ranges", "");

  if (audit.sourceArtifactsInAssignedRanges.length === 0) {
    lines.push("None.", "");
  } else {
    lines.push("| Day | Reference | Source artifacts |", "| ---: | --- | --- |");
    for (const item of audit.sourceArtifactsInAssignedRanges) {
      lines.push(`| ${item.dayNumber} | ${item.reference} | ${item.sourceArtifacts.join("; ")} |`);
    }
    lines.push("");
  }

  lines.push(
    "## Source/Schedule Mismatches",
    "",
    formatList(audit.sourceScheduleMismatches),
    "",
    "## Empty or Missing Content Checks",
    "",
    `- Gospel days with empty readingText: ${audit.emptyReadingTextDays.length ? audit.emptyReadingTextDays.join(", ") : "none"}`,
    `- Gospel days with missing reflectionPrompt: ${audit.missingReflectionPromptDays.length ? audit.missingReflectionPromptDays.join(", ") : "none"}`,
    "",
    "## Validation",
    "",
    formatList(audit.validationWarnings),
    "",
    "## Confirmations",
    "",
    "- Sunday Catechism days were left deferred with `readingText: null`.",
    "- Sunday Catechism days were left deferred with `reflectionPrompt: null`.",
    "- Gospel reading text was sliced from the reviewed Ascension source JSON artifacts.",
    "- Omitted source verse labels were recorded and not invented.",
    "- No Catechism text was added.",
    "- No SQL was created.",
    "- No Supabase migration was created.",
    "- No Supabase data was read, written, or mutated.",
    "- No app behavior was changed.",
    "- No Before You Read context was generated.",
    ""
  );

  return lines.join("\n");
}

const { output, audit } = buildOutput();
writeJson(OUTPUT_PATH, output);
writeText(AUDIT_PATH, buildAuditMarkdown(audit));

console.log(`Wrote ${OUTPUT_PATH}`);
console.log(`Wrote ${AUDIT_PATH}`);
console.log(`Gospel days populated: ${audit.gospelDaysPopulated}`);
console.log(`Reflection prompts populated: ${audit.reflectionPromptPopulatedCount}`);
console.log(`Catechism days deferred: ${audit.catechismDaysDeferred}`);
console.log(`Omitted label ranges: ${audit.omittedLabelsInAssignedRanges.length}`);
console.log(`Validation warnings: ${audit.validationWarnings.length}`);
