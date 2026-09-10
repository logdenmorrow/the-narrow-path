import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-4 text-center font-semibold transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "border-[color:var(--surface-strong)] bg-[color:var(--surface-strong)] text-[hsl(var(--primary-foreground))] hover:bg-[color:var(--surface-strong-2)]",
        secondary:
          "border-[color:var(--line-strong)] bg-[color:var(--surface-1)] text-[color:var(--text-0)] hover:bg-[color:var(--surface-2)]",
        outline:
          "border-[color:var(--line-strong)] bg-transparent text-[color:var(--text-0)] hover:bg-[color:var(--surface-2)]",
        ghost:
          "border-transparent bg-transparent text-[color:var(--text-1)] hover:bg-[color:var(--surface-3)] hover:text-[color:var(--text-0)] active:bg-[color:var(--surface-2)]",
        default:
          "border-[color:var(--surface-strong)] bg-[color:var(--surface-strong)] text-[hsl(var(--primary-foreground))] hover:bg-[color:var(--surface-strong-2)]",
        destructive:
          "border-[#7f1d1d] bg-[#991b1b] text-[#fee2e2] hover:bg-[#7f1d1d] active:bg-[#651717]",
        link: "h-auto rounded-none border-transparent bg-transparent px-0 text-[color:var(--surface-strong)] underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-8 px-3 text-xs",
        sm: "h-9 px-3.5 text-sm",
        default: "h-10 px-4 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-5 text-base",
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
