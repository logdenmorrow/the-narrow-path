"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveDailyStatus } from "@/app/today/actions";
import {
  DAILY_STATUS_LABELS,
  DAILY_STATUS_VALUES,
  type DailyStatus,
} from "@/lib/accountability";
import { Button } from "@/components/ui/button";

type DailyStatusCardProps = {
  initialStatus: DailyStatus | null;
  disabled?: boolean;
  helperText?: string;
};

export function DailyStatusCard({
  initialStatus,
  disabled = false,
  helperText,
}: DailyStatusCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedStatus, setSelectedStatus] = useState<DailyStatus | null>(initialStatus);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setSelectedStatus(initialStatus);
  }, [initialStatus]);

  const handleSelect = (status: DailyStatus) => {
    if (disabled || isPending) return;

    const previousStatus = selectedStatus;
    setSelectedStatus(status);
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("status", status);
        await saveDailyStatus(formData);
        router.refresh();
      } catch (error) {
        setSelectedStatus(previousStatus);
        setErrorMessage(
          error instanceof Error ? error.message : "Could not save daily status."
        );
      }
    });
  };

  return (
    <div className="mt-5 space-y-4">
      <div className="flex flex-wrap gap-3">
        {DAILY_STATUS_VALUES.map((status) => {
          const isSelected = selectedStatus === status;

          return (
            <Button
              key={status}
              type="button"
              variant={isSelected ? "primary" : "secondary"}
              disabled={disabled || isPending}
              aria-pressed={isSelected}
              onClick={() => handleSelect(status)}
            >
              {DAILY_STATUS_LABELS[status]}
            </Button>
          );
        })}
      </div>

      <p aria-live="polite" className="text-sm text-monastic-2">
        {errorMessage
          ? errorMessage
          : isPending
            ? "Saving..."
            : helperText ?? " "}
      </p>
    </div>
  );
}
