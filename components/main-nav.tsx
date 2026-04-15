"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { desktopNavItems, isActivePath } from "@/lib/navigation";

export default function MainNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "flex flex-wrap items-center",
        mobile
          ? "justify-around gap-2"
          : "rounded-full border border-monastic bg-monastic-panel p-1.5 shadow-[0_16px_34px_-28px_rgba(42,25,15,0.9)]"
      )}
    >
      {desktopNavItems.map((item) => {
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative rounded-full px-4 py-2.5 text-sm font-semibold tracking-[0.16em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
              "after:absolute after:bottom-1 after:left-4 after:right-4 after:h-px after:rounded-full after:transition after:content-['']",
              active
                ? "bg-[color:var(--surface-strong)] text-[hsl(var(--primary-foreground))] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] after:bg-[rgba(255,239,216,0.8)]"
                : "text-monastic-1 hover:bg-[color:var(--surface-3)] hover:text-monastic-0 after:bg-transparent"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
