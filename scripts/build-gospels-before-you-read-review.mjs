import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const SOURCE_ARTIFACT_PATH =
  "content/gospels/the-gospels-september-lent-import-artifact.json";
const REVIEW_ARTIFACT_PATH =
  "content/gospels/the-gospels-september-lent-before-you-read-review.json";
const REVIEW_SQL_PATH =
  "supabase/generated/the-gospels-september-lent-before-you-read-review.sql";
const REVIEW_DOC_PATH = "docs/GOSPELS_SEASON_BEFORE_YOU_READ_REVIEW.md";

const PLAN_SLUG = "the-gospels-september-lent";
const PLAN_NAME = "The Gospels: From September to Lent";
const TOTAL_DAYS = 162;
const SAMPLE_DAYS = [1, 2, 7, 8, 31, 32, 90, 161, 162];
const GENERIC_WATCH_FALLBACK =
  "Watch the concrete actions and questions in the text. They show what Jesus reveals and what He asks.";
const TRANSITION_AND_MAJOR_DAYS = new Set([
  1, 6, 13, 20, 27, 30, 34, 41, 48, 55, 62, 69, 75, 76, 83, 90,
  91, 97, 104, 111, 118, 124, 125, 126, 132, 139, 146, 153, 156,
  157, 159, 160, 161, 162,
]);

const KEY_TERM_LIBRARY = {
  angel: {
    term: "angel",
    definition: "A spiritual messenger sent by God.",
  },
  apostle: {
    term: "apostle",
    definition: "One sent by Christ with authority to witness and serve His Church.",
  },
  baptism: {
    term: "baptism",
    definition: "The sacrament of new birth in Christ and cleansing from sin.",
  },
  church: {
    term: "Church",
    definition: "The people Christ gathers into His Body through faith and the sacraments.",
  },
  confession: {
    term: "confession",
    definition: "The sacrament where sins are confessed and forgiven through Christ's mercy.",
  },
  conversion: {
    term: "conversion",
    definition: "A real turning of heart and life toward God.",
  },
  covenant: {
    term: "covenant",
    definition: "A sacred bond God establishes with His people.",
  },
  crucifixion: {
    term: "crucifixion",
    definition: "Jesus' death on the cross, offered in obedience and love.",
  },
  disciple: {
    term: "disciple",
    definition: "One who follows Jesus, learns from Him, and lives under His teaching.",
  },
  eucharist: {
    term: "Eucharist",
    definition: "The sacrament of Christ's Body and Blood, source and summit of Christian life.",
  },
  faith: {
    term: "faith",
    definition: "Trusting God and receiving what He reveals.",
  },
  forgivenessOfSins: {
    term: "forgiveness of sins",
    definition: "Christ's mercy freeing sinners from guilt and restoring communion with God.",
  },
  genealogy: {
    term: "genealogy",
    definition: "A family line that shows how God's promises move through history.",
  },
  gospel: {
    term: "Gospel",
    definition: "The good news of Jesus Christ, the Son of God and Savior.",
  },
  grace: {
    term: "grace",
    definition: "God's free gift of divine life and help.",
  },
  holySpirit: {
    term: "Holy Spirit",
    definition: "The third Person of the Trinity, given by the Father and the Son.",
  },
  incarnation: {
    term: "Incarnation",
    definition: "The eternal Son of God taking on human flesh.",
  },
  kingdomOfGod: {
    term: "Kingdom of God",
    definition: "God's saving reign, present in Christ and coming to fulfillment.",
  },
  kingship: {
    term: "kingship",
    definition: "Christ's royal authority, revealed through humility and the Cross.",
  },
  mary: {
    term: "Mary",
    definition: "The Mother of Jesus and model disciple.",
  },
  mercy: {
    term: "mercy",
    definition: "God's faithful love toward sinners, the suffering, and the lost.",
  },
  messiah: {
    term: "Messiah",
    definition: "The anointed one promised by God and fulfilled in Jesus.",
  },
  parable: {
    term: "parable",
    definition: "A short teaching story that reveals the Kingdom through familiar images.",
  },
  passion: {
    term: "Passion",
    definition: "The suffering and death Jesus freely accepts for our salvation.",
  },
  repentance: {
    term: "repentance",
    definition: "Turning away from sin and back toward God.",
  },
  resurrection: {
    term: "Resurrection",
    definition: "Jesus' rising from the dead in His glorified body.",
  },
  sabbath: {
    term: "Sabbath",
    definition: "The holy day of rest and worship given to Israel by God.",
  },
  sonOfDavid: {
    term: "son of David",
    definition: "A royal title showing Jesus as heir to David's promised kingdom.",
  },
  sonOfGod: {
    term: "Son of God",
    definition: "Jesus' divine identity as the eternal Son of the Father.",
  },
  temple: {
    term: "temple",
    definition: "The holy place of worship in Jerusalem, where Israel offered sacrifice.",
  },
  witness: {
    term: "witness",
    definition: "One who testifies to what God has done.",
  },
  word: {
    term: "Word",
    definition: "The eternal Son through whom the Father creates and reveals Himself.",
  },
};

