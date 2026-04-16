import { AuthCard } from "@/components/auth-shell";

export default function AuthLoading() {
  return (
    <AuthCard
      title="Preparing your account"
      description="Loading the next step in the auth flow."
    >
      <div className="space-y-4">
        <div className="monastic-loading-shimmer h-4 w-28 rounded-full" />
        <div className="monastic-loading-shimmer h-12 w-full rounded-2xl" />
        <div className="monastic-loading-shimmer h-4 w-24 rounded-full" />
        <div className="monastic-loading-shimmer h-12 w-full rounded-2xl" />
        <div className="monastic-loading-shimmer h-12 w-full rounded-[1.05rem]" />
      </div>
    </AuthCard>
  );
}
