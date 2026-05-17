import MonasticLoading from "@/components/monastic-loading";

export default function Loading() {
  return (
    <MonasticLoading
      label="Today"
      title="Loading today"
      description="Loading the reading, tasks, and current progress."
      maxWidthClassName="max-w-4xl"
    />
  );
}
