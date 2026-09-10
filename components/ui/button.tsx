import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[1.05rem] border px-4 text-center font-semibold tracking-[0.14em] transition-all duration-200 ease-out active:translate-y-px active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "border-[color:var(--line-strong)] bg-[linear-gradient(180deg,var(--surface-strong-2),var(--surface-strong))] text-[hsl(var(--primary-foreground))] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_18px_28px_-20px_rgba(27,17,11,0.86)] hover:-translate-y-0.5 hover:brightness-105 active:brightness-95",
        secondary:
          "border-[color:var(--line-strong)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-2)_90%,white),var(--surface-3))] text-[color:var(--text-0)] shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] hover:bg-[color:var(--surface-2)] hover:-translate-y-0.5 active:bg-[color:var(--surface-3)]",
        outline:
          "border-[color:var(--line-strong)] bg-transparent text-[color:var(--text-0)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-[color:var(--surface-3)] hover:-translate-y-0.5 active:bg-[color:var(--surface-2)]",
        ghost:
          "border-transparent bg-transparent text-[color:var(--text-1)] hover:bg-[color:var(--surface-3)] hover:text-[color:var(--text-0)] active:bg-[color:var(--surface-2)]",
        default:
          "border-[color:var(--line-strong)] bg-[linear-gradient(180deg,var(--surface-strong-2),var(--surface-strong))] text-[hsl(var(--primary-foreground))] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_18px_28px_-20px_rgba(27,17,11,0.86)] hover:-translate-y-0.5 hover:brightness-105 active:brightness-95",
        destructive:
          "border-[#7f1d1d] bg-[#991b1b] text-[#fee2e2] hover:bg-[#7f1d1d] active:bg-[#651717]",
        link: "h-auto rounded-none border-transparent bg-transparent px-0 text-[color:var(--surface-strong)] underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-8 px-3 text-[10px] uppercase",
        sm: "h-10 px-4 text-[11px] uppercase",
        default: "h-11 px-5 text-xs uppercase",
        md: "h-11 px-5 text-xs uppercase",
        lg: "h-12 px-6 text-sm uppercase",
        icon: "h-11 w-11 p-0",
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
