"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  clearAuthLog,
  copyAuthLogToClipboard,
  downloadAuthLog,
  fetchAuthServerSnapshot,
  getAuthLog,
  isAuthDebugEnabled,
} from "@/lib/auth-log";

export function AuthDebugPanel() {
  const searchParams = useSearchParams();
  const [entryCount, setEntryCount] = useState(0);
  const [isBusy, setIsBusy] = useState(false);

  const visible = isAuthDebugEnabled() || searchParams.get("debugAuth") === "1";

  useEffect(() => {
    if (!visible) {
      return;
    }

    setEntryCount(getAuthLog().length);
  }, [visible]);

  if (!visible) {
    return null;
  }

  const refreshCount = () => {
    setEntryCount(getAuthLog().length);
  };

  const runAction = async (action: () => Promise<unknown> | unknown) => {
    setIsBusy(true);

    try {
      await action();
    } finally {
      refreshCount();
      setIsBusy(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-amber-500/30 bg-stone-950/95 p-4 text-sm text-stone-100 shadow-[0_18px_45px_-20px_rgba(0,0,0,0.8)] backdrop-blur">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-amber-300">Auth Debug</p>
          <p className="text-xs text-stone-300">{entryCount} persisted entries</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" className="text-xs" disabled={isBusy} onClick={() => runAction(downloadAuthLog)}>
          Download Auth Log
        </Button>
        <Button type="button" variant="outline" className="text-xs" disabled={isBusy} onClick={() => runAction(copyAuthLogToClipboard)}>
          Copy Auth Log
        </Button>
        <Button
          type="button"
          variant="outline"
          className="text-xs"
          disabled={isBusy}
          onClick={() =>
            runAction(async () => {
              clearAuthLog();
            })
          }
        >
          Clear Auth Log
        </Button>
        <Button
          type="button"
          variant="outline"
          className="text-xs"
          disabled={isBusy}
          onClick={() => runAction(() => fetchAuthServerSnapshot("debug_panel"))}
        >
          Run Server Snapshot
        </Button>
      </div>
    </div>
  );
}
