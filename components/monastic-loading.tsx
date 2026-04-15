import {
  PageFrame,
  SectionHeader,
  SurfaceCard,
  SurfaceInset,
} from "@/components/monastic-ui";

type MonasticLoadingProps = {
  label: string;
  title: string;
  description: string;
  maxWidthClassName?: string;
};

export default function MonasticLoading({
  label,
  title,
  description,
  maxWidthClassName = "max-w-6xl",
}: MonasticLoadingProps) {
  return (
    <main className="monastic-page">
      <PageFrame className={`${maxWidthClassName} space-y-6`}>
        <SurfaceCard>
          <SectionHeader kicker={label} title={title} description={description} />

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <SurfaceInset className="space-y-3">
              <div className="monastic-loading-shimmer h-3 w-20 rounded-full" />
              <div className="monastic-loading-shimmer h-10 w-28 rounded-2xl" />
              <div className="monastic-loading-shimmer h-4 w-40 rounded-full" />
            </SurfaceInset>
            <SurfaceInset className="space-y-3">
              <div className="monastic-loading-shimmer h-3 w-24 rounded-full" />
              <div className="monastic-loading-shimmer h-10 w-32 rounded-2xl" />
              <div className="monastic-loading-shimmer h-4 w-36 rounded-full" />
            </SurfaceInset>
            <SurfaceInset className="space-y-3">
              <div className="monastic-loading-shimmer h-3 w-16 rounded-full" />
              <div className="monastic-loading-shimmer h-10 w-24 rounded-2xl" />
              <div className="monastic-loading-shimmer h-4 w-44 rounded-full" />
            </SurfaceInset>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="space-y-4">
            <div className="monastic-loading-shimmer h-4 w-32 rounded-full" />
            <div className="monastic-loading-shimmer h-12 w-full rounded-[1rem]" />
            <div className="monastic-loading-shimmer h-12 w-full rounded-[1rem]" />
            <div className="monastic-loading-shimmer h-40 w-full rounded-[1.25rem]" />
          </div>
        </SurfaceCard>
      </PageFrame>
    </main>
  );
}
