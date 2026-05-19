export type GiveThanksReadingSection = {
  label: string;
  title: string;
  paragraphs: string[];
};

export type GiveThanksQuote = {
  attribution: string;
  text: string;
};

export const GIVE_THANKS_READING_TITLE = "Give Thanks: Freedom for Faith";

export const GIVE_THANKS_READING_SOURCE =
  "Selected from Dignitatis Humanae, sections 1-4, 6, 10-11, and 14-15.";

export const GIVE_THANKS_READING_INTRO = [
  "On the final day of The Narrow Path 90, pause before celebration and remember that freedom is not only political. It is also spiritual. It is the space to seek God, worship Him, receive His sacraments, teach the faith, and follow conscience without coercion.",
  "This reading is drawn from Vatican II's Dignitatis Humanae, the Declaration on Religious Freedom. It is not the whole document. It is a curated Day 90 reading on gratitude, conscience, public worship, and the duty to use freedom well.",
];

export const GIVE_THANKS_READING_SECTIONS: GiveThanksReadingSection[] = [
  {
    label: "Dignitatis Humanae 1",
    title: "Responsible Freedom",
    paragraphs: [
      "The council begins with the dignity of the human person. Human beings are not made to be driven by force. They are made to act with responsible freedom, to seek truth, and to respond to God from conscience rather than pressure.",
      "Religious freedom is not indifference to truth. The Church still teaches that every person is bound to seek the truth, especially the truth about God, and to hold fast to it once it is known. But truth is not served by coercion. It enters the mind by its own power, quietly and strongly.",
    ],
  },
  {
    label: "Dignitatis Humanae 2",
    title: "A Right Rooted in Dignity",
    paragraphs: [
      "The right to religious freedom belongs to the human person because of human dignity. A person may not be forced to act against his beliefs, privately or publicly, alone or with others, within the just limits of public order.",
      "This right is not based on whether someone already understands or follows the truth well. It is rooted in the nature of the person. Because man has reason, free will, and responsibility before God, he must be free from coercion as he seeks and obeys the truth.",
    ],
  },
  {
    label: "Dignitatis Humanae 3",
    title: "Conscience and Public Worship",
    paragraphs: [
      "God orders the world in wisdom and love, and every person has the duty and right to seek religious truth. Conscience is where a person recognizes the demands of divine law and begins to direct his life toward God.",
      "Faith is deeply interior, but it is never merely private. Human beings are social, and religion has a social nature. A person should be able to worship publicly, profess the faith in community, and share religious life with others.",
    ],
  },
  {
    label: "Dignitatis Humanae 4",
    title: "Freedom for the Church to Serve",
    paragraphs: [
      "Religious freedom also belongs to communities. The Church and other religious communities must be free to worship, govern themselves according to their own life, teach, form ministers, build places of worship, communicate with the wider Church, and serve through charitable, educational, cultural, and social works.",
      "This freedom is not a license to manipulate or pressure people. The council warns against coercive or unworthy methods in spreading the faith. The Gospel is proclaimed with truth, charity, patience, and respect for the dignity of the person.",
    ],
  },
  {
    label: "Dignitatis Humanae 6",
    title: "Government and the Common Good",
    paragraphs: [
      "Government has a real duty here. Part of the common good is safeguarding the rights and duties of the human person. Civil authority should protect religious freedom by just laws and should help create conditions where people can exercise their religious rights and fulfill their religious duties.",
      "The council also warns against discrimination in religious matters. No citizen should be treated as lesser because of religion, and no government should use force or fear to make people profess, reject, join, or abandon a faith.",
    ],
  },
  {
    label: "Dignitatis Humanae 10-11",
    title: "Faith Must Be Free",
    paragraphs: [
      "Catholic doctrine teaches that faith must be free. No one is to be forced to embrace the Christian faith against his will. The act of faith is a free act, drawn by God and offered by the person in reason and love.",
      "Christ Himself witnessed to truth without coercion. He invited, taught, warned, suffered, and gave His life. He did not impose the truth by force. His kingdom advances by witness, by hearing the truth, and by the love shown from the cross.",
    ],
  },
  {
    label: "Dignitatis Humanae 14-15",
    title: "Courage and Gratitude",
    paragraphs: [
      "The Church must proclaim Christ with urgency and courage. Christians are called to understand the truth received from Him, proclaim it faithfully, defend it vigorously, and never use methods that contradict the Gospel.",
      "The council gives thanks where religious freedom is recognized, and it grieves where religious life is made difficult or dangerous. That should shape our gratitude today. Freedom is a gift, and it is also a responsibility.",
    ],
  },
];

export const GIVE_THANKS_CLOSING =
  "Today, give thanks to God for the freedom to go to Mass, receive the sacraments, pray openly, wear a crucifix, teach the faith, build churches, and speak the name of Jesus without fearing prison or violence. Many Christians do not have that freedom. Some worship quietly. Some risk their jobs, their safety, or their lives. So today, give thanks for the freedom you have, pray for the persecuted Church, and ask God for the courage to use your freedom well.";

export const GIVE_THANKS_QUOTES: GiveThanksQuote[] = [
  {
    attribution: "St. John Paul II",
    text: "Freedom consists not in doing what we like, but in having the right to do what we ought.",
  },
  {
    attribution: "St. Thomas More",
    text: "I die the King's good servant, and God's first.",
  },
  {
    attribution: "St. Peter and the Apostles",
    text: "It is necessary to obey God rather than men.",
  },
];
