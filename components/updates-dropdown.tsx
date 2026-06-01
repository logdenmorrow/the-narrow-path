"use client";

import Link from "next/link";
import { ChevronDown, Map as MapIcon, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UpdatesDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 px-3 text-xs tracking-[0.08em]"
        >
          Updates
          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-72 rounded-[1rem] border-monastic bg-[color:var(--surface-1)] p-2 shadow-[0_20px_48px_-28px_rgba(24,16,12,0.85)] backdrop-blur-xl"
      >
        <DropdownMenuItem asChild className="rounded-[0.85rem] p-0 text-monastic-1">
          <Link
            href="/announcements"
            className="flex w-full items-start gap-3 px-3 py-3"
          >
            <Megaphone className="mt-0.5 h-4 w-4 text-monastic-2" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-monastic-0">
                Announcements
              </span>
              <span className="mt-0.5 block text-xs text-monastic-2">
                Official updates
              </span>
            </span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="rounded-[0.85rem] p-0 text-monastic-1">
          <Link href="/news" className="flex w-full items-start gap-3 px-3 py-3">
            <MapIcon className="mt-0.5 h-4 w-4 text-monastic-2" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-monastic-0">
                Roadmap
              </span>
              <span className="mt-0.5 block text-xs text-monastic-2">
                What&rsquo;s ahead
              </span>
            </span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
