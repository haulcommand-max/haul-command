'use client';

import Link from 'next/link';
import { Check, Star, TrendingUp, Shield } from 'lucide-react';
import type { LevelCardVM } from '@/lib/training/mappers';

interface TrainingLevelCardProps {
  level: LevelCardVM;
  isCurrentLevel?: boolean;
  onPurchase?: (slug: string) => void;
}

export default function TrainingLevelCard({ level, isCurrentLevel = false, onPurchase }: TrainingLevelCardProps) {
  const isElite = level.badgeSlug === 'elite';
  const isCertified = level.badgeSlug === 'certified';

  return (
    <div className={`relative border rounded-xl p-6 flex flex-col gap-4 transition-all
      ${level.isMostPopular
        ? 'border-yellow-500/50 bg-yellow-500/5 shadow-lg shadow-yellow-500/10'
        : 'border-white/10 bg-white/[0.02] hover:border-white/20'
      }
      ${isCurrentLevel ? 'ring-1 ring-green-500/40' : ''}
    `}>
      {level.isMostPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-yellow-500 text-black text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1">
            <Star size={10} fill="currentColor" /> Most Popular
          </span>
        </div>
      )}

      {isCurrentLevel && (
        <div className="absolute -top-3 right-4">
          <span className="bg-green-500 text-black text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
            Current
          </span>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded border
            ${isElite ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10'
              : isCertified ? 'text-yellow-300 border-yellow-300/30 bg-yellow-300/5'
              : 'text-gray-400 border-gray-400/20 bg-gray-400/5'}`}>
            {level.badgeLabel}
          </span>
        </div>
        <h3 className="text-xl font-bold text-white">{level.name}</h3>
        <p className="text-sm text-gray-400 mt-1 leading-relaxed">{level.description}</p>
      </div>

      {/* Price */}
      <div className="border-t border-white/5 pt-4">
        <div className="text-2xl font-black text-white">{level.priceLabel}</div>
        {level.annualRefreshLabel && (
          <div className="text-xs text-gray-500 mt-0.5">{level.annualRefreshLabel}</div>
        )}
      </div>

      {/* Rank / Trust effects */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            <TrendingUp size={12} />
            Rank Boost
          </div>
          <div className="text-lg font-bold text-green-400">{level.rankWeightPct}</div>
        </div>
        <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            <Shield size={12} />
            Trust Weight
          </div>
          <div className="text-lg font-bold text-blue-400">{level.trustWeightPct}</div>
        </div>
      </div>

      {/* CTA */}
      {onPurchase ? (
        <button
          onClick={() => onPurchase(level.slug)}
          className={`w-full py-3 rounded-lg font-bold text-sm transition-all
            ${level.isMostPopular
              ? 'bg-yellow-500 hover:bg-yellow-400 text-black'
              : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
        >
          {isCurrentLevel ? 'View Details' : `Get ${level.name}`}
        </button>
      ) : (
        <Link
          href={level.href}
          className={`w-full py-3 rounded-lg font-bold text-sm transition-all text-center
            ${level.isMostPopular
              ? 'bg-yellow-500 hover:bg-yellow-400 text-black'
              : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
        >
          {isCurrentLevel ? 'View Details' : `Get ${level.name}`}
        </Link>
      )}

      <p className="text-[10px] text-gray-600 text-center leading-relaxed">
        Haul Command on-platform credential. Not a legal license.
      </p>
    </div>
  );
}
