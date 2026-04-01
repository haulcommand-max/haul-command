"use client";
import React from "react";

export interface QuickAnswer {
  headline: string;
  summary: string;
  facts: { label: string; value: string }[];
  sourceNote?: string;
}

export default function QuickAnswerBox({ data }: { data: QuickAnswer }) {
  return (
    <div
      className="relative my-8 p-5 sm:p-6 rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(245,158,11,0.02) 100%)",
        border: "1px solid rgba(245,158,11,0.18)",
      }}
    >
      {/* Corner badge */}
      <div className="absolute top-3 right-3 px-2 py-0.5 bg-amber-500/15 text-amber-400 text-[9px] font-black uppercase tracking-widest rounded-full">
        Quick Answer
      </div>

      <h2 className="text-base sm:text-lg font-bold text-white mb-2 pr-20">
        {data.headline}
      </h2>
      <p className="text-sm text-gray-300 leading-relaxed mb-4">
        {data.summary}
      </p>

      {/* Facts grid */}
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.facts.map((fact) => (
          <div
            key={fact.label}
            className="flex items-baseline gap-2 px-3 py-2 rounded-lg"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <dt className="text-xs text-gray-500 shrink-0">{fact.label}</dt>
            <dd className="text-sm font-semibold text-white">{fact.value}</dd>
          </div>
        ))}
      </dl>

      {data.sourceNote && (
        <p className="mt-3 text-[10px] text-gray-600 leading-relaxed">
          {data.sourceNote}
        </p>
      )}
    </div>
  );
}
