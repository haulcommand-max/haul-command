import React from "react";

export interface AnswerBlockProps {
  queryTitle: string;
  quickSummaryMarkdown: string;
  detailedContentMarkdown?: string;
}

export function AnswerBlock({ queryTitle, quickSummaryMarkdown, detailedContentMarkdown }: AnswerBlockProps) {
  return (
    <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-8">
      <h1 className="text-4xl font-black text-white capitalize tracking-tighter mb-4">{queryTitle}</h1>
      
      {/* The AI Snippet Box */}
      <div className="bg-gray-900 border-l-4 border-l-yellow-500 p-6 rounded mb-8 shadow-inner text-xl text-gray-200 leading-relaxed font-medium">
        {quickSummaryMarkdown}
      </div>

      {detailedContentMarkdown && (
         <div className="prose prose-invert max-w-none text-gray-400">
            {/* Extremely simple parse representation for demo */}
            {detailedContentMarkdown.split('\n').map((para, i) => (
                <p key={i} className="mb-4">{para}</p>
            ))}
         </div>
      )}
    </div>
  );
}
