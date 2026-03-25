'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Plus, ArrowRight, ShieldAlert, CheckCircle, Database } from 'lucide-react';

export default function DataQualityAudit() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCandidates();
  }, []);

  async function fetchCandidates() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('operators')
        .select('*, operator_phones(phone)')
        .eq('needs_review', true)
        .order('claim_value_score', { ascending: false });

      if (error) throw error;
      setCandidates(data || []);
    } catch (err) {
      console.error('Failed to fetch merge candidates:', err);
    } finally {
      setLoading(false);
    }
  }

  async function resolveMerge(id: string, action: 'merge' | 'insert' | 'discard') {
    try {
      // In production, this would call an API route to securely execute the merge logic.
      if (action === 'discard') {
        await supabase.from('operators').delete().eq('id', id);
      } else {
        await supabase.from('operators').update({ needs_review: false }).eq('id', id);
      }
      setCandidates(c => c.filter(op => op.id !== id));
    } catch (err) {
      console.error('Failed to resolve merge candidate', err);
      alert('Error resolving candidate');
    }
  }

  return (
    <div className="flex-1 bg-neutral-900 min-h-screen text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header>
          <div className="flex items-center gap-3 text-cyan-500 mb-2">
            <Database className="w-5 h-5" />
            <span className="font-semibold uppercase tracking-wider text-sm">AntiGravity Pipeline</span>
          </div>
          <h1 className="text-4xl font-bold font-sans">Data Quality Audit</h1>
          <p className="text-neutral-400 mt-2">
            Review Gemini & Claude flagged operator records from the automated competitor ingestion pipeline (CL-09).
          </p>
        </header>

        {loading ? (
          <div className="flex items-center justify-center p-20 text-neutral-500">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-3 font-medium">Fetching active queue...</span>
          </div>
        ) : candidates.length === 0 ? (
          <div className="bg-neutral-800/50 border border-neutral-800 rounded-xl p-16 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Queue is Empty</h3>
            <p className="text-neutral-400">
              All merged candidates and flagged ingestion records have been processed.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {candidates.map((op) => (
              <div key={op.id} className="bg-neutral-800 border border-neutral-700 rounded-xl p-6 transition-colors hover:border-neutral-600">
                <div className="flex flex-col lg:flex-row gap-6 justify-between items-start">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold">{op.company_name}</h3>
                      {op.competitor_sourced && (
                        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded text-xs font-bold uppercase tracking-wider ring-1 ring-amber-500/30">
                          {op.competitor_source || 'Competitor'} Sourced
                        </span>
                      )}
                      {op.claim_value_score > 0.8 && (
                        <span className="px-2.5 py-1 bg-cyan-500/10 text-cyan-400 rounded text-xs font-bold uppercase tracking-wider ring-1 ring-cyan-500/30">
                          High Value
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-neutral-400">
                      <div>
                        <span className="block text-neutral-500 mb-1">Location</span>
                        <span className="text-white">{op.city || 'N/A'}, {op.state} ({op.country_code})</span>
                      </div>
                      <div>
                        <span className="block text-neutral-500 mb-1">Phone</span>
                        <span className="text-white">{op.operator_phones?.[0]?.phone || 'Unknown'}</span>
                      </div>
                      <div>
                        <span className="block text-neutral-500 mb-1">Confidence</span>
                        <span className="text-white">{(op.confidence_score * 100).toFixed(0)}%</span>
                      </div>
                      <div>
                        <span className="block text-neutral-500 mb-1">Value Score</span>
                        <span className="text-white">{op.claim_value_score?.toFixed(2) || 'N/A'}</span>
                      </div>
                    </div>
                    
                    {op.raw_payload && (
                      <div className="mt-4 p-4 bg-black/40 rounded-lg overflow-auto text-xs text-neutral-300 font-mono">
                        {JSON.stringify(op.raw_payload, null, 2)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 min-w-48 shrink-0">
                    <button
                      onClick={() => resolveMerge(op.id, 'insert')}
                      className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-sm font-semibold transition-colors text-white"
                    >
                      Insert Fresh
                    </button>
                    <button
                      onClick={() => resolveMerge(op.id, 'merge')}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-semibold transition-colors text-white flex items-center justify-center gap-2"
                    >
                      Merge Match <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => resolveMerge(op.id, 'discard')}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-sm font-semibold transition-colors"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