const CATECHISM_OVERRIDES = {
  6: {
    readingContext:
      "This first Sunday grounds the season in the Church's love for Sacred Scripture. Before moving deeper into Mark, the Catechism reminds us that the Gospels are the heart of the Scriptures.",
    readingTodayPreview:
      "Today, the Catechism teaches how God speaks through Scripture and why the Gospels hold a privileged place.",
    readingWatchFor:
      "Notice how the Church receives Scripture as God's living word, not as religious information.",
    readingKeyTerms: [KEY_TERM_LIBRARY.gospel, KEY_TERM_LIBRARY.church],
  },
  13: {
    readingContext:
      "After Mark has shown Jesus teaching and healing with authority, this Sunday names who He is. The Catechism focuses on Christ, Lord, and Son of God.",
    readingTodayPreview:
      "Today, the Catechism explains the Church's confession that Jesus is the Christ and the Son of God.",
    readingWatchFor:
      "Watch how the titles of Jesus protect the truth of His identity and mission.",
    readingKeyTerms: [KEY_TERM_LIBRARY.messiah, KEY_TERM_LIBRARY.sonOfGod],
  },
  20: {
    readingContext:
      "Mark has begun to reveal both the glory and the humility of Jesus. This Sunday pauses to contemplate the mystery that the Son of God truly became man.",
    readingTodayPreview:
      "Today, the Catechism considers the Incarnation and why the Son of God became man for our salvation.",
    readingWatchFor:
      "Notice that Catholic faith holds together Christ's true divinity and true humanity.",
    readingKeyTerms: [KEY_TERM_LIBRARY.incarnation, KEY_TERM_LIBRARY.sonOfGod],
  },
  27: {
    readingContext:
      "Before the season moves from Mark's Passion into Matthew, this Sunday turns to Mary's yes. The Catechism shows how the Annunciation belongs to the mystery of Christ.",
    readingTodayPreview:
      "Today, the Catechism considers Mary, the Annunciation, and her free consent to God's saving plan.",
    readingWatchFor:
      "Notice Mary's faith. Her yes receives the Savior rather than controlling the gift.",
    readingKeyTerms: [KEY_TERM_LIBRARY.mary, KEY_TERM_LIBRARY.incarnation],
  },
  34: {
    readingContext:
      "Matthew has introduced Jesus as Emmanuel and beloved Son. This Sunday gathers the meaning of His baptism, temptation, and public mission.",
    readingTodayPreview:
      "Today, the Catechism considers Jesus' baptism, His temptation, and the beginning of His mission.",
    readingWatchFor:
      "Watch how Jesus enters the waters and the wilderness in solidarity with sinners.",
    readingKeyTerms: [KEY_TERM_LIBRARY.baptism, KEY_TERM_LIBRARY.sonOfGod],
  },
  41: {
    readingContext:
      "After the Sermon on the Mount, this Sunday names the Kingdom Jesus has been announcing. The Catechism frames His call to conversion and mercy.",
    readingTodayPreview:
      "Today, the Catechism considers the Kingdom of God and Christ's call to sinners.",
    readingWatchFor:
      "Notice that the Kingdom is not an idea first. It is present in Jesus Himself.",
    readingKeyTerms: [KEY_TERM_LIBRARY.kingdomOfGod, KEY_TERM_LIBRARY.conversion],
  },
  48: {
    readingContext:
      "Matthew has shown Jesus healing and teaching with authority. This Sunday looks at miracles as signs that the Kingdom is truly present in Him.",
    readingTodayPreview:
      "Today, the Catechism considers Christ's miracles and signs of the Kingdom.",
    readingWatchFor:
      "Watch how signs point beyond amazement toward faith in Christ.",
    readingKeyTerms: [KEY_TERM_LIBRARY.kingdomOfGod, KEY_TERM_LIBRARY.faith],
  },
  55: {
    readingContext:
      "As Matthew turns toward confession, correction, and mission, this Sunday focuses on the disciples and the Twelve. The Catechism shows that Jesus forms a people around Himself.",
    readingTodayPreview:
      "Today, the Catechism considers the disciples, the Twelve, and their share in Christ's mission.",
    readingWatchFor:
      "Notice that Jesus gathers and sends real men, not an abstract movement.",
    readingKeyTerms: [KEY_TERM_LIBRARY.disciple, KEY_TERM_LIBRARY.apostle],
  },
  62: {
    readingContext:
      "Matthew has brought us to Peter's confession and the keys. This Sunday considers Peter's office and the Church Christ builds.",
    readingTodayPreview:
      "Today, the Catechism considers Peter, the keys, and the Church's visible unity.",
    readingWatchFor:
      "Watch how authority is given for service, faith, and unity in the Church.",
    readingKeyTerms: [KEY_TERM_LIBRARY.church, KEY_TERM_LIBRARY.apostle],
  },
  69: {
    readingContext:
      "Before Matthew's final teaching and Passion, this Sunday returns to the Transfiguration. The Catechism shows how glory prepares the disciples for the scandal of the Cross.",
    readingTodayPreview:
      "Today, the Catechism considers the Transfiguration and its place on the road to the Passion.",
    readingWatchFor:
      "Notice how glory and the Cross belong together in Christ.",
    readingKeyTerms: [KEY_TERM_LIBRARY.passion, KEY_TERM_LIBRARY.sonOfGod],
  },
  76: {
    readingContext:
      "After Matthew's death and Resurrection narrative, this Sunday considers Jesus and Israel. The Catechism helps us read the opposition to Jesus without losing sight of fulfillment.",
    readingTodayPreview:
      "Today, the Catechism considers Jesus' relationship to Israel, the law, the temple, and faith.",
    readingWatchFor:
      "Notice that Jesus fulfills Israel's hope while exposing hardened hearts.",
    readingKeyTerms: [KEY_TERM_LIBRARY.temple, KEY_TERM_LIBRARY.faith],
  },
  83: {
    readingContext:
      "Luke has introduced Jesus as Son and Messiah. This Sunday turns directly to the Passion Christ freely accepts for sinners.",
    readingTodayPreview:
      "Today, the Catechism considers the Passion of Christ and His saving death.",
    readingWatchFor:
      "Watch how the Church speaks of the Passion as both human sin and Christ's free love.",
    readingKeyTerms: [KEY_TERM_LIBRARY.passion, KEY_TERM_LIBRARY.crucifixion],
  },
  90: {
    readingContext:
      "After Luke shows Jesus giving life to the widow's son, this Sunday contemplates Christ's real death and burial. The Catechism keeps the mystery concrete.",
    readingTodayPreview:
      "Today, the Catechism considers Christ's death, burial, and descent among the dead.",
    readingWatchFor:
      "Notice that Jesus truly enters death. Christian hope does not skip the tomb.",
    readingKeyTerms: [KEY_TERM_LIBRARY.passion, KEY_TERM_LIBRARY.resurrection],
  },
  97: {
    readingContext:
      "As Luke moves toward the road to Jerusalem, this Sunday turns to the Resurrection. The Catechism names it as a real event and the heart of Christian faith.",
    readingTodayPreview:
      "Today, the Catechism considers the Resurrection and the risen life of Christ.",
    readingWatchFor:
      "Watch how the Resurrection is both historical and more than a return to ordinary life.",
    readingKeyTerms: [KEY_TERM_LIBRARY.resurrection, KEY_TERM_LIBRARY.faith],
  },
  104: {
    readingContext:
      "Luke's Gospel keeps moving toward Jerusalem and the Father's plan. This Sunday considers Christ's return to the Father and His reign.",
    readingTodayPreview:
      "Today, the Catechism considers Christ's return to the Father and His reign at the Father's right hand.",
    readingWatchFor:
      "Notice that the risen Christ reigns and intercedes; He has not withdrawn from His Church.",
    readingKeyTerms: [KEY_TERM_LIBRARY.resurrection, KEY_TERM_LIBRARY.church],
  },
  111: {
    readingContext:
      "Luke has been showing mercy, repentance, and the gathering of the lost. This Sunday considers the Church in God's saving plan.",
    readingTodayPreview:
      "Today, the Catechism considers the Church as part of God's plan to gather His people in Christ.",
    readingWatchFor:
      "Notice that the Church begins in God's initiative, not in human organization alone.",
    readingKeyTerms: [KEY_TERM_LIBRARY.church, KEY_TERM_LIBRARY.kingdomOfGod],
  },
  118: {
    readingContext:
      "As Luke approaches Jerusalem, this Sunday considers the Church as the Body of Christ. The doctrine helps us read discipleship as communion with Jesus.",
    readingTodayPreview:
      "Today, the Catechism considers the Church as Christ's Body.",
    readingWatchFor:
      "Watch how union with Christ is personal and communal at the same time.",
    readingKeyTerms: [KEY_TERM_LIBRARY.church, KEY_TERM_LIBRARY.disciple],
  },
  125: {
    readingContext:
      "Luke has ended with opened Scriptures, blessing, and mission. Before John begins, this Sunday names the marks Christ gives His Church.",
    readingTodayPreview:
      "Today, the Catechism considers the Church as one, holy, catholic, and apostolic.",
    readingWatchFor:
      "Notice that the Church's marks come from Christ before they become our responsibility.",
    readingKeyTerms: [KEY_TERM_LIBRARY.church, KEY_TERM_LIBRARY.apostle],
  },
  132: {
    readingContext:
      "John has begun with the Word made flesh and the gift of living water. This Sunday considers Mary's motherhood in relation to Christ and His Church.",
    readingTodayPreview:
      "Today, the Catechism considers Mary as Mother of Christ and Mother of the Church.",
    readingWatchFor:
      "Notice how Mary's role always points to Christ and serves His people.",
    readingKeyTerms: [KEY_TERM_LIBRARY.mary, KEY_TERM_LIBRARY.church],
  },
  139: {
    readingContext:
      "After John 6 and the call to remain with Jesus, this Sunday considers Baptism and new life. The Catechism names the grace that begins Christian life.",
    readingTodayPreview:
      "Today, the Catechism considers Baptism, new birth, and life in Christ.",
    readingWatchFor:
      "Watch how Baptism is gift, cleansing, belonging, and mission.",
    readingKeyTerms: [KEY_TERM_LIBRARY.baptism, KEY_TERM_LIBRARY.grace],
  },
  146: {
    readingContext:
      "John has shown Jesus as shepherd and giver of life. This Sunday turns to the Eucharist, the sacrament of Christ's Body and Blood.",
    readingTodayPreview:
      "Today, the Catechism considers the Eucharist as the source and summit of Christian life.",
    readingWatchFor:
      "Notice how the Eucharist gathers sacrifice, presence, thanksgiving, and communion.",
    readingKeyTerms: [KEY_TERM_LIBRARY.eucharist, KEY_TERM_LIBRARY.church],
  },
  153: {
    readingContext:
      "John's farewell discourse has led into Jesus' words about the Father. This Sunday considers the prayer of Jesus and the prayer He gives His disciples.",
    readingTodayPreview:
      "Today, the Catechism considers Jesus' prayer and the Lord's Prayer.",
    readingWatchFor:
      "Notice how Christian prayer begins with Jesus' own relationship to the Father.",
    readingKeyTerms: [KEY_TERM_LIBRARY.faith, KEY_TERM_LIBRARY.disciple],
  },
  160: {
    readingContext:
      "This final Sunday before Lent turns from John's Passion narrative toward conversion. The Catechism prepares the season to close with penance, confession, and mercy.",
    readingTodayPreview:
      "Today, the Catechism considers conversion, penance, confession, and preparing for Lent.",
    readingWatchFor:
      "Notice that penance is not self-punishment. It is a return to the Father through Christ's mercy.",
    readingKeyTerms: [
      KEY_TERM_LIBRARY.conversion,
      KEY_TERM_LIBRARY.confession,
      KEY_TERM_LIBRARY.mercy,
    ],
  },
};

