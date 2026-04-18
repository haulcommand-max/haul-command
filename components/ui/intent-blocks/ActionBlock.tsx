import React from "react";
import Link from "next/link";
import { MasterIntent } from "./IntentRouter";

export interface ActionBlockProps {
  primaryAction: {
    label: string;
    intent: MasterIntent;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
}

export function ActionBlock({ primaryAction, secondaryAction }: ActionBlockProps) {
  return (
    <div className="bg-gray-900/80 p-8 rounded border border-gray-700 flex flex-col items-center text-center">
       <h3 className="text-gray-400 font-mono text-xs uppercase tracking-widest mb-6">Operational Next Step</h3>
       
       <Link 
          href={primaryAction.href}
          className="w-full md:w-auto bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-wide px-12 py-4 rounded shadow-[0_0_20px_rgba(34,197,94,0.3)] transition text-lg"
       >
          {primaryAction.label}
       </Link>
       
       {secondaryAction && (
          <Link href={secondaryAction.href} className="mt-4 text-sm text-yellow-500 hover:text-yellow-400 font-bold uppercase underline underline-offset-4">
             {secondaryAction.label}
          </Link>
       )}
    </div>
  );
}
