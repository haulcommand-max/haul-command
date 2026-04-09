'use client';

import { usePathname } from 'next/navigation';

export function GlobalBackground() {
  const pathname = usePathname() || '';

  // 1. Define the routing logic for specific backgrounds
  let bgImage = '/images/premium_logistics_hero.png'; // Global Default
  let bgPosition = 'center 30%';
  let opacity = '0.10';

  if (pathname.startsWith('/directory') || pathname.startsWith('/place')) {
    bgImage = '/images/directory_hero.png';
  } else if (pathname.startsWith('/training')) {
    bgImage = '/images/training_hero.png';
    bgPosition = 'center 20%';
  } else if (pathname.startsWith('/tools') || pathname.startsWith('/corridors')) {
    bgImage = '/images/tools_hero.png';
  } else if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    bgImage = '/images/dashboard_hero.png';
  }

  // 2. Render the faded background fixed to the viewport
  return (
    <>
      <div 
        className="fixed inset-0 z-[-2] pointer-events-none transition-all duration-1000" 
        style={{ 
          backgroundImage: `url('${bgImage}')`, 
          backgroundSize: "cover", 
          backgroundPosition: bgPosition,
          backgroundAttachment: "fixed",
          opacity: opacity
        }} 
      />
      <div className="fixed inset-0 bg-gradient-to-b from-[#0a0a0a]/70 via-[#0a0a0a]/90 to-[#0A0A0A] z-[-1] pointer-events-none" />
    </>
  );
}
