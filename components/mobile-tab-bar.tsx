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
    <div className="mobile-tab-bar inset-x-0 bottom-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:hidden">
      <nav
        aria-label="Primary mobile"
        className={cn(
          "mx-auto grid max-w-6xl gap-1 rounded-[1.75rem] border border-monastic bg-[color:var(--surface-1)]/95 p-2 shadow-[0_-10px_34px_-18px_rgba(24,16,12,0.7)] backdrop-blur-xl",
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
                "flex min-h-[3.85rem] min-w-0 flex-col items-center justify-center gap-1 rounded-[1.1rem] px-1.5 py-2 text-[10px] font-semibold leading-none tracking-[0.08em] transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                active
                  ? "bg-[linear-gradient(180deg,var(--surface-strong-2),var(--surface-strong))] text-[hsl(var(--primary-foreground))] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
                  : "text-monastic-1 hover:bg-[color:var(--surface-3)] hover:text-monastic-0"
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
