"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

type TestResult = {
  attempted: number;
  succeeded: number;
  failed: number;
  revoked: number;
  message?: string;
};

export function AdminNotificationTestButton() {
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendTest = async () => {
    setIsSending(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/notifications/test", {
        method: "POST",
        credentials: "same-origin",
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          body && typeof body.error === "string"
            ? body.error
            : "Unable to send test notification."
        );
      }

      setResult(body as TestResult);
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Unable to send test notification."
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button type="button" onClick={sendTest} disabled={isSending}>
        <Send aria-hidden="true" />
        {isSending ? "Sending..." : "Send Test Notification"}
      </Button>

      {result ? (
        <div className="rounded-[1rem] border border-emerald-700/40 bg-emerald-950/20 px-4 py-3 text-sm leading-6 text-emerald-100">
          {result.message ? <p>{result.message}</p> : null}
          <p>
            Attempted {result.attempted}. Succeeded {result.succeeded}. Failed{" "}
            {result.failed}. Revoked {result.revoked}.
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[1rem] border border-red-700/40 bg-red-950/20 px-4 py-3 text-sm leading-6 text-red-100">
          {error}
        </div>
      ) : null}
    </div>
  );
}
