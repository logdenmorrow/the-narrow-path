import { SectionHeader, SurfaceCard } from "@/components/monastic-ui";

const temperanceRules = [
  "Weekends only",
  "Max 2 drinks in a day",
  "Never more than 2 days in a row",
  "No alcohol on fasting or penance days",
  "No drunkenness",
] as const;

export function GospelTemperanceRuleCard() {
  return (
    <SurfaceCard className="border-[rgba(168,129,81,0.38)] bg-[rgba(168,129,81,0.06)]">
      <SectionHeader
        kicker="Temperance"
        title="Gospel Season Temperance Rule"
        description="This season practices temperance without requiring full abstinence. Alcohol is limited to weekends only, with a maximum of two drinks in a day, never more than two days in a row, and never on a fasting or penance day. Drunkenness is never permitted."
      />

      <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {temperanceRules.map((rule) => (
          <li
            key={rule}
            className="rounded-xl border border-monastic bg-[rgba(246,238,224,0.05)] px-3 py-2 text-sm font-semibold leading-5 text-monastic-0"
          >
            {rule}
          </li>
        ))}
      </ul>
    </SurfaceCard>
  );
}
