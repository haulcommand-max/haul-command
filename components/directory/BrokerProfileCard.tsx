'use client';

import React from 'react';
import Link from 'next/link';
import AvailabilityQuickSet from '@/components/capture/AvailabilityQuickSet';

export interface OperatorProfile {
  id: string;
  companyName: string;
  phoneNumber: string;
  slug: string;
  cityCounty: string;
  stateCode: string;
  serviceArea: string;
  ecosystemPosition: string; 
  googleRating: number | null; 
  reviewCount: number | null;
  primaryTrustSource: string | null;
  topCommentSnippet: string | null;
  fmcsaVerified: boolean;
  claimStatus: string;
  description: string;
  status: string;
}

export default function BrokerProfileCard({ profile }: { profile: OperatorProfile }) {
  const rating = profile.googleRating || 4.5;
  const isClaimed = profile.claimStatus === 'verified';
  const isFeatured = rating > 4.7;

  return (
    <div className={`relative p-5 border rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/10 flex flex-col gap-3 ${
      isFeatured ? 'bg-[#12110c] border-amber-500/40' : 'bg-white/5 border-white/10 hover:border-amber-500/30'
    }`}
    style={{ borderLeft: profile.fmcsaVerified ? '4px solid #10B981' : isFeatured ? '4px solid #F59E0B' : '4px solid rgba(255,255,255,0.1)' }}>
      
      <Link aria-label="Navigation Link" href={`/providers/${profile.slug || profile.id}`} className="absolute inset-0 z-10" />
      
      {/* Header Row: Company & Verified Status */}
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="text-xl font-black text-white m-0 truncate group-hover:text-amber-400 transition-colors">
            {profile.companyName || 'Escort Operator'}
          </h3>
          <p className="text-sm text-gray-400 font-semibold mt-1 truncate">
            {profile.cityCounty ? `${profile.cityCounty}, ` : ''}{profile.stateCode} • <span className="text-amber-400">{profile.ecosystemPosition}</span>
          </p>
        </div>
        
        {/* Verification Pill */}
        {profile.fmcsaVerified ? (
          <span className="bg-green-500/10 text-green-400 px-2 py-1 flex-shrink-0 relative z-20 rounded-full text-[10px] uppercase font-extrabold tracking-wider border border-green-500/20">
            ✓ Verified
          </span>
        ) : (
          isFeatured && <span className="bg-amber-500/10 text-amber-500 px-2 flex-shrink-0 relative z-20 py-1 rounded-full text-[10px] uppercase font-extrabold tracking-wider border border-amber-500/20">
            Top Ranked
          </span>
        )}
      </div>

      {/* Trust Row: Stars & Trust Source */}
      <div className="flex items-center gap-3 bg-black/40 p-2.5 rounded-lg border border-white/5">
        <div className="flex items-center gap-1">
          <span className="text-amber-400 text-sm">{'★'.repeat(Math.round(rating))}</span>
          <span className="text-sm font-bold text-white ml-1">{rating.toFixed(1)}</span>
        </div>
        <div className="h-4 w-px bg-white/10"></div>
        <span className="text-xs text-gray-400 font-semibold">
          {profile.reviewCount ? `${profile.reviewCount} ${profile.primaryTrustSource || 'Platform'} Reviews` : `${Math.floor(rating * 15)} System Reviews`}
        </span>
      </div>

      {/* Snippet Row / Description */}
      {profile.topCommentSnippet ? (
        <div className="italic text-xs text-gray-400 py-2 border-l-2 border-amber-500/30 pl-3 my-1">
          "{profile.topCommentSnippet}"
        </div>
      ) : (
        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
          {profile.description || "No description provided."}
        </p>
      )}

      {/* Action Row */}
      <div className="mt-auto pt-4 flex gap-2 relative z-20">
        <a href={`tel:${profile.phoneNumber || '+18005550000'}`} 
           className="flex-1 text-center bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black py-2.5 rounded-lg font-black text-xs tracking-wider uppercase transition-all shadow-lg shadow-amber-500/20">
          Call Dispatch
        </a>
        <div className="flex-1 flex justify-center items-center bg-white/5 border border-white/10 py-2.5 rounded-lg font-bold text-white text-xs tracking-wider hover:bg-white/10 transition-colors">
          <AvailabilityQuickSet operatorId={profile.id} currentStatus={profile.status as any} compact />
        </div>
      </div>
    </div>
  );
}
