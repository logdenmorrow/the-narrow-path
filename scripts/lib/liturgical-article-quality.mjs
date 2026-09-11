const PRIMARY_CATHOLIC_HOSTS = new Set([
  "bible.usccb.org",
  "press.vatican.va",
  "www.usccb.org",
  "www.vatican.va",
  "www.vaticannews.va",
]);

const INDEPENDENT_REFERENCE_HOSTS = new Set([
  "apnews.com",
  "www.britannica.com",
  "en.wikipedia.org",
]);

const META_LANGUAGE = /\b(?:this article|this profile|the app|our app|drafting process|review status|publication safety|not an official Church article)\b/i;
const MARKUP = /```|<\/?[a-z][^>]*>/i;
const RHETORICAL_COPY = /\b(?:a reminder that|invites us to|calls us to|challenges us to|speaks to us today|in today'?s world|timeless reminder|powerful reminder|journey of faith|how can we|what does this mean for us)\b/i;
const BANNED_HEADINGS = /^(?:catholic (?:meaning|connection)|application|takeaway|why it matters|what this means(?: for us)?|living it today|reflection)$/i;

export function articleWordCount(value) {
  return (String(value ?? "").match(/[A-Za-z0-9À-ž'’-]+/g) ?? []).length;
}

function normalizedText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

function normalizedUrl(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    url.search = "";
    url.pathname = url.pathname.replace(/\/$/, "");
    return url.toString().toLowerCase();
  } catch {
    return "";
  }
}

function sourceHost(source) {
  try {
    return new URL(source.url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function jaccardSimilarity(left, right) {
  const leftWords = new Set(normalizedText(left).split(" ").filter((word) => word.length > 3));
  const rightWords = new Set(normalizedText(right).split(" ").filter((word) => word.length > 3));
  if (leftWords.size === 0 || rightWords.size === 0) return 0;
  const intersection = [...leftWords].filter((word) => rightWords.has(word)).length;
  const union = new Set([...leftWords, ...rightWords]).size;
  return intersection / union;
}

function countOrnamentalContrasts(value) {
  return (String(value ?? "").match(/\bnot (?:merely|simply|only|just)\b[^.!?]{0,120}\bbut\b/gi) ?? []).length;
}

export function evaluateLiturgicalArticle(profile, options = {}) {
  const failures = [];
  const sections = Array.isArray(profile.sections) ? profile.sections : [];
  const facts = Array.isArray(profile.key_facts) ? profile.key_facts : [];
  const sources = Array.isArray(profile.source_refs) ? profile.source_refs : [];
  const cautions = Array.isArray(profile.historical_cautions)
    ? profile.historical_cautions
    : [];
  const publicText = [
    profile.short_summary,
    ...facts,
    ...sections.flatMap((section) => [section.heading, section.body]),
  ].join("\n");

  const summaryWords = articleWordCount(profile.short_summary);
  if (summaryWords < 45 || summaryWords > 120) {
    failures.push(`Lead summary must be 45-120 words; found ${summaryWords}.`);
  }

  if (facts.length < 6 || facts.length > 12) {
    failures.push(`Key facts must contain 6-12 useful facts; found ${facts.length}.`);
  }
  if (new Set(facts.map(normalizedText)).size !== facts.length) {
    failures.push("Key facts contain duplicate entries.");
  }

  if (sections.length < 5 || sections.length > 24) {
    failures.push(`Article must contain 5-24 sections; found ${sections.length}.`);
  }

  const totalSectionWords = sections.reduce(
    (total, section) => total + articleWordCount(section.body),
    0
  );
  if (totalSectionWords < 850 || totalSectionWords > 4500) {
    failures.push(`Article body must be 850-4,500 words; found ${totalSectionWords}.`);
  }

  const headings = sections.map((section) => normalizedText(section.heading));
  if (new Set(headings).size !== headings.length) {
    failures.push("Article contains duplicate section headings.");
  }

  sections.forEach((section, index) => {
    const sectionWords = articleWordCount(section.body);
    if (sectionWords < 90) {
      failures.push(`Section ${index + 1} (${section.heading}) is too thin at ${sectionWords} words.`);
    }
    if (sectionWords > 350) {
      failures.push(`Section ${index + 1} (${section.heading}) is too long at ${sectionWords} words.`);
    }
    if (BANNED_HEADINGS.test(String(section.heading ?? "").trim())) {
      failures.push(`Section heading "${section.heading}" is a prohibited appendix-style heading.`);
    }
  });

  for (let left = 0; left < sections.length; left += 1) {
    for (let right = left + 1; right < sections.length; right += 1) {
      if (jaccardSimilarity(sections[left].body, sections[right].body) >= 0.72) {
        failures.push(
          `Sections "${sections[left].heading}" and "${sections[right].heading}" substantially repeat one another.`
        );
      }
    }
  }

  if (META_LANGUAGE.test(publicText)) {
    failures.push("Reader-facing copy contains drafting, app, review, or disclaimer language.");
  }
  if (MARKUP.test(publicText)) {
    failures.push("Reader-facing copy contains Markdown fences or HTML.");
  }
  if (RHETORICAL_COPY.test(publicText)) {
    failures.push("Reader-facing copy contains slogan-like, motivational, or rhetorical language.");
  }
  const contrastCount = countOrnamentalContrasts(publicText);
  if (contrastCount > 2) {
    failures.push(`Article overuses "not X, but Y" contrasts (${contrastCount} instances).`);
  }

  const candidateTitle = normalizedText(options.candidate?.title);
  if (candidateTitle) {
    const meaningfulTokens = candidateTitle
      .split(" ")
      .filter((token) => token.length >= 4 && !["saint", "saints", "blessed", "memorial", "solemnity"].includes(token));
    const lead = normalizedText(`${profile.title} ${profile.short_summary}`);
    if (meaningfulTokens.length > 0 && !meaningfulTokens.some((token) => lead.includes(token))) {
      failures.push("Lead summary does not clearly identify the scheduled subject.");
    }
  }

  if (sources.length < 4 || sources.length > 16) {
    failures.push(`Article must cite 4-16 sources; found ${sources.length}.`);
  }
  const hosts = sources.map(sourceHost).filter(Boolean);
  if (new Set(hosts).size < 3) {
    failures.push("Sources must span at least three distinct hosts.");
  }
  if (!hosts.some((host) => PRIMARY_CATHOLIC_HOSTS.has(host))) {
    failures.push("Sources need at least one Holy See, Vatican News, USCCB, or USCCB Scripture source.");
  }
  if (!hosts.some((host) => INDEPENDENT_REFERENCE_HOSTS.has(host))) {
    failures.push("Sources need at least one independent reference source such as Britannica, AP, or Wikipedia.");
  }
  sources.forEach((source, index) => {
    if (articleWordCount(source.note) < 5) {
      failures.push(`Source ${index + 1} needs a specific note explaining what it supports.`);
    }
  });

  const consulted = new Set(
    (options.consultedSourceUrls ?? []).map(normalizedUrl).filter(Boolean)
  );
  if (options.requireConsultedSources) {
    if (consulted.size < 2) {
      failures.push("Web research did not return at least two traceable consulted sources.");
    } else {
      const matched = sources.filter((source) => consulted.has(normalizedUrl(source.url))).length;
      if (matched < 2) {
        failures.push("Fewer than two cited sources can be matched to the web research trace.");
      }
    }
  }

  if (cautions.length > 8) {
    failures.push(`Historical cautions must contain no more than eight items; found ${cautions.length}.`);
  }

  return {
    passed: failures.length === 0,
    failures,
    metrics: {
      summaryWords,
      keyFacts: facts.length,
      sections: sections.length,
      totalSectionWords,
      sources: sources.length,
      sourceHosts: new Set(hosts).size,
      historicalCautions: cautions.length,
    },
  };
}

export function evaluateEditorialReview(review) {
  const scoreNames = [
    "factual_grounding",
    "catholic_accuracy",
    "depth",
    "organization",
    "prose",
    "source_quality",
  ];
  const booleanNames = [
    "identity_clear",
    "claims_supported",
    "uncertainties_handled",
    "no_meta_language",
    "no_ai_style",
    "no_repetition",
  ];
  const failures = [];

  if (review?.decision !== "pass") failures.push("Editorial reviewer returned reject.");
  for (const name of scoreNames) {
    if (!Number.isInteger(review?.scores?.[name]) || review.scores[name] < 4) {
      failures.push(`${name} must score at least 4/5.`);
    }
  }
  for (const name of booleanNames) {
    if (review?.checks?.[name] !== true) failures.push(`${name} must pass.`);
  }
  for (const reason of review?.rejection_reasons ?? []) {
    if (String(reason).trim()) failures.push(String(reason).trim());
  }

  return { passed: failures.length === 0, failures };
}
