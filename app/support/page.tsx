import { redirect } from "next/navigation";
import { PageFrame, SectionHeader, SurfaceCard } from "@/components/monastic-ui";
import { Button } from "@/components/ui/button";
import { submitSupportRequest } from "@/app/support/actions";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function SupportPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  const resolvedSearchParams = await searchParams;
  const saved = getSearchParam(resolvedSearchParams, "saved") === "1";
  const errorCode = getSearchParam(resolvedSearchParams, "error");

  return (
    <main className="monastic-page">
      <PageFrame className="max-w-4xl space-y-6">
        <SurfaceCard>
          <SectionHeader
            kicker="Support"
            title="Support"
            description="Found a bug or something confusing? Send it here and I&apos;ll take a look."
          />

          {saved ? (
            <div className="mt-5 rounded-[1rem] border border-emerald-700/40 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-100">
              Your report was saved.
            </div>
          ) : null}

          {errorCode ? (
            <div className="mt-5 rounded-[1rem] border border-red-700/40 bg-red-950/20 px-4 py-3 text-sm text-red-100">
              {errorCode === "missing"
                ? "Add a type, title, and description before sending."
                : "Something went wrong saving that report. Try again in a minute."}
            </div>
          ) : null}

          <form action={submitSupportRequest} className="mt-6 grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="issue_type" className="text-sm font-medium text-monastic-1">
                  Type
                </label>
                <select id="issue_type" name="issue_type" required className="monastic-field">
                  <option value="bug">Bug</option>
                  <option value="confusing_behavior">Confusing behavior</option>
                  <option value="account_issue">Account issue</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="grid gap-2">
                <label htmlFor="severity" className="text-sm font-medium text-monastic-1">
                  Severity
                </label>
                <select id="severity" name="severity" defaultValue="medium" className="monastic-field">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium text-monastic-1">
                Title
              </label>
              <input id="title" name="title" type="text" required maxLength={160} className="monastic-field" />
            </div>

            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium text-monastic-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={7}
                maxLength={5000}
                className="monastic-field min-h-44"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="page_url" className="text-sm font-medium text-monastic-1">
                Page URL
              </label>
              <input
                id="page_url"
                name="page_url"
                type="url"
                placeholder="https://..."
                maxLength={500}
                className="monastic-field"
              />
            </div>

            <div>
              <Button type="submit">Send Report</Button>
            </div>
          </form>
        </SurfaceCard>
      </PageFrame>
    </main>
  );
}
