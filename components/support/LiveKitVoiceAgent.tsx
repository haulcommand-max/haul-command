"use client";

import { useEffect, useState } from "react";
import { LiveKitRoom, RoomAudioRenderer, VoiceAssistantControlBar, AudioVisualizer } from "@livekit/components-react";
import "@livekit/components-styles";
import { Loader2, Mic, PhoneOff } from "lucide-react";

export interface VoiceAgentProps {
    roomName: string;
    identity: string;
    role?: 'claim_verifier' | 'sales_assistant';
    onClose?: () => void;
}

export function LiveKitVoiceAgent({ roomName, identity, role = 'claim_verifier', onClose }: VoiceAgentProps) {
    const [token, setToken] = useState<string>("");
    const [url, setUrl] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [isConnecting, setIsConnecting] = useState<boolean>(true);

    useEffect(() => {
        async function fetchToken() {
            try {
                const res = await fetch("/api/livekit/token", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ roomName, participantIdentity: identity, role })
                });

                const data = await res.json();
                
                if (!res.ok) {
                    throw new Error(data.error || "Failed to fetch token");
                }

                setToken(data.token);
                setUrl(data.url || process.env.NEXT_PUBLIC_LIVEKIT_URL || "");
            } catch (err: any) {
                console.error("Voice Token Error:", err);
                setError(err.message);
            } finally {
                setIsConnecting(false);
            }
        }

        fetchToken();
    }, [roomName, identity, role]);

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-sm">Connection Failed</h3>
                    <p className="text-xs mt-1 text-red-400/80">{error}</p>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-2 hover:bg-black/20 rounded-lg">
                        <PhoneOff className="w-4 h-4" />
                    </button>
                )}
            </div>
        );
    }

    if (isConnecting || !token || !url) {
        return (
            <div className="bg-[#121214] border border-white/10 p-6 rounded-2xl flex flex-col items-center justify-center min-h-[200px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
                <p className="text-gray-400 text-sm font-medium animate-pulse">Connecting to AI Voice Agent...</p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-b from-[#18181b] to-[#0b0b0c] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
            <LiveKitRoom
                serverUrl={url}
                token={token}
                connect={true}
                audio={true}
                video={false}
                data-lk-theme="default"
                onDisconnected={() => {
                    console.log("Disconnected from voice session");
                    if (onClose) onClose();
                }}
            >
                <div className="p-8 flex flex-col items-center">
                    {/* Visualizer for Voice AI */}
                    <div className="w-full flex justify-center mb-8 h-32 items-center bg-black/40 rounded-xl overflow-hidden border border-white/5 relative">
                        <div className="absolute top-3 left-3 bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded font-bold uppercase tracking-wider flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                            {role === 'claim_verifier' ? 'Claims Agent' : 'Sales Assistant'}
                        </div>
                        <AudioVisualizer state="speaking" className="text-blue-500 w-full" />
                    </div>

                    {/* Microphone / End Call Controls */}
                    <VoiceAssistantControlBar controls={{ leave: true, mic: true }} />

                    {/* Render participant audio handles */}
                    <RoomAudioRenderer />
                </div>
            </LiveKitRoom>
        </div>
    );
}
