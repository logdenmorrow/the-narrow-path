import Link from "next/link";
import { AuthCard, AuthPageLink } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      {params?.error ? (
        <p className="text-sm text-muted-foreground">
          Code error: {params.error}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          An unspecified error occurred.
        </p>
      )}
    </>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  return (
    <AuthCard
      title="Something went wrong"
      description="The auth flow hit an error before it could finish."
      footer={
        <p className="text-center">
          Want to try again? <AuthPageLink href="/auth/login">Return to login</AuthPageLink>
        </p>
      }
    >
      <div className="space-y-5">
        <div className="rounded-[1.35rem] border border-monastic bg-[color:var(--surface-2)]/70 p-5">
          <Suspense>
            <ErrorContent searchParams={searchParams} />
          </Suspense>
        </div>

        <Button asChild variant="secondary" className="w-full">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </AuthCard>
  );
}
