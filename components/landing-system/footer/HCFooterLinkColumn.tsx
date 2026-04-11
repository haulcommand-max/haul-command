import React from 'react';
import Link from 'next/link';
import { FooterColumn } from '../types/shell-ia.types';

export function HCFooterLinkColumn({ column }: { column: FooterColumn }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold tracking-wider text-slate-300 uppercase">
        {column.heading}
      </h3>
      <ul className="flex flex-col gap-3">
        {column.links.map((link) => (
          <li key={link.href}>
            <Link 
              href={link.href}
              className="text-sm text-slate-500 hover:text-hc-gold-500 transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
