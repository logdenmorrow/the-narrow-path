export const NIGHT_PRAYER_SOURCE = "divineoffice";

export const NIGHT_PRAYER_ATTRIBUTION_TEXT =
  "Night Prayer text provided with permission from DivineOffice.org. All rights remain with their respective owners.";

export const NIGHT_PRAYER_ATTRIBUTION_HTML =
  '<p>Night Prayer text provided with permission from <a href="https://divineoffice.org/">DivineOffice.org</a>. All rights remain with their respective owners.</p>';

export type NightPrayerBlock = {
  type: "heading" | "paragraph" | "note";
  lines: string[];
};

export type NightPrayerContent = {
  version: 1;
  blocks: NightPrayerBlock[];
};

export function getDivineOfficeDateUrl(isoDate: string) {
  const yyyymmdd = isoDate.replaceAll("-", "");
  return `https://divineoffice.org/?date=${yyyymmdd}`;
}

export function getNightPrayerBlocks(value: unknown): NightPrayerBlock[] {
  if (!value || typeof value !== "object") return [];

  const content = value as Partial<NightPrayerContent>;
  if (content.version !== 1 || !Array.isArray(content.blocks)) {
    return [];
  }

  return content.blocks.filter((block): block is NightPrayerBlock => {
    if (!block || typeof block !== "object") return false;
    if (!["heading", "paragraph", "note"].includes(block.type)) return false;
    return Array.isArray(block.lines) && block.lines.every((line) => typeof line === "string");
  });
}
