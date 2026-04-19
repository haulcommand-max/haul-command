"use client";

import React from "react";
import Link from "next/link";
import { Search, MapPin, CheckCircle, Truck, Navigation, FileText, Zap, Shield, Users, ArrowRight, MessageSquare, TrendingUp } from "lucide-react";
import type { MarketPulseData, DirectoryListing, CorridorData } from "@/lib/server/data";
import type { HeroPack } from "@/components/hero/heroPacks";
import type { UserSignals } from "@/lib/next-moves-engine";

export interface HomeClientProps {
    marketPulse: MarketPulseData;
    directoryCount: number;
    corridorCount: number;
    topCorridors: CorridorData[];
    topListings: DirectoryListing[];
    heroPack: HeroPack;
    totalCountries: number;
    liveCountries: number;
    coveredCountries: number;
    totalOperators: number;
    totalCorridors: number;
    avgRatePerDay?: number;
    nextMoveSignals?: Partial<UserSignals>;
}

const CATEGORIES = [
    { label: "Escorts", icon: Truck, href: "/directory?category=escort-vehicle" },
    { label: "Pilot Cars", icon: Navigation, href: "/directory?category=pilot-car" },
    { label: "Pole Cars", icon: MapPin, href: "/directory?category=height-pole" },
    { label: "Permits", icon: FileText, href: "/permits" },
    { label: "Oversize", icon: Zap, href: "/directory?category=oversize" },
    { label: "Survey", icon: CheckCircle, href: "/directory?category=route-survey" },
    { label: "Lead", icon: ArrowRight, href: "/directory?category=lead-chase" },
    { label: "Safety", icon: Shield, href: "/directory?category=safety" },
    { label: "Team", icon: Users, href: "/directory?category=team" }
];

