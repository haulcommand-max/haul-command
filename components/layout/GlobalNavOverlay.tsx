'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export function GlobalNavOverlay() {
  const pathname = usePathname();
  
  // Don't show on the very root homepage
  if (pathname === '/') return null;

  return (
    <div style={{
      position: 'fixed',
      top: 24,
      left: 24,
      zIndex: 99999,
    }}>
      <Link href="/" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.2s ease-in-out',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
      }}
      >
        <Image src="/haul-command-logo.svg" alt="Haul Command" width={40} height={40} className="w-10 h-10 object-contain" onError={(e: any) => { e.currentTarget.src = '/icon.png'; }} /> 
        <span style={{ marginLeft: 12, fontWeight: 800, fontSize: 18, letterSpacing: '0.05em', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>HAUL COMMAND</span>
      </Link>
    </div>
  );
}
