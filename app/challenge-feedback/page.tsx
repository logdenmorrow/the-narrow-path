import { permanentRedirect } from "next/navigation";
import { SEASON_FEATURES } from "@/lib/season-features";

export default function ChallengeFeedbackPage() {
  permanentRedirect(SEASON_FEATURES.challengeFeedback.replacementPath);
}
