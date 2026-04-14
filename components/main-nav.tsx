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
              "relative rounded-md px-3 py-2 font-semibold tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a5432] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3e9d5]",
              "after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:rounded-full after:transition after:content-['']",
              active
                ? "bg-[#ead8bb] text-[#4a301f] after:bg-[#7a5432]"
                : "text-[#5a3d28] hover:bg-[#efe2ca] hover:text-[#3c2819] after:bg-transparent"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
