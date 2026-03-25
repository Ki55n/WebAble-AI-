"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

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

function getStringValue(
  data: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = data[key];
  return typeof value === "string" ? value : undefined;
}

function parseSseDataBlock(rawEvent: string): string | null {
  const dataLines = rawEvent
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim());

  if (dataLines.length === 0) {
    return null;
  }

  const payload = dataLines.join("\n").trim();
  if (!payload || payload === "[DONE]") {
    return null;
  }

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
  ) {
    return null;
  }

  const risks = payload.risks.filter(
    (value): value is string => typeof value === "string",
  );
  const fixes = payload.fixes.filter(
    (value): value is string => typeof value === "string",
  );
  const streamingUrl =
    typeof payload.streamingUrl === "string" ? payload.streamingUrl : null;

  return {
    reportId: payload.reportId,
    score: payload.score,
    risks,
    fixes,
    summary: payload.summary,
    streamingUrl,
  };
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
    if (token) {
      return token;
    }

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();

    if (!response.ok || typeof data?.token !== "string") {
      throw new Error(data?.msg || "Login failed");
    }

    setToken(data.token);
    return data.token;
  }, [email, password, token]);

  const loadReports = useCallback(
    async (activeToken?: string) => {
      const bearerToken = activeToken ?? token;
      if (!bearerToken) {
        return;
      }

      setIsLoadingReports(true);
      try {
        const response = await fetch("/api/reports", {
          headers: {
            Authorization: `Bearer ${bearerToken}`,
          },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.msg || "Failed to load reports");
        }

        if (Array.isArray(data)) {
          setReports(data as ReportListItem[]);
        } else {
          setReports([]);
        }
      } finally {
        setIsLoadingReports(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (token) {
      loadReports(token).catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
      });
    }
  }, [token, loadReports]);

  const handleRunAudit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLatestAudit(null);
    setAuditStatus("Starting audit...");
    setIsSubmitting(true);

    try {
      const bearerToken = await login();
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${bearerToken}`,
        },
        body: JSON.stringify({ vendor }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      if (!response.ok) {
        let errorMessage = "Audit failed";
        try {
          const errorJson = (await response.json()) as Record<string, unknown>;
          errorMessage =
            getStringValue(errorJson, "error") ??
            getStringValue(errorJson, "msg") ??
            errorMessage;
        } catch {
          // Keep fallback message
        }
        throw new Error(errorMessage);
      }

      let finalAudit: AuditResponse | null = null;
      if (contentType.includes("text/event-stream")) {
        if (!response.body) {
          throw new Error("No stream body received");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let streamBuffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          streamBuffer += decoder.decode(value, { stream: true });
          const events = streamBuffer.split(/\r?\n\r?\n/);
          streamBuffer = events.pop() ?? "";

          for (const rawEvent of events) {
            const payload = parseSseDataBlock(rawEvent);
            if (!payload) {
              continue;
            }

            try {
              const parsed = JSON.parse(payload);
              if (typeof parsed !== "object" || parsed === null) {
                continue;
              }

              const parsedPayload = parsed as Record<string, unknown>;
              const eventTypeRaw = getStringValue(parsedPayload, "type");
              const eventType = eventTypeRaw?.toLowerCase();

              if (eventType === "error") {
                throw new Error(
                  getStringValue(parsedPayload, "message") ?? "Audit failed",
                );
              }

              if (eventType === "audit_started") {
                setAuditStatus(`Auditing ${vendor}...`);
              }

              if (eventType === "log" || eventType === "progress") {
                const message =
                  getStringValue(parsedPayload, "message") ??
                  getStringValue(parsedPayload, "purpose") ??
                  getStringValue(parsedPayload, "content");
                if (message) {
                  setAuditStatus(message);
                }
              }

              const result = toAuditResponse(parsedPayload);
              if (result) {
                finalAudit = result;
              }
            } catch (innerError) {
              if (innerError instanceof Error) {
                throw innerError;
              }
            }
          }
        }

        if (streamBuffer.trim()) {
          const trailingPayload = parseSseDataBlock(streamBuffer);
          if (trailingPayload) {
            const parsed = JSON.parse(trailingPayload);
            if (typeof parsed === "object" && parsed !== null) {
              const result = toAuditResponse(parsed as Record<string, unknown>);
              if (result) {
                finalAudit = result;
              }
            }
          }
        }

        if (!finalAudit) {
          throw new Error("Audit completed without a final result");
        }
      } else {
        const data = (await response.json()) as Record<string, unknown>;
        finalAudit = toAuditResponse(data);
        if (!finalAudit) {
          throw new Error("Invalid audit response");
        }
      }

      setLatestAudit(finalAudit);
      setVendor("");
      setAuditStatus("Audit complete");
      await loadReports(bearerToken);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setAuditStatus(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadReport = async (reportId: string) => {
    setError(null);
    try {
      const bearerToken = await login();
      const response = await fetch(`/api/reports/${reportId}/download`, {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.msg || "Failed to download report");
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = `report-${reportId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50 px-4 pb-12 pt-20 text-gray-900 sm:px-6 sm:pb-16 sm:pt-24">
      <div className="mx-auto max-w-6xl">
        {/* Navigation */}
        <div className="mb-8">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-white"
            >
              <span aria-hidden="true">&lt;</span>
              Back to homepage
            </Link>
            <Link
              href="/audit"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100"
            >
              Open Audit workspace
            </Link>
            <Link
              href="/seo"
              className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-800 transition hover:bg-teal-100"
            >
              Open SEO workspace
            </Link>
          </div>
        </div>

        {/* Page Title */}
        <div className="mb-10 text-center">
          <span className="rounded-full bg-emerald-100 px-4 py-1 text-sm font-medium text-emerald-700">
            VENDOR AUDIT
          </span>
          <h1 className="mt-5 bg-gradient-to-r from-emerald-800 to-teal-700 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl md:text-5xl">
            Vendor Privacy &amp; Security Audit
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-gray-600 sm:text-lg">
            Run a TinyFish vendor audit, store results, and generate PDF reports
            for third-party compliance reviews.
          </p>
        </div>

        {/* Existing content */}
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-semibold text-gray-900">
              Vendor Privacy + Security Audit
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Runs a TinyFish vendor audit, stores results, and generates PDF
              reports.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleRunAudit}>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Login Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-2"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Login Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-2"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Vendor URL
                </label>
                <input
                  type="text"
                  value={vendor}
                  onChange={(event) => setVendor(event.target.value)}
                  placeholder="example.com or https://example.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-2"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
              >
                {isSubmitting ? "Running audit..." : "Run Vendor Audit"}
              </button>

              {auditStatus && (
                <p className="text-xs text-gray-600">{auditStatus}</p>
              )}
            </form>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {latestAudit && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm">
                <p className="font-semibold text-emerald-900">
                  Latest score: {latestAudit.score}/10
                </p>
                <p className="mt-2 text-emerald-800">{latestAudit.summary}</p>

                {latestAudit.risks.length > 0 && (
                  <div className="mt-3">
                    <p className="font-semibold text-emerald-900">Risks</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-emerald-800">
                      {latestAudit.risks.map((risk, index) => (
                        <li key={`${risk}-${index}`}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {latestAudit.fixes.length > 0 && (
                  <div className="mt-3">
                    <p className="font-semibold text-emerald-900">Fixes</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-emerald-800">
                      {latestAudit.fixes.map((fix, index) => (
                        <li key={`${fix}-${index}`}>{fix}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => downloadReport(latestAudit.reportId)}
                    className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-800"
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Saved Reports</h2>
              <button
                onClick={() => loadReports().catch(() => undefined)}
                disabled={isLoadingReports || !token}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
              >
                {isLoadingReports ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {reports.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">
                No reports found yet. Run an audit to generate one.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-lg border border-gray-200 p-4 text-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{report.vendor}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(report.date).toLocaleString()}
                        </p>
                      </div>
                      <p className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                        {report.score}/10
                      </p>
                    </div>

                    {report.summary && (
                      <p className="mt-2 text-gray-700 line-clamp-3">{report.summary}</p>
                    )}

                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => downloadReport(report.id)}
                        className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-800"
                      >
                        Download PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="mt-6 rounded-2xl border border-emerald-100 bg-white/80 p-4 text-xs text-gray-500 backdrop-blur">
          API helper routes integrated: <code>/api/auth/login</code>,{" "}
          <code>/api/audit</code>, <code>/api/reports</code>,{" "}
          <code>/api/reports/[id]</code>, <code>/api/reports/[id]/download</code>.
        </div>
      </div>
    </main>
  );
}
