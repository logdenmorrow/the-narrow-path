"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

type AccessibleModalOptions = {
  isOpen: boolean;
  onDismiss: () => void;
  overlayRef: RefObject<HTMLDivElement | null>;
  dialogRef: RefObject<HTMLDivElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
};

export function useAccessibleModal({
  isOpen,
  onDismiss,
  overlayRef,
  dialogRef,
  initialFocusRef,
}: AccessibleModalOptions) {
  useEffect(() => {
    if (!isOpen) return;

    const overlay = overlayRef.current;
    const dialog = dialogRef.current;
    if (!overlay || !dialog) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const parent = overlay.parentElement;
    const siblingStates = parent
      ? Array.from(parent.children)
          .filter(
            (element): element is HTMLElement =>
              element instanceof HTMLElement && element !== overlay
          )
          .map((element) => ({ element, wasInert: element.inert }))
      : [];
    const previousBodyOverflow = document.body.style.overflow;

    for (const { element } of siblingStates) {
      element.inert = true;
    }
    document.body.style.overflow = "hidden";

    const getFocusableElements = () =>
      Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (element) => !element.hidden && element.getAttribute("aria-hidden") !== "true"
      );

    const focusTarget = initialFocusRef?.current ?? getFocusableElements()[0] ?? dialog;
    const focusFrame = window.requestAnimationFrame(() => focusTarget.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onDismiss();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && (activeElement === first || !dialog.contains(activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      for (const { element, wasInert } of siblingStates) {
        element.inert = wasInert;
      }
      if (previouslyFocused?.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [dialogRef, initialFocusRef, isOpen, onDismiss, overlayRef]);
}
