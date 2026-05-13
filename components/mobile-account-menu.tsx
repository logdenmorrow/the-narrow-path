"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Laptop, LifeBuoy, Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ICON_SIZE = 16;

export default function MobileAccountMenu({
  signOutAction,
}: {
  signOutAction: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full border-[color:var(--line-strong)] bg-[color:var(--surface-2)]/70 text-monastic-1"
          aria-label="Open account menu"
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-64 rounded-[1rem] border-monastic bg-[color:var(--surface-1)] p-2 shadow-[0_20px_48px_-28px_rgba(24,16,12,0.85)] backdrop-blur-xl"
      >
        <DropdownMenuLabel className="px-3 py-2 text-xs uppercase tracking-[0.18em] text-monastic-2">
          Account
        </DropdownMenuLabel>
        <DropdownMenuItem asChild className="rounded-[0.85rem] px-3 py-2 text-monastic-1">
          <Link href="/support">
            <LifeBuoy className="h-4 w-4 text-monastic-2" aria-hidden="true" />
            Support
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-2 bg-[color:var(--line-soft)]" />

        <DropdownMenuLabel className="px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-monastic-2">
          Theme
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={mounted ? theme : "system"}
          onValueChange={setTheme}
        >
          <DropdownMenuRadioItem
            className="rounded-[0.85rem] py-2 pl-9 pr-3 text-monastic-1"
            value="light"
          >
            <Sun size={ICON_SIZE} className="text-monastic-2" />
            <span>Light</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            className="rounded-[0.85rem] py-2 pl-9 pr-3 text-monastic-1"
            value="dark"
          >
            <Moon size={ICON_SIZE} className="text-monastic-2" />
            <span>Dark</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            className="rounded-[0.85rem] py-2 pl-9 pr-3 text-monastic-1"
            value="system"
          >
            <Laptop size={ICON_SIZE} className="text-monastic-2" />
            <span>System</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator className="my-2 bg-[color:var(--line-soft)]" />

        <div className="px-1 py-1">{signOutAction}</div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
