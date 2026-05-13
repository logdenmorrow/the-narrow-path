export type RosaryMysterySetKey =
  | "joyful"
  | "sorrowful"
  | "glorious"
  | "luminous";

export type RosaryWeekday =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export type RosaryMystery = {
  title: string;
  description: string;
  meditations: string[];
};

export type RosaryMysterySet = {
  key: RosaryMysterySetKey;
  title: string;
  weekdayLabel: string;
  mysteries: RosaryMystery[];
};

export const SIGN_OF_THE_CROSS =
  "In the name of the Father, and of the Son, and of the Holy Spirit. Amen.";

export const APOSTLES_CREED =
  "I believe in God, the Father almighty, Creator of heaven and earth, and in Jesus Christ, His only Son, our Lord, who was conceived by the Holy Spirit, born of the Virgin Mary, suffered under Pontius Pilate, was crucified, died and was buried; He descended into hell; on the third day He rose again from the dead; He ascended into heaven, and is seated at the right hand of God the Father almighty; from there He will come to judge the living and the dead. I believe in the Holy Spirit, the holy catholic Church, the communion of saints, the forgiveness of sins, the resurrection of the body, and life everlasting. Amen.";

export const OUR_FATHER =
  "Our Father, who art in heaven, hallowed be thy name; thy kingdom come; thy will be done on earth as it is in heaven. Give us this day our daily bread; and forgive us our trespasses as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil. Amen.";

export const HAIL_MARY =
  "Hail Mary, full of grace, the Lord is with thee. Blessed art thou among women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.";

export const GLORY_BE =
  "Glory be to the Father, and to the Son, and to the Holy Spirit, as it was in the beginning, is now, and ever shall be, world without end. Amen.";

export const FATIMA_PRAYER =
  "O my Jesus, forgive us our sins, save us from the fires of hell, lead all souls to heaven, especially those in most need of thy mercy.";

export const HAIL_HOLY_QUEEN =
  "Hail, Holy Queen, Mother of Mercy, our life, our sweetness, and our hope. To thee do we cry, poor banished children of Eve; to thee do we send up our sighs, mourning and weeping in this valley of tears. Turn then, most gracious advocate, thine eyes of mercy toward us; and after this, our exile, show unto us the blessed fruit of thy womb, Jesus. O clement, O loving, O sweet Virgin Mary. Amen.";

export const ROSARY_CONCLUDING_DIALOGUE = [
  {
    speaker: "V.",
    text: "Pray for us, O holy Mother of God.",
  },
  {
    speaker: "R.",
    text: "That we may be made worthy of the promises of Christ.",
  },
];

export const ROSARY_CONCLUDING_PRAYER =
  "Let us pray. O God, whose Only Begotten Son, by His life, death, and resurrection, has purchased for us the rewards of eternal life, grant, we beseech thee, that while meditating on these mysteries of the most holy Rosary of the Blessed Virgin Mary, we may imitate what they contain and obtain what they promise, through the same Christ our Lord. Amen.";

export const ROSARY_MYSTERY_SETS: Record<
  RosaryMysterySetKey,
  RosaryMysterySet
