# Gospel Season Before You Read QA

Content QA for `content/gospels/the-gospels-september-lent-before-you-read-review.json`.

## Overall Verdict

The second-pass Before You Read review artifact is structurally complete and ready for final human spot-check before a future migration is prepared.

- Regenerated artifact warnings: 0.
- No source metadata issues were found in generated DB-bound context fields.
- Content is not yet applied to production.
- The Gospel plan remains inactive.

## First Pass Findings

The review artifact is safe and structurally complete, but it is not ready to become a migration without another generator pass and a small set of manual overrides.

- All 162 days have generated context fields.
- No generated DB-bound fields contain URLs, source attribution, extraction language, or Ascension references.
- The copy is generally plainspoken and Catholic-safe.
- The main weakness is repetition: many rows read like generated templates rather than day-specific reading helps.
- Catechism Sundays need a more distinct style from Gospel reading days.
- Several transition and final-week days need custom wording.

## Second Pass Notes

The generator was tuned after this QA pass and the review artifacts were regenerated.

- Added manual overrides for Days 30, 75, 89, 91, 124, 126, 156, 157, 159, 160, 161, and 162.
- Added topic-specific Catechism Sunday copy for all 23 Catechism days.
- Replaced broad stage language with per-book outline context for Mark, Matthew, Luke, and John.
- Added validation warnings for generic `Watch For` fallback use, repeated exact `Where We Are` copy over 3 uses, empty key terms on transition or major doctrinal days, and premature final-movement language.
- Regenerated artifact warnings: 0.
- Generic `Watch For` fallback rows: 0.
- Repeated exact `Where We Are` rows over threshold: 0.
- Key-term tightening improved broad terms: `disciple` dropped from 23 uses to 7, `Passion` dropped from 28 uses to 19, and `Church` dropped from 14 uses to 11.
- No transition or major doctrinal days now have empty key terms.

## Top Repeated Phrases

### Where We Are

The stage-based opening repeats heavily:

- `This reading comes in the middle movement of...`: 48 days
- `This reading comes in the later movement of...`: 33 days
- `This reading comes in the opening movement of...`: 29 days
- `This reading comes in the final movement of...`: 25 days
- `This Sunday pauses the Gospel sequence for the Catechism...`: 23 days

Exact repeated final-movement copy is especially visible:

- Matthew final movement sentence: 10 days
- Luke final movement sentence: 7 days
- Mark final movement sentence: 4 days
- John final movement sentence: 4 days

### Today

The `Today` field is serviceable but formulaic:

- `Today, Jesus teaches...`: 35 days
- `Today, the Catechism...`: 23 days
- `Today, Jesus is...`: 15 days
- `Today, Jesus answers...`: 9 days
- `Today, Jesus heals...`: 8 days

This is acceptable for a first pass, but the high counts point to places where the UI may feel repetitive on consecutive days.

### Watch For

Most repeated `Watch For` lines:

- `Notice how the Church's teaching clarifies what the Gospel shows in Christ's life and mission.`: 23 days
- `Watch the concrete actions and questions in the text. They show what Jesus reveals and what He asks.`: 21 days
- `Notice the concrete images Jesus uses to reveal the Kingdom.`: 18 days
- `Stay close to Jesus' obedience and silence as He freely enters His Passion.`: 16 days
- `Watch how mercy restores real people without pretending sin is harmless.`: 16 days
- `Watch how the Resurrection creates witness, worship, and mission.`: 16 days
- `Notice that disciples are called to be with Jesus before they are sent.`: 12 days

The generic fallback line appears too often and should be treated as a warning.

## Key Term QA

Most common key terms:

- `Passion`: 28
- `disciple`: 23
- `parable`: 20
- `Resurrection`: 17
- `baptism`: 14
- `Church`: 14
- `Kingdom of God`: 14
- `mercy`: 13
- `crucifixion`: 12
- `temple`: 12

Concerns:

