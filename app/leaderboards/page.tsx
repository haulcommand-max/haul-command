'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, MapPin, Gauge, Star, Trophy, Clock, Medal } from 'lucide-react';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { DataTeaserStrip } from '@/components/data/DataTeaserStrip';
import SocialProofBanner from '@/components/social/SocialProofBanner';

const MOCK_LEADERS = [
  { id: 'usr_1', company: 'Apex Heavy Haul', rank: 'Vanguard', runs: 2450, rating: 4.98, response: '2 min', loc: 'Dallas, TX', score: 99.8 },
  { id: 'usr_2', company: 'Titan Escort Services', rank: 'Centurion', runs: 1890, rating: 4.95, response: '4 min', loc: 'Houston, TX', score: 98.5 },
  { id: 'usr_3', company: 'Pioneer Pilot Cars', rank: 'Centurion', runs: 1650, rating: 4.90, response: '5 min', loc: 'Denver, CO', score: 97.2 },
  { id: 'usr_4', company: 'Sentinel Transport Intel', rank: 'Sentinel', runs: 1420, rating: 4.88, response: '8 min', loc: 'Phoenix, AZ', score: 95.9 },
  { id: 'usr_5', company: 'Oversize Authority', rank: 'Sentinel', runs: 980, rating: 4.85, response: '12 min', loc: 'Atlanta, GA', score: 94.1 },
];

const TIER_COLORS: Record<string, string> = {
  'Vanguard': 'from-yellow-400 via-amber-500 to-orange-600 border-amber-500/50 text-amber-400',
  'Centurion': 'from-gray-300 via-gray-400 to-gray-500 border-gray-400/50 text-gray-300',
  'Sentinel': 'from-orange-700 via-amber-700 to-red-800 border-orange-700/50 text-orange-600',
};

