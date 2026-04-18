'use client';

import { useState } from 'react';
import { postAvailableNow } from '@/app/actions/broadcast';

export function PostAvailabilityCTA() {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [msg, setMsg] = useState("");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsSubmitting(true);
        setMsg("");
        
        const formData = new FormData(e.currentTarget);
        
        try {
            await postAvailableNow(formData);
            setMsg("Success! Broadcast is live.");
            setTimeout(() => {
                setIsOpen(false);
                setMsg("");
            }, 2000);
        } catch (error: any) {
            setMsg(error.message || "Failed to broadcast. Are you logged in?");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="bg-transparent border border-green-500 text-green-500 hover:bg-green-500 hover:text-black font-black uppercase tracking-wider px-6 py-3 rounded-lg flex items-center gap-2 transition-colors relative"
            >
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></span>
                Broadcast "Available Now"
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-4 w-80 bg-[#141e28] border border-[#1e3048] shadow-2xl rounded-xl p-5 z-50">
                    <h4 className="text-lg font-bold text-white mb-2 uppercase tracking-tight">Signal Brokers</h4>
                    <p className="text-xs text-[#8ab0d0] mb-4">Post your current location to explicitly signal you are empty and ready for a hot load right now.</p>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex gap-3">
                            <div className="w-2/3">
                                <label className="block text-xs uppercase text-[#8ab0d0] font-bold mb-1">City</label>
                                <input type="text" name="city" required placeholder="e.g. Dallas" className="w-full bg-[#0a1118] border border-[#1e3048] rounded px-3 py-2 text-white text-sm focus:border-[#e8a828] outline-none" />
                            </div>
                            <div className="w-1/3">
                                <label className="block text-xs uppercase text-[#8ab0d0] font-bold mb-1">State</label>
                                <input type="text" name="state_code" required placeholder="TX" maxLength={2} className="w-full bg-[#0a1118] border border-[#1e3048] rounded px-3 py-2 text-white text-sm focus:border-[#e8a828] outline-none uppercase" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs uppercase text-[#8ab0d0] font-bold mb-1">Status</label>
                            <select name="status" className="w-full bg-[#0a1118] border border-[#1e3048] rounded px-3 py-2 text-white text-sm focus:border-[#e8a828] outline-none">
                                <option value="available_now">🟢 Available Right Now</option>
                                <option value="available_today">🟡 Available Later Today</option>
                                <option value="available_this_week">🔵 Available This Week</option>
                            </select>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full bg-[#e8a828] text-black font-black uppercase tracking-wider py-2.5 rounded hover:bg-[#ffe399] transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? 'Broadcasting...' : 'Go Live'}
                        </button>
                        
                        {msg && <p className={`text-xs ${msg.includes('Success') ? 'text-green-500' : 'text-red-500'} text-center mt-2`}>{msg}</p>}
                    </form>
                </div>
            )}
        </div>
    );
}
