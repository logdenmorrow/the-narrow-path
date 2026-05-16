import {
  HeroPanel,
  MetricCard,
  PageFrame,
  SectionHeader,
  SurfaceCard,
} from "@/components/monastic-ui";
import { AppActionBar } from "@/components/page-actions";
import { AdminNotificationBroadcastForm } from "@/app/admin/notifications/broadcast-form";
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
  const { count: allActiveSubscriptionCount, error: allCountError } = await admin
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
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
                Send a safe test push to a selected user before broadcast tools exist.
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

        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="Your Active Devices"
            value={countError ? "Error" : `${activeSubscriptionCount ?? 0}`}
            detail={
              countError
                ? countError.message
                : "Current active push subscriptions tied to your admin account. The test form can target another user by email."
            }
          />
          <MetricCard
            label="All Active Devices"
            value={allCountError ? "Error" : `${allActiveSubscriptionCount ?? 0}`}
            detail={
              allCountError
                ? allCountError.message
                : "Every opted-in active device subscription."
            }
          />
          <MetricCard
            label="Audience"
            value="Test + Broadcast"
            detail="Test by email, or broadcast to all opted-in devices."
          />
        </div>

        <SurfaceCard>
          <SectionHeader
            kicker="Test Send"
            title="Send a test notification."
            description="This creates an admin_test notification record and attempts delivery only to active subscriptions for the email below."
          />
          <div className="mt-5">
            <AdminNotificationTestButton defaultTargetEmail={user.email ?? ""} />
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeader
            kicker="Broadcast"
            title="Send to all opted-in devices."
            description="This creates an all_active notification record and attempts delivery to every active push subscription. Keep the message generic."
          />
          <div className="mt-5">
            <AdminNotificationBroadcastForm />
          </div>
        </SurfaceCard>
      </PageFrame>
    </main>
  );
}
