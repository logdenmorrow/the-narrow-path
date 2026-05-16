"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

type TestResult = {
  targetEmail: string;
  attempted: number;
  succeeded: number;
  failed: number;
  revoked: number;
  message?: string;
};

export function AdminNotificationTestButton({
  defaultTargetEmail,
}: {
  defaultTargetEmail: string;
}) {
  const [targetEmail, setTargetEmail] = useState(defaultTargetEmail);
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
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ targetEmail }),
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
      <div className="grid gap-2">
        <label htmlFor="target-email" className="text-sm font-medium text-monastic-1">
          Target user email
        </label>
        <input
          id="target-email"
          type="email"
          value={targetEmail}
          onChange={(event) => setTargetEmail(event.target.value)}
          className="monastic-field"
          placeholder="user@example.com"
          disabled={isSending}
        />
      </div>

      <Button type="button" onClick={sendTest} disabled={isSending}>
        <Send aria-hidden="true" />
        {isSending ? "Sending..." : "Send Test Notification"}
      </Button>

      {result ? (
        <div className="rounded-[1rem] border border-emerald-700/40 bg-emerald-950/20 px-4 py-3 text-sm leading-6 text-emerald-100">
          {result.message ? <p>{result.message}</p> : null}
          <p>
            Target {result.targetEmail}. Attempted {result.attempted}. Succeeded{" "}
            {result.succeeded}. Failed {result.failed}. Revoked {result.revoked}.
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
