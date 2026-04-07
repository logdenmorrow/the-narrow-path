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
        "flex flex-wrap items-center text-sm text-zinc-300",
        mobile ? "justify-around gap-2" : "gap-x-3 gap-y-2 sm:gap-x-4"
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
              "relative rounded-lg px-2.5 py-1.5 font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
              "after:absolute after:bottom-0 after:left-2.5 after:right-2.5 after:h-0.5 after:rounded-full after:transition after:content-['']",
              active
                ? "text-white after:bg-white"
                : "text-zinc-300 hover:text-white after:bg-transparent"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
