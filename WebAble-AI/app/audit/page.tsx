import Link from "next/link";
import AutomationForm from "../components/AutomationForm";

export default function AuditPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,#f4fff9_0%,#ebfaf4_28%,#f8fffc_58%,#ffffff_100%)] px-4 py-12 text-gray-900 sm:px-6 sm:py-16">
      <div className="pointer-events-none absolute left-[10%] top-28 h-[24rem] w-[24rem] rounded-full bg-emerald-200/20 blur-3xl" />
      <div className="pointer-events-none absolute right-[8%] top-40 h-[20rem] w-[20rem] rounded-full bg-teal-200/20 blur-3xl" />

      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-white">
            <span aria-hidden="true">&lt;</span> Back to homepage
          </Link>
          <Link href="/seo" className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-800 transition hover:bg-teal-100">
            Open SEO workspace
          </Link>
          <Link href="/vendor-audit" className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-white">
            Vendor Audit
          </Link>
        </div>

        <div className="mb-10 text-center">
          <span className="rounded-full bg-emerald-100 px-4 py-1 text-sm font-medium text-emerald-700">
            AUDIT WORKSPACE
          </span>
          <h1 className="mt-6 bg-gradient-to-r from-emerald-800 to-teal-700 bg-clip-text pb-2 text-3xl font-bold text-transparent sm:text-4xl md:text-5xl">
            Run and review accessibility audits in one place
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600 sm:text-lg">
            Start a new scan, monitor progress, inspect screenshots, and turn findings into developer-ready tickets from this dedicated workspace.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-500">
            Need metadata and search visibility checks too? Jump into the SEO workspace for title, description, canonical, social tag, and indexing analysis.
          </p>
        </div>

        <div className="rounded-2xl border border-white/60 bg-white/90 p-4 shadow-xl backdrop-blur sm:p-8">
          <AutomationForm mode="workspace" />
        </div>
      </div>
    </main>
  );
}
