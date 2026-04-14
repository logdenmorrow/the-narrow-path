import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors focus:outline-none focus:ring-2 focus:ring-[#d7bf97] focus:ring-offset-2 focus:ring-offset-[#140f0a]",
  {
    variants: {
      variant: {
        default:
          "border-[#6b4a2c] bg-[#f0e0c2] text-[#432c19] dark:border-[#7f6544] dark:bg-[#2e2218] dark:text-[#f1ddbc]",
        secondary:
          "border-[#8d7050] bg-[#efe1c7] text-[#4a3520] dark:border-zinc-700 dark:bg-transparent dark:text-zinc-300",
        destructive:
          "border-[#7f1d1d] bg-[#fee2e2] text-[#7f1d1d] dark:border-[#7f1d1d] dark:bg-[#3a1515] dark:text-[#fecaca]",
        outline:
          "border-[#8d7050] bg-transparent text-[#4a3520] dark:border-zinc-700 dark:text-zinc-300",
        required:
          "border-[#7f1d1d] bg-[#fee2e2] text-[#7f1d1d] dark:border-[#7f1d1d] dark:bg-[#3a1515] dark:text-[#fecaca]",
        optional:
          "border-[#8d7050] bg-[#efe1c7] text-[#4a3520] dark:border-zinc-700 dark:bg-transparent dark:text-zinc-300",
        done: "border-emerald-700 bg-emerald-100/70 text-emerald-900 dark:bg-transparent dark:text-emerald-200",
        started:
          "border-[#755236] bg-[#eddcc8] text-[#4a341f] dark:border-[#7c5838] dark:bg-[#271d16] dark:text-[#ddc3a8]",
        momentum:
          "border-[#826642] bg-[#eadcc2] text-[#4e3923] dark:border-[#87704a] dark:bg-[#292014] dark:text-[#d8c09b]",
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
