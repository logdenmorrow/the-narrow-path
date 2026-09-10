import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCommunityName, type Track } from "@/lib/track";

type AdminViewTrackSwitcherProps = {
  basePath: string;
  currentTrack: Track;
  params?: Record<string, string | number | null | undefined>;
};

function buildHref(
  basePath: string,
  viewTrack: Track,
  params: AdminViewTrackSwitcherProps["params"] = {}
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  searchParams.set("viewTrack", viewTrack);
  return `${basePath}?${searchParams.toString()}`;
}

export function AdminViewTrackSwitcher({
  basePath,
  currentTrack,
  params,
}: AdminViewTrackSwitcherProps) {
  return (
    <div className="flex flex-col gap-3 rounded-[1.4rem] border border-amber-700/40 bg-amber-950/20 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="section-kicker text-amber-200">Admin Diagnostic View</p>
        <p className="mt-2 text-sm text-monastic-1">
          Viewing as {getCommunityName(currentTrack)}.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant={currentTrack === "brotherhood" ? "primary" : "outline"}>
          <Link href={buildHref(basePath, "brotherhood", params)}>Brotherhood</Link>
        </Button>
        <Button asChild size="sm" variant={currentTrack === "sisterhood" ? "primary" : "outline"}>
          <Link href={buildHref(basePath, "sisterhood", params)}>Sisterhood</Link>
        </Button>
      </div>
    </div>
  );
}
