import { cn } from "@/lib/utils";

export type ProgressStripData = {
  dayLabel: string;
  requiredLabel: string;
  streakLabel: string;
};

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-full border border-zinc-800 bg-zinc-950/70 px-2.5 py-1">
      <p className="truncate text-[10px] uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p className="truncate text-xs font-medium text-zinc-100">{value}</p>
    </div>
  );
}

export function ProgressStripSkeleton() {
  return (
    <div className="mt-3 h-[52px] w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-2 py-2 sm:h-[40px]" />
  );
}

export default function ProgressStrip({
  data,
  compact = false,
}: {
  data: ProgressStripData;
  compact?: boolean;
}) {
  return (
    <section
      aria-label="Challenge progress"
      className={cn(
        "mt-3 w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-2 py-2",
        compact ? "" : ""
      )}
    >
      <div className="flex items-center gap-2 overflow-x-auto sm:flex-nowrap">
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
          <Pill label="Day" value={data.dayLabel} />
          <Pill label="Required" value={data.requiredLabel} />
          <Pill label="Streak" value={data.streakLabel} />
        </div>
      </div>
    </section>
  );
}
