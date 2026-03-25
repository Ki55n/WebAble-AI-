import Image from "next/image";
import Link from "next/link";

const heroStats = [
  { value: "WCAG", label: "Coverage across accessibility standards" },
  { value: "1.2s", label: "Average scan feedback loop" },
  { value: "98%", label: "Signal quality for issue detection" },
];

const heroSignals = [
  "Keyboard traps detected",
  "Contrast regressions mapped",
  "ARIA misuse highlighted",
];

export default function Home() {

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,#f4fff9_0%,#ebfaf4_28%,#f8fffc_58%,#ffffff_100%)] text-gray-900">
      <header className="fixed top-0 z-50 w-full border-b border-emerald-100/80 bg-white/70 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-[0_10px_30px_rgba(16,185,129,0.14)] ring-1 ring-emerald-100">
              <Image
                src="/WebAble-logo2.png"
                width={38}
                height={38}
                alt="WebAble AI"
              />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight text-emerald-950">
                WebAble AI
              </p>
              <p className="max-w-[20rem] text-[11px] leading-4 text-emerald-800/80 sm:max-w-md sm:text-xs">
                Your 24/7 Autonomous AI-Powered Accessibility Auditor Powered by TinyFish
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:w-auto md:justify-end md:gap-4">
            <span className="text-sm font-medium text-gray-600">
              Scan. Verify. Ship accessibly.
            </span>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/seo"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-teal-200 bg-teal-50 px-5 py-2.5 text-sm font-semibold text-teal-800 transition hover:-translate-y-0.5 hover:bg-teal-100"
              >
                Open SEO workspace
              </Link>
              <Link
                href="/vendor-audit"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-emerald-200 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-800 transition hover:-translate-y-0.5 hover:bg-emerald-50"
              >
                Vendor Audit
              </Link>
              <Link
                href="/audit"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(6,95,70,0.25)] transition hover:-translate-y-0.5 hover:bg-emerald-900"
              >
                Start Scan
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate px-4 pb-18 pt-44 sm:px-6 sm:pt-40 md:pb-24 md:pt-36">
          <div className="hero-grid pointer-events-none absolute inset-0 opacity-40"></div>
          <div className="hero-spotlight absolute left-1/2 top-24 h-136 w-136 -translate-x-1/2 rounded-full bg-emerald-300/20 blur-3xl"></div>
          <div className="hero-spotlight absolute right-[8%] top-28 h-96 w-96 rounded-full bg-teal-300/20 blur-3xl"></div>

          <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="max-w-3xl">
              <div className="hero-reveal inline-flex items-center gap-3 rounded-full border border-emerald-200/80 bg-white/80 px-4 py-2 shadow-[0_10px_30px_rgba(16,185,129,0.08)] backdrop-blur">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.75)]"></span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-emerald-800">
                  Real-Time Accessibility Intelligence
                </span>
              </div>

              <h1 className="hero-reveal-delay hero-title mt-8 text-balance font-serif text-4xl leading-[0.95] tracking-tight text-emerald-950 sm:text-6xl lg:text-7xl xl:text-[5.4rem]">
                <span className="hero-title-line hero-title-primary block">
                  Websites that
                </span>
                <span className="hero-title-line mt-3 block font-sans text-emerald-900">
                  feel open to
                </span>
                <span className="hero-title-accent hero-title-line mt-4 block font-sans text-[0.9em] leading-[0.95] text-emerald-700 sm:whitespace-nowrap">
                  every human being.
                </span>
              </h1>

              <p className="hero-reveal-delay-2 mt-8 max-w-2xl text-lg leading-8 text-gray-600 md:text-xl">
                WebAble AI scans live experiences, surfaces accessibility risk,
                and transforms complex WCAG failures into confident,
                developer-ready action.
              </p>

              <div className="hero-reveal-delay-3 mt-10 flex flex-col gap-4 xl:flex-row xl:items-center">
                <Link
                  href="/audit"
                  className="inline-flex min-h-16 w-full shrink-0 items-center justify-center rounded-full bg-emerald-800 px-8 py-4 text-center text-lg font-semibold text-white shadow-[0_18px_38px_rgba(6,95,70,0.24)] transition hover:-translate-y-0.5 hover:bg-emerald-900 sm:w-auto sm:whitespace-nowrap"
                >
                  Open Audit Workspace
                </Link>
                <Link
                  href="/seo"
                  className="inline-flex min-h-16 max-w-xl items-center gap-3 rounded-full border border-emerald-100 bg-white/85 px-5 py-4 text-sm text-gray-600 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white"
                >
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                    SEO
                  </span>
                  <span className="leading-6">
                    Audit metadata, social tags, and search indexing signals
                  </span>
                </Link>
              </div>

              <div className="hero-reveal-delay-3 mt-10 grid gap-4 sm:grid-cols-3">
                {heroStats.map((item) => (
                  <div
                    key={item.value}
                    className="rounded-2xl border border-white/80 bg-white/75 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur"
                  >
                    <p className="text-2xl font-bold tracking-tight text-emerald-900">
                      {item.value}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative lg:pl-6">
              <div className="hero-orbit absolute right-8 top-8 hidden rounded-full border border-emerald-200/80 bg-white/80 px-4 py-2 shadow-[0_16px_34px_rgba(16,185,129,0.12)] backdrop-blur md:flex md:items-center md:gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                  Scan Active
                </span>
              </div>

              <div className="hero-card relative overflow-hidden rounded-4xl border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.9),rgba(237,253,245,0.88))] p-6 shadow-[0_28px_90px_rgba(6,95,70,0.16)] backdrop-blur-2xl sm:p-8">
                <div className="absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-emerald-300 to-transparent"></div>
                <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-300/15 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 h-36 w-36 rounded-full bg-teal-300/15 blur-3xl"></div>

                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700/80">
                      Live Accessibility Engine
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-emerald-950 sm:text-3xl">
                      See barriers before users do
                    </h2>
                  </div>
                  <div className="rounded-2xl border border-emerald-200 bg-white/80 px-4 py-3 text-left shadow-[0_10px_24px_rgba(16,185,129,0.08)] sm:text-right">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                      Status
                    </p>
                    <p className="mt-1 text-sm font-semibold text-emerald-800">
                      Monitoring live
                    </p>
                  </div>
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
                  <div className="relative flex items-center justify-center rounded-[1.75rem] border border-emerald-100 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.12),rgba(255,255,255,0)_68%)] p-8">
                    <div className="hero-radar absolute h-48 w-48 rounded-full border border-emerald-300/40"></div>
                    <div className="hero-radar-delay absolute h-36 w-36 rounded-full border border-emerald-300/50"></div>
                    <div className="hero-radar-delay-2 absolute h-24 w-24 rounded-full border border-emerald-400/60"></div>
                    <div className="hero-sweep absolute h-48 w-48 rounded-full"></div>
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 shadow-[0_0_30px_rgba(16,185,129,0.45)]">
                      <div className="h-5 w-5 rounded-full bg-white"></div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="hero-float-card rounded-2xl border border-white/70 bg-white/80 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-emerald-900">
                            Contrast issue on primary CTA
                          </p>
                          <p className="mt-1 text-sm text-gray-600">
                            Detected before release with actionable fix guidance.
                          </p>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                          Major
                        </span>
                      </div>
                    </div>

                    <div className="hero-float-card-delay rounded-2xl border border-white/70 bg-white/80 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">
                        Audit Signal
                      </p>
                      <div className="mt-3 space-y-3">
                        {heroSignals.map((signal) => (
                          <div key={signal} className="flex items-center gap-3">
                            <span className="h-2.5 w-2.5 rounded-full bg-teal-500"></span>
                            <span className="text-sm text-gray-700">{signal}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="hero-float-card rounded-2xl border border-emerald-100 bg-linear-to-r from-emerald-900 to-teal-800 p-5 text-white shadow-[0_18px_40px_rgba(6,95,70,0.22)]">
                      <p className="text-xs uppercase tracking-[0.22em] text-emerald-200">
                        Ready for Teams
                      </p>
                      <p className="mt-3 text-lg font-semibold leading-7">
                        Turn findings into developer tickets, remediation tasks,
                        and stakeholder-ready proof in one pass.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-white/80 bg-white/80 p-8 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Auto-Remediation
              </p>
              <p className="mt-4 text-2xl font-semibold tracking-tight text-emerald-950">
                Fix what matters first.
              </p>
              <p className="mt-3 text-gray-600">
                Prioritized issues with concrete implementation guidance for real products.
              </p>
            </div>

            <div className="rounded-3xl border border-white/80 bg-white/80 p-8 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Continuous Scanning
              </p>
              <p className="mt-4 text-2xl font-semibold tracking-tight text-emerald-950">
                Catch regressions while building.
              </p>
              <p className="mt-3 text-gray-600">
                Monitor accessible experiences across live pages, flows, and critical UI states.
              </p>
            </div>

            <div className="rounded-3xl border border-white/80 bg-white/80 p-8 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Team Visibility
              </p>
              <p className="mt-4 text-2xl font-semibold tracking-tight text-emerald-950">
                Make accessibility visible.
              </p>
              <p className="mt-3 text-gray-600">
                Share screenshots, logs, and issue summaries with engineers, PMs, and QA in seconds.
              </p>
            </div>
          </div>
        </section>


      </main>

      <footer className="mt-16 bg-emerald-950 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-3">
          <div>
            <h4 className="mb-4 text-lg font-semibold">WebAble AI</h4>
          </div>

          <div>
            <p className="mb-2 font-semibold">Product</p>
            <p className="text-emerald-200">Features</p>
            <p className="text-emerald-200">Vendor Audit</p>
            <p className="text-emerald-200">API</p>
          </div>

          <div>
            <p className="mb-2 font-semibold">Legal</p>
            <p className="text-emerald-200">Accessibility</p>
            <p className="text-emerald-200">Privacy</p>
            <p className="text-emerald-200">Terms</p>
          </div>
        </div>

        <div className="pb-6 text-center text-emerald-300">
          Copyright 2026 WebAble AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
