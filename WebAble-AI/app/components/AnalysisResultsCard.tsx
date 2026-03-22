"use client";

import ReactMarkdown from 'react-markdown';

interface Ticket { title: string; description: string; priority: 'high' | 'medium' | 'low'; }
interface AnalysisResult { summary: string; tickets: Ticket[]; }
interface AnalysisResultsCardProps {
  analysisResult: AnalysisResult | null;
  isLoading: boolean;
  lastLog: string;
  expandedTickets: Set<string>;
  setExpandedTickets: (tickets: Set<string>) => void;
  onRedoAnalysis: () => void;
}

export default function AnalysisResultsCard({ analysisResult, isLoading, lastLog, expandedTickets, setExpandedTickets, onRedoAnalysis }: AnalysisResultsCardProps) {
  if (!analysisResult) return null;

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(analysisResult, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'accessibility-report.json'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-8 space-y-6 text-gray-900 card-shadow">
      <div className="flex items-center justify-between border-b border-gray-200 pb-6">
        <h3 className="text-xl font-bold text-gray-900">Analysis Results</h3>
        <div className="flex items-center gap-3">
          <button onClick={onRedoAnalysis} disabled={isLoading || !lastLog} className="text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50">
            <svg className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            {isLoading ? 'Regenerating...' : 'Redo Analysis'}
          </button>
          <span className="px-3 py-1 bg-green-100 text-green-700 border border-green-200 rounded-full text-xs font-medium">Complete</span>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-600 mb-3">Summary</h4>
        <div className="text-sm text-gray-700 leading-relaxed prose max-w-none">
          <ReactMarkdown>{analysisResult.summary}</ReactMarkdown>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-600 mb-4">Identified Issues ({analysisResult.tickets?.length || 0})</h4>
        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
          {analysisResult.tickets?.slice().sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority])).map((ticket, i) => {
            const isExpanded = expandedTickets.has(ticket.title);
            return (
              <div key={`${ticket.title}-${i}`} onClick={() => { const n = new Set(expandedTickets); if (isExpanded) n.delete(ticket.title); else n.add(ticket.title); setExpandedTickets(n); }} className="group p-4 border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 hover:border-blue-400 transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{ticket.title}</span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${ticket.priority === 'high' ? 'bg-red-100 text-red-700 border border-red-200' : ticket.priority === 'medium' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>{ticket.priority}</span>
                </div>
                <p className={`text-sm text-gray-600 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>{ticket.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <button onClick={handleDownload} className="w-full bg-emerald-800 hover:bg-emerald-900 text-white px-6 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Download Report (JSON)
          </button>
        </div>
      </div>
    </div>
  );
}
