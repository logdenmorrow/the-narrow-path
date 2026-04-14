import { cn } from "@/lib/utils";

type StatusPillTone =
  | "required"
  | "optional"
  | "done"
  | "started"
  | "locked"
  | "quota"
  | "neutral";

type StatusPillProps = {
  label: string;
  tone?: StatusPillTone;
  className?: string;
};

const TONE_CLASSES: Record<StatusPillTone, string> = {
  required:
    "border-[#ab3f30] bg-[#f2ddd4] text-[#782819] dark:border-red-800 dark:bg-red-950/40 dark:text-red-200",
  optional:
    "border-[#ab8f67] bg-[#efe2cb] text-[#6f5138] dark:border-amber-700 dark:bg-amber-950/20 dark:text-amber-200",
  done: "border-emerald-700 bg-emerald-100/70 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  started:
    "border-[#755236] bg-[#eddcc8] text-[#4a341f] dark:border-[#7c5838] dark:bg-[#271d16] dark:text-[#ddc3a8]",
  locked:
    "border-amber-800 bg-amber-100/70 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200",
  quota:
    "border-[#95744b] bg-[#efe1c6] text-[#4b3620] dark:border-zinc-700 dark:bg-transparent dark:text-zinc-300",
  neutral:
    "border-[#8d7350] bg-[#efe2ca] text-[#5a4328] dark:border-[#6e5c42] dark:bg-[#211b14] dark:text-[#cdbb9f]",
};

export function StatusPill({ label, tone = "neutral", className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]",
        TONE_CLASSES[tone],
        className
      )}
    >
      {label}
    </span>
  );
}
