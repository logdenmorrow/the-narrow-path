import { redirect } from "next/navigation";

// TODO: When Lauds and Vespers content exists, resolve the current Hour by
// time of day and redirect accordingly.
export default function HoursPage() {
  redirect("/hours/compline");
}
