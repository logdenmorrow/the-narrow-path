import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ButtonVariant = NonNullable<React.ComponentProps<typeof Button>["variant"]>;
type ButtonSize = NonNullable<React.ComponentProps<typeof Button>["size"]>;

type PageAction = {
  href: string;
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

type PageActionsProps = {
  actions: PageAction[];
  className?: string;
  stackOnMobile?: boolean;
};

export function AppActionBar({
  actions,
  className,
  stackOnMobile = false,
}: PageActionsProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-3 rounded-[0.85rem] border border-monastic bg-monastic-panel p-2",
        stackOnMobile && "flex-col items-stretch sm:flex-row sm:items-center",
        className
      )}
    >
      {actions.map((action) => (
        <Button
          key={`${action.href}-${action.label}`}
          asChild
          variant={action.variant ?? "secondary"}
          size={action.size ?? "md"}
          className={action.className}
        >
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ))}
    </div>
  );
}

export const PageActions = AppActionBar;
