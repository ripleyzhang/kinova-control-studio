export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 sm:px-12">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-current/15 pb-6">
        <p className="text-xs font-bold tracking-[0.22em]">SIX AXIS RUSH</p>
        <span className="rounded-full border border-emerald-600/40 bg-emerald-500/10 px-4 py-2 text-xs font-bold tracking-widest">
          KINEMATIC PREVIEW
        </span>
      </header>
      <section className="flex flex-1 flex-col justify-center py-20">
        <p className="mb-6 text-xs font-bold tracking-[0.2em] opacity-60">LEVEL 1 / SPAWN POINT</p>
        <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight sm:text-7xl">
          Kinova Control Studio
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed opacity-70">
          A browser-based workspace for the Kinova Gen3 Lite.
          The frontend foundation is ready.
        </p>
        <p className="mt-10 text-sm font-medium tracking-wide">No Physics / No Hardware</p>
      </section>
      <footer className="border-t border-current/15 pt-5 text-xs opacity-60">
        V1 · Frontend only · Robot visualization and joint controls are not loaded.
      </footer>
    </main>
  );
}
