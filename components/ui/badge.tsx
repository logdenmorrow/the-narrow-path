import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2 focus:ring-offset-transparent sm:px-3 sm:py-1.5 sm:text-[10px] sm:tracking-[0.22em]",
  {
    variants: {
      variant: {
        default:
          "border-[color:var(--line-strong)] bg-[color:var(--surface-3)] text-[color:var(--text-0)]",
        secondary:
          "border-[color:var(--line-soft)] bg-transparent text-[color:var(--text-1)]",
        destructive:
          "border-[#7f1d1d] bg-[#fee2e2] text-[#7f1d1d] dark:border-[#7f1d1d] dark:bg-[#3a1515] dark:text-[#fecaca]",
        outline:
          "border-[color:var(--line-strong)] bg-transparent text-[color:var(--text-0)]",
        required:
          "border-[rgba(117,65,36,0.4)] bg-[rgba(136,87,49,0.12)] text-[color:var(--surface-strong)]",
        optional:
          "border-[color:var(--line-soft)] bg-[color:var(--surface-3)] text-[color:var(--text-1)]",
        done: "border-[rgba(69,116,85,0.45)] bg-[rgba(126,167,145,0.14)] text-[#426855] dark:text-[#a7ccb9]",
        started:
          "border-[rgba(125,97,63,0.44)] bg-[rgba(176,142,98,0.14)] text-[color:var(--text-0)]",
        momentum:
          "border-[rgba(148,104,47,0.42)] bg-[rgba(201,153,91,0.12)] text-[color:var(--surface-strong)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
