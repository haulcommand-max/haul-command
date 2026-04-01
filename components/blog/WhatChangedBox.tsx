"use client";
import React from "react";

export interface ChangeItem {
  date: string;   // e.g. "Jan 2026"
  text: string;
}

export default function WhatChangedBox({ changes, year }: { changes: ChangeItem[]; year?: string }) {
  if (!changes || changes.length === 0) return null;

  return (
    <aside
      className="my-6 p-4 sm:p-5 rounded-xl"
      style={{
        background: "rgba(59,130,246,0.04)",
        border: "1px solid rgba(59,130,246,0.12)",
      }}
    >
      <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
        <span>📋</span>
        <span>What Changed{year ? ` in ${year}` : ""}</span>
      </h3>
      <ul className="space-y-2">
        {changes.map((change, i) => (
          <li key={i} className="flex items-start gap-3 text-xs">
            <span className="shrink-0 px-2 py-0.5 bg-blue-500/10 text-blue-400 font-bold rounded-md whitespace-nowrap mt-0.5">
              {change.date}
            </span>
            <span className="text-gray-300 leading-relaxed">{change.text}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
