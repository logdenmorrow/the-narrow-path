import MonasticLoading from "@/components/monastic-loading";

export default function Loading() {
  return (
    <MonasticLoading
      label="This Week"
      title="Loading this week"
      description="Loading the week's readings, tasks, and progress."
    />
  );
}
