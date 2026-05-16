import Link from "next/link";
import { redirect } from "next/navigation";
import { Download, LifeBuoy } from "lucide-react";
import { PageFrame, SectionHeader, SurfaceCard, SurfaceInset } from "@/components/monastic-ui";
import { PushNotificationControl } from "@/components/push-notification-control";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  return (
    <main className="monastic-page">
      <PageFrame className="max-w-4xl space-y-6">
        <SurfaceCard>
          <SectionHeader
            kicker="Account"
            title="Settings"
            description="Manage this device and a few account-adjacent tools for The Narrow Path."
          />
          <p className="mt-5 break-all text-sm text-monastic-1 sm:break-normal">
            Signed in as {user.email}
          </p>
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeader
            kicker="Notifications"
            title="Device notifications"
            description="Enable or disable notifications for this browser or Home Screen app."
          />
          <div className="mt-4">
            <PushNotificationControl />
          </div>
        </SurfaceCard>

        <div className="grid gap-4 sm:grid-cols-2">
          <SurfaceInset>
            <div className="section-kicker">Support</div>
            <h2 className="mt-2 text-xl font-semibold text-monastic-0">
              Need help?
            </h2>
            <p className="mt-2 text-sm leading-6 text-monastic-1">
              Send a bug report or describe anything confusing.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
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
            <Button asChild variant="outline" size="sm" className="mt-4">
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
