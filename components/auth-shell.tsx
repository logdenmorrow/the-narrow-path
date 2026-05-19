import * as React from "react";
import Link from "next/link";
import { PageFrame } from "@/components/monastic-ui";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  children: React.ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="monastic-page">
      <PageFrame className="flex min-h-[calc(100vh-5.5rem)] max-w-6xl items-center justify-center px-3 py-5 sm:min-h-[calc(100vh-8rem)] sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="grid w-full min-w-0 items-stretch gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(26rem,32rem)] lg:gap-8">
          <section className="monastic-hero hidden min-h-[36rem] flex-col justify-between p-9 lg:flex xl:p-10">
            <div className="relative z-10 max-w-xl space-y-6 text-[hsl(var(--primary-foreground))]">
              <p className="text-xs uppercase tracking-[0.32em] text-[rgba(255,239,216,0.88)]">
                The Narrow Path
              </p>
              <div className="space-y-5">
                <h1 className="text-4xl font-semibold tracking-tight text-[rgba(249,236,214,0.94)] [text-wrap:balance] xl:text-5xl xl:leading-[1.06]">
                  Prayer, readings, tasks, and accountability.
                </h1>
                <p className="max-w-lg text-base leading-8 text-[rgba(255,239,216,0.88)] xl:text-lg">
                  The Narrow Path keeps the daily work simple: Scripture,
                  prayer, tasks, and community.
                </p>
              </div>
            </div>

            <div className="relative z-10 rounded-[1.75rem] border border-[rgba(230,197,152,0.14)] bg-[rgba(17,13,12,0.52)] p-6 shadow-[0_24px_40px_-28px_rgba(0,0,0,0.9)] backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.24em] text-[rgba(255,239,216,0.72)]">
                Prayer / Sacraments / Accountability
              </p>
              <p className="mt-3 max-w-md text-sm leading-7 text-[rgba(255,239,216,0.9)]">
                Sign in to continue.
              </p>
            </div>
          </section>

          <div className="flex min-w-0 items-center justify-center">
            <div className="w-full min-w-0 max-w-xl">{children}</div>
          </div>
        </div>
      </PageFrame>
    </main>
  );
}

type AuthCardProps = {
  eyebrow?: string;
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export function AuthCard({
  eyebrow = "The Narrow Path",
  title,
  description,
  children,
  footer,
  className,
}: AuthCardProps) {
  return (
    <section
      className={cn(
        "monastic-card max-w-full overflow-hidden rounded-[1.15rem] border border-monastic sm:rounded-[1.75rem]",
        className
      )}
    >
      <div className="border-b border-[color:var(--line-soft)] px-4 py-5 sm:px-8 sm:py-8">
        <p className="section-kicker text-[color:var(--surface-strong)]">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-monastic-0 sm:mt-3 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-monastic-1 sm:mt-3 sm:text-base sm:leading-7">
          {description}
        </p>
      </div>

      <div className="px-4 py-5 sm:px-8 sm:py-7">{children}</div>

      {footer ? (
        <div className="border-t border-[color:var(--line-soft)] bg-[color:var(--surface-2)]/72 px-4 py-4 text-sm text-monastic-1 sm:px-8 sm:py-5">
          {footer}
        </div>
      ) : null}
    </section>
  );
}

type AuthPageLinkProps = React.ComponentPropsWithoutRef<typeof Link>;

export function AuthPageLink({ className, ...props }: AuthPageLinkProps) {
  return (
    <Link
      className={cn(
        "font-semibold text-[color:var(--surface-strong)] underline decoration-[color:var(--line-strong)] underline-offset-4 transition hover:text-[color:var(--text-0)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        className
      )}
      {...props}
    />
  );
}
