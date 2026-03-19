"use client";

import { useState } from "react";
import OutputConsole from "./OutputConsole";
import ScreenshotsCard from "./ScreenshotsCard";
import AnalysisResultsCard from "./AnalysisResultsCard";
import Image from "next/image";

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
}: AuditSidePanelProps) {
  const [isOutputExpanded, setIsOutputExpanded] = useState(false);

  if (!isOpen) return null;

  const activeSession = sessions.find((s) => s.id === activeSessionId);
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
    <div className="fixed inset-0 z-50 flex justify-end">

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-5xl bg-white shadow-2xl flex flex-col h-full border-l border-gray-200">

        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50">

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white-700 flex items-center justify-center p-1">
              <Image
                src="/WebAble-logo2.png"
                alt="WebAble AI"
                width={28}
                height={28}
                className="object-contain"
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                WebAble AI Audit
              </h2>
              <p className="text-xs text-gray-500">
                Accessibility scan sessions
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            ✕
          </button>
        </div>

        {/* SESSION TABS */}
        <div className="border-b border-gray-200 bg-white overflow-x-auto">
          <div className="flex px-4 gap-2 min-w-max">

            {sortedSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isRunning =
                session.type === "audit" && session.isLoading;

              return (
                <button
                  key={session.id}
                  onClick={() => onSessionChange(session.id)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 transition
                    ${isActive
                      ? "bg-emerald-100 text-emerald-800"
                      : "text-gray-600 hover:bg-gray-100"
                    }`}
                >
                  {getSessionTitle(session)}

                  {isRunning && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}

                  {!isRunning &&
                    session.type === "audit" &&
                    session.analysisResult && (
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                    )}

                  {session.type === "scout" && (
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6">

          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">

              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-3xl mb-4">
                🔍
              </div>

              <h3 className="text-lg font-semibold text-gray-800">
                No audits yet
              </h3>

              <p className="text-gray-500 text-sm max-w-md mt-2">
                Start a scan from the main page. Every audit session will
                appear here with logs, screenshots, and AI analysis.
              </p>

            </div>
          ) : activeSession ? (
            activeSession.type === "audit" ? (

              <div className="space-y-6">

                {/* SESSION INFO */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">

                  <div className="grid grid-cols-2 gap-4 text-sm">

                    <div>
                      <span className="text-gray-500">Framework</span>
                      <p className="font-medium text-gray-900">
                        {activeSession.framework}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-500">Agent</span>
                      <p className="font-medium text-gray-900 capitalize">
                        {activeSession.agent}
                      </p>
                    </div>

                  </div>

                  <div className="mt-4">
                    <span className="text-gray-500 text-sm">URLs</span>

                    <div className="mt-2 space-y-1">
                      {activeSession.urls.map((url, i) => (
                        <div
                          key={i}
                          className="text-xs font-mono bg-white border rounded px-3 py-2 break-all whitespace-pre-wrap overflow-hidden"
                        >
                          {url}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* LOADING STATUS */}
                {activeSession.isLoading && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">

                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-emerald-700 font-medium">
                        {activeSession.statusMessage}
                      </span>
                    </div>

                    <div className="w-full bg-emerald-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-2 w-2/3 animate-pulse" />
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
              <div className="space-y-4 text-sm">

                <p className="font-medium text-gray-800">
                  Scout Query
                </p>

                <p className="italic text-gray-600">
                  {activeSession.query}
                </p>

                <a
                  href={activeSession.viewUrl}
                  target="_blank"
                  className="text-purple-600 font-medium hover:underline"
                >
                  View Scout Progress →
                </a>

              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a session to view results
            </div>
          )}

        </div>
      </div>
    </div>
  );
}