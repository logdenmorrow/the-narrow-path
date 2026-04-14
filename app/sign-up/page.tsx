export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
        <p className="mb-3 text-sm uppercase tracking-[0.3em] text-zinc-400">
          The Narrow Path
        </p>

        <h1 className="mb-4 text-4xl font-bold tracking-tight">Create Account</h1>

        <p className="mb-8 max-w-lg text-zinc-300">
          Begin the journey. Create your account and prepare to walk the narrow
          path with discipline and brotherhood.
        </p>

        <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-left shadow-xl">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Your name"
                className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white outline-none placeholder:text-zinc-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white outline-none placeholder:text-zinc-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Password
              </label>
              <input
                type="password"
                placeholder="Create a password"
                className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white outline-none placeholder:text-zinc-500"
              />
            </div>

            <button className="w-full rounded-lg bg-white px-4 py-3 font-semibold text-black transition hover:bg-zinc-200">
              Create Account
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}