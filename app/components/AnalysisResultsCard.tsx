"use client";

import ReactMarkdown from "react-markdown";

interface Ticket {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

interface AnalysisResult {
  summary: string;
  tickets: Ticket[];
}

interface AnalysisResultsCardProps {
  analysisResult: AnalysisResult | null;
  isLoading: boolean;
  lastLog: string;
  expandedTickets: Set<string>;
  setExpandedTickets: (tickets: Set<string>) => void;
  ticketCreationResult: any;
  isCreatingTickets: boolean;
  onRedoAnalysis: () => void;
  onCreateLinearTickets: () => void;
}

export default function AnalysisResultsCard({
  analysisResult,
  isLoading,
  lastLog,
  expandedTickets,
  setExpandedTickets,
  ticketCreationResult,
  isCreatingTickets,
  onRedoAnalysis,
  onCreateLinearTickets,
}: AnalysisResultsCardProps) {
  if (!analysisResult) return null;

  return (
    <div className="space-y-6 rounded-3xl border border-gray-200 bg-white p-8 text-gray-900 card-shadow">
      <div className="flex items-center justify-between border-b border-gray-200 pb-6">
        <h3 className="text-xl font-bold text-gray-900">Analysis Results</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={onRedoAnalysis}
            disabled={isLoading || !lastLog}
            className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-all hover:bg-gray-200 hover:shadow-sm disabled:opacity-50"
          >
            <svg
              className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {isLoading ? "Regenerating..." : "Redo Analysis"}
          </button>
          <span className="rounded-full border border-green-200 bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
            Complete
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-600">
          Summary
        </h4>
        <div className="prose max-w-none text-sm leading-relaxed text-gray-700 prose-p:leading-relaxed prose-li:marker:text-gray-500">
          <ReactMarkdown>{analysisResult.summary}</ReactMarkdown>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-600">
            Identified Issues ({analysisResult.tickets?.length || 0})
          </h4>
        </div>

        <div className="custom-scrollbar max-h-80 space-y-3 overflow-y-auto pr-2">
          {analysisResult.tickets
            ?.slice()
            .sort((a, b) => {
              const priorityOrder = { high: 0, medium: 1, low: 2 };
              return priorityOrder[a.priority] - priorityOrder[b.priority];
            })
            .map((ticket, index) => {
              const isExpanded = expandedTickets.has(ticket.title);

              return (
                <div
                  key={`${ticket.title}-${index}`}
                  onClick={() => {
                    const newExpanded = new Set(expandedTickets);
                    if (isExpanded) {
                      newExpanded.delete(ticket.title);
                    } else {
                      newExpanded.add(ticket.title);
                    }
                    setExpandedTickets(newExpanded);
                  }}
                  className="group cursor-pointer rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all duration-200 hover:border-emerald-400 hover:bg-gray-100 hover:shadow-sm"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <span className="font-medium text-gray-900 transition-colors group-hover:text-emerald-700">
                      {ticket.title}
                    </span>
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                        ticket.priority === "high"
                          ? "border border-red-200 bg-red-100 text-red-700"
                          : ticket.priority === "medium"
                            ? "border border-amber-200 bg-amber-100 text-amber-700"
                            : "border border-emerald-200 bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {ticket.priority}
                    </span>
                  </div>
                  <p
                    className={`text-sm leading-relaxed text-gray-600 group-hover:text-gray-700 ${isExpanded ? "" : "line-clamp-2"}`}
                  >
                    {ticket.description}
                  </p>
                </div>
              );
            })}
        </div>

        <div className="mt-6 border-t border-gray-200 pt-6">
          {!ticketCreationResult ? (
            <button
              onClick={onCreateLinearTickets}
              disabled={isCreatingTickets}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-800 hover:shadow-md active:scale-[0.99]"
            >
              {isCreatingTickets ? "Creating Tickets..." : "Export to Linear"}
            </button>
          ) : (
            <div className="animate-in rounded-xl border border-green-200 bg-green-50 p-4 fade-in slide-in-from-bottom-2">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-green-600">OK</span>
                <h5 className="font-bold text-green-700">Export Complete</h5>
              </div>
              <p className="mb-3 ml-6 text-sm text-green-700">
                Created tickets in team <strong>{ticketCreationResult.teamName}</strong>.
              </p>
              <ul className="ml-6 space-y-2 text-xs text-green-700">
                {ticketCreationResult.results?.map((result: any, index: number) => (
                  <li key={index} className="flex items-center gap-2">
                    {result.success ? (
                      <a
                        href={result.issue?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2 hover:underline"
                      >
                        <span className="rounded bg-green-100 px-1.5 py-0.5 font-mono text-green-700 transition-colors group-hover:bg-green-200">
                          {result.issue?.identifier}
                        </span>
                        <span className="max-w-xs truncate text-green-700">
                          {result.title}
                        </span>
                      </a>
                    ) : (
                      <span className="flex items-center gap-2 text-red-600">
                        <span>X</span> {result.title}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
