"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Mic, MapPin, Briefcase, Navigation, ShieldAlert, Cpu } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

interface SearchPrediction {
  id: string;
  type: "entity" | "route" | "permit" | "rare_role";
  label: string;
  subtitle?: string;
  url: string;
  confidence: number;
}

export function GlobalOmniSearch() {
  const [query, setQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [predictions, setPredictions] = useState<SearchPrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Web Speech API for Voice Search
  const toggleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice search is not supported in this browser.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result) => result.transcript)
        .join("");
      setQuery(transcript);
      simulateTypoTolerantPrediction(transcript);
      setIsOpen(true);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    if (isListening) {
      recognition.stop();
    } else {
      setQuery("");
      recognition.start();
    }
  };

  // Active TypeSense Search Integration (Wave 3)
  const simulateTypoTolerantPrediction = async (input: string) => {
    if (input.length < 2) {
      setPredictions([]);
      return;
    }
    
    // Check if we have supabase client initialized
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    if (!supabaseUrl) return;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase.functions.invoke("discovery-search-core", {
      body: { action: "search", query: input }
    });

    if (error || !data || !data.ok || !data.results) return;

    const results: SearchPrediction[] = [];
    const [profilesData, corridorsData, glossaryData] = data.results;

    if (corridorsData?.hits) {
      corridorsData.hits.forEach((h: any) => {
         const doc = h.document;
         results.push({ id: `c-${doc.id}`, type: "route", label: `${doc.origin_state || ''} to ${doc.dest_state || doc.corridor_id}`, subtitle: "Live Rates & Availability", url: `/rates/corridors/${doc.corridor_id.toLowerCase()}`, confidence: 0.99 });
      });
    }

    if (profilesData?.hits) {
      profilesData.hits.forEach((h: any) => {
         const doc = h.document;
         const isRare = doc.equipment_tags?.includes("bucket_truck") || doc.equipment_tags?.includes("height_pole");
         results.push({ id: `p-${doc.id}`, type: isRare ? "rare_role" : "entity", label: doc.display_name, subtitle: `${doc.home_base_state || 'US'} · ${doc.vehicle_type?.replace(/_/g, " ")}`, url: `/directory/profile/${doc.slug}`, confidence: 0.95 });
      });
    }

    if (glossaryData?.hits) {
      glossaryData.hits.forEach((h: any) => {
         const doc = h.document;
         results.push({ id: `g-${doc.id}`, type: "permit", label: doc.term, subtitle: "Glossary & Regulations", url: `/glossary/${doc.slug}`, confidence: 0.88 });
      });
    }

    setPredictions(results);
    setIsOpen(true);
  };

  const IconMap = {
    entity: Briefcase,
    route: MapPin,
    permit: ShieldAlert,
    rare_role: Cpu,
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl mx-auto z-50">
      <div className="relative flex items-center w-full h-12 rounded-full bg-slate-900 border border-slate-700 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500 shadow-lg overflow-hidden transition-all duration-200">
        <div className="pl-4 text-slate-400">
          <Search size={20} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            simulateTypoTolerantPrediction(e.target.value);
          }}
          onFocus={() => { if (query.length >= 2) setIsOpen(true) }}
          placeholder="Search anything (e.g., 'Texas escorts', 'Bucket trucks in AZ', 'Route rules')..."
          className="w-full bg-transparent border-none text-white px-4 py-2 focus:outline-none placeholder-slate-500 font-medium"
        />
        <button
          onClick={toggleVoiceSearch}
          className={`pr-4 pl-2 h-full flex items-center justify-center transition-colors ${isListening ? 'text-orange-500 animate-pulse' : 'text-slate-400 hover:text-white'}`}
          title="Voice Search"
        >
          <Mic size={20} />
        </button>
      </div>

      {/* Predictive Dropdown */}
      {isOpen && predictions.length > 0 && (
        <div className="absolute top-14 left-0 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md">
          <div className="flex flex-col py-2">
            {predictions.map((p) => {
              const Icon = IconMap[p.type] || Navigation;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setIsOpen(false);
                    router.push(p.url);
                  }}
                  className="flex items-start px-4 py-3 hover:bg-slate-800 transition-colors text-left"
                >
                  <div className={`mt-1 flex-shrink-0 p-2 rounded-lg ${p.type === 'rare_role' ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-800 text-slate-400'}`}>
                    <Icon size={18} />
                  </div>
                  <div className="ml-3 flex flex-col">
                    <span className="text-white font-medium">{p.label}</span>
                    <span className="text-slate-400 text-sm">{p.subtitle}</span>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="bg-slate-950 px-4 py-2 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
            <span>Powered by TypeSense Intelligence</span>
            <span>Press Enter to search all</span>
          </div>
        </div>
      )}
    </div>
  );
}
