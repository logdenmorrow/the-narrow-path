import MonasticLoading from "@/components/monastic-loading";

export default function Loading() {
  return (
    <MonasticLoading
      label="Reflection"
      title="Loading reflection"
      description="Preparing the prompt and your saved entry for the selected day."
      maxWidthClassName="max-w-4xl"
    />
  );
}