export default function LeaderboardsPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-amber-500/30 overflow-hidden font-sans relative">
      <div className="absolute top-0 inset-x-0 h-96 bg-amber-500/10 blur-[150px] -z-10 rounded-full" />
      
      {/* Header */}
      <section className="relative pt-24 pb-12 px-6 text-center z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            Dominance <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">Leaderboards</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto font-light">
            The elite echelon of heavy haul operators. Rankings driven by real-time telematics, verified completions, and broker trust signals.
          </p>
        </motion.div>
      </section>

      {/* Top 3 Podium */}
      <section className="max-w-7xl mx-auto px-6 pb-20 z-10 relative">
        <div className="flex flex-col md:flex-row justify-center items-end gap-6 h-auto md:h-96">
          {/* Rank 2 */}
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="w-full md:w-1/3 relative z-10 order-2 md:order-1">
            <div className="bg-white/5 backdrop-blur-3xl border border-gray-400/20 rounded-t-3xl p-6 h-72 flex flex-col justify-between shadow-2xl">
              <div className="text-center">
                <Trophy className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <h3 className="text-2xl font-bold">{MOCK_LEADERS[1].company}</h3>
                <p className="text-gray-400 text-sm">{MOCK_LEADERS[1].loc}</p>
              </div>
              <div className="text-center space-y-1">
                <p className="font-mono text-gray-300">Score: {MOCK_LEADERS[1].score}</p>
                <div className="inline-block px-3 py-1 bg-gray-400/20 rounded-full text-xs font-semibold text-gray-300">
                  {MOCK_LEADERS[1].rank}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Rank 1 */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="w-full md:w-1/3 relative z-20 order-1 md:order-2">
            <div className="bg-gradient-to-b from-amber-500/10 to-transparent backdrop-blur-3xl border border-amber-500/40 rounded-t-3xl p-8 h-80 flex flex-col justify-between shadow-[0_0_50px_rgba(245,158,11,0.2)]">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-600 text-black px-4 py-1 rounded-full font-bold text-sm shadow-xl flex items-center gap-2">
                <Star className="w-4 h-4" /> FORTUNE #1
              </div>
              <div className="text-center mt-4">
                <Medal className="w-16 h-16 mx-auto text-amber-400 mb-2 drop-shadow-lg" />
                <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">{MOCK_LEADERS[0].company}</h3>
                <p className="text-amber-400/80 text-sm mt-1">{MOCK_LEADERS[0].loc}</p>
              </div>
              <div className="text-center space-y-2">
                <p className="font-mono text-amber-400 text-xl font-bold">{MOCK_LEADERS[0].score} <span className="text-xs text-gray-500">HC INDEX</span></p>
                <div className="inline-block px-4 py-1.5 bg-amber-500/20 rounded-full text-sm font-bold text-amber-400 shadow-inner">
                  {MOCK_LEADERS[0].rank}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Rank 3 */}
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="w-full md:w-1/3 relative z-10 order-3 md:order-3">
            <div className="bg-white/5 backdrop-blur-3xl border border-orange-700/30 rounded-t-3xl p-6 h-64 flex flex-col justify-between shadow-2xl">
              <div className="text-center">
                <Trophy className="w-10 h-10 mx-auto text-orange-600 mb-2" />
                <h3 className="text-xl font-bold">{MOCK_LEADERS[2].company}</h3>
                <p className="text-gray-400 text-sm">{MOCK_LEADERS[2].loc}</p>
              </div>
              <div className="text-center space-y-1">
                <p className="font-mono text-orange-500">Score: {MOCK_LEADERS[2].score}</p>
                <div className="inline-block px-3 py-1 bg-orange-500/20 rounded-full text-xs font-semibold text-orange-500">
                  {MOCK_LEADERS[2].rank}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Report Cards & Global Rankings */}
      <section className="max-w-7xl mx-auto px-6 pb-32 z-10 relative">
        <h2 className="text-3xl font-bold mb-8 text-white/90">Global Network Rankings</h2>
        
        <div className="space-y-4">
          {MOCK_LEADERS.map((leader, i) => (
            <motion.div 
              key={leader.id} 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: 0.1 * i }}
              className="group relative overflow-hidden bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 backdrop-blur-xl rounded-2xl p-6 transition-all duration-300 cursor-pointer"
            >
              {/* Dynamic hover gradient */}
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-amber-500/50 transition-colors duration-500" />
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                
                <div className="flex items-center gap-6 w-full md:w-1/3">
                  <span className="text-4xl font-black text-white/10 group-hover:text-white/20 transition-colors w-12 text-center">
                    {i + 1}
                  </span>
                  <div>
                    <h4 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-2">
                      {leader.company}
                      {i === 0 && <Shield className="w-5 h-5 text-amber-500 fill-amber-500/20" />}
                    </h4>
                    <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {leader.loc}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-8 w-full md:w-auto text-center md:text-left">
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-1">Total Runs</p>
                    <p className="text-lg font-mono font-medium">{leader.runs.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-1">Response</p>
                    <p className="text-lg font-mono font-medium flex items-center justify-center md:justify-start gap-1">
                      <Clock className="w-4 h-4 text-emerald-400" /> {leader.response}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-1">Rating</p>
                    <p className="text-lg font-mono font-medium flex items-center justify-center md:justify-start gap-1">
                      {leader.rating.toFixed(2)} <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    </p>
                  </div>
                </div>

                <div className="w-full md:w-32 flex justify-end">
                  <div className={`px-4 py-2 rounded-lg border ${TIER_COLORS[leader.rank]} bg-black/40 text-sm font-bold shadow-inner`}>
                    {leader.rank}
                  </div>
                </div>

              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Leaderboard Sponsor */}
      <section className="max-w-7xl mx-auto px-6 pb-12">
        <AdGridSlot zone="leaderboard_sponsor" />
      </section>

      {/* Data Teaser Strip */}
      <section className="max-w-7xl mx-auto px-6 pb-12">
        <DataTeaserStrip />
      </section>

      {/* Social Proof */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <SocialProofBanner />
      </section>
    </div>
  );
}
