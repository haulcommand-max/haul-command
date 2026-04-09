"use client";

import React, { useState } from "react";

// Haul Command UGC Hazard Submission Modal
// This connects the operator's browser to the Trust Points backend ingestion API.

export default function HazardUGCModal({ isOpen, onClose, userProfile }: { isOpen: boolean, onClose: () => void, userProfile?: any }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      corridor_name: formData.get("corridor_name"),
      alert_type: formData.get("alert_type"),
      severity: formData.get("severity"),
      message: formData.get("message"),
      country_code: formData.get("country_code"),
      author_id: userProfile?.id || "anonymous-uuid", // In prod, this is tied to the logged-in user
    };

    try {
      const res = await fetch("/api/ugc/corridor-alerts", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-yellow-500/30 p-8 rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Report Hazard</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">✖</button>
        </div>

        {success ? (
          <div className="bg-green-900/30 border border-green-500/50 p-6 rounded text-center">
            <span className="text-4xl block mb-2">⭐</span>
            <p className="text-green-400 font-bold">Alert Published</p>
            <p className="text-sm text-green-300 mt-2">+10 Trust Points Added to Report Card</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-xs font-mono text-gray-400 mb-1">CORRIDOR / ROUTE</label>
              <input name="corridor_name" required placeholder="e.g. I-10 Houston Bypass" className="w-full bg-gray-800 border border-gray-700 text-white rounded p-3 text-sm focus:border-yellow-500 focus:outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-xs font-mono text-gray-400 mb-1">HAZARD TYPE</label>
                 <select name="alert_type" required className="w-full bg-gray-800 border border-gray-700 text-white rounded p-3 text-sm focus:border-yellow-500 focus:outline-none">
                    <option value="construction">Low Clearance / Const</option>
                    <option value="curfew">City Curfew Active</option>
                    <option value="weather">Severe Weather</option>
                 </select>
              </div>
              <div>
                 <label className="block text-xs font-mono text-gray-400 mb-1">SEVERITY</label>
                 <select name="severity" required className="w-full bg-gray-800 border border-gray-700 text-white rounded p-3 text-sm focus:border-yellow-500 focus:outline-none">
                    <option value="high">High - Route Blocked</option>
                    <option value="medium">Medium - Expect Delays</option>
                    <option value="low">Low - Drive Caution</option>
                 </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-400 mb-1">SITUATION REPORT</label>
              <textarea name="message" required rows={3} placeholder="Describe the hazard..." className="w-full bg-gray-800 border border-gray-700 text-white rounded p-3 text-sm focus:border-yellow-500 focus:outline-none"></textarea>
            </div>

            <input type="hidden" name="country_code" value="US" />

            <button type="submit" disabled={loading} className="w-full mt-4 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-black uppercase text-sm py-4 rounded transition-all shadow-[0_0_15px_rgba(234,179,8,0.3)]">
              {loading ? "Broadcasting..." : "Broadcast Alert & Earn Points"}
            </button>
            <p className="text-center text-xs text-gray-500 mt-3 uppercase tracking-wider">Updates live on Corridor Boards</p>
          </form>
        )}
      </div>
    </div>
  );
}