> = {
  joyful: {
    key: "joyful",
    title: "Joyful Mysteries",
    weekdayLabel: "Monday and Saturday",
    mysteries: [
      {
        title: "The Annunciation",
        description:
          "The angel Gabriel announces to Mary that she will bear the Son of God.",
        meditations: [
          "Mary receives God's word with humility and trust.",
          "Ask for a heart that says yes before every duty God gives.",
          "Let hidden obedience become a real act of love.",
        ],
      },
      {
        title: "The Visitation",
        description:
          "Mary goes in haste to Elizabeth, carrying Christ to her cousin's home.",
        meditations: [
          "Charity moves quickly when another person needs help.",
          "Mary brings Christ quietly, without drawing attention to herself.",
          "Ask for joy that serves before it explains itself.",
        ],
      },
      {
        title: "The Nativity",
        description:
          "Jesus is born in Bethlehem and laid in a manger.",
        meditations: [
          "The Lord enters poverty without resentment.",
          "Make room for Christ in the small and ordinary parts of the day.",
          "Ask for simplicity, gratitude, and reverence.",
        ],
      },
      {
        title: "The Presentation",
        description:
          "Mary and Joseph present Jesus in the Temple according to the Law.",
        meditations: [
          "The Holy Family gives back to God what already belongs to Him.",
          "Faithfulness is often quiet, regular, and unseen.",
          "Offer your responsibilities without bargaining.",
        ],
      },
      {
        title: "The Finding in the Temple",
        description:
          "After three days, Mary and Joseph find Jesus teaching in His Father's house.",
        meditations: [
          "Seek Christ patiently when He feels hidden.",
          "Mary keeps what she does not yet understand in her heart.",
          "Ask for perseverance in prayer and trust in God's timing.",
        ],
      },
    ],
  },
  sorrowful: {
    key: "sorrowful",
    title: "Sorrowful Mysteries",
    weekdayLabel: "Tuesday and Friday",
    mysteries: [
      {
        title: "The Agony in the Garden",
        description:
          "Jesus prays in Gethsemane and accepts the Father's will.",
        meditations: [
          "Christ does not flee the cup placed before Him.",
          "Bring fear, fatigue, and sorrow honestly to the Father.",
          "Ask for obedience when obedience costs something.",
        ],
      },
      {
        title: "The Scourging at the Pillar",
        description:
          "Jesus is bound and scourged for the sins of the world.",
        meditations: [
          "The Lord bears wounds caused by sin and cruelty.",
          "Pray for purity of body, speech, and imagination.",
          "Let repentance become concrete and merciful.",
        ],
      },
      {
        title: "The Crowning with Thorns",
        description:
          "Jesus is mocked as king and crowned with thorns.",
        meditations: [
          "Christ's kingship is humble, patient, and truthful.",
          "Renounce pride, contempt, and the need to win every moment.",
          "Ask for meekness under insult or misunderstanding.",
        ],
      },
      {
        title: "The Carrying of the Cross",
        description:
          "Jesus carries the Cross to Calvary.",
        meditations: [
          "The Cross is not abstract; it is carried step by step.",
          "Receive today's burdens without self-pity.",
          "Ask to help others carry what is heavy for them.",
        ],
      },
      {
        title: "The Crucifixion",
        description:
          "Jesus dies on the Cross for love of the Father and for our salvation.",
        meditations: [
          "At the Cross, love gives everything.",
          "Stand with Mary where suffering cannot be explained away.",
          "Ask for contrition, mercy, and a faithful death.",
        ],
      },
    ],
  },
  glorious: {
    key: "glorious",
    title: "Glorious Mysteries",
    weekdayLabel: "Wednesday and Sunday",
    mysteries: [
      {
        title: "The Resurrection",
        description:
          "Jesus rises from the dead, conquering sin and death.",
        meditations: [
          "The Father's mercy is stronger than the grave.",
          "Let hope correct discouragement and spiritual laziness.",
          "Ask to live today as someone redeemed.",
        ],
      },
      {
        title: "The Ascension",
        description:
          "Jesus ascends into heaven and sends His disciples to witness.",
        meditations: [
          "Christ reigns and intercedes for His Church.",
          "Your ordinary life is part of the mission.",
          "Ask for courage to speak and act as a disciple.",
        ],
      },
      {
        title: "The Descent of the Holy Spirit",
        description:
          "The Holy Spirit comes upon Mary and the apostles at Pentecost.",
        meditations: [
          "The Church is born in prayer and filled with fire.",
          "Ask the Holy Spirit to purify your motives.",
          "Receive strength for fidelity, witness, and charity.",
        ],
      },
      {
        title: "The Assumption of Mary",
        description:
          "Mary is taken body and soul into heavenly glory.",
        meditations: [
          "God completes His work in the one who trusted Him fully.",
          "The body is made for holiness and resurrection.",
          "Ask for a clean hope fixed on heaven.",
        ],
      },
      {
        title: "The Coronation of Mary",
        description:
          "Mary is crowned Queen of Heaven and Earth.",
        meditations: [
          "True greatness is perfect humility before God.",
          "Mary's glory is entirely the fruit of grace.",
          "Ask her help to love Jesus with an undivided heart.",
        ],
      },
    ],
  },
  luminous: {
    key: "luminous",
    title: "Luminous Mysteries",
    weekdayLabel: "Thursday",
    mysteries: [
      {
        title: "The Baptism of Jesus",
        description:
          "Jesus is baptized in the Jordan, and the Father reveals Him as His beloved Son.",
        meditations: [
          "Christ enters the waters in solidarity with sinners.",
          "Remember the dignity and responsibility of baptism.",
          "Ask to live as a beloved child of the Father.",
        ],
      },
      {
        title: "The Wedding at Cana",
        description:
          "At Mary's request, Jesus performs His first sign and turns water into wine.",
        meditations: [
          "Mary notices need and brings it to Jesus.",
          "Do whatever He tells you, even in small things.",
          "Ask for trust in Christ's generous timing.",
        ],
      },
      {
        title: "The Proclamation of the Kingdom",
        description:
          "Jesus announces the Kingdom of God and calls all to repentance.",
        meditations: [
          "The Gospel is an invitation to conversion, not self-improvement alone.",
          "Let Christ rule the habits, desires, and choices of the day.",
          "Ask for the grace to repent without delay.",
        ],
      },
      {
        title: "The Transfiguration",
        description:
          "Jesus is transfigured before Peter, James, and John.",
        meditations: [
          "Christ reveals the glory hidden beneath His humility.",
          "Listen to Him before listening to fear or noise.",
          "Ask for prayer that strengthens you for the Cross.",
        ],
      },
      {
        title: "The Institution of the Eucharist",
        description:
          "Jesus gives His Body and Blood at the Last Supper.",
        meditations: [
          "The Lord remains with His Church in the Blessed Sacrament.",
          "Receive His self-gift with reverence and gratitude.",
          "Ask for Eucharistic love, purity, and hunger for God.",
        ],
      },
    ],
  },
};