- `disciple` is too generic at 23 uses. Keep it only where discipleship itself is central.
- `Passion` is over-triggered by broad words like death and burial. It should be used around Passion narrative, not every death-related phrase.
- `Church` is often useful on Catechism Sundays, but should not be a filler term.
- 24 days have no key terms: 4, 10, 16, 30, 36, 39, 40, 42, 61, 67, 82, 86, 94, 102, 107, 133, 135, 136, 138, 144, 147, 152, 155, 158.
- Empty key terms are allowed, but several of those days could use one useful term, especially Day 30, Day 36, Day 40, Day 136, Day 144, Day 152, and Day 158.

## Days Needing Manual Review

### High Priority

- Day 30, `Matthew 1:1-17`: transition from Mark to Matthew is too generic, and `Watch For` falls back to the generic line.
- Day 75, `Luke 1:1-25`: transition from Matthew to Luke needs custom context; `Watch For` incorrectly emphasizes baptism.
- Day 89, `Luke 7:1-17`: incorrectly placed in Luke's final movement because the generator treats `raises` as final/Resurrection language.
- Day 91, `Luke 7:18-35`: `Watch For` emphasizes baptism because of John, but the passage is about signs of the Messiah and John's messengers.
- Day 124, `Luke 24:13-53`: needs custom Resurrection/Emmaus/mission wording; current watch line says disciples are called before being sent.
- Day 126, `John 1:1-18`: transition to John needs richer prologue wording; current watch line is generic.
- Day 156, `John 16:1-33`: final discourse watch line is weak.
- Day 157, `John 17:1-26`: priestly prayer needs a custom watch line.
- Day 159, `John 18:28-19:16`: current watch line says disciples are called before being sent, which is irrelevant.
- Day 160, `CCC 1422-1433; 1440-1449; 1450-1460; 1480-1484`: final Catechism Sunday before Lent should receive custom transition wording.
- Day 161, `John 19:17-20:18`: good direction, but final-week context should name Cross, empty tomb, and Mary Magdalene more directly.
- Day 162, `John 20:19-21:25`: needs stronger custom wording around peace, forgiveness of sins, Thomas, Peter, and witness.

### Catechism Sundays

All 23 Catechism Sundays need a distinct template or topic-specific overrides:

6, 13, 20, 27, 34, 41, 48, 55, 62, 69, 76, 83, 90, 97, 104, 111, 118, 125, 132, 139, 146, 153, 160.

The current repeated pattern is clear and safe, but flat. Each Sunday should connect the Catechism topic to the prior or upcoming Gospel readings.

### Gospel Transitions

Manual transition context is recommended for:

- Day 1: opening the season and Mark.
- Day 30: Mark to Matthew.
- Day 75: Matthew to Luke.
- Day 126: Luke/Catechism to John.
- Day 161-162: closing the whole season before Lent.

## Recommended Generator Changes

- Replace broad stage language with a per-book outline map. Example: Mark early ministry, Mark Jerusalem/Passion; Matthew infancy, Sermon, mission, parables, Church, Jerusalem; Luke infancy, Galilee, journey to Jerusalem, Passion/Resurrection; John signs, Bread of Life, feasts, farewell discourse, Passion/Resurrection.
- Add manual override support keyed by `day_number` for transition days, Catechism Sundays, and final week.
- Make `Watch For` topic-specific before falling back. Treat fallback usage as a warning if it exceeds a small threshold.
- For Catechism Sundays, use a Sunday-specific generator:
  - `Where We Are`: connect this doctrine to the season's Gospel arc.
  - `Today`: state the doctrine plainly.
  - `Watch For`: name how the doctrine helps the reader read Christ.
- Restrict key-term triggers to title, reference, focus, and section headings, but add targeted terms for known titles.
- De-prioritize broad terms such as `disciple`, `Church`, and `Passion` unless the day is directly about them.
- Add validation warnings for:
  - generic fallback `Watch For`
  - repeated exact `Where We Are` over 3 uses
  - empty key terms on major doctrinal or transition days
  - final-movement assignment before the actual Passion/Resurrection arc

