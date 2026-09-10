"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getMobileTabItems, isActivePath } from "@/lib/navigation";

const GRID_COLS_CLASS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

export default function MobileTabBar({
  communityName = "Brotherhood",
  hideSeasonalNav = false,
}: {
  communityName?: string;
  hideSeasonalNav?: boolean;
}) {
  const pathname = usePathname();
  const isRosaryPrayerMode = pathname === "/rosary";
  const tabs = getMobileTabItems(hideSeasonalNav);

  if (isRosaryPrayerMode) {
    return null;
  }

  return (
    <div className="mobile-tab-bar inset-x-0 bottom-0 sm:hidden">
      <nav
        aria-label="Primary mobile"
        className={cn(
          "mx-auto grid max-w-6xl gap-1 border-t border-monastic bg-[color:var(--surface-1)] px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5",
          GRID_COLS_CLASS[tabs.length] ?? "grid-cols-4"
        )}
      >
        {tabs.map((tab) => {
          const active = isActivePath(pathname, tab.href);
          const Icon = tab.icon;
          const label = tab.href === "/brotherhood" ? communityName : tab.label;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-h-[3.6rem] min-w-0 flex-col items-center justify-center gap-1 px-1.5 py-2 text-[11px] font-semibold leading-none transition-colors after:absolute after:inset-x-4 after:top-[-0.4rem] after:h-0.5 after:content-['']",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                active
                  ? "text-[color:var(--surface-strong)] after:bg-[color:var(--surface-strong)]"
                  : "text-monastic-1 hover:text-monastic-0 after:bg-transparent"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="mobile-tab-label block max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
