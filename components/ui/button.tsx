import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent font-semibold uppercase tracking-[0.16em] transition-all duration-150 ease-out active:translate-y-px active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7bf97] focus-visible:ring-offset-2 focus-visible:ring-offset-[#140f0a] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "border-[#5e3f25] bg-[#7a5331] text-[#f9efdc] shadow-[0_9px_20px_-16px_rgba(22,14,8,0.7)] hover:bg-[#694727] active:bg-[#5d3f23]",
        secondary:
          "border-[#ae906a] bg-[#f4e8d2] text-[#412a18] hover:bg-[#edddc0] active:bg-[#e4d2b1] dark:border-[#69543a] dark:bg-[#2a1f15] dark:text-[#f2dfbf] dark:hover:bg-[#332518]",
        outline:
          "border-[#9e8059] bg-transparent text-[#f3e7d2] hover:bg-[#f4e8d2]/12 active:bg-[#f4e8d2]/18 dark:border-[#7f6342] dark:text-[#e8d3af]",
        ghost:
          "border-transparent bg-transparent text-[#f3e7d2] hover:bg-[#f4e8d2]/14 active:bg-[#f4e8d2]/20 dark:text-[#e8d3af]",
        default:
          "border-[#5e3f25] bg-[#7a5331] text-[#f9efdc] shadow-[0_9px_20px_-16px_rgba(22,14,8,0.7)] hover:bg-[#694727] active:bg-[#5d3f23]",
        destructive:
          "border-[#7f1d1d] bg-[#991b1b] text-[#fee2e2] hover:bg-[#7f1d1d] active:bg-[#651717]",
        link: "border-transparent bg-transparent px-0 text-[#e6cfaa] underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-8 px-3 text-[10px]",
        sm: "h-9 px-3.5 text-[11px]",
        default: "h-10 px-5 text-xs",
        md: "h-10 px-5 text-xs",
        lg: "h-11 px-6 text-sm",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
