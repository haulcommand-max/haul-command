'use client';
import { motion } from 'framer-motion';
import { Map, ShieldAlert, Zap } from 'lucide-react';

export function RouteIntelHero() {
  return (
    <div className="relative overflow-hidden w-full pt-20 pb-24 md:pt-32 md:pb-32 px-4">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[#050505]" />
        
        {/* Abstract glowing shapes */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen" />
        
        {/* Noise overlay for texture */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/80 to-[#050505]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-amber-400 mb-8 backdrop-blur-md"
        >
          <Zap className="w-3 h-3 fill-amber-400" />
          <span>Global Access Live</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight"
        >
          <span className="text-white">Authoritative</span><br />
          <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent">
            Route Intelligence.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12 font-light leading-relaxed"
        >
          Bypass hours of manual research. Ask the Haul Command engine any question about oversize regulations, pilot cars, or permits across 120 countries.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl"
        >
          {[
            { icon: Map, title: '120 countries', desc: 'Real-time routing data' },
            { icon: ShieldAlert, title: 'Permit Rules', desc: 'State-by-state laws' },
            { icon: Zap, title: 'Instant Answers', desc: 'Powered by Gemini AI' }
          ].map((feature, idx) => (
            <div key={idx} className="flex flex-col items-center bg-white/[0.02] border border-white/[0.05] p-6 rounded-2xl backdrop-blur-sm">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-white font-medium mb-1">{feature.title}</h3>
              <p className="text-sm text-gray-500">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
