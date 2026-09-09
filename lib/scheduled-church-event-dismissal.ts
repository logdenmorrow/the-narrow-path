const STORAGE_PREFIX = "tnp-scheduled-church-event-dismissed:";

export function getScheduledChurchEventDismissalKey(eventKey: string) {
  return `${STORAGE_PREFIX}${eventKey}`;
}

export function isScheduledChurchEventDismissed(
  storage: Pick<Storage, "getItem">,
  eventKey: string
) {
  return storage.getItem(getScheduledChurchEventDismissalKey(eventKey)) === "true";
}

export function dismissScheduledChurchEvent(
  storage: Pick<Storage, "setItem">,
  eventKey: string
) {
  storage.setItem(getScheduledChurchEventDismissalKey(eventKey), "true");
}
