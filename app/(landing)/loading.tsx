export default function LandingLoading() {
  return (
    <main className="min-h-screen text-white">
      <section className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-7xl flex-col justify-center px-5 py-14 sm:px-8 lg:px-10">
        <div className="max-w-4xl">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.24em] text-[#F1A91B]">
            Haul Command
          </p>
          <h1 className="max-w-4xl text-5xl font-black uppercase leading-[0.9] tracking-wide text-[#fffaf0] sm:text-6xl lg:text-7xl">
            Heavy-haul support without the blind call scramble
          </h1>
          <p className="mt-6 max-w-2xl text-base font-semibold leading-7 text-white/78 sm:text-lg">
            Loading directory, route, and market signals. You can still search providers, post a load, or claim a profile while live data refreshes.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#F1A91B] px-5 py-3 text-sm font-black text-black" href="/directory">
              Search Directory
            </a>
            <a className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#F1A91B]/45 bg-black/55 px-5 py-3 text-sm font-black text-white" href="/loads/post">
              Post Load
            </a>
            <a className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/18 bg-black/40 px-5 py-3 text-sm font-black text-white" href="/claim">
              Claim Profile
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
