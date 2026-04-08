import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface VendorCardProps {
  name: string;
  category: string;
  description: string;
  offerText: string;
  link: string;
  logoUrl?: string;
  isFeatured?: boolean;
}

export function VendorCard({ name, category, description, offerText, link, logoUrl, isFeatured }: VendorCardProps) {
  return (
    <Card className={`flex flex-col md:flex-row items-center overflow-hidden transition-all hover:bg-slate-800/80 ${isFeatured ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-slate-800'}`}>
      <div className="w-full md:w-48 h-48 md:h-full bg-slate-950 flex flex-col items-center justify-center shrink-0 border-b md:border-b-0 md:border-r border-slate-800 p-6">
         {logoUrl ? (
           <img src={logoUrl} alt={name} className="max-w-full max-h-full object-contain filter drop-shadow-md" />
         ) : (
           <div className="text-slate-400 font-bold text-4xl tracking-tighter">{name.substring(0, 2).toUpperCase()}</div>
         )}
      </div>
      <div className="flex-1 p-6 flex flex-col justify-between h-full">
        <div>
          <div className="text-xs uppercase tracking-widest text-emerald-500 font-semibold mb-2">{category}</div>
          <h3 className="text-2xl font-bold text-white mb-2">{name}</h3>
          <p className="text-slate-300 text-sm mb-6 leading-relaxed">{description}</p>
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-auto">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-500/20">
            <span className="text-emerald-500">✦</span> Partner Offer: {offerText}
          </div>
          <a href={link} target="_blank" rel="noopener noreferrer" className="w-full md:w-auto">
             <Button className="w-full md:w-auto whitespace-nowrap bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20">
               Claim Benefit
             </Button>
          </a>
        </div>
      </div>
    </Card>
  );
}