## Recommended Manual Overrides

- Day 30: Matthew transition and genealogy.
- Day 75: Luke transition and Zechariah.
- Day 89: remove final-movement language.
- Day 91: John's messengers and messianic signs.
- Day 124: Emmaus, opened Scriptures, blessing, and mission.
- Day 126: John's prologue.
- Days 156-162: farewell discourse, priestly prayer, Passion, penance Sunday, Cross, Resurrection, Thomas, Peter, and witness.
- Catechism Sundays: at least Days 6, 20, 62, 83, 90, 97, 104, 125, 132, 139, 146, 153, and 160 should get handcrafted or topic-specific wording.

## Better Wording Examples

### Day 30 - Matthew 1:1-17

Current issue: generic transition and generic watch line.

Suggested:

- Where We Are: Matthew begins again at Israel's story, naming Jesus as son of David and son of Abraham. After finishing Mark, the season turns to another Gospel witness to the same Christ.
- Today: Today, Matthew traces Jesus' genealogy and shows that God's promises move through real families and history.
- Watch For: Notice the names Matthew includes. The Messiah comes through Israel's story, with mercy visible even in a wounded family line.
- Key Terms: Messiah; son of David; genealogy.

### Day 75 - Luke 1:1-25

Current issue: `Watch For` incorrectly points to baptism.

Suggested:

- Where We Are: Luke begins with an orderly account rooted in promise, prayer, and the temple. The story opens before Jesus' birth with Zechariah and Elizabeth.
- Today: Today, the angel announces John's birth while Zechariah is serving in the temple.
- Watch For: Notice how God begins quietly, through prayer, barrenness, and a promise that asks for trust.
- Key Terms: temple; angel; covenant.

### Day 89 - Luke 7:1-17

Current issue: marked as final movement too early.

Suggested:

- Where We Are: Jesus is still revealing the Kingdom through mercy and authority in Galilee. The crowds see His power reach a Gentile household and a grieving widow.
- Today: Today, Jesus heals the centurion's servant and raises a widow's son.
- Watch For: Notice the centurion's humility and the Lord's compassion for the widow.
- Key Terms: faith; mercy.

### Day 126 - John 1:1-18

Current issue: prologue deserves custom wording.

Suggested:

- Where We Are: John begins before creation, with the eternal Word who is with God and is God. The final Gospel opens by naming the mystery behind everything Jesus does.
- Today: Today, John proclaims that the Word became flesh and dwelt among us.
- Watch For: Notice the movement from light and life to the flesh of Christ. John wants belief to become communion with God.
- Key Terms: Word; Incarnation; grace.

### Day 159 - John 18:28-19:16

Current issue: irrelevant discipleship watch line.

Suggested:

- Where We Are: Jesus stands before Pilate as the Passion moves toward the Cross. Human judgment is confused, but Christ remains faithful.
- Today: Today, Jesus is questioned, mocked, presented to the crowd, and handed over to be crucified.
- Watch For: Notice the words "Behold the man." John shows Jesus' kingship through suffering and humiliation.
- Key Terms: Passion; kingship; crucifixion.

### Day 162 - John 20:19-21:25

Current issue: acceptable but too thin for the season's final day.

Suggested:

- Where We Are: The season closes with the risen Jesus giving peace, mercy, and mission. John ends by restoring faith, Peter's love, and the witness of the beloved disciple.
- Today: Today, Jesus appears to the disciples, gives the authority to forgive sins, meets Thomas' doubt, and restores Peter.
- Watch For: Notice how the wounds of Christ remain visible after the Resurrection. Peace, mercy, and mission all flow from the risen Lord.
- Key Terms: Resurrection; forgiveness of sins; witness.

## Source Metadata Check

No generated `reading_context`, `previous_reading_summary`, `reading_today_preview`, or `reading_watch_for` fields contain:

- URLs
- source attribution language
- extraction/source metadata language
- Ascension references as source attribution
