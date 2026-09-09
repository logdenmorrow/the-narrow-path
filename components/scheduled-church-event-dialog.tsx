"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { LiturgicalSpecialEventNotice } from "@/lib/liturgical-calendar";

type ScheduledChurchEventDialogProps = {
  notice: LiturgicalSpecialEventNotice;
};

const STORAGE_PREFIX = "tnp-scheduled-church-event-dismissed:";

export function ScheduledChurchEventDialog({
  notice,
}: ScheduledChurchEventDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      setIsOpen(
        window.localStorage.getItem(`${STORAGE_PREFIX}${notice.eventKey}`) !==
          "true"
      );
    } catch {
      setIsOpen(true);
    }
  }, [notice.eventKey]);

  if (!isOpen) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(
        `${STORAGE_PREFIX}${notice.eventKey}`,
        "true"
      );
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
        className="monastic-card w-full max-w-lg p-5 shadow-2xl sm:p-7"
      >
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

        <div className="mt-6 grid gap-2 sm:grid-cols-[1fr_auto]">
          <Button asChild className="w-full" onClick={dismiss}>
            <Link href={notice.href}>{notice.ctaLabel}</Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full sm:w-auto"
            onClick={dismiss}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