const MANUAL_OVERRIDES = {
  30: {
    readingContext:
      "Matthew begins again at Israel's story, naming Jesus as son of David and son of Abraham. After finishing Mark, the season turns to another Gospel witness to the same Christ.",
    readingTodayPreview:
      "Today, Matthew traces Jesus' genealogy and shows that God's promises move through real families and history.",
    readingWatchFor:
      "Notice the names Matthew includes. The Messiah comes through Israel's story, with mercy visible even in a wounded family line.",
    readingKeyTerms: [
      KEY_TERM_LIBRARY.messiah,
      KEY_TERM_LIBRARY.sonOfDavid,
      KEY_TERM_LIBRARY.genealogy,
    ],
  },
  75: {
    readingContext:
      "Luke begins with an orderly account rooted in promise, prayer, and the temple. The story opens before Jesus' birth with Zechariah and Elizabeth.",
    readingTodayPreview:
      "Today, the angel announces John's birth while Zechariah is serving in the temple.",
    readingWatchFor:
      "Notice how God begins quietly, through prayer, barrenness, and a promise that asks for trust.",
    readingKeyTerms: [
      KEY_TERM_LIBRARY.temple,
      KEY_TERM_LIBRARY.angel,
      KEY_TERM_LIBRARY.covenant,
    ],
  },
  89: {
    readingContext:
      "Jesus is still revealing the Kingdom through mercy and authority in Galilee. The crowds see His power reach a Gentile household and a grieving widow.",
    readingTodayPreview:
      "Today, Jesus heals the centurion's servant and raises a widow's son.",
    readingWatchFor:
      "Notice the centurion's humility and the Lord's compassion for the widow.",
    readingKeyTerms: [KEY_TERM_LIBRARY.faith, KEY_TERM_LIBRARY.mercy],
  },
  91: {
    readingContext:
      "After Sunday's Catechism reading on Christ's death and burial, Luke returns to Jesus' public signs. John the Baptist's messengers bring the question directly to Jesus.",
    readingTodayPreview:
      "Today, Jesus answers John's messengers by pointing to the works of the Messiah.",
    readingWatchFor:
      "Notice that Jesus answers with deeds: healing, good news, and mercy reveal who He is.",
    readingKeyTerms: [KEY_TERM_LIBRARY.messiah, KEY_TERM_LIBRARY.mercy],
  },
  124: {
    readingContext:
      "Luke closes with the risen Jesus meeting disciples on the road, opening the Scriptures, and blessing them. The Gospel ends in worship and mission.",
    readingTodayPreview:
      "Today, Jesus walks with the disciples, opens Scripture, appears to them, blesses them, and sends them as witnesses.",
    readingWatchFor:
      "Notice how the risen Lord opens both Scripture and hearts before sending His disciples.",
    readingKeyTerms: [KEY_TERM_LIBRARY.resurrection, KEY_TERM_LIBRARY.witness],
  },
  126: {
    readingContext:
      "John begins before creation, with the eternal Word who is with God and is God. The final Gospel opens by naming the mystery behind everything Jesus does.",
    readingTodayPreview:
      "Today, John proclaims that the Word became flesh and dwelt among us.",
    readingWatchFor:
      "Notice the movement from light and life to the flesh of Christ. John wants belief to become communion with God.",
    readingKeyTerms: [
      KEY_TERM_LIBRARY.word,
      KEY_TERM_LIBRARY.incarnation,
      KEY_TERM_LIBRARY.grace,
    ],
  },
  156: {
    readingContext:
      "Jesus is still speaking to the disciples before His Passion. He prepares them for sorrow, the Spirit's help, and the peace that remains in Him.",
    readingTodayPreview:
      "Today, Jesus teaches about the Spirit, coming sorrow, prayer, and His victory over the world.",
    readingWatchFor:
      "Notice that Jesus does not deny tribulation. He gives peace from within His victory.",
    readingKeyTerms: [KEY_TERM_LIBRARY.holySpirit, KEY_TERM_LIBRARY.faith],
  },
  157: {
    readingContext:
      "The farewell discourse becomes prayer. Jesus turns to the Father and prays for His disciples and for those who will believe through their word.",
    readingTodayPreview:
      "Today, Jesus prays to the Father for glory, unity, holiness, and the mission of His disciples.",
    readingWatchFor:
      "Notice that Jesus prays before He suffers. His prayer reveals His love for the Father and His people.",
    readingKeyTerms: [KEY_TERM_LIBRARY.disciple, KEY_TERM_LIBRARY.church],
  },
  159: {
    readingContext:
      "Jesus stands before Pilate as the Passion moves toward the Cross. Human judgment is confused, but Christ remains faithful.",
    readingTodayPreview:
      "Today, Jesus is questioned, mocked, presented to the crowd, and handed over to be crucified.",
    readingWatchFor:
      "Notice the words \"Behold the man.\" John shows Jesus' kingship through suffering and humiliation.",
    readingKeyTerms: [
      KEY_TERM_LIBRARY.passion,
      KEY_TERM_LIBRARY.kingship,
      KEY_TERM_LIBRARY.crucifixion,
    ],
  },
  160: CATECHISM_OVERRIDES[160],
  161: {
    readingContext:
      "The season reaches the Cross, the tomb, and the first Easter witness. John shows Jesus' death, burial, and appearance to Mary Magdalene.",
    readingTodayPreview:
      "Today, Jesus is crucified, dies, is buried, and appears to Mary Magdalene at the empty tomb.",
    readingWatchFor:
      "Watch the movement from \"It is finished\" to Mary's name being spoken by the risen Lord.",
    readingKeyTerms: [
      KEY_TERM_LIBRARY.passion,
      KEY_TERM_LIBRARY.crucifixion,
      KEY_TERM_LIBRARY.resurrection,
    ],
  },
  162: {
    readingContext:
      "The season closes with the risen Jesus giving peace, mercy, and mission. John ends by restoring faith, Peter's love, and the witness of the beloved disciple.",
    readingTodayPreview:
      "Today, Jesus appears to the disciples, gives the authority to forgive sins, meets Thomas' doubt, and restores Peter.",
    readingWatchFor:
      "Notice how the wounds of Christ remain visible after the Resurrection. Peace, mercy, and mission all flow from the risen Lord.",
    readingKeyTerms: [
      KEY_TERM_LIBRARY.resurrection,
      KEY_TERM_LIBRARY.forgivenessOfSins,
      KEY_TERM_LIBRARY.witness,
    ],
  },
};

