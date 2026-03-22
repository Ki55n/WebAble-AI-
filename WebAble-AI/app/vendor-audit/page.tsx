"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type AuditResponse = {
  reportId: string;
  score: number;
  risks: string[];
  fixes: string[];
  summary: string;
  streamingUrl?: string | null;
};

type ReportListItem = {
  id: string;
  vendor: string;
  score: number;
  risks: string[];
  fixes: string[];
  summary: string;
  date: string;
};

const DEFAULT_EMAIL = "test@vendorshield.com";
const DEFAULT_PASSWORD = "pass";

function getStringValue(data: Record<string, unknown>, key: string): string | undefined {
  const value = data[key];
  return typeof value === "string" ? value : undefined;
}

function parseSseDataBlock(rawEvent: string): string | null {
  const dataLines = rawEvent
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim());
  if (dataLines.length === 0) return null;
  const payload = dataLines.join("\n").trim();
  if (!payload || payload === "[DONE]") return null;
  return payload;
}

function toAuditResponse(payload: Record<string, unknown>): AuditResponse | null {
  if (
    payload.type !== "audit_saved" ||
    typeof payload.reportId !== "string" ||
    typeof payload.score !== "number" ||
    typeof payload.summary !== "string" ||
    !Array.isArray(payload.risks) ||
    !Array.isArray(payload.fixes)
  ) return null;

  return {
    reportId: payload.reportId,
    score: payload.score,
    risks: payload.risks.filter((v): v is string => typeof v === "string"),
    fixes: payload.fixes.filter((v): v is string => typeof v === "string"),
    summary: payload.summary,
    streamingUrl: typeof payload.streamingUrl === "string" ? payload.streamingUrl : null,
  };
}

