'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function HCGlobalSearchLauncher({ placeholder }: { placeholder?: string }) {
  const [q, setQ] = useState('');
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`/directory?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">🔍</span>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder ?? 'Search escorts, corridors, locations…'}
          className="w-full pl-12 pr-28 py-4 bg-white/[0.04] border border-white/10 rounded-2xl text-white placeholder:text-gray-600 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all text-sm"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-accent text-black px-5 py-2 rounded-xl font-bold text-xs hover:bg-yellow-400 transition-colors"
        >
          Search
        </button>
      </div>
    </form>
  );
}
