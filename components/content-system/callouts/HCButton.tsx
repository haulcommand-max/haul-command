import React from 'react';
import Link from 'next/link';

export function HCButton({ 
  children, 
  href, 
  variant = 'primary', 
  onClick, 
  className = '' 
}: { 
  children: React.ReactNode, 
  href?: string, 
  variant?: 'primary' | 'secondary' | 'ghost', 
  onClick?: () => void, 
  className?: string 
}) {
  const baseClasses = "inline-flex items-center justify-center font-bold transition-all duration-200 focus:outline-none min-h-[48px] px-6 text-sm uppercase tracking-widest";
  
  const variants = {
    primary: "bg-gradient-to-br from-[#C6923A] to-[#8A6428] text-white rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.4)] hover:shadow-[0_4px_24px_rgba(198,146,58,0.3)] hover:-translate-y-[1px]",
    secondary: "bg-[#16181B] text-[#E0B05C] border border-[#23262B] rounded-xl hover:border-[#8A6428] hover:bg-[#1E2028]",
    ghost: "bg-transparent text-[#9CA3AF] hover:text-[#F3F4F6] rounded-xl hover:bg-[rgba(255,255,255,0.05)]",
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
