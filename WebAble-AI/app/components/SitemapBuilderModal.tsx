"use client";

import { useState, useEffect } from 'react';

interface SitemapBuilderModalProps { initialUrl?: string; onSitemapComplete?: (urls: string[]) => void; compact?: boolean; }

export default function SitemapBuilderModal({ initialUrl = '', onSitemapComplete, compact = false }: SitemapBuilderModalProps) {
  const [url, setUrl] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sitemapResult, setSitemapResult] = useState<string | null>(null);
  const [streamOutput, setStreamOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => { if (initialUrl) setUrl(initialUrl); }, [initialUrl]);
  useEffect(() => { if (sitemapResult && onSitemapComplete) onSitemapComplete(sitemapResult.split(',').map(u => u.trim()).filter(Boolean)); }, [sitemapResult]);

  const goal = 'Create a sitemap.xml by traversing all public subpages. Output a comma-separated list of all subpage URLs.';

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true); setError(null); setSitemapResult(null); setStreamOutput(''); setStatus('running');
    let processedUrl = url.trim();
    if (processedUrl && !/^https?:\/\//i.test(processedUrl)) processedUrl = 'https://' + processedUrl;
    if (!processedUrl) { setError('Please enter a valid URL.'); setIsLoading(false); return; }

    try {
      const response = await fetch('/api/run-automation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: processedUrl, goal }) });
      if (!response.ok) { const d = await response.json(); throw new Error(d.details || d.error || 'Failed to run automation'); }
      if (!response.body) throw new Error('No response body');
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let fullLog = '';
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        const chunk = decoder.decode(value, { stream: true }); fullLog += chunk; setStreamOutput(fullLog);
        const matches = fullLog.match(/(?:https?:\/\/[^\s,]+(?:,\s*https?:\/\/[^\s,]+)*)/g);
        if (matches) { const unique = Array.from(new Set(matches.join(',').split(',').map(u => u.trim()).filter(Boolean))); if (unique.length > 0) setSitemapResult(unique.join(', ')); }
      }
      setStatus('completed');
    } catch (err: any) { setError(err.message); setStatus('failed'); } finally { setIsLoading(false); }
  };

  if (compact) return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" disabled={isLoading} className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all disabled:opacity-50 text-sm" />
        <button type="button" onClick={handleSubmit} disabled={isLoading || !url.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2.5 rounded-xl transition disabled:opacity-50 text-sm">{isLoading ? 'Building...' : 'Build Sitemap'}</button>
      </div>
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}
      {sitemapResult && <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">Found {sitemapResult.split(',').length} pages</div>}
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-8">
      <h2 className="text-xl font-medium mb-6 text-gray-900 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Build Sitemap</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div><label className="block text-xs font-medium uppercase tracking-wider text-gray-600 mb-2">Target URL</label><input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" required disabled={isLoading} className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all disabled:opacity-50" /></div>
        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}
        <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
          {isLoading ? <><svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>Building...</> : 'Build Sitemap'}
        </button>
      </form>

      {isLoading && streamOutput && (
        <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-2">Live Output</h4>
          <div className="bg-white rounded-lg p-3 border border-gray-200 max-h-48 overflow-auto"><pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">{streamOutput}</pre></div>
        </div>
      )}

      {sitemapResult && (
        <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-gray-900">Sitemap Results — {sitemapResult.split(',').length} pages found</h4>
            <button onClick={async () => { try { await navigator.clipboard.writeText(sitemapResult); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {} }} className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors px-4 py-2 rounded-lg hover:bg-gray-100 border border-gray-300">
              {copied ? <span className="text-emerald-600">Copied!</span> : <span>Copy</span>}
            </button>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 max-h-96 overflow-auto"><pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">{sitemapResult}</pre></div>
        </div>
      )}
    </div>
  );
}
