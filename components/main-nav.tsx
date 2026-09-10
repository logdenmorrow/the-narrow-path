"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getDesktopNavItems, isActivePath } from "@/lib/navigation";

export default function MainNav({
  mobile = false,
  communityName = "Brotherhood",
  hideSeasonalNav = false,
}: {
  mobile?: boolean;
  communityName?: string;
  hideSeasonalNav?: boolean;
}) {
  const pathname = usePathname();
  const navItems = getDesktopNavItems(hideSeasonalNav);

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "flex flex-wrap items-center",
        mobile
          ? "justify-around gap-2"
          : "gap-1 border-b border-monastic"
      )}
    >
      {navItems.map((item) => {
        const active = isActivePath(pathname, item.href);
        const label = item.href === "/brotherhood" ? communityName : item.label;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
              "after:absolute after:inset-x-3 after:bottom-[-1px] after:h-0.5 after:transition-colors after:content-['']",
              active
                ? "text-monastic-0 after:bg-[color:var(--surface-strong)]"
                : "text-monastic-1 hover:text-monastic-0 after:bg-transparent"
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
