"use client";

import { useEffect, useRef, useState } from "react";

interface Framework {
  id: string;
  name: string;
  description: string;
}

interface AutomationInputCardProps {
  urls: string;
  setUrls: (urls: string) => void;
  selectedFramework: string;
  setSelectedFramework: (framework: string) => void;
  frameworks: Framework[];
  onSubmit: (e: React.FormEvent) => void;
  buildSitemapFirst: boolean;
  setBuildSitemapFirst: (value: boolean) => void;
  findSiteOwners: boolean;
  setFindSiteOwners: (value: boolean) => void;
  isSubmitting?: boolean;
}

export default function AutomationInputCard({
  urls,
  setUrls,
  selectedFramework,
  setSelectedFramework,
  frameworks,
  onSubmit,
  buildSitemapFirst,
  setBuildSitemapFirst,
  findSiteOwners,
  setFindSiteOwners,
  isSubmitting = false,
}: AutomationInputCardProps) {
  const [isFrameworkMenuOpen, setIsFrameworkMenuOpen] = useState(false);
  const [isSitemapMenuOpen, setIsSitemapMenuOpen] = useState(false);
  const frameworkMenuRef = useRef<HTMLDivElement>(null);
  const sitemapMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        frameworkMenuRef.current &&
        !frameworkMenuRef.current.contains(event.target as Node)
      ) {
        setIsFrameworkMenuOpen(false);
      }

      if (
        sitemapMenuRef.current &&
        !sitemapMenuRef.current.contains(event.target as Node)
      ) {
        setIsSitemapMenuOpen(false);
      }
    };

    if (isFrameworkMenuOpen || isSitemapMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFrameworkMenuOpen, isSitemapMenuOpen]);

  return (
    <div className="group relative overflow-visible rounded-3xl border border-emerald-100 bg-white p-4 shadow-lg transition-all hover:border-emerald-300 hover:shadow-2xl sm:p-8">
      <div className="pointer-events-none absolute inset-0 rounded-3xl bg-linear-to-br from-emerald-50/60 via-transparent to-teal-50/60"></div>

      <h2 className="relative z-10 mb-8 flex items-center gap-3 text-xl font-bold text-gray-900 sm:text-2xl">
        <span className="h-3 w-3 animate-pulse rounded-full bg-linear-to-r from-emerald-500 to-teal-500 shadow-md"></span>
        <span className="bg-linear-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
          Audit your site now
        </span>
      </h2>

      <form onSubmit={onSubmit} className="relative z-10 space-y-6">
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label
              htmlFor="urls"
              className="block flex-1 text-xs font-semibold uppercase tracking-widest text-gray-600"
            >
              Target URL(s)
            </label>

            <div className="relative" ref={frameworkMenuRef}>
              <button
                type="button"
                onClick={() => setIsFrameworkMenuOpen(!isFrameworkMenuOpen)}
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-700 transition-all hover:border-emerald-400 hover:bg-white hover:shadow-md focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                title="Select Audit Framework"
              >
                <span className="hidden text-xs font-semibold uppercase tracking-wider text-gray-600 md:inline">
                  Framework:
                </span>
                <span className="text-xs font-medium text-gray-900">
                  {selectedFramework}
                </span>
                <svg
                  className={`h-4 w-4 text-gray-600 transition-transform ${isFrameworkMenuOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isFrameworkMenuOpen && (
                <div className="absolute left-0 right-0 top-full z-50 mt-3 w-full min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl sm:left-auto sm:right-0 sm:w-80">
                  <div className="max-h-64 overflow-auto py-2">
                    {frameworks.map((framework) => (
                      <button
                        key={framework.id}
                        type="button"
                        onClick={() => {
                          setSelectedFramework(framework.id);
                          setIsFrameworkMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors hover:bg-emerald-50 ${selectedFramework === framework.id ? "border-l-2 border-emerald-600 bg-emerald-50 text-emerald-700" : "text-gray-900"}`}
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold">{framework.id}</span>
                          <span className="mt-0.5 text-xs text-gray-500">
                            {framework.description}
                          </span>
                        </div>
                        {selectedFramework === framework.id && (
                          <svg
                            className="h-4 w-4 text-emerald-600"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="relative" ref={sitemapMenuRef}>
            <div className="relative flex items-center">
              <button
                type="button"
                onClick={() => setIsSitemapMenuOpen(!isSitemapMenuOpen)}
                className="absolute left-4 z-10 p-2 text-gray-400 transition-colors hover:text-gray-600"
                title="Build sitemap"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>

              <input
                id="urls"
                type="text"
                value={urls}
                onChange={(event) => setUrls(event.target.value)}
                placeholder="https://example.com, https://another.com"
                required
                className={`w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3.5 text-gray-900 placeholder-gray-400 transition-all focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:shadow-md ${buildSitemapFirst || findSiteOwners ? "pl-12 pr-4 sm:pr-32" : "pl-12 pr-4"}`}
              />

              {(buildSitemapFirst || findSiteOwners) && (
                <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-10 hidden items-center justify-end gap-2 sm:flex">
                  {buildSitemapFirst && (
                    <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5">
                      <button
                        type="button"
                        onClick={() => setBuildSitemapFirst(false)}
                        className="rounded-full bg-emerald-100 p-0.5 text-emerald-600 transition-colors hover:bg-emerald-200"
                        title="Remove build sitemap"
                      >
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                      <span className="text-sm font-medium text-emerald-700">
                        Build sitemap
                      </span>
                    </div>
                  )}
                  {findSiteOwners && (
                    <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-teal-300 bg-teal-50 px-3 py-1.5">
                      <button
                        type="button"
                        onClick={() => setFindSiteOwners(false)}
                        className="rounded-full bg-teal-100 p-0.5 text-teal-600 transition-colors hover:bg-teal-200"
                        title="Remove find site owners"
                      >
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                      <span className="text-sm font-medium text-teal-700">
                        Find owners
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {isSitemapMenuOpen && (
              <div className="absolute left-0 top-full z-50 mt-3 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                <div className="space-y-4 p-5">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="build-sitemap-dropdown"
                      checked={buildSitemapFirst}
                      onChange={(event) => {
                        setBuildSitemapFirst(event.target.checked);
                        if (event.target.checked) {
                          setTimeout(() => setIsSitemapMenuOpen(false), 200);
                        }
                      }}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 accent-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="build-sitemap-dropdown"
                        className="block cursor-pointer text-sm font-semibold text-gray-900"
                      >
                        Build sitemap first
                      </label>
                      <p className="mt-1 text-xs text-gray-600">
                        Automatically discover all public pages before auditing.{" "}
                        <span className="font-semibold text-emerald-700">
                          Adds 2-3 minutes to processing time.
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="find-site-owners-dropdown"
                        checked={findSiteOwners}
                        onChange={(event) => {
                          setFindSiteOwners(event.target.checked);
                          if (event.target.checked) {
                            setTimeout(() => setIsSitemapMenuOpen(false), 200);
                          }
                        }}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-teal-600 accent-teal-600 focus:ring-teal-500"
                      />
                      <div className="flex-1">
                        <label
                          htmlFor="find-site-owners-dropdown"
                          className="block cursor-pointer text-sm font-semibold text-gray-900"
                        >
                          Find site owners
                        </label>
                        <p className="mt-1 text-xs text-gray-600">
                          Research and find contact information for accessibility owners.{" "}
                          <span className="font-semibold text-teal-700">
                            Runs in parallel with audit.
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {(buildSitemapFirst || findSiteOwners) && (
            <div className="flex flex-wrap gap-2 sm:hidden">
              {buildSitemapFirst && (
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5">
                  <button
                    type="button"
                    onClick={() => setBuildSitemapFirst(false)}
                    className="rounded-full bg-emerald-100 p-0.5 text-emerald-600 transition-colors hover:bg-emerald-200"
                    title="Remove build sitemap"
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                  <span className="text-sm font-medium text-emerald-700">
                    Build sitemap
                  </span>
                </div>
              )}

              {findSiteOwners && (
                <div className="inline-flex items-center gap-2 rounded-full border border-teal-300 bg-teal-50 px-3 py-1.5">
                  <button
                    type="button"
                    onClick={() => setFindSiteOwners(false)}
                    className="rounded-full bg-teal-100 p-0.5 text-teal-600 transition-colors hover:bg-teal-200"
                    title="Remove find site owners"
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                  <span className="text-sm font-medium text-teal-700">
                    Find owners
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!urls.trim() || isSubmitting}
          className="group/btn relative mt-8 flex w-full transform items-center justify-center gap-2 overflow-hidden rounded-xl px-6 py-4 font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="absolute inset-0 rounded-xl bg-linear-to-r from-emerald-700 via-emerald-600 to-teal-600 opacity-100 transition-opacity group-btn-hover:opacity-110"></div>
          <div className="absolute inset-0 -translate-x-full transform rounded-xl bg-linear-to-r from-transparent via-white/30 to-transparent transition-transform duration-500 group-btn-hover:translate-x-full"></div>

          <span className="relative flex items-center gap-2 font-bold text-white">
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white"></span>
                <span>Starting Audit</span>
              </>
            ) : (
              <>
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span>Run Audit</span>
              </>
            )}
          </span>
        </button>
      </form>
    </div>
  );
}
