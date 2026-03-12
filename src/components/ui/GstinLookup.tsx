'use client';

import { useState } from 'react';

interface GstinLookupProps {
  onFound?: (data: { gstin: string; legalName?: string; tradeName?: string; address?: string; state?: string }) => void;
  initialGstin?: string;
}

export default function GstinLookup({ onFound, initialGstin = '' }: GstinLookupProps) {
  const [gstin, setGstin] = useState(initialGstin);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ legalName?: string; tradeName?: string; address?: string; state?: string; status?: string; note?: string; error?: string } | null>(null);

  const lookup = async () => {
    if (!gstin || gstin.length !== 15) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/gstin?gstin=${gstin.trim().toUpperCase()}`);
      const data = await res.json();
      if (!res.ok) { setResult({ error: data.error || 'Lookup failed' }); return; }
      setResult(data);
      onFound?.(data);
    } catch {
      setResult({ error: 'Network error. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={gstin}
          onChange={e => { setGstin(e.target.value.toUpperCase()); setResult(null); }}
          onKeyDown={e => e.key === 'Enter' && lookup()}
          placeholder="Enter GSTIN (e.g. 29ABCDE1234F1Z5)"
          maxLength={15}
          className="flex-1 bg-black/30 border border-[#2a2836] rounded-xl px-3 py-2.5 text-sm font-mono text-white placeholder:text-[#5a5668] placeholder:font-sans focus:outline-none focus:border-amber-500/50 uppercase"
        />
        <button
          onClick={lookup}
          disabled={loading || gstin.length !== 15}
          className="bg-amber-500 hover:bg-amber-400 disabled:bg-[#2a2836] disabled:text-[#5a5668] text-black text-sm font-bold px-4 rounded-xl transition-colors whitespace-nowrap"
        >
          {loading ? '⏳' : '🔍 Lookup'}
        </button>
      </div>

      {result && !result.error && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 space-y-1">
          {result.legalName && <div className="text-sm font-bold text-white">{result.legalName}</div>}
          {result.tradeName && result.tradeName !== result.legalName && (
            <div className="text-xs text-[#8a8695]">Trade: {result.tradeName}</div>
          )}
          {result.address && <div className="text-xs text-[#8a8695]">📍 {result.address}</div>}
          {result.status && <div className="text-xs"><span className="text-green-400">● {result.status}</span></div>}
          {result.note && <div className="text-[10px] text-orange-400 mt-1">{result.note}</div>}
          <button
            onClick={() => onFound?.({ gstin, ...result })}
            className="text-xs text-amber-400 font-bold hover:underline mt-1"
          >
            ← Use this data
          </button>
        </div>
      )}
      {result?.error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-400">{result.error}</div>
      )}
    </div>
  );
}
