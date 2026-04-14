export default function LoginPage() {
  return (
    <main className="min-h-screen bg-app text-fg">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
        <p className="mb-3 text-sm uppercase tracking-[0.3em] text-muted">
          The Narrow Path
        </p>

        <h1 className="mb-4 text-4xl font-bold tracking-tight">Sign In</h1>

        <p className="mb-8 max-w-lg text-muted-foreground">
          Return to the path. Sign in to continue your discipline, prayer, and
          accountability with your brothers.
        </p>

        <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 text-left shadow-xl">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-lg border border-border bg-app px-4 py-3 text-fg outline-none placeholder:text-muted"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-lg border border-border bg-app px-4 py-3 text-fg outline-none placeholder:text-muted"
              />
            </div>

            <button className="w-full rounded-lg bg-accent px-4 py-3 font-semibold text-accent-foreground transition hover:bg-accent-hover">
              Sign In
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}