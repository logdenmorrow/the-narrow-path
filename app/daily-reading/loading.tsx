import MonasticLoading from "@/components/monastic-loading";

export default function Loading() {
  return (
    <MonasticLoading
      label="Reading"
      title="Loading daily reading"
      description="Preparing the text, notes, and focus for the selected day."
      maxWidthClassName="max-w-5xl"
    />
  );
}
