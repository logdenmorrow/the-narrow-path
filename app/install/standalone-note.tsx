"use client";

import { useEffect, useState } from "react";

export function StandaloneNote() {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standaloneMedia = window.matchMedia("(display-mode: standalone)");
    const navigatorStandalone =
      "standalone" in window.navigator &&
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

    setIsStandalone(standaloneMedia.matches || navigatorStandalone);

    const handleChange = (event: MediaQueryListEvent) => {
      setIsStandalone(event.matches || navigatorStandalone);
    };

    standaloneMedia.addEventListener("change", handleChange);

    return () => standaloneMedia.removeEventListener("change", handleChange);
  }, []);

  if (!isStandalone) {
    return null;
  }

  return (
    <div className="rounded-[1rem] border border-[color:var(--line-soft)] bg-[color:var(--surface-2)] px-4 py-3 text-sm leading-6 text-monastic-1">
      You are already using the Home Screen app.
    </div>
  );
}
