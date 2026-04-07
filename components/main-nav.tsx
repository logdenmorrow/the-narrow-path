"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/today", label: "Today" },
  { href: "/this-week", label: "This Week" },
  { href: "/daily-reading", label: "Daily Reading" },
  { href: "/brotherhood", label: "Brotherhood" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function MainNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex flex-wrap items-center text-sm text-zinc-300",
        mobile ? "justify-around gap-2" : "gap-x-4 gap-y-2 sm:gap-x-6"
      )}
    >
      {navItems.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-2 py-1 transition",
              active
                ? "bg-zinc-900 text-white"
                : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