function ScoreRing({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const color = score >= 7 ? "text-emerald-600" : score >= 4 ? "text-amber-500" : "text-rose-500";
  const ring = score >= 7 ? "stroke-emerald-500" : score >= 4 ? "stroke-amber-400" : "stroke-rose-500";
  const r = 28; const circ = 2 * Math.PI * r;
  return (
    <div className="relative flex items-center justify-center w-20 h-20">
      <svg className="absolute inset-0 -rotate-90" width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
        <circle cx="40" cy="40" r={r} fill="none" className={ring} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      </svg>
      <span className={`text-xl font-bold ${color}`}>{score}</span>
    </div>
  );
}

export default function VendorAuditPage() {
  const [email, setEmail] = useState(DEFAULT_EMAIL);
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [vendor, setVendor] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auditStatus, setAuditStatus] = useState<string | null>(null);
  const [latestAudit, setLatestAudit] = useState<AuditResponse | null>(null);
  const [reports, setReports] = useState<ReportListItem[]>([]);

  const login = useCallback(async (): Promise<string> => {
    if (token) return token;
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok || typeof data?.token !== "string") throw new Error(data?.msg || "Login failed");
    setToken(data.token);
    return data.token;
  }, [email, password, token]);

  const loadReports = useCallback(async (activeToken?: string) => {
    const bearerToken = activeToken ?? token;
    if (!bearerToken) return;
    setIsLoadingReports(true);
    try {
      const response = await fetch("/api/reports", { headers: { Authorization: `Bearer ${bearerToken}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.msg || "Failed to load reports");
      setReports(Array.isArray(data) ? (data as ReportListItem[]) : []);
    } finally {
      setIsLoadingReports(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) loadReports(token).catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)));
  }, [token, loadReports]);

  const handleRunAudit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null); setLatestAudit(null); setAuditStatus("Starting audit..."); setIsSubmitting(true);
    try {
      const bearerToken = await login();
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${bearerToken}` },
        body: JSON.stringify({ vendor }),
      });
      if (!response.ok) {
        let msg = "Audit failed";
        try { const e = await response.json() as Record<string, unknown>; msg = getStringValue(e, "error") ?? getStringValue(e, "msg") ?? msg; } catch {}
        throw new Error(msg);
      }
      let finalAudit: AuditResponse | null = null;
      if (response.headers.get("content-type")?.includes("text/event-stream") && response.body) {
        const reader = response.body.getReader(); const decoder = new TextDecoder(); let buf = "";
        while (true) {
          const { done, value } = await reader.read(); if (done) break;
          buf += decoder.decode(value, { stream: true });
          const events = buf.split(/\r?\n\r?\n/); buf = events.pop() ?? "";
          for (const raw of events) {
            const payload = parseSseDataBlock(raw); if (!payload) continue;
            try {
              const parsed = JSON.parse(payload) as Record<string, unknown>;
              const t = getStringValue(parsed, "type")?.toLowerCase();
              if (t === "error") throw new Error(getStringValue(parsed, "message") ?? "Audit failed");
              if (t === "audit_started") setAuditStatus(`Auditing ${vendor}...`);
              if (t === "log" || t === "progress") {
                const msg = getStringValue(parsed, "message") ?? getStringValue(parsed, "purpose") ?? getStringValue(parsed, "content");
                if (msg) setAuditStatus(msg);
              }
              const result = toAuditResponse(parsed); if (result) finalAudit = result;
            } catch (inner) { if (inner instanceof Error) throw inner; }
          }
        }
      }
      if (!finalAudit) throw new Error("Audit completed without a final result");
      setLatestAudit(finalAudit); setAuditStatus("Audit complete");
      await loadReports(bearerToken);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err)); setAuditStatus(null);
    } finally { setIsSubmitting(false); }
  };

  const downloadReport = async (reportId: string) => {
    setError(null);
    try {
      const bearerToken = await login();
      const response = await fetch(`/api/reports/${reportId}/download`, { headers: { Authorization: `Bearer ${bearerToken}` } });
      if (!response.ok) { const d = await response.json(); throw new Error(d?.msg || "Failed to download"); }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `report-${reportId}.pdf`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : String(err)); }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,#f4fff9_0%,#ebfaf4_28%,#f8fffc_58%,#ffffff_100%)] px-4 py-12 text-gray-900 sm:px-6 sm:py-16">

      {/* Background blurs */}
      <div className="pointer-events-none absolute left-[8%] top-28 h-[22rem] w-[22rem] rounded-full bg-emerald-200/20 blur-3xl" />
      <div className="pointer-events-none absolute right-[6%] top-40 h-[18rem] w-[18rem] rounded-full bg-teal-200/20 blur-3xl" />

      <div className="mx-auto max-w-6xl">

        {/* Nav breadcrumbs */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-white">
            <span aria-hidden="true">&lt;</span> Back to homepage
          </Link>
          <Link href="/audit" className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-800 transition hover:bg-teal-100">
            Open accessibility workspace
          </Link>
          <Link href="/seo" className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-white">
            Open SEO workspace
          </Link>
        </div>

        {/* Header */}
        <div className="mb-10 text-center">
          <span className="rounded-full bg-emerald-100 px-4 py-1 text-sm font-medium text-emerald-700">
            VENDOR SECURITY AUDIT
          </span>
          <h1 className="mt-6 bg-gradient-to-r from-emerald-800 to-teal-700 bg-clip-text pb-2 text-3xl font-bold text-transparent sm:text-4xl md:text-5xl">
            Audit vendor privacy &amp; security in one place
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600 sm:text-lg">
            Run a TinyFish-powered security audit on any vendor. Get a risk score, detailed findings, and a downloadable PDF report — all stored automatically.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* LEFT — Audit form */}
          <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(240,253,250,0.92))] p-6 shadow-[0_24px_80px_rgba(6,95,70,0.10)] sm:p-8">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-200/25 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-teal-200/25 blur-3xl" />

            <div className="relative">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">Run Vendor Audit</h2>
              <p className="mt-2 text-sm text-gray-600">
                Powered by TinyFish. Results saved to MongoDB, downloadable as PDF.
              </p>

              <form className="mt-6 space-y-4" onSubmit={handleRunAudit}>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-600">Login Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    className="min-h-11 w-full rounded-2xl border border-gray-300 bg-white/90 px-4 text-sm text-gray-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-200" />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-600">Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                    className="min-h-11 w-full rounded-2xl border border-gray-300 bg-white/90 px-4 text-sm text-gray-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-200" />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-600">Vendor URL</label>
                  <input type="text" value={vendor} onChange={e => setVendor(e.target.value)}
                    placeholder="example.com or https://example.com" required
                    className="min-h-11 w-full rounded-2xl border border-gray-300 bg-white/90 px-4 text-sm text-gray-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-200" />
                </div>

                <button type="submit" disabled={isSubmitting}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-6 font-semibold text-white shadow-[0_14px_32px_rgba(6,95,70,0.22)] transition hover:-translate-y-0.5 hover:bg-emerald-900 disabled:opacity-60">
                  {isSubmitting ? (
                    <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Running audit...</>
                  ) : "Run Vendor Audit"}
                </button>

                {auditStatus && (
                  <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    {isSubmitting && <svg className="h-3.5 w-3.5 animate-spin text-emerald-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                    <p className="text-xs font-medium text-emerald-700">{auditStatus}</p>
                  </div>
                )}
              </form>

              {error && (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
              )}

              {/* Latest audit result */}
              {latestAudit && (
                <div className="mt-6 rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-4">
                    <ScoreRing score={latestAudit.score} />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Security Score</p>
                      <p className="text-lg font-bold text-gray-900">{latestAudit.score}/10</p>
                    </div>
                  </div>

                  {latestAudit.summary && (
                    <p className="mt-4 text-sm leading-6 text-gray-700">{latestAudit.summary}</p>
                  )}

                  {latestAudit.risks.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-rose-700 mb-2">Risks</p>
                      <ul className="space-y-1.5">
                        {latestAudit.risks.map((risk, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                            {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {latestAudit.fixes.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-2">Recommended Fixes</p>
                      <ul className="space-y-1.5">
                        {latestAudit.fixes.map((fix, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                            {fix}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button onClick={() => downloadReport(latestAudit.reportId)}
                    className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-900">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Download PDF Report
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* RIGHT — Saved reports */}
          <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(240,253,250,0.92))] p-6 shadow-[0_24px_80px_rgba(6,95,70,0.10)] sm:p-8">
            <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-teal-200/20 blur-3xl" />

            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-gray-900">Saved Reports</h2>
                  <p className="mt-1 text-sm text-gray-500">{reports.length} report{reports.length !== 1 ? "s" : ""} stored</p>
                </div>
                <button onClick={() => loadReports().catch(() => undefined)} disabled={isLoadingReports || !token}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">
                  {isLoadingReports ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              <div className="mt-6 space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {reports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                      <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <p className="font-medium text-gray-700">No reports yet</p>
                    <p className="mt-1 text-sm text-gray-500">Run an audit to generate your first report.</p>
                  </div>
                ) : (
                  reports.map(report => (
                    <div key={report.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900 text-sm">{report.vendor}</p>
                          <p className="mt-0.5 text-xs text-gray-500">{new Date(report.date).toLocaleString()}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${report.score >= 7 ? "bg-emerald-100 text-emerald-700" : report.score >= 4 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                          {report.score}/10
                        </span>
                      </div>

                      {report.summary && (
                        <p className="mt-3 text-xs leading-5 text-gray-600 line-clamp-2">{report.summary}</p>
                      )}

                      <div className="mt-3 flex items-center gap-2">
                        <button onClick={() => downloadReport(report.id)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-900">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3" /></svg>
                          PDF
                        </button>
                        {report.risks.length > 0 && (
                          <span className="text-xs text-gray-500">{report.risks.length} risk{report.risks.length !== 1 ? "s" : ""}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>

        {/* API info footer */}
        <div className="mx-auto mt-6 max-w-6xl rounded-2xl border border-gray-200 bg-white/70 px-5 py-4 text-xs text-gray-500 backdrop-blur">
          Endpoints used: <code className="rounded bg-gray-100 px-1.5 py-0.5">/api/auth/login</code>{" "}
          <code className="rounded bg-gray-100 px-1.5 py-0.5">/api/audit</code>{" "}
          <code className="rounded bg-gray-100 px-1.5 py-0.5">/api/reports</code>{" "}
          <code className="rounded bg-gray-100 px-1.5 py-0.5">/api/reports/[id]/download</code> —{" "}
          <Link href="/api/docs" target="_blank" className="text-emerald-700 hover:underline">View full API docs →</Link>
        </div>

      </div>
    </main>
  );
}
