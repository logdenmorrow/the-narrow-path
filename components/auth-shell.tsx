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
      <PageFrame className="flex min-h-[calc(100vh-5.5rem)] max-w-lg items-center justify-center px-3 py-6 sm:min-h-[calc(100vh-8rem)] sm:px-6 sm:py-12">
        <div className="w-full min-w-0">
          {children}
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
        "monastic-card max-w-full overflow-hidden border border-monastic",
        className
      )}
    >
      <div className="border-b border-[color:var(--line-soft)] px-4 py-5 sm:px-8 sm:py-8">
        <p className="text-sm font-medium text-[color:var(--surface-strong)]">{eyebrow}</p>
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
