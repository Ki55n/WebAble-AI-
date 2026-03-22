"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AutomationInputCard from './AutomationInputCard';
import AuditSidePanel from './AuditSidePanel';

interface AuditSession {
  type: 'audit';
  id: string;
  urls: string[];
  framework: string;
  output: string;
  statusMessage: string;
  isLoading: boolean;
  analysisResult: { summary: string; tickets: any[] } | null;
  screenshots: string[];
  lastLog: string;
  expandedTickets: Set<string>;
  createdAt: Date;
}

interface AutomationFormProps {
  isPanelOpen?: boolean;
  onPanelToggle?: (isOpen: boolean) => void;
  mode?: 'embedded' | 'workspace';
}

const STORAGE_KEY = 'accessibility-audit-sessions';

const saveSessionsToStorage = (sessions: AuditSession[]) => {
  try {
    if (typeof window === 'undefined') return;
    if (sessions.length === 0) { localStorage.removeItem(STORAGE_KEY); return; }
    const serializable = sessions.map(s => ({
      ...s,
      expandedTickets: Array.from(s.expandedTickets || []),
      createdAt: s.createdAt.toISOString(),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch (error) { console.error('Failed to save sessions:', error); }
};

const loadSessionsFromStorage = (): AuditSession[] => {
  try {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored).map((s: any) => ({
      ...s,
      expandedTickets: new Set<string>(s.expandedTickets || []),
      createdAt: new Date(s.createdAt),
    }));
  } catch { return []; }
};

export default function AutomationForm({ isPanelOpen: externalPanelOpen, onPanelToggle, mode = 'embedded' }: AutomationFormProps = {} as AutomationFormProps) {
  const router = useRouter();
  const [urls, setUrls] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('WCAG');
  const [sessions, setSessions] = useState<AuditSession[]>(() => loadSessionsFromStorage());
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [internalPanelOpen, setInternalPanelOpen] = useState(false);
  const [buildSitemapFirst, setBuildSitemapFirst] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSidePanelOpen = externalPanelOpen !== undefined ? externalPanelOpen : internalPanelOpen;
  const setIsSidePanelOpen = (isOpen: boolean) => { if (onPanelToggle) onPanelToggle(isOpen); else setInternalPanelOpen(isOpen); };

  useEffect(() => {
    if (sessions.length > 0 && !activeSessionId) {
      const sorted = [...sessions].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setActiveSessionId(sorted[0].id);
    }
  }, []);

  useEffect(() => { saveSessionsToStorage(sessions); }, [sessions]);

  useEffect(() => {
    if (isSidePanelOpen && sessions.length > 0 && !activeSessionId) {
      const sorted = [...sessions].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setActiveSessionId(sorted[0].id);
    }
  }, [isSidePanelOpen, sessions, activeSessionId]);

  const FRAMEWORKS = [
    { id: 'WCAG', name: 'WCAG (Web Content Accessibility Guidelines)', description: 'W3C standard; global default (2.1/2.2 most used).' },
    { id: 'APG', name: 'ARIA Authoring Practices (APG)', description: 'Patterns for accessible interactive components.' },
    { id: 'Section508', name: 'Section 508 (US)', description: 'Federal accessibility requirements (maps to WCAG).' },
    { id: 'EN301549', name: 'EN 301 549 (EU)', description: 'EU public sector standard (based on WCAG).' },
    { id: 'ADA', name: 'ADA (US)', description: 'Civil rights law; WCAG used as the technical benchmark.' },
    { id: 'ATAG', name: 'ATAG', description: 'Accessibility for authoring tools (CMS, editors).' },
    { id: 'UAAG', name: 'UAAG', description: 'Accessibility for browsers and user agents.' },
    { id: 'ISO40500', name: 'ISO/IEC 40500', description: 'ISO adoption of WCAG 2.0.' },
    { id: 'BBC_GEL', name: 'BBC GEL / GOV.UK Design System', description: 'Practical, opinionated implementations on top of WCAG.' },
  ];

  const getPrompt = (frameworkId: string) => {
    const fw = FRAMEWORKS.find(f => f.id === frameworkId);
    const name = fw ? fw.name : 'WCAG 2.2 Level AA';
    return `You are an autonomous accessibility auditing agent. Perform a ${name} audit on the provided URL. Detect POUR violations, check semantic HTML, ARIA usage, color contrast, keyboard navigation, focus states, alt text, and dynamic content issues. For each issue include: Criterion, Severity (Critical/Major/Minor), Affected element, Why it fails, Concrete fix. Return a pass/fail verdict and manual test checklist. Output findings only, no navigation logs.`;
  };

  const updateSession = (sessionId: string, updates: Partial<AuditSession>) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, ...updates } : s));
  };

  const extractScreenshotUrls = (log: string): string[] => {
    const found = new Set<string>();
    try {
      log.split('\n').forEach(line => {
        try { const j = JSON.parse(line); if (j.screenshotUrl) found.add(j.screenshotUrl); if (j.screenshot) found.add(j.screenshot); } catch {}
      });
    } catch {}
    for (const m of log.matchAll(/https?:\/\/[^\s"']+\.(?:png|jpg|jpeg|webp)/gi)) found.add(m[0]);
    return Array.from(found);
  };

  const runConversion = async (log: string, sessionId: string) => {
    updateSession(sessionId, { statusMessage: 'Generating report...' });
    const screenshots = extractScreenshotUrls(log);
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, output: s.output + '\n\n--- Generating report... ---\n', screenshots, lastLog: log } : s));
    try {
      const res = await fetch('/api/convert-output', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ automationLog: log, screenshotUrls: screenshots }) });
      if (res.ok) { const data = await res.json(); updateSession(sessionId, { analysisResult: data }); }
      else { updateSession(sessionId, { statusMessage: 'Report generation failed.' }); }
    } catch (err) { console.error('Conversion error:', err); }
  };

  const buildSitemap = async (baseUrl: string, sessionId: string): Promise<string[]> => {
    updateSession(sessionId, { statusMessage: 'Building sitemap...' });
    const res = await fetch('/api/run-automation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: baseUrl, goal: 'Traverse all public subpages and output a comma-separated list of all URLs found.' }) });
    if (!res.ok || !res.body) throw new Error('Failed to build sitemap');
    const reader = res.body.getReader(); const decoder = new TextDecoder(); let log = '';
    while (true) { const { done, value } = await reader.read(); if (done) break; log += decoder.decode(value, { stream: true }); }
    const matches = log.match(/(?:https?:\/\/[^\s,]+(?:,\s*https?:\/\/[^\s,]+)*)/g);
    if (matches) return Array.from(new Set(matches.join(',').split(',').map(u => u.trim()).filter(Boolean)));
    throw new Error('Could not extract URLs from sitemap');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    let urlList = urls.split(',').map(u => { let url = u.trim(); if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url; return url; }).filter(Boolean);
    if (!urlList.length) { setIsSubmitting(false); alert('Please enter at least one valid URL.'); return; }

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setSessions(prev => [...prev, { type: 'audit', id: sessionId, urls: urlList, framework: selectedFramework, output: '', statusMessage: 'Initializing...', isLoading: true, analysisResult: null, screenshots: [], lastLog: '', expandedTickets: new Set(), createdAt: new Date() }]);
    setActiveSessionId(sessionId);
    setUrls('');
    await new Promise(r => setTimeout(r, 300));
    setIsSidePanelOpen(true);

    try {
      if (buildSitemapFirst && urlList.length === 1) {
        try { const discovered = await buildSitemap(urlList[0], sessionId); if (discovered.length > 0) { urlList = discovered; updateSession(sessionId, { urls: discovered, statusMessage: `Found ${discovered.length} pages. Starting audit...` }); } } catch (err: any) { updateSession(sessionId, { statusMessage: `Sitemap failed: ${err.message}. Continuing...` }); }
      }

      for (const targetUrl of urlList) {
        try { updateSession(sessionId, { statusMessage: `Auditing ${new URL(targetUrl).hostname}...` }); } catch { updateSession(sessionId, { statusMessage: `Auditing ${targetUrl}...` }); }
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, output: s.output + `\n\n--- Auditing: ${targetUrl} ---\n` } : s));
        let fullLog = '';
        try {
          const res = await fetch('/api/run-automation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: targetUrl, goal: getPrompt(selectedFramework) }) });
          if (!res.ok) { const d = await res.json(); throw new Error(d.details || d.error || res.statusText); }
          if (!res.body) continue;
          const reader = res.body.getReader(); const decoder = new TextDecoder();
          while (true) { const { done, value } = await reader.read(); if (done) break; const chunk = decoder.decode(value, { stream: true }); fullLog += chunk; setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, output: s.output + chunk } : s)); }
          await runConversion(fullLog, sessionId);
        } catch (err) {
          setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, output: s.output + `\nError: ${err instanceof Error ? err.message : String(err)}` } : s));
        }
      }
    } catch (error) {
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, output: s.output + `\nFatal: ${error instanceof Error ? error.message : String(error)}` } : s));
    } finally {
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, isLoading: false, statusMessage: 'Complete', output: s.output + '\n\n--- Audit complete ---' } : s));
      setIsSubmitting(false);
    }
  };

  const handleRedoAnalysis = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session?.lastLog) return;
    updateSession(sessionId, { isLoading: true, analysisResult: null });
    await runConversion(session.lastLog, sessionId);
    updateSession(sessionId, { isLoading: false });
  };

  const handleDeleteSession = (sessionId: string) => {
    if (typeof window !== 'undefined' && !window.confirm('Delete this audit session?')) return;
    setSessions(prev => { const next = prev.filter(s => s.id !== sessionId); if (activeSessionId === sessionId) { const n = next.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime())[0]; setActiveSessionId(n?.id ?? null); } if (!next.length) setIsSidePanelOpen(false); return next; });
  };

  const handleClearHistory = () => {
    if (typeof window !== 'undefined' && !window.confirm('Clear all audit history?')) return;
    setSessions([]); setActiveSessionId(null); setIsSidePanelOpen(false);
  };

  if (isSidePanelOpen) {
    return (
      <AuditSidePanel
        isOpen={isSidePanelOpen}
        onClose={() => { setIsSidePanelOpen(false); if (mode === 'embedded') router.push('/audit'); }}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSessionChange={setActiveSessionId}
        onRedoAnalysis={handleRedoAnalysis}
        onClearOutput={(sid) => updateSession(sid, { output: '' })}
        onSetExpandedTickets={(sid, tickets) => updateSession(sid, { expandedTickets: tickets })}
        onDeleteSession={handleDeleteSession}
        onClearHistory={handleClearHistory}
      />
    );
  }

  return (
    <AutomationInputCard
      urls={urls}
      setUrls={setUrls}
      selectedFramework={selectedFramework}
      setSelectedFramework={setSelectedFramework}
      frameworks={FRAMEWORKS}
      onSubmit={handleSubmit}
      buildSitemapFirst={buildSitemapFirst}
      setBuildSitemapFirst={setBuildSitemapFirst}
      isSubmitting={isSubmitting}
    />
  );
}
