import React from "react";

export function Table({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className="relative w-full overflow-auto">
      <table className={`w-full caption-bottom text-sm text-slate-300 ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <thead className={`border-b border-slate-800 ${className}`}>{children}</thead>;
}

export function TableBody({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <tbody className={`[&_tr:last-child]:border-0 ${className}`}>{children}</tbody>;
}

export function TableRow({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <tr
      className={`border-b border-slate-800/60 transition-colors hover:bg-slate-800/40 data-[state=selected]:bg-slate-800 ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableHead({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <th
      className={`h-10 px-4 text-left align-middle font-medium text-slate-400 [&:has([role=checkbox])]:pr-0 ${className}`}
    >
      {children}
    </th>
  );
}

export function TableCell({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <td
      className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`}
    >
      {children}
    </td>
  );
}
