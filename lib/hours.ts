export const VALID_HOURS = ["lauds", "vespers", "compline"] as const;

export type LiturgicalHour = (typeof VALID_HOURS)[number];

export function isValidHour(value: string): value is LiturgicalHour {
  return (VALID_HOURS as readonly string[]).includes(value);
}

const HOUR_DISPLAY_NAMES: Record<LiturgicalHour, string> = {
  lauds: "Morning Prayer",
  vespers: "Evening Prayer",
  compline: "Night Prayer",
};

const HOUR_KICKERS: Record<LiturgicalHour, string> = {
  lauds: "Lauds",
  vespers: "Vespers",
  compline: "Compline",
};

export function getHourDisplayName(hour: LiturgicalHour): string {
  return HOUR_DISPLAY_NAMES[hour];
}

export function getHourKicker(hour: LiturgicalHour): string {
  return HOUR_KICKERS[hour];
}

// TODO: When Lauds and Vespers content exists, resolve the current Hour by
// time of day instead of always returning 'compline'.
export function getDefaultHour(): LiturgicalHour {
  return "compline";
}

const HOUR_TASK_SLUGS: Record<LiturgicalHour, string> = {
  lauds: "liturgy-of-the-hours-lauds",
  vespers: "liturgy-of-the-hours-vespers",
  compline: "liturgy-of-the-hours-compline",
};

export function getHourTaskSlug(hour: LiturgicalHour): string {
  return HOUR_TASK_SLUGS[hour];
}
