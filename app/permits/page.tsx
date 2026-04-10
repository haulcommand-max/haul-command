"use client"

import React, { useState } from "react"
import { Shield, FastForward, Clock, Globe, Award, ChevronRight, Truck } from "lucide-react"

export default function PermitIntakePage() {
    const [step, setStep] = useState(1)
    
    return (
        <div className="min-h-screen bg-[#07090D] pt-24 pb-32">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                
                {/* ── Money-Left-On-The-Table Harvester Header ── */}
                <div className="text-center max-w-4xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full mb-6">
                        <FastForward className="w-4 h-4 text-rose-500" />
                        <span className="text-xs font-bold uppercase tracking-widest text-rose-500">Expedited Service Available</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
                        Nationwide Oversize <br className="hidden md:block"/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C6923A] to-yellow-500">Load Permits. Faster.</span>
                    </h1>
                    <p className="text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
                        Say goodbye to individual state portal logins. Request, route, and receive your oversize/overweight permits 3x faster through the Haul Command Concierge desk.
                    </p>
                </div>

                <div className="grid lg:grid-cols-12 gap-12 items-start">
                    
                    {/* Left: Dynamic Intake Form */}
                    <div className="lg:col-span-7 bg-[#121212] border border-white/5 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
                        {/* Glow effect */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C6923A]/5 blur-[80px] rounded-full pointer-events-none" />
                        
                        <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-6">
                            <div className="w-12 h-12 bg-[#C6923A]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Truck className="w-6 h-6 text-[#C6923A]" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white">Request Permits</h2>
                                <p className="text-sm text-white/40">Our logistics team binds the application natively.</p>
                            </div>
                        </div>

                        {step === 1 && (
                            <div className="space-y-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-white/60">Origin State</label>
                                        <select className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[#C6923A] appearance-none transition">
                                            <option>Texas (TX)</option>
                                            <option>Oklahoma (OK)</option>
                                            <option>Louisiana (LA)</option>
                                            <option>New Mexico (NM)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-white/60">Destination State</label>
                                        <select className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[#C6923A] appearance-none transition">
                                            <option>Colorado (CO)</option>
                                            <option>Wyoming (WY)</option>
                                            <option>Kansas (KS)</option>
                                            <option>Utah (UT)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-white/60">Max Overall Dimensions</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        <input type="text" placeholder="Width (ft)" className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[#C6923A] transition" />
                                        <input type="text" placeholder="Height (ft)" className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[#C6923A] transition" />
                                        <input type="text" placeholder="Weight (lbs)" className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[#C6923A] transition" />
                                    </div>
                                </div>
                                
                                <div className="pt-4">
                                    <button 
                                        onClick={() => setStep(2)}
                                        className="w-full group bg-[#C6923A] hover:bg-[#b0802e] text-black font-black uppercase tracking-widest rounded-xl py-4 flex items-center justify-center gap-2 transition"
                                    >
                                        Start Load Intake <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 relative z-10 animate-in fade-in slide-in-from-right-8 duration-500 text-center py-12">
                                <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Shield className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2">Create an Account to Autofill</h3>
                                <p className="text-white/50 mb-8 max-w-sm mx-auto">
                                    We vault your USDOT, Insurance, and Truck configurations so you never have to type them again. 
                                </p>
                                <a href="/login" className="inline-flex items-center justify-center w-full max-w-xs bg-white text-black font-black uppercase text-sm tracking-widest rounded-xl py-4 hover:bg-neutral-200 transition">
                                    Sign Up & Continue
                                </a>
                                <button onClick={() => setStep(1)} className="block w-full text-xs text-white/30 font-bold hover:text-white mt-6 underline">
                                    Back to Step 1
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right: SEO / Value Props */}
                    <div className="lg:col-span-5 space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-xl font-black text-white">Why 1,500+ Brokers use Haul Command Permits</h3>
                            <p className="text-sm text-white/50 leading-relaxed">
                                Don't let state DOT bureaucracy stall your million-dollar loads. Our dedicated team of route analysts handles the state-level friction.
                            </p>
                        </div>
                        
                        <div className="space-y-4">
                            {[
                                { icon: Clock, title: "Turnarounds in Hours, Not Days", text: "Direct API pipelines into standard state DOT databases." },
                                { icon: Globe, title: "All 50 States + Provinces", text: "Coverage spanning the entire continuous US and lower Canada." },
                                { icon: Award, title: "Guaranteed Routing Accuracy", text: "We analyze bridge heights, construction zones, and local curfews." }
                            ].map((prop, i) => (
                                <div key={i} className="flex items-start gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                    <div className="w-10 h-10 bg-[#C6923A]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <prop.icon className="w-5 h-5 text-[#C6923A]" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white mb-1">{prop.title}</h4>
                                        <p className="text-xs text-white/50">{prop.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Testimonial Injection (From Mypevo Competitive Analysis) */}
                        <div className="p-6 bg-gradient-to-tr from-white/[0.05] to-transparent border border-white/10 rounded-2xl">
                            <div className="flex text-[#C6923A] mb-3">
                                {[...Array(5)].map((_, i) => <Shield key={i} className="w-4 h-4 fill-current mr-1" />)}
                            </div>
                            <p className="text-sm text-white/80 italic leading-relaxed mb-4">
                                "Haul Command took the absolute headache out of our Texas to Colorado runs. They handled the permits securely so we could actually focus on driving. Best agency software I've used."
                            </p>
                            <div className="text-xs font-bold text-white uppercase tracking-widest">— Heavy Hauler, Houston TX</div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
