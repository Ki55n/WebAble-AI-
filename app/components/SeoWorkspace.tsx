"use client";

import { FormEvent, useState } from "react";

type Severity = "good" | "warning" | "issue";

interface SeoCheck {
  label: string;
  value: string;
  status: Severity;
  detail: string;
}

interface SeoResult {
  score: number;
  normalizedUrl: string;
  checks: SeoCheck[];
  summary: {
    good: number;
    warning: number;
    issue: number;
  };
}

const normalizeUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const getSeverityClasses = (status: Severity) => {
  if (status === "good") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-rose-200 bg-rose-50 text-rose-800";
};

export default function SeoWorkspace() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SeoResult | null>(null);

  const resultSummary = result?.summary ?? {
    good: result?.checks.filter((check) => check.status === "good").length ?? 0,
    warning:
      result?.checks.filter((check) => check.status === "warning").length ?? 0,
    issue: result?.checks.filter((check) => check.status === "issue").length ?? 0,
  };

  const analyzeSeo = async (event: FormEvent) => {
    event.preventDefault();

    const normalizedUrl = normalizeUrl(url);
    if (!normalizedUrl) {
      setError("Enter a valid URL to analyze.");
      setResult(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setUrl("");

    try {
      const response = await fetch("/api/fetch-html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizedUrl }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.details || "Failed to fetch page HTML.");
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(data.html, "text/html");
      const title = doc.querySelector("title")?.textContent?.trim() ?? "";
      const description =
        doc
          .querySelector('meta[name="description"]')
          ?.getAttribute("content")
          ?.trim() ?? "";
      const canonical =
        doc
          .querySelector('link[rel="canonical"]')
          ?.getAttribute("href")
          ?.trim() ?? "";
      const robots =
        doc
          .querySelector('meta[name="robots"]')
          ?.getAttribute("content")
          ?.trim() ?? "";
      const viewport =
        doc
          .querySelector('meta[name="viewport"]')
          ?.getAttribute("content")
          ?.trim() ?? "";
      const h1Count = doc.querySelectorAll("h1").length;
      const lang = doc.documentElement.getAttribute("lang")?.trim() ?? "";
      const ogTitle =
        doc
          .querySelector('meta[property="og:title"]')
          ?.getAttribute("content")
          ?.trim() ?? "";
      const ogDescription =
        doc
          .querySelector('meta[property="og:description"]')
          ?.getAttribute("content")
          ?.trim() ?? "";
      const ogImage =
        doc
          .querySelector('meta[property="og:image"]')
          ?.getAttribute("content")
          ?.trim() ?? "";
      const twitterCard =
        doc
          .querySelector('meta[name="twitter:card"]')
          ?.getAttribute("content")
          ?.trim() ?? "";
      const structuredDataCount = doc.querySelectorAll(
        'script[type="application/ld+json"]'
      ).length;
      const images = Array.from(doc.querySelectorAll("img"));
      const imagesMissingAlt = images.filter(
        (image) => !image.getAttribute("alt")?.trim()
      ).length;

      const checks: SeoCheck[] = [
        {
          label: "Title tag",
          value: title || "Missing",
          status: title.length >= 30 && title.length <= 60 ? "good" : title ? "warning" : "issue",
          detail: title
            ? `Length: ${title.length} characters`
            : "Add a unique title between 30 and 60 characters.",
        },
        {
          label: "Meta description",
          value: description || "Missing",
          status:
            description.length >= 120 && description.length <= 160
              ? "good"
              : description
                ? "warning"
                : "issue",
          detail: description
            ? `Length: ${description.length} characters`
            : "Add a description to improve snippet quality.",
        },
        {
          label: "Canonical URL",
          value: canonical || "Missing",
          status: canonical ? "good" : "warning",
          detail: canonical
            ? "Canonical tag found."
            : "Add a canonical link to reduce duplicate URL ambiguity.",
        },
        {
          label: "Robots meta",
          value: robots || "Missing",
          status: robots ? "good" : "warning",
          detail: robots
            ? "Robots directive found."
            : "Optional, but useful when indexing rules matter.",
        },
        {
          label: "Viewport meta",
          value: viewport || "Missing",
          status: viewport ? "good" : "issue",
          detail: viewport
            ? "Mobile viewport is declared."
            : "Add a viewport tag for mobile rendering.",
        },
        {
          label: "Primary heading",
          value: `${h1Count} H1 tag${h1Count === 1 ? "" : "s"}`,
          status: h1Count === 1 ? "good" : h1Count > 1 ? "warning" : "issue",
          detail:
            h1Count === 1
              ? "Exactly one H1 found."
              : "Use one clear page-level H1 to strengthen topic clarity.",
        },
        {
          label: "HTML lang",
          value: lang || "Missing",
          status: lang ? "good" : "warning",
          detail: lang
            ? "Language attribute found on the html element."
            : "Set `lang` on `<html>` for search and accessibility clarity.",
        },
        {
          label: "Open Graph",
          value: ogTitle && ogDescription && ogImage ? "Complete" : "Partial / Missing",
          status:
            ogTitle && ogDescription && ogImage
              ? "good"
              : ogTitle || ogDescription || ogImage
                ? "warning"
                : "issue",
          detail: `Title: ${ogTitle ? "yes" : "no"}, description: ${ogDescription ? "yes" : "no"}, image: ${ogImage ? "yes" : "no"}`,
        },
        {
          label: "Twitter card",
          value: twitterCard || "Missing",
          status: twitterCard ? "good" : "warning",
          detail: twitterCard
            ? "Twitter card metadata found."
            : "Add Twitter metadata for stronger link previews.",
        },
        {
          label: "Structured data",
          value: `${structuredDataCount} script${structuredDataCount === 1 ? "" : "s"}`,
          status: structuredDataCount > 0 ? "good" : "warning",
          detail:
            structuredDataCount > 0
              ? "JSON-LD structured data detected."
              : "Consider adding schema markup for rich results.",
        },
        {
          label: "Image alt coverage",
          value: images.length
            ? `${images.length - imagesMissingAlt}/${images.length} with alt`
            : "No images found",
          status:
            images.length === 0
              ? "good"
              : imagesMissingAlt === 0
                ? "good"
                : imagesMissingAlt < images.length / 2
                  ? "warning"
                  : "issue",
          detail:
            images.length === 0
              ? "No images to evaluate."
              : `${imagesMissingAlt} image${imagesMissingAlt === 1 ? "" : "s"} missing alt text.`,
        },
      ];

      const points = checks.reduce((sum, check) => {
        if (check.status === "good") return sum + 10;
        if (check.status === "warning") return sum + 6;
        return sum + 2;
      }, 0);

      const summary = checks.reduce(
        (acc, check) => {
          acc[check.status] += 1;
          return acc;
        },
        { good: 0, warning: 0, issue: 0 }
      );

      setResult({
        score: Math.round((points / (checks.length * 10)) * 100),
        normalizedUrl: data.url || normalizedUrl,
        checks,
        summary,
      });
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "SEO analysis failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-teal-100 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(240,253,250,0.92))] p-5 pb-8 shadow-[0_24px_80px_rgba(13,148,136,0.12)] sm:p-8 sm:pb-10">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-teal-200/30 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-emerald-200/30 blur-3xl"></div>

        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              SEO workspace
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
              Analyze core on-page SEO signals including title tags, meta
              descriptions, canonical URLs, social metadata, headings,
              viewport, and structured data.
            </p>

            <form
              onSubmit={analyzeSeo}
              className="mt-6 flex flex-col gap-4 sm:flex-row"
            >
              <input
                type="text"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://example.com"
                className="min-h-12 flex-1 rounded-2xl border border-gray-300 bg-white/90 px-4 text-gray-900 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-200"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-teal-700 px-6 font-semibold text-white shadow-[0_14px_32px_rgba(13,148,136,0.2)] transition hover:-translate-y-0.5 hover:bg-teal-800 disabled:opacity-60"
              >
                {isLoading ? "Analyzing..." : "Run SEO check"}
              </button>
            </form>
          </div>

          <div className="relative rounded-[1.75rem] border border-white/80 bg-white/75 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
              What We Check
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-teal-50 px-4 py-3 text-sm text-teal-900">
                Title and meta quality
              </div>
              <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                Canonical and robots
              </div>
              <div className="rounded-2xl bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
                Open Graph and Twitter
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-900">
                Headings, lang, schema
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-gray-600">
              The score is a real value out of 100, normalized across all
              checks instead of showing a raw 1-10 style average.
            </p>
          </div>
        </div>

        {error && (
          <div className="relative mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}
      </div>

      {result && (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-[0.62fr_1.38fr]">
            <div className="rounded-3xl border border-white/80 bg-white p-6 shadow-md">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">
                SEO Score
              </p>
              <p className="mt-4 text-5xl font-bold tracking-tight text-gray-900">
                {result.score}
              </p>
              <p className="mt-2 text-sm text-gray-500">out of 100</p>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-700"
                  style={{ width: `${result.score}%` }}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-white/80 bg-white p-6 shadow-md">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">
                  Analyzed URL
                </p>
                <p className="mt-4 break-all text-sm text-gray-700">
                  {result.normalizedUrl}
                </p>
              </div>
              <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6 shadow-md">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                  Good
                </p>
                <p className="mt-4 text-4xl font-bold tracking-tight text-emerald-900">
                  {resultSummary.good}
                </p>
              </div>
              <div className="rounded-3xl border border-amber-100 bg-amber-50 p-6 shadow-md">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                  Warnings
                </p>
                <p className="mt-4 text-4xl font-bold tracking-tight text-amber-900">
                  {resultSummary.warning}
                </p>
              </div>
              <div className="rounded-3xl border border-rose-100 bg-rose-50 p-6 shadow-md">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-700">
                  Issues
                </p>
                <p className="mt-4 text-4xl font-bold tracking-tight text-rose-900">
                  {resultSummary.issue}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {result.checks.map((check) => (
              <div
                key={check.label}
                className="rounded-3xl border border-white/80 bg-white p-5 shadow-md"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {check.label}
                    </p>
                    <p className="mt-2 text-sm text-gray-600">{check.detail}</p>
                  </div>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getSeverityClasses(check.status)}`}
                  >
                    {check.status}
                  </span>
                </div>
                <div className="mt-4 rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-800">
                  {check.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
