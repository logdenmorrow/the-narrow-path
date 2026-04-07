"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/today", label: "Today" },
  { href: "/this-week", label: "Week" },
  { href: "/daily-reading", label: "Reading" },
  { href: "/brotherhood", label: "Brotherhood" },
];

export default function MobileTabBar() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-black/95 px-2 py-2 backdrop-blur sm:hidden">
      <nav className="mx-auto grid max-w-6xl grid-cols-4 gap-1">
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "rounded-md px-2 py-2 text-center text-xs font-semibold transition",
                active ? "bg-zinc-100 text-black" : "text-zinc-300 hover:bg-zinc-900"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
