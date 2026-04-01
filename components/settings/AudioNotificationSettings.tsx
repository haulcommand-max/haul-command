'use client';
import { useState } from 'react';

export default function AudioNotificationSettings() {
  const [activeSound, setActiveSound] = useState<'standard' | 'aggressive'>('standard');

  const playTest = (type: 'standard' | 'aggressive') => {
    setActiveSound(type);
    // In production: new Audio(`/sounds/${type}.mp3`).play();
    alert(`Playing test sound: ${type}.mp3`);
  };

  return (
    <div className="p-6 border border-gray-800 rounded-xl bg-[#0a0a0c]">
      <h3 className="text-white font-bold mb-4">Notification Sounds</h3>
      <div className="space-y-3">
        <label className="flex items-center justify-between p-3 border border-gray-700 rounded bg-black cursor-pointer hover:border-gray-500 transition-colors">
          <div className="flex items-center gap-3">
            <input type="radio" checked={activeSound === 'standard'} onChange={() => playTest('standard')} className="accent-yellow-500 w-4 h-4" />
            <span className="text-sm text-gray-200 font-medium">Standard Ping</span>
          </div>
          <span className="text-xs text-gray-500">Free Tier</span>
        </label>
        
        <label className="flex items-center justify-between p-3 border border-yellow-500/30 rounded bg-yellow-500/5 cursor-pointer hover:border-yellow-500 transition-colors">
          <div className="flex items-center gap-3">
            <input type="radio" checked={activeSound === 'aggressive'} onChange={() => playTest('aggressive')} className="accent-yellow-500 w-4 h-4" />
            <span className="text-sm text-white font-bold">Aggressive Klaxon</span>
          </div>
          <span className="text-xs text-yellow-500 font-bold uppercase tracking-wider">Premium</span>
        </label>
      </div>
    </div>
  );
}