export const ROSARY_AUDIO_PATH_BY_WEEKDAY: Record<RosaryWeekday, string> = {
  sunday: "hallow/jonathan-roumie/sunday-rosary-jonathan-roumie.m4a",
  monday: "hallow/jonathan-roumie/monday-rosary-jonathan-roumie.m4a",
  tuesday: "hallow/jonathan-roumie/tuesday-rosary-jonathan-roumie.m4a",
  wednesday: "hallow/jonathan-roumie/wednesday-rosary-jonathan-roumie.m4a",
  thursday: "hallow/jonathan-roumie/thursday-rosary-jonathan-roumie.m4a",
  friday: "hallow/jonathan-roumie/friday-rosary-jonathan-roumie.m4a",
  saturday: "hallow/jonathan-roumie/saturday-rosary-jonathan-roumie.m4a",
};

const ROSARY_WEEKDAYS: RosaryWeekday[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function getDayOfWeek(date: string | null) {
  const resolvedDate = date ? new Date(`${date}T12:00:00`) : new Date();
  return Number.isNaN(resolvedDate.getTime())
    ? new Date().getDay()
    : resolvedDate.getDay();
}

export function getRosaryMysterySetForDate(date: string | null) {
  const dayOfWeek = getDayOfWeek(date);

  if (dayOfWeek === 1 || dayOfWeek === 6) {
    return ROSARY_MYSTERY_SETS.joyful;
  }

  if (dayOfWeek === 2 || dayOfWeek === 5) {
    return ROSARY_MYSTERY_SETS.sorrowful;
  }

  if (dayOfWeek === 4) {
    return ROSARY_MYSTERY_SETS.luminous;
  }

  return ROSARY_MYSTERY_SETS.glorious;
}

export function getRosaryWeekdayForDate(date: string | null) {
  if (!date) return null;

  const resolvedDate = new Date(`${date}T12:00:00`);
  if (Number.isNaN(resolvedDate.getTime())) return null;

  return ROSARY_WEEKDAYS[resolvedDate.getDay()];
}

export function getRosaryAudioPathForDate(date: string | null) {
  const weekday = getRosaryWeekdayForDate(date);
  return weekday ? ROSARY_AUDIO_PATH_BY_WEEKDAY[weekday] : null;
}
