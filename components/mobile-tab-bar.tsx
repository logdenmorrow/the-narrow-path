"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isActivePath, mobileTabItems } from "@/lib/navigation";

export default function MobileTabBar() {
  const pathname = usePathname();

  return (
    <div className="mobile-tab-bar fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-[#efe3cd]/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur sm:hidden">
      <nav aria-label="Primary mobile" className="mx-auto grid max-w-6xl grid-cols-4 gap-1">
        {mobileTabItems.map((tab) => {
          const active = isActivePath(pathname, tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold leading-none transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a5432]/90 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f2e7d1]",
                active
                  ? "bg-[#7d5431] text-[#f6ebd7]"
                  : "text-[#5e3f2a] hover:bg-[#e5d4b8] hover:text-[#462e1f]"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
