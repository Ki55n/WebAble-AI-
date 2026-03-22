"use client";

import { useState, useRef, useEffect } from 'react';

interface Framework { id: string; name: string; description: string; }
interface AutomationInputCardProps {
  urls: string; setUrls: (urls: string) => void;
  selectedFramework: string; setSelectedFramework: (f: string) => void;
  frameworks: Framework[]; onSubmit: (e: React.FormEvent) => void;
  buildSitemapFirst: boolean; setBuildSitemapFirst: (v: boolean) => void;
  isSubmitting?: boolean;
}

export default function AutomationInputCard({ urls, setUrls, selectedFramework, setSelectedFramework, frameworks, onSubmit, buildSitemapFirst, setBuildSitemapFirst, isSubmitting }: AutomationInputCardProps) {
  const [isFrameworkMenuOpen, setIsFrameworkMenuOpen] = useState(false);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const frameworkRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (frameworkRef.current && !frameworkRef.current.contains(e.target as Node)) setIsFrameworkMenuOpen(false);
      if (optionsRef.current && !optionsRef.current.contains(e.target as Node)) setIsOptionsMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-8 transition-all relative overflow-visible card-shadow hover:card-shadow-hover">
      <h2 className="text-xl font-medium mb-6 text-gray-900 flex items-center gap-3 relative z-10">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>Audit your site now</span>
      </h2>

      <form onSubmit={onSubmit} className="space-y-5 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <label htmlFor="urls" className="block text-xs font-medium uppercase tracking-wider text-gray-600 flex-1">Target URL(s)</label>
            <div className="relative" ref={frameworkRef}>
              <button type="button" onClick={() => setIsFrameworkMenuOpen(!isFrameworkMenuOpen)} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all">
                <span className="hidden md:inline text-xs font-medium text-gray-600 uppercase tracking-wider">Framework:</span>
                <span className="text-xs font-medium">{selectedFramework}</span>
                <svg className={`w-4 h-4 transition-transform ${isFrameworkMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {isFrameworkMenuOpen && (
                <div className="absolute z-50 right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                  <div className="py-1 max-h-64 overflow-auto">
                    {frameworks.map(f => (
                      <button key={f.id} type="button" onClick={() => { setSelectedFramework(f.id); setIsFrameworkMenuOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${selectedFramework === f.id ? 'bg-emerald-50 text-emerald-700' : 'text-gray-900'}`}>
                        <div><span className="font-medium">{f.id}</span><span className="block text-xs text-gray-500 mt-0.5">{f.description}</span></div>
                        {selectedFramework === f.id && <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="relative" ref={optionsRef}>
            <div className="relative flex items-center">
              <button type="button" onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)} className="absolute left-3 z-10 p-1.5 text-gray-400 hover:text-gray-600 transition-colors" title="Options">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              </button>
              <input id="urls" type="text" value={urls} onChange={e => setUrls(e.target.value)} placeholder="https://example.com, https://another.com" required className={`w-full py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${buildSitemapFirst ? 'pl-11 pr-32' : 'pl-11 pr-4'}`} />
              {buildSitemapFirst && (
                <div className="absolute right-2 z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
                    <button type="button" onClick={() => setBuildSitemapFirst(false)} className="p-0.5 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-600 transition-colors">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <span className="text-sm font-medium text-emerald-700">Build sitemap</span>
                  </div>
                </div>
              )}
            </div>

            {isOptionsMenuOpen && (
              <div className="absolute z-50 left-0 top-full mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" id="build-sitemap" checked={buildSitemapFirst} onChange={e => { setBuildSitemapFirst(e.target.checked); if (e.target.checked) setTimeout(() => setIsOptionsMenuOpen(false), 200); }} className="mt-0.5 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500" />
                    <div>
                      <label htmlFor="build-sitemap" className="text-sm font-medium text-gray-900 cursor-pointer block">Build sitemap first</label>
                      <p className="text-xs text-gray-600 mt-1">Automatically discover all public pages before auditing. <span className="font-semibold text-amber-700">Adds 2–3 minutes.</span></p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <button type="submit" disabled={!urls.trim() || isSubmitting} className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-semibold px-6 py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
          {isSubmitting ? (
            <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>Starting audit...</>
          ) : 'Run Audit'}
        </button>
      </form>
    </div>
  );
}