const KEY_TERM_DEFINITIONS = [
  {
    term: "repentance",
    definition: "Turning away from sin and back toward God.",
    patterns: [/repent/i, /forgiveness of sins/i],
  },
  {
    term: "Gospel",
    definition: "The good news of Jesus Christ, the Son of God and Savior.",
    patterns: [/\bgospel\b/i],
  },
  {
    term: "Kingdom of God",
    definition: "God's saving reign, present in Christ and coming to fulfillment.",
    patterns: [/\bkingdom\b/i],
  },
  {
    term: "baptism",
    definition: "The sacrament of new birth in Christ and cleansing from sin.",
    patterns: [/\bbaptis/i],
  },
  {
    term: "Holy Spirit",
    definition: "The third Person of the Trinity, given by the Father and the Son.",
    patterns: [/\bholy spirit\b/i, /\bspirit\b/i, /\badvocate\b/i],
  },
  {
    term: "Son of God",
    definition: "Jesus' divine identity as the eternal Son of the Father.",
    patterns: [/\bson of god\b/i, /\bbeloved son\b/i],
  },
  {
    term: "disciple",
    definition: "One who follows Jesus, learns from Him, and lives under His teaching.",
    patterns: [/\bdiscipleship\b/i, /\bdisciples?\b.*\b(sent|mission|called|follow|with Jesus)\b/i, /\bfollow me\b/i],
  },
  {
    term: "apostle",
    definition: "One sent by Christ with authority to witness and serve His Church.",
    patterns: [/\bapostle/i, /\btwelve\b/i],
  },
  {
    term: "Sabbath",
    definition: "The holy day of rest and worship given to Israel by God.",
    patterns: [/\bsabbath\b/i],
  },
  {
    term: "parable",
    definition: "A short teaching story that reveals the Kingdom through familiar images.",
    patterns: [/\bparable/i, /\bsower\b/i, /\bmustard seed\b/i],
  },
  {
    term: "faith",
    definition: "Trusting God and receiving what He reveals.",
    patterns: [/\bfaith\b/i, /\bbelieve\b/i, /\bbelief\b/i],
  },
  {
    term: "mercy",
    definition: "God's faithful love toward sinners, the suffering, and the lost.",
    patterns: [/\bmercy\b/i, /\bmerciful\b/i, /\bcompassion\b/i],
  },
  {
    term: "Son of Man",
    definition: "A title Jesus uses that points to His authority, suffering, and glory.",
    patterns: [/\bson of man\b/i],
  },
  {
    term: "temple",
    definition: "The holy place of worship in Jerusalem, where Israel offered sacrifice.",
    patterns: [/\btemple\b/i],
  },
  {
    term: "Passover",
    definition: "Israel's feast of deliverance, fulfilled by Christ in His Passion.",
    patterns: [/\bpassover\b/i],
  },
  {
    term: "Passion",
    definition: "The suffering and death Jesus freely accepts for our salvation.",
    patterns: [/\bpassion\b/i, /\bsuffer/i, /\bagony\b/i, /\btrial\b/i, /\barrest/i, /\bcondemned\b/i, /\bhanded over\b/i, /\bbehold the man\b/i],
  },
  {
    term: "crucifixion",
    definition: "Jesus' death on the cross, offered in obedience and love.",
    patterns: [/\bcrucif/i, /\bcross\b/i],
  },
  {
    term: "Resurrection",
    definition: "Jesus' rising from the dead in His glorified body.",
    patterns: [/\bresurrection\b/i, /\brisen\b/i, /\braised\b/i, /\bempty tomb\b/i],
  },
  {
    term: "Incarnation",
    definition: "The eternal Son of God taking on human flesh.",
    patterns: [/\bincarnation\b/i, /\bword became flesh\b/i, /\bgod with us\b/i, /\bchild king\b/i, /\bbirth\b/i, /\bemmanuel\b/i],
  },
  {
    term: "Annunciation",
    definition: "The angel's announcement to Mary and her faithful consent to God's plan.",
    patterns: [/\bannunciation\b/i, /\bangel's word\b/i],
  },
  {
    term: "Magnificat",
    definition: "Mary's hymn of praise after Elizabeth greets her.",
    patterns: [/\bmagnificat\b/i],
  },
  {
    term: "Eucharist",
    definition: "The sacrament of Christ's Body and Blood, source and summit of Christian life.",
    patterns: [/\beucharist\b/i, /\bbread of life\b/i, /\bmy flesh\b/i],
  },
  {
    term: "Church",
    definition: "The people Christ gathers into His Body through faith and the sacraments.",
    patterns: [/\bchurch\b/i],
  },
  {
    term: "keys",
    definition: "The sign of authority Christ gives to Peter for service in the Church.",
    patterns: [/\bkeys\b/i],
  },
  {
    term: "Our Father",
    definition: "The prayer Jesus teaches His disciples to pray to the Father.",
    patterns: [/\bour father\b/i, /\blord's prayer\b/i],
  },
  {
    term: "living water",
    definition: "Jesus' image for the life of grace given by the Spirit.",
    patterns: [/\bliving water\b/i],
  },
  {
    term: "Good Shepherd",
    definition: "Jesus' image for His pastoral care and self-giving love.",
    patterns: [/\bgood shepherd\b/i, /\bshepherd\b/i],
  },
  {
    term: "conversion",
    definition: "A real turning of heart and life toward God.",
    patterns: [/\bconversion\b/i, /\bconvert/i],
  },
  {
    term: "confession",
    definition: "The sacrament where sins are confessed and forgiven through Christ's mercy.",
    patterns: [/\bconfession\b/i, /\bforgive the sins\b/i, /\bpenance\b/i],
  },
];

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

function writeText(path, text) {
  const outputPath = resolve(process.cwd(), path);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, text, "utf8");
}

function stripMarkdown(text) {
  return String(text ?? "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(\d+)\.\*\*/g, "$1.")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function ensurePeriod(text) {
  const trimmed = String(text ?? "").trim();
  if (!trimmed) return "";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function phraseTitle(title) {
  return String(title ?? "")
    .trim()
    .replace(/^The Ascension and Christ's Reign$/i, "Christ's return to the Father and His reign")
    .replace(/\bAscension\b/g, "Christ's return to the Father")
    .replace(/^The\s+/, "the ");
}

function clauseText(text) {
  return String(text ?? "")
    .trim()
    .replace(/^The\s+/, "the ");
}

function extractSectionHeadings(text) {
  return String(text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^#{2,3}\s+\S/.test(line))
    .map(stripMarkdown)
    .join(" ");
}

function analysisText(day) {
  return [
    day.readingTitle,
    day.readingReference,
    day.focus,
    extractSectionHeadings(day.readingText),
  ].join(" ");
}

function extractBook(reference) {
  const trimmed = String(reference ?? "").trim();
  if (trimmed.startsWith("CCC")) return "Catechism";

  const match = trimmed.match(/^([1-3]?\s?[A-Za-z]+)/);
  return match?.[1] ?? "Gospel";
}

function sourceSubset(day, previousDay) {
  const pick = (value) =>
    value
      ? {
          dayNumber: value.dayNumber,
          date: value.date,
          contentType: value.contentType,
          readingTitle: value.readingTitle,
          readingReference: value.readingReference,
          readingText: value.readingText,
          focus: value.focus,
          notes: value.notes,
          gospelBook: value.gospelBook,
          cccRanges: value.cccRanges,
        }
      : null;

  return JSON.stringify({
    current: pick(day),
    previous: pick(previousDay),
  });
}

function buildBookPositions(days) {
  const gospelDaysByBook = new Map();

  for (const day of days) {
    if (day.contentType !== "gospel") continue;
    const book = extractBook(day.readingReference);
    const list = gospelDaysByBook.get(book) ?? [];
    list.push(day.dayNumber);
    gospelDaysByBook.set(book, list);
  }

  const positions = new Map();
  for (const [book, dayNumbers] of gospelDaysByBook.entries()) {
    dayNumbers.forEach((dayNumber, index) => {
      positions.set(dayNumber, {
        book,
        index: index + 1,
        total: dayNumbers.length,
      });
    });
  }

  return positions;
}

function buildReadingContext(day, position) {
  if (day.dayNumber === 1) {
    return "The season opens at the Jordan and in the wilderness. Mark introduces Jesus as the Son of God and moves quickly into His public mission.";
  }

  const catechismOverride = CATECHISM_OVERRIDES[day.dayNumber];
  if (day.contentType === "catechism" && catechismOverride) {
    return catechismOverride.readingContext;
  }

  const book = position?.book ?? extractBook(day.readingReference);

  if (position?.index === 1) {
    return `This reading begins ${book}'s account of Jesus. It sets the starting point for this Gospel's witness to Christ.`;
  }

  if (book === "Mark") {
    if (day.dayNumber <= 5) {
      return `Mark's opening ministry shows Jesus acting with urgency and authority. This reading continues that beginning as ${clauseText(day.focus)}`;
    }
    if (day.dayNumber <= 16) {
      return `Mark now shows Jesus' authority and mercy spreading through Galilee. This reading continues that witness as ${clauseText(day.focus)}`;
    }
    if (day.dayNumber <= 22) {
      return `Mark turns from public wonder toward discipleship and the Cross. This reading continues that turn as ${clauseText(day.focus)}`;
    }
    return `Mark brings Jesus to Jerusalem and into His Passion. This reading continues that final stretch as ${clauseText(day.focus)}`;
  }

  if (book === "Matthew") {
    if (day.dayNumber <= 35) {
      return `Matthew opens with infancy, fulfillment, and the beginning of Jesus' public mission. This reading continues that foundation as ${clauseText(day.focus)}`;
    }
    if (day.dayNumber <= 44) {
      return `Matthew is showing Jesus as teacher of the Kingdom in word and deed. This reading continues that teaching as ${clauseText(day.focus)}`;
    }
    if (day.dayNumber <= 56) {
      return `Matthew now emphasizes mission, parables, and mercy. This reading continues that movement as ${clauseText(day.focus)}`;
    }
    if (day.dayNumber <= 63) {
      return `Matthew turns toward confession, the Church, forgiveness, and the cost of following Christ. This reading continues that formation as ${clauseText(day.focus)}`;
    }
    return `Matthew brings Jesus into Jerusalem, conflict, judgment, and the Passion. This reading continues that final movement as ${clauseText(day.focus)}`;
  }

  if (book === "Luke") {
    if (day.dayNumber <= 82) {
      return `Luke begins with infancy, promise, prayer, and preparation. This reading continues that beginning as ${clauseText(day.focus)}`;
    }
    if (day.dayNumber <= 98) {
      return `Luke shows Jesus' Galilee ministry through mercy, teaching, and signs of the Kingdom. This reading continues that ministry as ${clauseText(day.focus)}`;
    }
    if (day.dayNumber <= 115) {
      return `Luke follows Jesus on the road with lessons in mercy, prayer, and discipleship. This reading continues that journey as ${clauseText(day.focus)}`;
    }
    return `Luke brings Jesus to Jerusalem, the Cross, and the joy of the Resurrection. This reading continues that final movement as ${clauseText(day.focus)}`;
  }

  if (book === "John") {
    if (day.dayNumber <= 136) {
      return `John opens with the Word made flesh and early signs that invite belief. This reading continues that witness as ${clauseText(day.focus)}`;
    }
    if (day.dayNumber <= 147) {
      return `John now unfolds themes of bread, water, light, feasts, and shepherding. This reading continues those signs as ${clauseText(day.focus)}`;
    }
    if (day.dayNumber <= 153) {
      return `John turns toward Jesus' hour through friendship, anointing, service, and the new commandment. This reading continues that turn as ${clauseText(day.focus)}`;
    }
    if (day.dayNumber <= 157) {
      return `John's farewell discourse prepares the disciples for the Cross, the Spirit, and mission. This reading continues that preparation as ${clauseText(day.focus)}`;
    }
    return `John brings the Gospel to Jesus' Passion and Resurrection. This reading continues that final witness as ${clauseText(day.focus)}`;
  }

  return `This reading continues ${book}'s witness to Christ as ${clauseText(day.focus)}`;
}

function buildPreviousSummary(day, previousDay) {
  if (!previousDay) {
    return "This is the beginning of the Gospel season, so there is no previous day to review.";
  }

  if (previousDay.contentType === "catechism") {
    return `Yesterday's Catechism reading focused on ${phraseTitle(previousDay.readingTitle)}.`;
  }

  return `Yesterday, ${clauseText(previousDay.focus)}`;
}

function buildTodayPreview(day) {
  const catechismOverride = CATECHISM_OVERRIDES[day.dayNumber];
  if (day.contentType === "catechism" && catechismOverride) {
    return catechismOverride.readingTodayPreview;
  }

  return `Today, ${clauseText(day.focus)}`;
}

function buildWatchFor(day) {
  const catechismOverride = CATECHISM_OVERRIDES[day.dayNumber];
  if (day.contentType === "catechism" && catechismOverride) {
    return catechismOverride.readingWatchFor;
  }

  const haystack = analysisText(day);
  const text = haystack.toLowerCase();

  if (/resurrection|risen|raised|empty tomb|peace, thomas|appears to the disciples/.test(text)) {
    return "Watch how the Resurrection creates witness, worship, and mission.";
  }

  if (/passion|cross|crucif|arrest|trial|condemned|mocked|agony|it is finished/.test(text)) {
    return "Stay close to Jesus' obedience and silence as He freely enters His Passion.";
  }

  if (/baptis/.test(text)) {
    return "Watch how baptism is joined to identity, mission, and the work of the Holy Spirit.";
  }

  if (/tempt|wilderness|desert/.test(text)) {
    return "Notice how testing reveals trust, obedience, and the Father's care.";
  }

  if (/parable|sower|seed|mustard|vineyard|talent/.test(text)) {
    return "Notice the concrete images Jesus uses to reveal the Kingdom.";
  }

  if (/joseph|magi|child king|holy family|emmanuel|god with us|birth/.test(text)) {
    return "Notice how the child Jesus is received, protected, and revealed as God with us.";
  }

  if (/forgiv|mercy|sinner|lost|leper|unclean|paralytic/.test(text)) {
    return "Watch how mercy restores real people without pretending sin is harmless.";
  }

  if (/sabbath|fasting/.test(text)) {
    return "Watch how Jesus reveals the purpose of worship, mercy, and holy rest.";
  }

  if (/twelve|sent|apostle|disciple|follow me/.test(text)) {
    return "Notice that disciples are called to be with Jesus before they are sent.";
  }

  if (/bread|feed|supper|eucharist|wine|cana/.test(text)) {
    return "Watch the pattern of gift, thanksgiving, and abundance. It points toward sacramental life.";
  }

  if (/storm|sea|calms|fear/.test(text)) {
    return "Notice how fear changes when Jesus' authority is seen clearly.";
  }

  if (/raises|jairus|widow's son|official's son|heals through a word/.test(text)) {
    return "Watch how trust is asked for before the whole outcome can be seen.";
  }

  if (/defiles|heart|deeper righteousness|conversion of the heart/.test(text)) {
    return "Notice how Jesus moves the question from outward appearance to the heart.";
  }

  if (/marriage|children|riches|treasure/.test(text)) {
    return "Watch how Jesus receives the vulnerable and asks freedom from divided loves.";
  }

  if (/enters jerusalem|cleanses the temple|purifies worship|temple/.test(text)) {
    return "Notice how Jesus' authority reaches worship, the temple, and the leaders' questions.";
  }

  if (/watchfulness|watch and be faithful|endurance|narrow door|urgency/.test(text)) {
    return "Watch the urgency in Jesus' words. Faithfulness is concrete, not vague intention.";
  }

  if (/build on the rock|obedience and trust/.test(text)) {
    return "Notice that hearing Jesus is meant to become obedience, not admiration alone.";
  }

  if (/hypocrisy|woe|lament/.test(text)) {
    return "Watch how Jesus' warnings are severe because He desires true conversion.";
  }

  if (/humility|rivalry|greatness/.test(text)) {
    return "Notice how Jesus corrects ambition by drawing disciples toward humility.";
  }

  if (/samaritan woman|living water/.test(text)) {
    return "Watch how Jesus leads the Samaritan woman from thirst to faith and witness.";
  }

  if (/feast/.test(text)) {
    return "Notice how Jesus teaches publicly while the crowd remains divided over Him.";
  }

  if (/vine|abide|friendship/.test(text)) {
    return "Watch the word abide. Jesus describes discipleship as living communion with Him.";
  }

  if (/mary|annunciation|visitation|magnificat/.test(text)) {
    return "Notice Mary's faithful response and how grace moves through humble obedience.";
  }

  if (/peter|keys|church/.test(text)) {
    return "Watch how Jesus gives real pastoral responsibility for the good of His Church.";
  }

  if (/pray|father|our father|lord's prayer/.test(text)) {
    return "Notice how prayer reveals trust in the Father and forms the disciple's heart.";
  }

  if (/spirit|advocate/.test(text)) {
    return "Watch how the Holy Spirit is promised as the gift who strengthens and teaches the Church.";
  }

  if (/light|blind/.test(text)) {
    return "Notice the contrast between physical sight and the deeper sight of faith.";
  }

  if (/shepherd/.test(text)) {
    return "Watch how Jesus describes His care as personal, sacrificial, and protective.";
  }

  return GENERIC_WATCH_FALLBACK;
}

function buildKeyTerms(day) {
  const catechismOverride = CATECHISM_OVERRIDES[day.dayNumber];
  if (day.contentType === "catechism" && catechismOverride) {
    return catechismOverride.readingKeyTerms;
  }

  const haystack = analysisText(day);
  const terms = [];

  for (const candidate of KEY_TERM_DEFINITIONS) {
    if (candidate.patterns.some((pattern) => pattern.test(haystack))) {
      terms.push({
        term: candidate.term,
        definition: candidate.definition,
      });
    }

    if (terms.length >= 4) break;
  }

  return terms;
}

function applyOverride(row, override) {
  if (!override) return row;

  return {
    ...row,
    reading_context: override.readingContext ?? row.reading_context,
    previous_reading_summary:
      override.previousReadingSummary ?? row.previous_reading_summary,
    reading_today_preview:
      override.readingTodayPreview ?? row.reading_today_preview,
    reading_watch_for: override.readingWatchFor ?? row.reading_watch_for,
    reading_key_terms: override.readingKeyTerms ?? row.reading_key_terms,
  };
}

function buildContextRows(days) {
  const positions = buildBookPositions(days);

  return days.map((day, index) => {
    const previousDay = days[index - 1] ?? null;
    const readingContext = ensurePeriod(
      buildReadingContext(day, positions.get(day.dayNumber))
    );
    const previousReadingSummary = ensurePeriod(
      buildPreviousSummary(day, previousDay)
    );
    const readingTodayPreview = ensurePeriod(buildTodayPreview(day));
    const readingWatchFor = ensurePeriod(buildWatchFor(day));
    const readingKeyTerms = buildKeyTerms(day);
    const readingContextSourceHash = sha256(sourceSubset(day, previousDay));

    const row = {
      day_number: day.dayNumber,
      date: day.date,
      content_type: day.contentType,
      reading_title: day.readingTitle,
      reading_reference: day.readingReference,
      reading_context: readingContext,
      previous_reading_summary: previousReadingSummary,
      reading_today_preview: readingTodayPreview,
      reading_watch_for: readingWatchFor,
      reading_key_terms: readingKeyTerms,
      reading_context_source_hash: readingContextSourceHash,
    };

    return applyOverride(row, MANUAL_OVERRIDES[day.dayNumber]);
  });
}

function sqlText(value) {
  if (value === null || value === undefined) return "null";
  const text = String(value);
  let tagBase = "tnp";
  let suffix = 0;
  let tag = `$${tagBase}$`;

  while (text.includes(tag)) {
    suffix += 1;
    tagBase = `tnp${suffix}`;
    tag = `$${tagBase}$`;
  }

  return `${tag}${text}${tag}`;
}

function sqlJsonb(value) {
  return `${sqlText(JSON.stringify(value))}::jsonb`;
}

function buildReviewSql(rows, sourceArtifactHash) {
  const updates = rows
    .map((row) =>
      [
        `-- Day ${row.day_number}: ${row.reading_reference} - ${row.reading_title}`,
        "update public.plan_days pd",
        "set",
        `  reading_context = ${sqlText(row.reading_context)},`,
        `  previous_reading_summary = ${sqlText(row.previous_reading_summary)},`,
        `  reading_today_preview = ${sqlText(row.reading_today_preview)},`,
        `  reading_watch_for = ${sqlText(row.reading_watch_for)},`,
        `  reading_key_terms = ${sqlJsonb(row.reading_key_terms)},`,
        `  reading_context_source_hash = ${sqlText(row.reading_context_source_hash)}`,
        "from public.challenge_plans cp",
        "where cp.id = pd.plan_id",
        `  and cp.slug = ${sqlText(PLAN_SLUG)}`,
        `  and pd.day_number = ${row.day_number};`,
      ].join("\n")
    )
    .join("\n\n");

  return [
    "-- REVIEW-ONLY SQL DRAFT. DO NOT EXECUTE.",
    "-- Not a Supabase migration.",
    "-- This file is generated only so reviewers can inspect the proposed updates.",
    "-- It intentionally ends with rollback.",
    `-- Source artifact: ${SOURCE_ARTIFACT_PATH}`,
    `-- Source artifact SHA-256: ${sourceArtifactHash}`,
    "",
    "begin;",
    "",
    updates,
    "",
    "rollback;",
    "",
  ].join("\n");
}

function formatTerms(terms) {
  if (!terms.length) return "None";
  return terms
    .map((term) => `${term.term}: ${term.definition}`)
    .join("; ");
}

function formatSample(row) {
  return [
    `### Day ${row.day_number} - ${row.reading_reference} - ${row.reading_title}`,
    "",
    `- Where We Are: ${row.reading_context}`,
    `- Yesterday: ${row.previous_reading_summary}`,
    `- Today: ${row.reading_today_preview}`,
    `- Watch For: ${row.reading_watch_for}`,
    `- Key Terms: ${formatTerms(row.reading_key_terms)}`,
    `- Source Hash: \`${row.reading_context_source_hash}\``,
  ].join("\n");
}

function findWarnings(rows, planDays) {
  const warnings = [];
  const generatedTextFields = [
    "reading_context",
    "previous_reading_summary",
    "reading_today_preview",
    "reading_watch_for",
  ];

  if (planDays.length !== TOTAL_DAYS) {
    warnings.push(`Expected ${TOTAL_DAYS} days but found ${planDays.length}.`);
  }

  const whereCounts = new Map();
  for (const row of rows) {
    whereCounts.set(
      row.reading_context,
      (whereCounts.get(row.reading_context) ?? 0) + 1
    );
  }

  for (const [readingContext, count] of whereCounts.entries()) {
    if (count > 3) {
      warnings.push(
        `Repeated exact Where We Are appears ${count} times: ${readingContext}`
      );
    }
  }

  for (const row of rows) {
    for (const field of generatedTextFields) {
      const value = row[field];
      if (
        typeof value === "string" &&
        /\bAscension\b|\bAscension Press\b|https?:\/\/|source metadata|extraction/i.test(value)
      ) {
        warnings.push(`Day ${row.day_number} ${field} contains source metadata.`);
      }
    }

    if (row.reading_key_terms.length > 4) {
      warnings.push(`Day ${row.day_number} has more than 4 key terms.`);
    }

    if (row.reading_watch_for === GENERIC_WATCH_FALLBACK) {
      warnings.push(`Day ${row.day_number} uses the generic Watch For fallback.`);
    }

    if (
      TRANSITION_AND_MAJOR_DAYS.has(row.day_number) &&
      row.reading_key_terms.length === 0
    ) {
      warnings.push(
        `Day ${row.day_number} is a transition or major doctrinal day with no key terms.`
      );
    }

    if (
      /final movement/i.test(row.reading_context) &&
      ((/^Mark\b/.test(row.reading_reference) && row.day_number < 23) ||
        (/^Matthew\b/.test(row.reading_reference) && row.day_number < 64) ||
        (/^Luke\b/.test(row.reading_reference) && row.day_number < 116) ||
        (/^John\b/.test(row.reading_reference) && row.day_number < 158))
    ) {
      warnings.push(
        `Day ${row.day_number} uses final-movement language before the Passion/Resurrection section.`
      );
    }
  }

  return warnings;
}

function buildReviewDoc({ rows, warnings, sourceArtifactHash }) {
  const generatedCount = rows.filter(
    (row) =>
      row.reading_context &&
      row.previous_reading_summary &&
      row.reading_today_preview &&
      row.reading_watch_for &&
      row.reading_context_source_hash
  ).length;
  const missingRows = rows.filter((row) => row.reading_context === "");
  const samples = SAMPLE_DAYS.map((dayNumber) =>
    formatSample(rows.find((row) => row.day_number === dayNumber))
  ).join("\n\n");

  return [
    "# Gospel Season Before You Read Review",
    "",
    "Review-only local artifact. Do not execute against production.",
    "",
    "## Summary",
    "",
    `- Plan: ${PLAN_NAME}`,
    `- Slug: \`${PLAN_SLUG}\``,
    `- Source artifact: \`${SOURCE_ARTIFACT_PATH}\``,
    `- Source artifact SHA-256: \`${sourceArtifactHash}\``,
    `- Review JSON: \`${REVIEW_ARTIFACT_PATH}\``,
    `- Review SQL: \`${REVIEW_SQL_PATH}\``,
    `- Total days processed: ${rows.length}`,
    `- Days with context generated: ${generatedCount}`,
    `- Days missing context: ${missingRows.length}`,
    "",
    "## Warnings",
    "",
    warnings.length
      ? warnings.map((warning) => `- ${warning}`).join("\n")
      : "- None.",
    "",
    "## Sample Output",
    "",
    samples,
    "",
  ].join("\n");
}

function main() {
  const artifactText = readFileSync(
    resolve(process.cwd(), SOURCE_ARTIFACT_PATH),
    "utf8"
  );
  const sourceArtifactHash = sha256(artifactText);
  const artifact = JSON.parse(artifactText);

  if (artifact.plan?.slug !== PLAN_SLUG) {
    throw new Error(`Expected plan slug ${PLAN_SLUG}.`);
  }

  if (!Array.isArray(artifact.planDays)) {
    throw new Error("Source artifact must include planDays.");
  }

  const rows = buildContextRows(artifact.planDays);
  const warnings = findWarnings(rows, artifact.planDays);
  const reviewArtifact = {
    artifact_type: "gospels-season-before-you-read-review",
    note: "Review-only local artifact. Not a migration and not live app content.",
    source_artifact_path: SOURCE_ARTIFACT_PATH,
    source_artifact_sha256: sourceArtifactHash,
    plan_slug: PLAN_SLUG,
    plan_name: PLAN_NAME,
    total_days: TOTAL_DAYS,
    days: rows,
    warnings,
  };

  writeText(REVIEW_ARTIFACT_PATH, `${JSON.stringify(reviewArtifact, null, 2)}\n`);
  writeText(REVIEW_SQL_PATH, buildReviewSql(rows, sourceArtifactHash));
  writeText(
    REVIEW_DOC_PATH,
    buildReviewDoc({ rows, warnings, sourceArtifactHash })
  );

  console.log(
    JSON.stringify(
      {
        status: "ok",
        days: rows.length,
        generated: rows.length - rows.filter((row) => row.reading_context === "").length,
        warnings: warnings.length,
        reviewArtifactPath: REVIEW_ARTIFACT_PATH,
        reviewSqlPath: REVIEW_SQL_PATH,
        reviewDocPath: REVIEW_DOC_PATH,
      },
      null,
      2
    )
  );
}

main();
