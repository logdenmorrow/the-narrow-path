import ProgressStrip from "@/components/progress-strip";
import { getProgressStripMetrics } from "@/lib/progress-strip";

export default async function ProgressStripServer({ userId }: { userId: string }) {
  const metrics = await getProgressStripMetrics(userId);

  if (!metrics) {
    return <div className="mt-3 h-[52px] w-full sm:h-[40px]" aria-hidden />;
  }

  return (
    <ProgressStrip
      data={{
        dayLabel: `Day ${metrics.selectedDay}/${metrics.totalDays}`,
        requiredLabel: `${metrics.completedRequiredCount}/${metrics.totalRequiredCount}`,
        streakLabel: `${metrics.dailyStreakCount}-day streak`,
      }}
    />
  );
}
