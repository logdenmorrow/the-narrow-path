import { describe, expect, it } from "vitest";
import {
  dismissScheduledChurchEvent,
  getScheduledChurchEventDismissalKey,
  isScheduledChurchEventDismissed,
} from "@/lib/scheduled-church-event-dismissal";

function createStorage() {
  const values = new Map<string, string>();

  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

describe("scheduled Church event dismissal", () => {
  it("keeps an event dismissed after either dialog action records it", () => {
    const storage = createStorage();
    const eventKey = "2026-09-24:fulton-j-sheen";

    expect(isScheduledChurchEventDismissed(storage, eventKey)).toBe(false);

    dismissScheduledChurchEvent(storage, eventKey);

    expect(isScheduledChurchEventDismissed(storage, eventKey)).toBe(true);
    expect(storage.getItem(getScheduledChurchEventDismissalKey(eventKey))).toBe(
      "true"
    );
  });

  it("does not dismiss a different future event", () => {
    const storage = createStorage();

    dismissScheduledChurchEvent(storage, "2026-09-24:fulton-j-sheen");

    expect(
      isScheduledChurchEventDismissed(storage, "2027-09-24:another-event")
    ).toBe(false);
  });
});
