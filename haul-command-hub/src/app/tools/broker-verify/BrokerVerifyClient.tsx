'use client';

import { useState } from 'react';

export default function BrokerVerifyClient() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!query) return;

    setIsSearching(true);
    setResult(null);

    // Simulate API delay for FMCSA / DB lookup
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock response
    if (query.match(/^\d+$/)) {
      setResult({
        status: 'VERIFIED',
        company: 'Example Logistics LLC',
        mcNumber: query,
        dotNumber: (parseInt(query) + 12000).toString(),
        phone: '+1 (555) ' + query.slice(0, 3) + '-' + query.slice(3, 7) || '0123',
        riskScore: 'Low',
        lastVerified: new Date().toISOString().split('T')[0],
        bonds: 'Active ($75,000)'
      });
    } else {
      setResult({
        status: 'UNVERIFIED',
        message: 'No active MC records found. Check for name variations or use MC Number directly.',
        company: query
      });
    }

    setIsSearching(false);
  }

  return (
    <div className="bg-black/40 border border-white/10 rounded-2xl p-6 md:p-10 shadow-2xl backdrop-blur-sm max-w-4xl mx-auto">
      <form onSubmit={handleVerify} className="flex flex-col md:flex-row gap-4 mb-8">
        <input 
          type="text" 
          placeholder="Enter Broker Name, MC Number, or USDOT..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-grow bg-black/60 border border-white/10 rounded-lg px-6 py-4 text-white focus:outline-none focus:border-accent text-lg"
        />
        <button 
          type="submit" 
          disabled={isSearching || !query}
          className="bg-accent text-black font-bold py-4 px-8 rounded-lg hover:bg-white transition-colors flex justify-center items-center gap-2 shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isSearching ? 'Verifying...' : 'Verify Broker'}
        </button>
      </form>

      {result && (
        <div className={`p-8 rounded-xl border transition-all duration-500 ag-slide-up ${result.status === 'VERIFIED' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${result.status === 'VERIFIED' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-500'}`}>
              {result.status === 'VERIFIED' ? '✓' : '✗'}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">{result.company}</h3>
              <p className={`text-sm tracking-widest uppercase font-bold ${result.status === 'VERIFIED' ? 'text-green-500' : 'text-red-500'}`}>
                {result.status}
              </p>
            </div>
          </div>

          {result.status === 'VERIFIED' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <span className="block text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">MC Number</span>
                <span className="text-white font-mono">{result.mcNumber}</span>
              </div>
              <div>
                <span className="block text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">DOT Number</span>
                <span className="text-white font-mono">{result.dotNumber}</span>
              </div>
              <div>
                <span className="block text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Risk Score</span>
                <span className="text-green-400 font-bold">{result.riskScore}</span>
              </div>
              <div>
                <span className="block text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Bonds/Insurance</span>
                <span className="text-white">{result.bonds}</span>
              </div>
            </div>
          ) : (
             <p className="text-gray-400">
               {result.message}
             </p>
          )}

          {result.status === 'VERIFIED' && (
             <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center text-sm">
                <span className="text-gray-500">Last Verified: {result.lastVerified} via FMCSA Sync</span>
                <button className="text-accent hover:underline">Report Issue</button>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
