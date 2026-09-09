"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { LiturgicalSpecialEventNotice } from "@/lib/liturgical-calendar";
import {
  dismissScheduledChurchEvent,
  isScheduledChurchEventDismissed,
} from "@/lib/scheduled-church-event-dismissal";

type ScheduledChurchEventDialogProps = {
  notice: LiturgicalSpecialEventNotice;
};

export function ScheduledChurchEventDialog({
  notice,
}: ScheduledChurchEventDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      setIsOpen(
        !isScheduledChurchEventDismissed(
          window.localStorage,
          notice.eventKey
        )
      );
    } catch {
      setIsOpen(true);
    }
  }, [notice.eventKey]);

  if (!isOpen) return null;

  const dismiss = () => {
    try {
      dismissScheduledChurchEvent(window.localStorage, notice.eventKey);
    } catch {
      // The dialog can still close when storage is unavailable.
    }

    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4 py-8 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="scheduled-church-event-title"
        aria-describedby="scheduled-church-event-description"
        className="monastic-card relative w-full max-w-lg p-5 shadow-2xl sm:p-7"
      >
        <button
          type="button"
          aria-label="Close announcement"
          onClick={dismiss}
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg text-monastic-2 transition-colors hover:bg-white/5 hover:text-monastic-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
        <p className="section-kicker">Today in the Church</p>
        <h2
          id="scheduled-church-event-title"
          className="mt-3 text-2xl font-semibold leading-tight text-monastic-0 sm:text-3xl"
        >
          {notice.title}
        </h2>
        <p
          id="scheduled-church-event-description"
          className="mt-4 text-sm leading-6 text-monastic-1 sm:text-base sm:leading-7"
        >
          {notice.body}
        </p>

        <div className="mt-6">
          <Button asChild className="w-full" onClick={dismiss}>
            <Link href={notice.href}>{notice.ctaLabel}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
