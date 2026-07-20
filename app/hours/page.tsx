import { redirect } from "next/navigation";
import { CHALLENGE_TIME_ZONE } from "@/lib/challenge";

// TODO: these cutoff times (10am / 5pm local) are approximate defaults and
// could be made configurable later.
function resolveDefaultHourByTimeOfDay() {
  const localHour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: CHALLENGE_TIME_ZONE,
      hour: "numeric",
      hourCycle: "h23",
    }).format(new Date())
  );

  if (localHour < 10) return "lauds";
  if (localHour < 17) return "vespers";
  return "compline";
}

export default function HoursPage() {
  redirect(`/hours/${resolveDefaultHourByTimeOfDay()}`);
}
