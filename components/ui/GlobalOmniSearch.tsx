"use client";

import React, { useEffect, useRef, useState } from "react";
import { Briefcase, Cpu, MapPin, Mic, Navigation, Search, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchPrediction {
  id: string;
  type: "entity" | "route" | "permit" | "rare_role" | "role" | "place" | "rate";
  label: string;
  subtitle?: string;
  url: string;
  confidence: number;
}

function mapSuggestionType(type: string): SearchPrediction["type"] {
  if (type === "operator") return "entity";
  if (type === "corridor") return "route";
  if (type === "role") return "role";
  if (type === "place") return "place";
  if (type === "rate") return "rate";
  return "permit";
}

export function GlobalOmniSearch() {
  const [query, setQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [predictions, setPredictions] = useState<SearchPrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchCanonicalSuggestions = async (input: string) => {
    if (input.length < 2) {
      setPredictions([]);
      return;
    }

    const params = new URLSearchParams({ q: input });
    const response = await fetch(`/api/search/suggest?${params.toString()}`);
    if (!response.ok) return;

    const data = await response.json();
    const results: SearchPrediction[] = (data.suggestions ?? []).map((suggestion: any, index: number) => ({
      id: `${suggestion.type}-${index}-${suggestion.href}`,
      type: mapSuggestionType(String(suggestion.type)),
      label: String(suggestion.label ?? ""),
      subtitle: suggestion.sub ? String(suggestion.sub) : undefined,
      url: String(suggestion.href ?? "/search"),
      confidence: 0.9,
    }));

    setPredictions(results);
    setIsOpen(true);
  };

  const toggleVoiceSearch = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Voice search is not supported in this browser.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join("");
      setQuery(transcript);
      fetchCanonicalSuggestions(transcript);
      setIsOpen(true);
    };
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);

    if (isListening) {
      recognition.stop();
    } else {
      setQuery("");
      recognition.start();
    }
  };

  const IconMap = {
    entity: Briefcase,
    route: MapPin,
    permit: ShieldAlert,
    rare_role: Cpu,
    role: Cpu,
    place: MapPin,
    rate: ShieldAlert,
  };

  return (
    <div ref={wrapperRef} className="relative z-50 mx-auto w-full max-w-2xl">
      <div className="relative flex h-12 w-full items-center overflow-hidden rounded-full border border-slate-700 bg-slate-900 shadow-lg transition-all duration-200 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500">
        <div className="pl-4 text-slate-400">
          <Search size={20} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            fetchCanonicalSuggestions(nextQuery);
          }}
          onFocus={() => {
            if (query.length >= 2) setIsOpen(true);
          }}
          placeholder="Search anything (e.g., Texas escorts, bucket trucks in AZ, route rules)..."
          className="w-full border-none bg-transparent px-4 py-2 font-medium text-white placeholder-slate-500 focus:outline-none"
        />
        <button
          onClick={toggleVoiceSearch}
          className={`flex h-full items-center justify-center pl-2 pr-4 transition-colors ${isListening ? "animate-pulse text-orange-500" : "text-slate-400 hover:text-white"}`}
          title="Voice Search"
        >
          <Mic size={20} />
        </button>
      </div>

      {isOpen && predictions.length > 0 && (
        <div className="absolute left-0 top-14 w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col py-2">
            {predictions.map((prediction) => {
              const Icon = IconMap[prediction.type] || Navigation;
              return (
                <button
                  key={prediction.id}
                  onClick={() => {
                    setIsOpen(false);
                    router.push(prediction.url);
                  }}
                  className="flex items-start px-4 py-3 text-left transition-colors hover:bg-slate-800"
                >
                  <div className={`mt-1 flex-shrink-0 rounded-lg p-2 ${prediction.type === "rare_role" || prediction.type === "role" ? "bg-orange-500/20 text-orange-400" : "bg-slate-800 text-slate-400"}`}>
                    <Icon size={18} />
                  </div>
                  <div className="ml-3 flex flex-col">
                    <span className="font-medium text-white">{prediction.label}</span>
                    <span className="text-sm text-slate-400">{prediction.subtitle}</span>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 px-4 py-2 text-xs text-slate-500">
            <span>Powered by Haul Command search</span>
            <span>Press Enter to search all</span>
          </div>
        </div>
      )}
    </div>
  );
}
