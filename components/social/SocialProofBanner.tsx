'use client';

import { motion } from 'framer-motion';
import { Star, ShieldCheck, Map, Users, Anchor, Building, Truck, HardHat } from 'lucide-react';

export default function SocialProofBanner() {
  return (
    <section className="relative w-full py-12 sm:py-20 border-y border-white/[0.04] bg-[#0b0c10] overflow-hidden">
      {/* Ambient background lines */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#C6923A] to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(198,146,58,0.06),transparent_70%)]" />
      </div>

      <div className="hc-container max-w-5xl relative z-10">
        
        {/* PREMIUM STATS STRIP */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-16 mb-16 sm:mb-24">
          {[
            { label: 'Active Operators', value: '11,400+', icon: Users },
            { label: 'Market Coverage', value: '120 Countries', icon: Map },
            { label: 'Verified Partners', value: '3,200', icon: ShieldCheck },
          ].map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <stat.icon className="w-4 h-4 text-[#C6923A]" />
                <div className="text-2xl sm:text-3xl font-black text-white" style={{ fontFamily: "var(--font-mono, monospace)" }}>
                  {stat.value}
                </div>
              </div>
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] text-[#8fa3b8]">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* TESTIMONIAL BLOCK */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center mb-16 sm:mb-24 relative"
        >
          {/* Quote Mark */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl font-serif text-[#C6923A] opacity-10 pointer-events-none">
            "
          </div>
          
          <div className="flex justify-center gap-1 mb-6">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className="w-5 h-5 text-[#C6923A] fill-[#C6923A] opacity-90" />
            ))}
          </div>
          
          <blockquote className="text-xl sm:text-3xl font-medium leading-[1.4] text-white mb-8 sm:mb-10 px-4" style={{ fontFamily: "var(--font-display, sans-serif)", letterSpacing: "-0.01em" }}>
            "Haul Command has fundamentally changed how we dispatch. We used to spend hours calling numbers that weren't active. Now we see live operator state, verify their equipment, and dispatch directly on the corridor."
          </blockquote>
          
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full border border-white/10 bg-[#C6923A]/10 flex items-center justify-center text-[#C6923A] font-bold text-lg">
              MR
            </div>
            <div className="text-left">
              <div className="font-bold text-white text-sm sm:text-base">Mike Reynolds</div>
              <div className="text-xs text-[#8fa3b8] font-medium tracking-wide">VP Operations, Sterling Heavy Haul</div>
            </div>
          </div>
        </motion.div>

        {/* PARTNER LOGOS (Placeholder) */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center"
        >
          <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.25em] mb-8">
            Trusted By Global Logistics Leaders
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 px-4">
            {/* Logo 1 */}
            <div className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer">
              <Anchor className="w-6 h-6 text-[#3b82f6]" />
              <span className="font-black text-xl tracking-tighter text-white">OCEANLINK</span>
            </div>
            
            {/* Logo 2 */}
            <div className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer">
              <Building className="w-6 h-6 text-[#ef4444]" />
              <span className="font-black text-xl tracking-tight text-white uppercase">Vanguard<span className="font-light">Logistics</span></span>
            </div>
            
            {/* Logo 3 */}
            <div className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer">
              <HardHat className="w-6 h-6 text-[#f59e0b]" />
              <span className="font-bold text-xl tracking-widest text-white uppercase">AeroBuild</span>
            </div>
            
            {/* Logo 4 */}
            <div className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer">
              <Truck className="w-6 h-6 text-[#10b981]" />
              <span className="font-black italic text-xl tracking-tight text-white">FAST<span className="text-[#10b981]">FREIGHT</span></span>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
