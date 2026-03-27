import React from 'react';
import Image from 'next/image';
import { categoryIcon, categoryLabel } from '@/lib/directory-helpers';

interface EntityAvatarProps {
  entityName: string;
  roleSlug: string;
  countryCode: string; // ISO-2 e.g. US, CA, AU
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isClaimed?: boolean;
}

export default function EntityAvatar({
  entityName,
  roleSlug,
  countryCode,
  imageUrl,
  size = 'md',
  isClaimed = false
}: EntityAvatarProps) {
  const sMap = {
    sm: 'w-10 h-10 text-xs',
    md: 'w-16 h-16 text-xl',
    lg: 'w-24 h-24 text-3xl',
    xl: 'w-32 h-32 text-5xl'
  };

  const dimMap = { sm: 40, md: 64, lg: 96, xl: 128 };
  const sizeClasses = sMap[size];

  // Assign a stable deterministic pseudo-random background color from a sleek palette
  const colors = ['#0f172a', '#1e293b', '#334155', '#475569', '#1e1b4b'];
  const charCodeSum = entityName.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const bgColor = colors[charCodeSum % colors.length];

  return (
    <div className={`relative ${sizeClasses} rounded-full flex items-center justify-center shrink-0 border-2 border-slate-800 group shadow-md`} style={{ backgroundColor: bgColor }}>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`Logo for ${entityName}`}
          width={dimMap[size]}
          height={dimMap[size]}
          className="rounded-full object-cover w-full h-full"
          loading="lazy"
        />
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full rounded-full">
          <div className="opacity-80 flex items-center justify-center h-full w-full">
            {categoryIcon(roleSlug)}
          </div>
        </div>
      )}

      {/* Country Visual Variation Badge */}
      <div 
        className="absolute bottom-0 right-0 rounded-full border border-black bg-slate-800 flex items-center justify-center shadow-lg overflow-hidden"
        style={{ width: `${Math.max(16, dimMap[size]/3.5)}px`, height: `${Math.max(16, dimMap[size]/3.5)}px` }}
        title={`Operating Region: ${countryCode.toUpperCase()}`}
      >
        <Image
          src={`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`}
          alt={countryCode}
          layout="fill"
          className="object-cover"
        />
      </div>

      {/* Verification / Trust Badge */}
      {isClaimed && (
        <div className="absolute top-0 right-1 w-3 h-3 md:w-4 md:h-4 bg-emerald-500 rounded-full border-2 border-black flex items-center justify-center shadow-[0_0_8px_rgba(16,185,129,0.5)]">
          <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  );
}
