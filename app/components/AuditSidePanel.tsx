"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import AnalysisResultsCard from "./AnalysisResultsCard";
import OutputConsole from "./OutputConsole";
import ScreenshotsCard from "./ScreenshotsCard";

interface AuditSession {
  type: "audit";
  id: string;
  urls: string[];
  framework: string;
  agent: "tinyfish" | "yutori";
  output: string;
  statusMessage: string;
  isLoading: boolean;
  analysisResult: { summary: string; tickets: any[] } | null;
  screenshots: string[];
  lastLog: string;
  expandedTickets: Set<string>;
  ticketCreationResult: any;
  isCreatingTickets: boolean;
  createdAt: Date;
  taskIds: Array<{ url: string; taskId: string }>;
}

interface ScoutSession {
  type: "scout";
  id: string;
  scoutId: string;
  query: string;
  viewUrl: string;
  createdAt: Date;
}

type Session = AuditSession | ScoutSession;

interface AuditSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  activeSessionId: string | null;
  onSessionChange: (sessionId: string) => void;
  onRedoAnalysis: (sessionId: string) => void;
  onCreateLinearTickets: (sessionId: string) => void;
  onClearOutput: (sessionId: string) => void;
  onSetExpandedTickets: (sessionId: string, tickets: Set<string>) => void;
  onDeleteSession: (sessionId: string) => void;
  onClearHistory: () => void;
}

export default function AuditSidePanel({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSessionChange,
  onRedoAnalysis,
  onCreateLinearTickets,
  onClearOutput,
  onSetExpandedTickets,
  onDeleteSession,
  onClearHistory,
}: AuditSidePanelProps) {
  const [isOutputExpanded, setIsOutputExpanded] = useState(false);

  if (!isOpen) return null;

  const activeSession = sessions.find((session) => session.id === activeSessionId);
  const sortedSessions = [...sessions].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  const getSessionTitle = (session: Session) => {
    if (session.type === "scout") return "Scout";

    if (session.urls.length === 1) {
      try {
        return new URL(session.urls[0]).hostname;
      } catch {
        return session.urls[0].substring(0, 30);
      }
    }

    return `${session.urls.length} URLs`;
  };

  return (
    <section className="min-h-screen w-full bg-linear-to-br from-slate-50 via-white to-emerald-50">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col">
        <div className="sticky top-0 z-20 flex flex-col gap-4 border-b border-gray-200 bg-white/90 px-4 py-4 backdrop-blur sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white p-1 ring-1 ring-emerald-100">
              <Image
                src="/WebAble-logo2.png"
                alt="WebAble AI"
                width={28}
                height={28}
                className="object-contain"
              />
            </div>

            <div>
              <h2 className="bg-linear-to-r from-emerald-800 to-teal-700 bg-clip-text text-lg font-semibold text-transparent">
                WebAble AI Audit
              </h2>
              <p className="max-w-xl text-xs leading-4 text-gray-500">
                Your 24/7 Autonomous AI-Powered Accessibility Auditor Powered by TinyFish
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/seo"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-800 transition hover:bg-teal-100"
            >
              Open SEO workspace
            </Link>
            <button
              onClick={onClearHistory}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
            >
              Clear history
            </button>
            <button
              onClick={onClose}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Back to form
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border-b border-gray-200 bg-white">
          <div className="flex min-w-max gap-2 px-4 py-3 sm:px-6">
            {sortedSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isRunning = session.type === "audit" && session.isLoading;

              return (
                <button
                  key={session.id}
                  onClick={() => onSessionChange(session.id)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-emerald-100 text-emerald-800"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span>{getSessionTitle(session)}</span>

                  {isRunning && (
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}

                  {!isRunning &&
                    session.type === "audit" &&
                    session.analysisResult && (
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                    )}

                  {session.type === "scout" && (
                    <span className="h-2 w-2 rounded-full bg-purple-500" />
                  )}

                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        onDeleteSession(session.id);
                      }
                    }}
                    className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition hover:bg-white/70 hover:text-rose-600"
                    aria-label={`Delete ${getSessionTitle(session)} session`}
                  >
                    x
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-4 py-6 sm:px-6 sm:py-8">
          {sessions.length === 0 ? (
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">
                Scan
              </div>

              <h3 className="text-lg font-semibold text-gray-800">
                No audits yet
              </h3>

              <p className="mt-2 max-w-md text-sm text-gray-500">
                Start a scan from the main page. Every audit session will
                appear here with logs, screenshots, and AI analysis.
              </p>
            </div>
          ) : activeSession ? (
            activeSession.type === "audit" ? (
              <div className="mx-auto max-w-6xl space-y-6">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                    <div>
                      <span className="text-gray-500">Framework</span>
                      <p className="font-medium text-gray-900">
                        {activeSession.framework}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-500">Agent</span>
                      <p className="font-medium capitalize text-gray-900">
                        {activeSession.agent}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => onDeleteSession(activeSession.id)}
                      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                    >
                      Delete this audit
                    </button>
                  </div>

                  <div className="mt-4">
                    <span className="text-sm text-gray-500">URLs</span>

                    <div className="mt-2 space-y-1">
                      {activeSession.urls.map((url, index) => (
                        <div
                          key={index}
                          className="overflow-hidden break-all rounded border bg-white px-3 py-2 font-mono text-xs whitespace-pre-wrap"
                        >
                          {url}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {activeSession.isLoading && (
                  <div className="rounded-xl border border-emerald-200 bg-linear-to-r from-emerald-50 to-teal-50 p-4">
                    <div className="mb-4 flex flex-col gap-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-emerald-800">
                          Audit in progress
                        </p>
                        <span className="font-medium text-emerald-700">
                          {activeSession.statusMessage}
                        </span>
                      </div>

                      <span className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700"></span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-100">
                      <div className="h-2 w-2/3 animate-pulse bg-linear-to-r from-emerald-600 to-teal-500" />
                    </div>
                  </div>
                )}

                <OutputConsole
                  output={activeSession.output}
                  isOutputExpanded={isOutputExpanded}
                  setIsOutputExpanded={setIsOutputExpanded}
                  onClear={() => onClearOutput(activeSession.id)}
                />

                {activeSession.screenshots.length > 0 && (
                  <ScreenshotsCard screenshots={activeSession.screenshots} />
                )}

                <AnalysisResultsCard
                  analysisResult={activeSession.analysisResult}
                  isLoading={activeSession.isLoading}
                  lastLog={activeSession.lastLog}
                  expandedTickets={activeSession.expandedTickets}
                  setExpandedTickets={(tickets) =>
                    onSetExpandedTickets(activeSession.id, tickets)
                  }
                  ticketCreationResult={activeSession.ticketCreationResult}
                  isCreatingTickets={activeSession.isCreatingTickets}
                  onRedoAnalysis={() => onRedoAnalysis(activeSession.id)}
                  onCreateLinearTickets={() =>
                    onCreateLinearTickets(activeSession.id)
                  }
                />
              </div>
            ) : (
              <div className="mx-auto max-w-4xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <div className="space-y-4 text-sm">
                  <p className="font-medium text-gray-800">Scout Query</p>

                  <p className="italic text-gray-600">{activeSession.query}</p>

                  <a
                    href={activeSession.viewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-purple-600 hover:underline"
                  >
                    View Scout Progress
                  </a>

                  <button
                    onClick={() => onDeleteSession(activeSession.id)}
                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                  >
                    Delete this scout
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="flex min-h-[60vh] items-center justify-center text-gray-500">
              Select a session to view results
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