export default function HomeClient({ totalOperators }: HomeClientProps) {
    return (
        <div className="font-['Arial',_sans-serif] antialiased bg-white text-[#111827]">
            {/* Title */}
            <h1 className="text-center font-bold text-3xl sm:text-[42px] mt-12 mb-8 text-[#111827] tracking-tight">
                Discover Local<span className="text-xs align-super font-normal text-gray-500 ml-1">SM</span>
            </h1>

            {/* Hero Search Box */}
            <div className="max-w-[1240px] mx-auto px-4">
                <div className="relative w-full h-[280px] sm:h-[400px] rounded-[16px] overflow-hidden flex items-center justify-center">
                    <img src="/images/homepage_hero_bg_1775877319950.png" className="absolute inset-0 w-full h-full object-cover object-center" alt="Heavy Haul Background" />
                    <div className="absolute inset-0 bg-black/10" />
                    
                    <form action="/directory" method="GET" className="relative z-10 w-full max-w-[900px] mx-4 flex flex-col md:flex-row rounded overflow-hidden bg-white shadow-[0_10px_30px_rgba(0,0,0,0.3)] p-1 md:p-0">
                        <div className="flex-[1.2] flex items-center bg-white px-4 py-4 md:border-r border-gray-300 border-b md:border-b-0">
                            <Search className="w-5 h-5 md:w-6 md:h-6 text-gray-400 mr-3 flex-shrink-0" />
                            <select name="category" className="w-full text-base md:text-[19px] focus:outline-none bg-transparent cursor-pointer text-gray-700">
                                <option value="">Find a business...</option>
                                <option value="escort-vehicle">Escort Vehicle</option>
                                <option value="pilot-car">Pilot Car</option>
                                <option value="height-pole">Height Pole</option>
                                <option value="route-survey">Route Survey</option>
                            </select>
                        </div>
                        <div className="flex-1 flex items-center bg-white px-4 py-4">
                            <MapPin className="w-5 h-5 md:w-6 md:h-6 text-gray-400 mr-3 flex-shrink-0" />
                            <input type="text" name="q" placeholder="City, State" className="w-full text-base md:text-[19px] focus:outline-none bg-transparent placeholder-gray-500 text-gray-900" />
                        </div>
                        <button type="submit" className="bg-[#FFD700] hover:bg-[#FACC15] text-[#111827] font-bold text-[19px] px-14 py-4 md:py-5 transition-colors tracking-wide">
                            FIND
                        </button>
                    </form>
                </div>
            </div>

            {/* Circular Category Grid (Like YP) */}
            <div className="max-w-[1000px] mx-auto mt-14 px-4 pb-12">
                <div className="flex flex-wrap justify-center gap-x-6 sm:gap-x-12 gap-y-10">
                    {CATEGORIES.map(cat => (
                        <Link key={cat.label} href={cat.href} className="flex flex-col items-center gap-3 group w-[70px]">
                            <div className="w-[72px] h-[72px] rounded-full border border-gray-300 flex items-center justify-center bg-white group-hover:border-[#0073B1] group-hover:shadow-[0_0_10px_rgba(0,115,177,0.2)] transition-all">
                                <cat.icon className="w-8 h-8 text-[#0073B1] opacity-80 group-hover:opacity-100" strokeWidth={1.2} />
                            </div>
                            <span className="text-[12px] text-center text-gray-600 font-medium group-hover:text-[#0073B1] group-hover:underline">
                                {cat.label}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Manage Free Listing - Visual Divider */}
            <div className="border-t border-gray-100 mt-16 pt-24 pb-20 relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-y-0 left-0 w-1/2 bg-[#f4f7f8] rounded-r-full opacity-50 transform -translate-x-1/4"></div>
                </div>
                <div className="max-w-[1000px] mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-16 relative z-10">
                    <div className="flex-shrink-0 relative">
                        {/* Background subtle dots/circles */}
                        <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full border border-gray-200"></div>
                        <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full border border-gray-200"></div>
                        
                        <div className="w-64 h-64 bg-gray-200 rounded-full border-[8px] border-white shadow-xl overflow-hidden relative z-10">
                            {/* Placeholder for YP-style circle image of person on laptop */}
                            <div className="w-full h-full bg-[#E5E7EB] flex items-center justify-center text-gray-400 pb-4">
                                <Users size={120} strokeWidth={1} />
                            </div>
                        </div>
                    </div>
                    <div className="text-center md:text-left">
                        <h2 className="text-[36px] sm:text-[44px] font-light text-gray-800 mb-3 tracking-tight">
                            Manage your <span className="font-bold text-[#111827] border-b-[5px] border-[#FFD700] pb-1">free</span> listing.
                        </h2>
                        <p className="text-gray-600 text-lg mb-8">Update your business information in a few steps.</p>
                        <Link href="/claim" className="inline-block bg-[#0073B1] hover:bg-[#005b8e] text-white font-bold text-lg py-3.5 px-8 shadow-md transition-colors">
                            Claim Your Listing
                        </Link>
                        <p className="text-gray-500 text-sm mt-5">or call <span className="font-bold text-gray-800">1-800-428-5263</span></p>
                    </div>
                </div>
            </div>

            {/* Questions and Answers - Blue Pill Container */}
            <div className="max-w-[1100px] mx-auto px-4 mt-8 mb-24">
                <div className="relative bg-[#008CC9] rounded-[48px] p-10 md:p-14 overflow-visible shadow-[0_15px_40px_rgba(0,115,177,0.2)]">
                    <div className="md:w-[60%] lg:w-[50%] relative z-10">
                        <h2 className="text-white text-[32px] sm:text-[40px] font-light mb-2">
                            Questions and <span className="font-bold italic">Answers</span>
                        </h2>
                        <p className="text-blue-100 text-sm mb-10 max-w-sm">
                            How much is a pilot car? Who should I contact for oversize escort advice?
                        </p>
                        
                        <div className="space-y-5 mb-10 text-white font-medium text-[15px]">
                            <div className="flex items-center gap-3">
                                <div className="bg-white rounded-full p-0.5"><CheckCircle className="w-4 h-4 text-[#008CC9]" /></div>
                                <span>Ask questions to the HC community</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="bg-white rounded-full p-0.5"><CheckCircle className="w-4 h-4 text-[#008CC9]" /></div>
                                <span>Share your knowledge to help out others</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="bg-white rounded-full p-0.5"><CheckCircle className="w-4 h-4 text-[#008CC9]" /></div>
                                <span>Find answers or offer solutions</span>
                            </div>
                        </div>
                        
                        <Link href="/ask" className="inline-flex items-center justify-center bg-white text-[#008CC9] font-bold text-[15px] px-8 py-3 rounded border border-white hover:bg-blue-50 transition-colors shadow">
                            Ask a Question
                        </Link>
                    </div>
                    
                    {/* Floating Circle Image (Like Q&A girl on YP) */}
                    <div className="hidden md:flex absolute right-[5%] top-1/2 transform -translate-y-1/2 w-[380px] h-[380px] rounded-full border-[12px] border-white shadow-2xl bg-gray-200 overflow-hidden items-center justify-center z-20">
                         <div className="w-full h-full bg-[#E5E7EB] flex items-center justify-center text-gray-400 pb-4">
                            <MessageSquare size={130} strokeWidth={1} />
                        </div>
                    </div>
                </div>
                
                {/* Horizontal links below Q&A */}
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-6 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                    <span className="text-gray-800">Browse Popular Questions & Answers</span>
                    <Link href="/qna/permits" className="hover:underline">Permits</Link>
                    <Link href="/qna/escorts" className="hover:underline">Escorts</Link>
                    <Link href="/qna/routes" className="hover:underline">Routes</Link>
                    <Link href="/qna/equipment" className="hover:underline">Equipment</Link>
                    <Link href="/qna/regulations" className="hover:underline">Regulations</Link>
                </div>
            </div>

            {/* Advertise Section */}
            <div className="max-w-[1050px] mx-auto px-4 mt-32 mb-32 flex flex-col md:flex-row items-center justify-center gap-16 relative">
                 {/* Decorative background dotted curve (simulated with CSS) */}
                 <div className="absolute right-0 bottom-0 w-64 h-64 border-t-2 border-r-2 border-blue-100 rounded-tr-full opacity-60 z-0"></div>
                 
                <div className="w-full md:w-[45%] rounded overflow-hidden shadow-2xl relative z-10 bg-gray-100 h-[320px] flex items-center justify-center">
                    <div className="w-full h-full bg-[#E5E7EB] flex items-center justify-center text-gray-400 pb-4">
                        <TrendingUp size={120} strokeWidth={1} />
                    </div>
                </div>
                <div className="w-full md:w-[50%] text-center md:text-left relative z-10 md:pl-8">
                    <h2 className="text-[34px] sm:text-[42px] font-light text-[#111827] mb-5 leading-[1.1] tracking-tight">
                        Get your business in front of <span className="font-bold text-[#111827] border-b-[4px] border-[#FFD700] pb-1 inline-block">local customers</span>.
                    </h2>
                    <p className="text-gray-600 mb-8 text-[15px] max-w-sm mx-auto md:mx-0">
                        Maximize your opportunities for shippers to find you by advertising with Haul Command.
                    </p>
                    <Link href="/sponsor" className="inline-block bg-[#0073B1] hover:bg-[#005b8e] text-white font-bold text-[15px] py-3 px-8 shadow-md transition-colors">
                        Learn More
                    </Link>
                </div>
            </div>

            {/* App Teaser Section */}
            <div className="max-w-[800px] mx-auto px-4 mt-32 mb-28 text-center relative">
                 {/* Decorative dotted curve */}
                 <div className="absolute left-10 top-0 w-64 h-32 border-b-2 border-l-2 border-blue-100 rounded-bl-full opacity-50 z-0"></div>
                
                <div className="relative z-10 flex flex-col items-center">
                    <div className="flex justify-center mb-8 gap-4 w-full px-8">
                         {/* Placeholder phones */}
                         <div className="w-[120px] h-[240px] bg-gray-200 rounded-2xl shadow-xl flex items-center justify-center text-gray-400 -rotate-6"><MapPin /></div>
                         <div className="w-[140px] h-[280px] bg-gray-200 rounded-2xl shadow-2xl z-10 flex items-center justify-center text-gray-400 -mt-6"><Search /></div>
                         <div className="w-[120px] h-[240px] bg-gray-200 rounded-2xl shadow-xl flex items-center justify-center text-gray-400 rotate-6"><Users /></div>
                    </div>

                    <h2 className="text-[32px] sm:text-[40px] font-light text-[#111827] mb-2 tracking-tight">
                        Take HC with you. It's <span className="font-bold text-[#111827]">free!</span>
                    </h2>
                    <p className="text-[#111827] mb-2 text-[15px]">Make Every Day Local℠ <Link href="/app" className="text-[#0073B1] hover:underline ml-1">Learn more &raquo;</Link></p>
                    <p className="text-gray-500 text-[13px] mb-6 max-w-xs mx-auto text-center">You can search millions of local businesses on the go. Everything you need in one app.</p>
                    
                    <div className="flex justify-center gap-4 border-b border-gray-100 pb-12 w-full">
                        <div className="bg-black text-white px-5 py-2.5 rounded-md flex items-center gap-2 cursor-pointer hover:bg-gray-900 shadow">
                            <span className="text-[10px] font-semibold text-left">Get it on<br/><span className="text-base font-bold">Google Play</span></span>
                        </div>
                        <div className="bg-black text-white px-5 py-2.5 rounded-md flex items-center gap-2 cursor-pointer hover:bg-gray-900 shadow">
                            <span className="text-[10px] font-semibold text-left">Download on the<br/><span className="text-base font-bold">App Store</span></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Matching YP exactly */}
            <footer className="bg-[#f2f2f2] border-t border-gray-200 py-12 pb-24">
                <div className="max-w-[1240px] mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 text-[11px] text-gray-500 leading-[1.8]">
                        <div>
                            <h4 className="font-bold text-[#111827] mb-3 text-[11px] uppercase tracking-wide">About</h4>
                            <ul className="space-y-1">
                                <li><Link href="/about" className="hover:underline">About Us</Link></li>
                                <li><Link href="/contact" className="hover:underline">Contact Us</Link></li>
                                <li><Link href="/sponsor" className="hover:underline">Advertise with Us</Link></li>
                                <li><Link href="/blog" className="hover:underline">Corporate Blog</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-[#111827] mb-3 text-[11px] uppercase tracking-wide">Site Directory</h4>
                            <ul className="space-y-1">
                                <li><Link href="/articles" className="hover:underline">Articles</Link></li>
                                <li><Link href="/directory" className="hover:underline">Find a Business</Link></li>
                                <li><Link href="/app" className="hover:underline">HC Mobile App</Link></li>
                                <li><Link href="/sitemap.xml" className="hover:underline">Site Map</Link></li>
                                <li><Link href="/categories" className="hover:underline">Categories</Link></li>
                            </ul>
                        </div>
                        <div className="col-span-2 md:col-span-2 lg:col-span-3">
                            <h4 className="font-bold text-[#111827] mb-3 text-[11px] uppercase tracking-wide">City Guides <span className="font-normal text-gray-400 capitalize">(More Cities)</span></h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4">
                                <ul className="space-y-1">
                                    <li><Link href="/directory/us/ga/atlanta" className="hover:underline">Atlanta</Link></li>
                                    <li><Link href="/directory/us/tx/austin" className="hover:underline">Austin</Link></li>
                                    <li><Link href="/directory/us/md/baltimore" className="hover:underline">Baltimore</Link></li>
                                    <li><Link href="/directory/us/ma/boston" className="hover:underline">Boston</Link></li>
                                    <li><Link href="/directory/us/nc/charlotte" className="hover:underline">Charlotte</Link></li>
                                    <li><Link href="/directory/us/il/chicago" className="hover:underline">Chicago</Link></li>
                                    <li><Link href="/directory/us/tx/dallas" className="hover:underline">Dallas</Link></li>
                                    <li><Link href="/directory/us/co/denver" className="hover:underline">Denver</Link></li>
                                </ul>
                                <ul className="space-y-1">
                                    <li><Link href="/directory/us/mi/detroit" className="hover:underline">Detroit</Link></li>
                                    <li><Link href="/directory/us/tx/houston" className="hover:underline">Houston</Link></li>
                                    <li><Link href="/directory/us/in/indianapolis" className="hover:underline">Indianapolis</Link></li>
                                    <li><Link href="/directory/us/mo/kansas-city" className="hover:underline">Kansas City</Link></li>
                                    <li><Link href="/directory/us/nv/las-vegas" className="hover:underline">Las Vegas</Link></li>
                                    <li><Link href="/directory/us/ca/los-angeles" className="hover:underline">Los Angeles</Link></li>
                                    <li><Link href="/directory/us/ky/louisville" className="hover:underline">Louisville</Link></li>
                                    <li><Link href="/directory/us/tn/memphis" className="hover:underline">Memphis</Link></li>
                                </ul>
                                <ul className="space-y-1">
                                    <li><Link href="/directory/us/fl/miami" className="hover:underline">Miami</Link></li>
                                    <li><Link href="/directory/us/wi/milwaukee" className="hover:underline">Milwaukee</Link></li>
                                    <li><Link href="/directory/us/ny/new-york" className="hover:underline">New York</Link></li>
                                    <li><Link href="/directory/us/ok/oklahoma-city" className="hover:underline">Oklahoma City</Link></li>
                                    <li><Link href="/directory/us/fl/orlando" className="hover:underline">Orlando</Link></li>
                                    <li><Link href="/directory/us/pa/philadelphia" className="hover:underline">Philadelphia</Link></li>
                                    <li><Link href="/directory/us/az/phoenix" className="hover:underline">Phoenix</Link></li>
                                    <li><Link href="/directory/us/mo/saint-louis" className="hover:underline">Saint Louis</Link></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="mt-16 text-center text-[10px] text-[#0073B1]">
                        <div className="flex justify-center gap-4 mb-4">
                            <Link href="/privacy" className="hover:underline">Privacy</Link>
                            <span className="text-gray-300">|</span>
                            <Link href="/legal" className="hover:underline">Do Not Sell or Share My Personal Information</Link>
                            <span className="text-gray-300">|</span>
                            <Link href="/terms" className="hover:underline">Terms of Use</Link>
                            <span className="text-gray-300">|</span>
                            <Link href="/legal" className="hover:underline">Legal</Link>
                        </div>
                        <p className="text-gray-400 mt-6">© {new Date().getFullYear()} Haul Command LLC. All rights reserved.</p>
                        <p className="mt-1 text-gray-400">YP, the YP logo and all other YP marks contained herein are trademarks of Thryv, Inc.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}