import {
  HeroPanel,
  MetricCard,
  PageFrame,
  SectionHeader,
  SurfaceCard,
} from "@/components/monastic-ui";
import { AppActionBar } from "@/components/page-actions";
import { AdminNotificationTestButton } from "@/app/admin/notifications/test-button";
import { requireAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminNotificationsPage() {
  const user = await requireAdminUser();
  const admin = createAdminClient();

  const { count: activeSubscriptionCount, error: countError } = await admin
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_active", true);

  return (
    <main className="monastic-page">
      <PageFrame className="space-y-6">
        <HeroPanel className="py-7 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <div className="text-[#f7ebd8]">
              <p className="section-kicker text-[#ead6b0]">Admin</p>
              <h1 className="mt-3 text-5xl font-semibold sm:text-6xl">
                Notifications
              </h1>
              <p className="mt-3 text-lg leading-8 text-[#ead8bc]">
                Send a safe test push to your own active devices before broadcast tools exist.
              </p>
            </div>

            <AppActionBar
              className="grid gap-3 border-white/10 bg-[rgba(22,16,13,0.28)] sm:grid-cols-3"
              actions={[
                { href: "/dashboard", label: "Dashboard", variant: "secondary" },
                { href: "/admin/plan", label: "Admin Plan", variant: "secondary" },
                { href: "/admin/support", label: "Support", variant: "outline" },
              ]}
            />
          </div>
        </HeroPanel>

        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard
            label="Your Active Devices"
            value={countError ? "Error" : `${activeSubscriptionCount ?? 0}`}
            detail={
              countError
                ? countError.message
                : "Current active push subscriptions tied to your admin account."
            }
          />
          <MetricCard
            label="Audience"
            value="Admin Test"
            detail="This phase only sends to your own active devices."
          />
        </div>

        <SurfaceCard>
          <SectionHeader
            kicker="Test Send"
            title="Send a test notification."
            description="This creates an admin_test notification record and attempts delivery only to your active device subscriptions."
          />
          <div className="mt-5">
            <AdminNotificationTestButton />
          </div>
        </SurfaceCard>
      </PageFrame>
    </main>
  );
}
