"use client";

import { useState } from "react";
import { Mail, ArrowRight, Loader2 } from "lucide-react";

interface EmailSubscribeProps {
  title?: string;
  description?: string;
  ctaText?: string;
  source?: string;
}

export function EmailSubscribe({ 
  title = "Get the Heavy Haul Intel Brief", 
  description = "Join top operators receiving regulatory updates, corridor warnings, and high-paying load alerts directly.",
  ctaText = "Subscribe Free",
  source = "blog_footer"
}: EmailSubscribeProps) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setState("loading");
    // Simulate API call to track "lead_capture" event
    setTimeout(() => {
      setState("success");
      setEmail("");
    }, 1000);
  };

  if (state === "success") {
    return (
      <div className="p-8 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-6 h-6 text-green-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">You're on the list.</h3>
        <p className="text-green-200/70">Expect the next intel brief in your inbox soon.</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
        <div className="flex-1">
          <h3 className="text-2xl font-black text-white tracking-tight mb-2">{title}</h3>
          <p className="text-neutral-400 leading-relaxed">{description}</p>
        </div>
        <form onSubmit={handleSubmit} className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="operator@company.com"
            className="px-4 py-3 bg-black border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent min-w-[280px]"
            required
            disabled={state === "loading"}
          />
          <button 
            type="submit"
            disabled={state === "loading"}
            className="px-6 py-3 bg-white hover:bg-neutral-200 text-black font-bold rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
          >
            {state === "loading" ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                {ctaText}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
