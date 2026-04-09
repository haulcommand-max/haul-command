'use client';
import { useState } from 'react';

export default function MagicLinkFallback() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleMagicLink = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate Supabase magic link send
    setSent(true);
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-[#0a0a0c] border border-gray-800 rounded-2xl">
      <h2 className="text-2xl font-bold text-white mb-2">Login Without Password</h2>
      <p className="text-gray-400 text-sm mb-6">Enter your email and we'll send you a 1-click magic link to securely sign into Haul Command.</p>
      
      {sent ? (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-bold text-center">
          Magic Link Sent! Check your inbox.
        </div>
      ) : (
        <form onSubmit={handleMagicLink} className="space-y-4">
          <input 
            type="email" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="pilot@example.com"
            required
            className="w-full bg-black border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-yellow-500 transition-colors"
          />
          <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-yellow-900/30">
            Send Secure Link
          </button>
        </form>
      )}
    </div>
  );
}
