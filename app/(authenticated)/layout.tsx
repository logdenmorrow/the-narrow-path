import { Suspense } from "react";
import { redirect } from "next/navigation";
import ProgressStripServer from "@/components/progress-strip-server";
import { ProgressStripSkeleton } from "@/components/progress-strip";
import { createClient } from "@/lib/supabase/server";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <Suspense fallback={<ProgressStripSkeleton />}>
          <ProgressStripServer userId={user.id} />
        </Suspense>
      </div>
      {children}
    </>
  );
}
