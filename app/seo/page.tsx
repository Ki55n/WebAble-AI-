import Link from "next/link";
import SeoWorkspace from "../components/SeoWorkspace";

export default function SeoPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,#effffc_0%,#e6fbf6_24%,#f6fffd_58%,#ffffff_100%)] px-4 py-12 text-gray-900 sm:px-6 sm:py-16">
      <div className="pointer-events-none absolute left-[10%] top-28 h-[24rem] w-[24rem] rounded-full bg-teal-200/20 blur-3xl"></div>
      <div className="pointer-events-none absolute right-[8%] top-40 h-[20rem] w-[20rem] rounded-full bg-emerald-200/20 blur-3xl"></div>
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-white"
          >
            <span aria-hidden="true">&lt;</span>
            Back to homepage
          </Link>
          <Link
            href="/audit"
            className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-800 transition hover:bg-teal-100"
          >
            Open accessibility workspace
          </Link>
          <Link
            href="/vendor-audit"
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100"
          >
            Vendor Audit
          </Link>
        </div>

        <div className="mb-10 text-center">
          <span className="rounded-full bg-teal-100 px-4 py-1 text-sm font-medium text-teal-700">
            SEO WORKSPACE
          </span>
          <h1 className="mt-6 pb-2 bg-gradient-to-r from-teal-800 to-emerald-700 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl md:text-5xl">
            Audit core SEO signals in one place
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600 sm:text-lg">
            Review metadata, indexability, social sharing tags, heading
            structure, and basic content signals for any public page.
          </p>
        </div>

        <SeoWorkspace />
      </div>
    </main>
  );
}
