"use client";

import { useState } from 'react';
import OutputConsole from './OutputConsole';
import ScreenshotsCard from './ScreenshotsCard';
import AnalysisResultsCard from './AnalysisResultsCard';

interface AuditSession {
  type: 'audit'; id: string; urls: string[]; framework: string; output: string;
  statusMessage: string; isLoading: boolean; analysisResult: { summary: string; tickets: any[] } | null;
  screenshots: string[]; lastLog: string; expandedTickets: Set<string>; createdAt: Date;
}

interface AuditSidePanelProps {
  isOpen: boolean; onClose: () => void; sessions: AuditSession[]; activeSessionId: string | null;
  onSessionChange: (id: string) => void; onRedoAnalysis: (id: string) => void;
  onClearOutput: (id: string) => void; onSetExpandedTickets: (id: string, tickets: Set<string>) => void;
  onDeleteSession: (id: string) => void; onClearHistory: () => void;
}

export default function AuditSidePanel({ isOpen, onClose, sessions, activeSessionId, onSessionChange, onRedoAnalysis, onClearOutput, onSetExpandedTickets, onDeleteSession, onClearHistory }: AuditSidePanelProps) {
  const [isOutputExpanded, setIsOutputExpanded] = useState(false);
  if (!isOpen) return null;

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const sortedSessions = [...sessions].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const getSessionTitle = (session: AuditSession) => {
    if (session.urls.length === 1) { try { return new URL(session.urls[0]).hostname; } catch { return session.urls[0].substring(0, 30); } }
    return `${session.urls.length} URLs`;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white shadow-2xl flex flex-col h-full">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900">Audit Sessions</h2>
          <div className="flex items-center gap-2">
            {sessions.length > 0 && <button onClick={onClearHistory} className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">Clear all</button>}
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition-colors" aria-label="Close panel">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-white overflow-x-auto">
          <div className="flex items-center gap-1 px-4 min-w-max">
            {sortedSessions.map(session => (
              <div key={session.id} className="flex items-center">
                <button onClick={() => onSessionChange(session.id)} className={`px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${session.id === activeSessionId ? 'border-emerald-500 text-emerald-700 bg-emerald-50' : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                  <span className="truncate max-w-[180px]">{getSessionTitle(session)}</span>
                  {session.isLoading && <svg className="w-3 h-3 animate-spin text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>}
                  {!session.isLoading && session.analysisResult && <span className="w-2 h-2 rounded-full bg-green-500" />}
                </button>
                <button onClick={() => onDeleteSession(session.id)} className="p-1 text-gray-300 hover:text-red-400 transition-colors ml-1" title="Delete session">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              <p className="text-lg font-medium text-gray-700 mb-2">No audit sessions yet</p>
              <p className="text-sm text-gray-500 text-center max-w-md">Start an audit to see results here.</p>
            </div>
          ) : activeSession ? (
            <div className="space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-600 font-medium">Framework:</span><span className="ml-2 text-gray-900">{activeSession.framework}</span></div>
                  <div className="col-span-2">
                    <span className="text-gray-600 font-medium">URLs:</span>
                    <div className="mt-1 space-y-1">{activeSession.urls.map((url, idx) => <div key={idx} className="text-gray-900 text-xs font-mono bg-white px-2 py-1 rounded border border-gray-200 truncate">{url}</div>)}</div>
                  </div>
                </div>
              </div>

              {activeSession.isLoading && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                  <svg className="w-5 h-5 animate-spin text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                  <span className="text-sm text-emerald-700 font-medium">{activeSession.statusMessage}</span>
                </div>
              )}

              <OutputConsole output={activeSession.output} isOutputExpanded={isOutputExpanded} setIsOutputExpanded={setIsOutputExpanded} onClear={() => onClearOutput(activeSession.id)} />

              {activeSession.screenshots.length > 0 && <ScreenshotsCard screenshots={activeSession.screenshots} />}

              <AnalysisResultsCard analysisResult={activeSession.analysisResult} isLoading={activeSession.isLoading} lastLog={activeSession.lastLog} expandedTickets={activeSession.expandedTickets} setExpandedTickets={(tickets) => onSetExpandedTickets(activeSession.id, tickets)} onRedoAnalysis={() => onRedoAnalysis(activeSession.id)} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="text-lg font-medium text-gray-700 mb-2">Select a session</p>
              <p className="text-sm text-gray-500">Choose a tab above to view audit details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
