"use client";

import { useState, useEffect } from 'react';
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

type Session = AuditSession;

interface AutomationFormProps {
  isPanelOpen?: boolean;
  onPanelToggle?: (isOpen: boolean) => void;
}

const STORAGE_KEY = 'accessibility-audit-sessions';

// Helper functions for localStorage
const saveSessionsToStorage = (sessions: Session[]) => {
  try {
    const serializable = sessions.map(session => {
      return {
        ...session,
        expandedTickets: Array.from(session.expandedTickets || []),
        createdAt: session.createdAt.toISOString(),
      };
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch (error) {
    console.error('Failed to save sessions to localStorage:', error);
  }
};

const loadSessionsFromStorage = (): Session[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return parsed.map((session: any) => {
      return {
        ...session,
        expandedTickets: new Set<string>(session.expandedTickets || []),
        createdAt: new Date(session.createdAt),
      };
    });
  } catch (error) {
    console.error('Failed to load sessions from localStorage:', error);
    return [];
  }
};

export default function AutomationForm({ isPanelOpen: externalPanelOpen, onPanelToggle }: AutomationFormProps = {} as AutomationFormProps) {
  const [urls, setUrls] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('WCAG');
  const [sessions, setSessions] = useState<Session[]>(() => loadSessionsFromStorage());
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [internalPanelOpen, setInternalPanelOpen] = useState(false);
  const [buildSitemapFirst, setBuildSitemapFirst] = useState(false);
  
  const isSidePanelOpen = externalPanelOpen !== undefined ? externalPanelOpen : internalPanelOpen;
  const setIsSidePanelOpen = (isOpen: boolean) => {
    if (onPanelToggle) {
      onPanelToggle(isOpen);
    } else {
      setInternalPanelOpen(isOpen);
    }
  };

  // Auto-select most recent session on initial load
  useEffect(() => {
    if (sessions.length > 0 && !activeSessionId) {
      const sortedSessions = [...sessions].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setActiveSessionId(sortedSessions[0].id);
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      saveSessionsToStorage(sessions);
    }
  }, [sessions]);

  // Auto-select most recent session when panel opens
  useEffect(() => {
    if (isSidePanelOpen && sessions.length > 0 && !activeSessionId) {
      const sortedSessions = [...sessions].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setActiveSessionId(sortedSessions[0].id);
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
      const framework = FRAMEWORKS.find(f => f.id === frameworkId);
      const frameworkName = framework ? framework.name : 'WCAG 2.2 Level AA';
      
      return `You are an autonomous accessibility auditing agent.
For each provided URL, perform a ${frameworkName} audit using both automated and heuristic analysis.

Audit requirements
	•	Detect violations across Perceivable, Operable, Understandable, Robust (POUR) or equivalent principles for the chosen standard.
	•	Check: semantic HTML, heading order, landmarks, ARIA usage, color contrast, text resizing, focus order, keyboard navigation, visible focus states, skip links, form labels/errors, alt text quality, media captions, motion/animation preferences, touch target size, and screen-reader announcements.
	•	Identify dynamic content issues (SPA routing, modals, toasts, accordions).
	•	Flag false ARIA, redundant roles, and inaccessible custom components.
    •   Specific focus: Apply the guidelines and success criteria specific to ${frameworkName}.

Output requirements (strict)
	•	Only report actual issues, not best-practice suggestions unless tied to a failure of the selected standard.
	•	For each issue include:
	•	Criterion/Guideline (e.g., 1.3.1 Info and Relationships or relevant section)
	•	Severity (Critical / Major / Minor)
	•	Affected element or pattern
	•	Why it fails (assistive-tech impact)
	•	Concrete fix (HTML/CSS/ARIA behavior, not vague advice)
	•	Group issues by page section and component type.

Fix guidance
	•	Prefer native HTML over ARIA.
	•	Provide minimal, production-ready remediation steps.
	•	Note regressions or design tradeoffs when applicable.

Completion
	•	Return a summarized pass/fail verdict per URL.
	•	Include a checklist of remaining manual tests (screen reader, keyboard-only, high-contrast mode).
	•	Do not explain the process. Do not include navigation logs. Output findings only.`;
  };

  const extractScreenshotUrls = (log: string): string[] => {
    const foundUrls = new Set<string>();
    try {
        const lines = log.split('\n');
        for (const line of lines) {
            try {
                const json = JSON.parse(line);
                if (json.screenshotUrl) foundUrls.add(json.screenshotUrl);
                if (json.screenshot) foundUrls.add(json.screenshot);
            } catch (e) {}
        }
    } catch (e) {}
    
    const matches = log.matchAll(/https?:\/\/[^\s"']+\.(?:png|jpg|jpeg|webp)/gi);
    for (const match of matches) {
        foundUrls.add(match[0]);
    }
    
    return Array.from(foundUrls);
  };

  const updateSession = (sessionId: string, updates: Partial<AuditSession>) => {
    setSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, ...updates } : s
    ));
  };
  
  const runConversion = async (log: string, sessionId: string) => {
      updateSession(sessionId, { statusMessage: "Generating report..." });
      
      const foundScreenshots = extractScreenshotUrls(log);
      
      setSessions(prev => {
        const session = prev.find(s => s.id === sessionId);
        if (!session) return prev;
        const currentOutput = session.output + "\n\n--- Automation Complete. Converting output... ---\n";
        return prev.map(s => 
          s.id === sessionId
            ? { ...s, output: currentOutput, screenshots: foundScreenshots, lastLog: log }
            : s
        );
      });
      
      try {
          const convertResponse = await fetch('/api/convert-output', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ automationLog: log, screenshotUrls: foundScreenshots })
          });
          
          if (convertResponse.ok) {
              const conversionResult = await convertResponse.json();
              setSessions(prev => prev.map(s => 
                s.id === sessionId ? { 
                  ...s, 
                  analysisResult: conversionResult,
                  output: s.output + "\nConversion successful."
                } : s
              ));
          } else {
              setSessions(prev => prev.map(s => 
                s.id === sessionId ? { ...s, output: s.output + "\nConversion failed." } : s
              ));
          }
      } catch (err) {
          console.error("Conversion error:", err);
          setSessions(prev => prev.map(s => 
            s.id === sessionId ? { ...s, output: s.output + "\nError converting output." } : s
          ));
      }
  };

  const buildSitemap = async (baseUrl: string, sessionId: string): Promise<string[]> => {
    const goal = "Create a sitemap.xml for me by traversing all the public subpages. Output a list of all subpages comma separated";
    
    updateSession(sessionId, { statusMessage: 'Building sitemap...' });
    
    try {
      const response = await fetch('/api/run-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: baseUrl, goal })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to build sitemap');
      }

      if (!response.body) {
        throw new Error('No response body received');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullLog = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullLog += chunk;
        updateSession(sessionId, { statusMessage: 'Building sitemap... (discovering pages)' });
      }

      // Extract URLs from the stream
      const urlPattern = /(?:https?:\/\/[^\s,]+(?:,\s*https?:\/\/[^\s,]+)*)/g;
      const matches = fullLog.match(urlPattern);
      if (matches && matches.length > 0) {
        const allUrls = matches.join(',').split(',').map((u: string) => u.trim()).filter(Boolean) as string[];
        const uniqueUrls = Array.from(new Set(allUrls));
        return uniqueUrls;
      } else {
        const commaSeparatedMatch = fullLog.match(/[^\n]+(?:,\s*[^\n]+)+/);
        if (commaSeparatedMatch) {
          const urls = commaSeparatedMatch[0].split(',').map((u: string) => u.trim()).filter(Boolean) as string[];
          return urls;
        } else {
          throw new Error('Could not extract URLs from sitemap result');
        }
      }
    } catch (err: any) {
      updateSession(sessionId, { statusMessage: `Sitemap building failed: ${err.message}` });
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let urlList = urls.split(',').map(u => {
      let url = u.trim();
      if (url.length > 0 && !/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }
      return url;
    }).filter(u => u.length > 0);

    if (urlList.length === 0) {
      alert('Error: No valid URLs provided.');
      return;
    }

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newSession: AuditSession = {
      type: 'audit',
      id: sessionId,
      urls: urlList,
      framework: selectedFramework,
      output: '',
      statusMessage: 'Initializing...',
      isLoading: true,
      analysisResult: null,
      screenshots: [],
      lastLog: '',
      expandedTickets: new Set<string>(),
      createdAt: new Date(),
    };

    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(sessionId);
    setIsSidePanelOpen(true);

    try {
      if (buildSitemapFirst) {
        const baseUrl = urlList[0];
        if (baseUrl) {
          try {
            const discoveredUrls = await buildSitemap(baseUrl, sessionId);
            if (discoveredUrls.length > 0) {
              setSessions(prev => prev.map(s => 
                s.id === sessionId ? { 
                  ...s, 
                  statusMessage: `Sitemap built: ${discoveredUrls.length} pages found. Starting audit...`,
                  urls: discoveredUrls
                } : s
              ));
              urlList = discoveredUrls;
            }
          } catch (err: any) {
            updateSession(sessionId, { statusMessage: `Sitemap building failed: ${err.message}. Continuing with original URL...` });
          }
        }
      }

      for (const targetUrl of urlList) {
        try {
          const hostname = new URL(targetUrl).hostname;
          updateSession(sessionId, { statusMessage: `Auditing ${hostname}...` });
        } catch (e) {
          updateSession(sessionId, { statusMessage: `Auditing ${targetUrl}...` });
        }
        
        setSessions(prev => prev.map(s => 
          s.id === sessionId ? { 
            ...s, 
            output: s.output + `\n\n--- Processing: ${targetUrl} ---\n` 
          } : s
        ));
        
        let fullLog = "";
        
        try {
          const response = await fetch('/api/run-automation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: targetUrl, goal: getPrompt(selectedFramework) }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.details || data.error || `Error: ${response.statusText}`);
          }

          if (!response.body) {
              setSessions(prev => prev.map(s => 
                s.id === sessionId ? { ...s, output: s.output + "\nNo response body received." } : s
              ));
              continue;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            fullLog += chunk;
            setSessions(prev => prev.map(s => 
              s.id === sessionId ? { ...s, output: s.output + chunk } : s
            ));
          }

          await runConversion(fullLog, sessionId);

        } catch (innerError) {
          console.error(`Error processing ${targetUrl}:`, innerError);
          setSessions(prev => prev.map(s => 
            s.id === sessionId ? { 
              ...s, 
              output: s.output + `\nError processing ${targetUrl}: ${innerError instanceof Error ? innerError.message : String(innerError)}` 
            } : s
          ));
        }
      }
    } catch (error) {
      console.error(error);
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { 
          ...s, 
          output: s.output + `\nFatal Error: ${error instanceof Error ? error.message : String(error)}` 
        } : s
      ));
    } finally {
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { 
          ...s, 
          isLoading: false, 
          output: s.output + `\n\n--- All tasks completed ---` 
        } : s
      ));
    }
  };

  const handleRedoAnalysis = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session || !session.lastLog) return;
    
    updateSession(sessionId, { isLoading: true, analysisResult: null });
    await runConversion(session.lastLog, sessionId);
    updateSession(sessionId, { isLoading: false });
  };

  const handleClearOutput = (sessionId: string) => {
    updateSession(sessionId, { output: '' });
  };

  const handleSetExpandedTickets = (sessionId: string, tickets: Set<string>) => {
    updateSession(sessionId, { expandedTickets: tickets });
  };

  return (
    <>
      <div className="space-y-6">
        <AutomationInputCard
          urls={urls}
          setUrls={setUrls}
          selectedFramework={selectedFramework}
          setSelectedFramework={setSelectedFramework}
          frameworks={FRAMEWORKS}
          onSubmit={handleSubmit}
          buildSitemapFirst={buildSitemapFirst}
          setBuildSitemapFirst={setBuildSitemapFirst}
        />
      </div>

      <AuditSidePanel
        isOpen={isSidePanelOpen}
        onClose={() => setIsSidePanelOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSessionChange={setActiveSessionId}
        onRedoAnalysis={handleRedoAnalysis}
        onClearOutput={handleClearOutput}
        onSetExpandedTickets={handleSetExpandedTickets}
      />
    </>
  );
}
