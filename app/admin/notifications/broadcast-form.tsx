"use client";

import { useState } from "react";
import { RadioTower } from "lucide-react";
import { Button } from "@/components/ui/button";

type BroadcastResult = {
  attempted: number;
  succeeded: number;
  failed: number;
  revoked: number;
  message?: string;
};

export function AdminNotificationBroadcastForm() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetUrl, setTargetUrl] = useState("/app");
  const [confirmed, setConfirmed] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendBroadcast = async () => {
    if (!confirmed) {
      setError("Confirm that this should go to every active opted-in device.");
      return;
    }

    setIsSending(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/notifications/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ title, body, targetUrl }),
      });
      const responseBody = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          responseBody && typeof responseBody.error === "string"
            ? responseBody.error
            : "Unable to send broadcast notification."
        );
      }

      setResult(responseBody as BroadcastResult);
      setConfirmed(false);
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Unable to send broadcast notification."
      );
    } finally {
      setIsSending(false);
    }
  };

  const isSubmitDisabled =
    isSending || !confirmed || !title.trim() || !body.trim();

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-[0.9fr_1.1fr]">
        <div className="grid gap-2">
          <label htmlFor="broadcast-title" className="text-sm font-medium text-monastic-1">
            Title
          </label>
          <input
            id="broadcast-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            className="monastic-field"
            disabled={isSending}
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="broadcast-target-url" className="text-sm font-medium text-monastic-1">
            Target URL
          </label>
          <input
            id="broadcast-target-url"
            value={targetUrl}
            onChange={(event) => setTargetUrl(event.target.value)}
            maxLength={2048}
            className="monastic-field"
            disabled={isSending}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label htmlFor="broadcast-body" className="text-sm font-medium text-monastic-1">
          Body
        </label>
        <textarea
          id="broadcast-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={500}
          rows={4}
          className="monastic-field min-h-28"
          disabled={isSending}
        />
      </div>

      <label className="monastic-subcard flex cursor-pointer items-start gap-3 p-4 text-sm leading-6 text-monastic-1">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="mt-1 h-4 w-4 accent-[color:var(--surface-strong)]"
          disabled={isSending}
        />
        <span>
          I understand this sends to all opted-in active device subscriptions.
          This is not limited to one user.
        </span>
      </label>

      <Button type="button" onClick={sendBroadcast} disabled={isSubmitDisabled}>
        <RadioTower aria-hidden="true" />
        {isSending ? "Sending..." : "Send Broadcast"}
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
