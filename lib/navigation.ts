import { BookOpenText, CalendarDays, CalendarRange, Users } from "lucide-react";

export const desktopNavItems = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/today", label: "Today" },
  { href: "/this-week", label: "This Week" },
  { href: "/daily-reading", label: "Daily Reading" },
  { href: "/brotherhood", label: "Brotherhood" },
] as const;

export const mobileTabItems = [
  { href: "/today", label: "Today", icon: CalendarDays },
  { href: "/this-week", label: "Week", icon: CalendarRange },
  { href: "/daily-reading", label: "Reading", icon: BookOpenText },
  { href: "/brotherhood", label: "Brotherhood", icon: Users },
] as const;

export function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
