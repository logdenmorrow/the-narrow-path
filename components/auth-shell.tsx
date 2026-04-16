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
      <PageFrame className="flex min-h-[calc(100vh-7rem)] max-w-6xl items-center justify-center py-8 sm:min-h-[calc(100vh-8rem)] sm:py-12 lg:py-16">
        <div className="grid w-full items-stretch gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(24rem,32rem)]">
          <section className="monastic-hero hidden min-h-[34rem] flex-col justify-between p-8 lg:flex">
            <div className="space-y-5 text-[hsl(var(--primary-foreground))]">
              <p className="text-xs uppercase tracking-[0.32em] text-[rgba(255,239,216,0.74)]">
                The Narrow Path
              </p>
              <div className="space-y-4">
                <h1 className="max-w-xl text-4xl font-semibold tracking-tight xl:text-5xl">
                  Return to the rule of prayer, discipline, and brotherhood.
                </h1>
                <p className="max-w-lg text-base leading-8 text-[rgba(255,239,216,0.82)] xl:text-lg">
                  The same monastic rhythm carries through the whole app. Your
                  account pages should feel like the same cloister, not a
                  separate product.
                </p>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-white/10 bg-black/10 p-6 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-[rgba(255,239,216,0.62)]">
                Prayer • Discipline • Brotherhood
              </p>
              <p className="mt-3 text-sm leading-7 text-[rgba(255,239,216,0.85)]">
                Enter quietly, keep the flow simple, and continue where you
                left off.
              </p>
            </div>
          </section>

          <div className="flex items-center justify-center">
            <div className="w-full max-w-xl">{children}</div>
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
        "monastic-card overflow-hidden rounded-[1.75rem] border border-monastic",
        className
      )}
    >
      <div className="border-b border-monastic px-6 py-6 sm:px-8 sm:py-7">
        <p className="section-kicker">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-monastic-0 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-monastic-1">
          {description}
        </p>
      </div>

      <div className="px-6 py-6 sm:px-8 sm:py-7">{children}</div>

      {footer ? (
        <div className="border-t border-monastic bg-[color:var(--surface-2)]/55 px-6 py-5 text-sm text-monastic-1 sm:px-8">
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
        "font-semibold text-[color:var(--surface-strong)] underline decoration-[color:var(--line-strong)] underline-offset-4 transition hover:text-[color:var(--surface-strong-2)]",
        className
      )}
      {...props}
    />
  );
}
