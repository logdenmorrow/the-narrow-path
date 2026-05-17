import Link from "next/link";
import { redirect } from "next/navigation";
import { Download, LifeBuoy } from "lucide-react";
import { PageFrame, SectionHeader, SurfaceCard, SurfaceInset } from "@/components/monastic-ui";
import { DailyReminderSettings } from "@/components/daily-reminder-settings";
import { PushNotificationControl } from "@/components/push-notification-control";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

type ReminderSlotRow = {
  reminder_type: "morning_scripture" | "night_prayer";
  enabled: boolean;
  local_time: string | null;
  timezone: string | null;
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  const { data: reminderSlots } = await supabase
    .from("notification_reminder_slots")
    .select("reminder_type, enabled, local_time, timezone")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true })
    .returns<ReminderSlotRow[]>();

  return (
    <main className="monastic-page">
      <PageFrame className="max-w-4xl space-y-6">
        <SurfaceCard>
          <SectionHeader
            kicker="Account"
            title="Settings"
            description="Manage notifications, reminders, support, and install options."
          />
          <p className="mt-5 break-all text-sm text-monastic-1 sm:break-normal">
            Signed in as {user.email}
          </p>
        </SurfaceCard>

        <SurfaceCard id="notifications" className="scroll-mt-24">
          <SectionHeader
            kicker="Notifications"
            title="Device notifications"
            description="Enable or disable notifications for this browser or Home Screen app."
          />
          <div className="mt-4 min-w-0 max-w-full">
            <PushNotificationControl />
          </div>
        </SurfaceCard>

        <SurfaceCard id="reminders" className="scroll-mt-24">
          <SectionHeader
            kicker="Reminders"
            title="Reminders"
            description="Choose the preset reminder times for this account. Reminders send to enabled devices for this account."
          />
          <div className="mt-4 min-w-0 max-w-full">
            <DailyReminderSettings initialSlots={reminderSlots ?? []} />
          </div>
        </SurfaceCard>

        <div className="grid min-w-0 max-w-full gap-4 sm:grid-cols-2">
          <SurfaceInset>
            <div className="section-kicker">Support</div>
            <h2 className="mt-2 text-xl font-semibold text-monastic-0">
              Need help?
            </h2>
            <p className="mt-2 text-sm leading-6 text-monastic-1">
              Send a bug report or describe anything confusing.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4 w-full sm:w-auto">
              <Link href="/support">
                <LifeBuoy aria-hidden="true" />
                Support
              </Link>
            </Button>
          </SurfaceInset>

          <SurfaceInset>
            <div className="section-kicker">Install App</div>
            <h2 className="mt-2 text-xl font-semibold text-monastic-0">
              Home Screen app
            </h2>
            <p className="mt-2 text-sm leading-6 text-monastic-1">
              Open install guidance for iPhone, iPad, and Android.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4 w-full sm:w-auto">
              <Link href="/install">
                <Download aria-hidden="true" />
                Install
              </Link>
            </Button>
          </SurfaceInset>
        </div>
      </PageFrame>
    </main>
  );
}
