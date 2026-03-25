'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Search, MicOff } from 'lucide-react';

export default function DirectorySearchForm() {
    const [query, setQuery] = useState('');
    const [isListening, setIsListening] = useState(false);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            // @ts-expect-error Web Speech API types
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = true;
                
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                recognitionRef.current.onresult = (event: any) => {
                    const transcript = Array.from(event.results)
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        .map((result: any) => result[0])
                        .map((result) => result.transcript)
                        .join('');
                    
                    setQuery(transcript);
                };

                recognitionRef.current.onerror = () => {
                    setIsListening(false);
                };

                recognitionRef.current.onend = () => {
                    setIsListening(false);
                };
            }
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert('Speech recognition is not supported in this browser.');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    return (
        <form onSubmit={(e) => { e.preventDefault(); /* Hook up actual search later */ }} className="max-w-2xl mx-auto w-full group relative">
            <div className={`relative flex items-center bg-white/5 border ${isListening ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-white/10 group-hover:border-accent/40'} rounded-2xl overflow-hidden transition-all`}>
                <div className="pl-4 pr-2 text-gray-500 flex-shrink-0">
                    <Search className="w-5 h-5" />
                </div>
                <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={isListening ? "Listening..." : "Search states, categories, or 'pilot cars near me'..."}
                    className="w-full bg-transparent px-2 py-4 text-white placeholder-gray-500 outline-none text-base sm:text-lg"
                />
                
                <button 
                    type="button"
                    onClick={toggleListening}
                    className={`p-3 mr-1 rounded-xl flex-shrink-0 transition-colors ${isListening ? 'bg-red-500/10 text-red-500' : 'text-gray-400 hover:text-accent hover:bg-white/5'}`}
                >
                    {isListening ? (
                        <>
                            <MicOff className="w-5 h-5 relative z-10" />
                            <span className="absolute right-3.5 top-3.5 w-6 h-6 rounded-full bg-red-500/20 animate-ping" />
                        </>
                    ) : (
                        <Mic className="w-5 h-5" />
                    )}
                </button>
            </div>
            
            <div className="flex justify-between items-center mt-2 px-2">
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Mic className="w-3 h-3 block" /> 
                    Voice input enabled for drivers
                </p>
                <button type="submit" className="text-xs font-bold text-accent hover:underline hidden sm:block">
                    Search Directory →
                </button>
            </div>
        </form>
    );
}
