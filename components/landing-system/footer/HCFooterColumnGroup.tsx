import React from 'react';
import { FooterColumn } from '../types/shell-ia.types';
import { HCFooterLinkColumn } from './HCFooterLinkColumn';

export function HCFooterColumnGroup({ columns }: { columns: FooterColumn[] }) {
  return (
    <>
      {columns.map((column, i) => (
        <HCFooterLinkColumn key={i} column={column} />
      ))}
    </>
  );
}
