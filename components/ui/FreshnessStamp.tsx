import React from 'react';
import { Clock } from 'lucide-react';

interface FreshnessStampProps {
  lastUpdated: string | Date;
  label?: string;
  className?: string;
}

export function FreshnessStamp({ lastUpdated, label = "Live Data Verified", className = "" }: FreshnessStampProps) {
  const dateStr = lastUpdated instanceof Date 
    ? lastUpdated.toISOString() 
    : (lastUpdated || new Date().toISOString());

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      <Clock className="w-3 h-3" />
      <span>{label} {new Date(dateStr).toLocaleString()}</span>
    </div>
  );
}
