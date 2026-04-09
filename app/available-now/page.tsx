import { fetchAvailableEscorts } from "@/app/actions/broadcast";
import { AvailabilityCard } from "@/components/availability/AvailabilityCard";
import { PostAvailabilityCTA } from "@/components/availability/PostAvailabilityCTA";

export const metadata = {
    title: "Available Now | Haul Command Heavy Haul Network",
    description: "Live feed of pilot cars, escorts, and heavy haul operators available right now across the global network."
};

export default async function AvailableNowPage() {
    const operators = await fetchAvailableEscorts();

    return (
        <div className="min-h-screen bg-[#0a1118] text-[#f0f2f5] pt-24 pb-16">
            <div className="container mx-auto px-4 max-w-7xl">
                
                {/* Header & Post CTA */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-white uppercase tracking-tight mb-2">Available <span className="text-[#e8a828]">Now</span></h1>
                        <p className="text-[#8ab0d0] max-w-2xl text-sm md:text-base">
                            Live repositioning map and real-time operator availability. Book trusted pilot cars and transport assets instantly before capacity drops.
                        </p>
                    </div>
                    
                    <PostAvailabilityCTA />
                </div>

                {/* Dashboard / Split View */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left: Live Feed */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between border-b border-[#1e3048] pb-4 mb-4">
                            <h2 className="text-xl font-bold uppercase tracking-wider flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                Live Feed
                            </h2>
                            <span className="text-xs font-mono text-[#8ab0d0] px-2 py-1 bg-[#141e28] rounded border border-[#1e3048]">
                                {operators.length} ACTIVE DRIVERS
                            </span>
                        </div>

                        {operators.length === 0 ? (
                            <div className="p-12 text-center bg-[#141e28] border border-[#1e3048] rounded-xl">
                                <span className="block text-4xl mb-4">📡</span>
                                <h3 className="text-lg font-bold text-white mb-2">No operators broadcasting</h3>
                                <p className="text-[#8ab0d0] text-sm mb-6">Be the first to list your empty backhaul and get booked instantly.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {operators.map((op: any) => (
                                    <AvailabilityCard key={op.id} operator={op} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Map & Stats (Teaser) */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-[#141e28] border border-[#1e3048] rounded-xl overflow-hidden shadow-2xl h-96 relative flex items-center justify-center">
                            {/* Premium placeholder Map */}
                            <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: "url('/maps-placeholder.jpg')" }}></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#141e28] via-transparent to-transparent"></div>
                            
                            <div className="relative z-10 text-center p-6 border border-[#e8a828]/20 bg-[#0a1118]/80 backdrop-blur-sm rounded-xl">
                                <h3 className="text-[#e8a828] font-bold uppercase tracking-widest text-sm mb-2">RouteRadar Map</h3>
                                <p className="text-xs text-[#8ab0d0] mb-4">Visual asset tracking limited to Pro dispatchers.</p>
                                <button className="w-full py-2 bg-transparent border border-[#e8a828] text-[#e8a828] rounded font-bold uppercase text-xs hover:bg-[#e8a828] hover:text-black transition-colors delay-75">
                                    Unlock Map View
                                </button>
                            </div>
                        </div>

                        <div className="bg-[#141e28] border border-[#1e3048] rounded-xl p-6">
                            <h3 className="text-sm font-bold uppercase text-white mb-4 border-b border-[#1e3048] pb-2">Active Corridors</h3>
                            <ul className="space-y-3 text-sm">
                                <li className="flex justify-between">
                                    <span className="text-[#8ab0d0]">I-10 (TX to LA)</span>
                                    <span className="text-green-400 font-mono">High Density</span>
                                </li>
                                <li className="flex justify-between">
                                    <span className="text-[#8ab0d0]">I-80 (WY to NE)</span>
                                    <span className="text-yellow-400 font-mono">2 Available</span>
                                </li>
                                <li className="flex justify-between">
                                    <span className="text-[#8ab0d0]">I-5 (CA to OR)</span>
                                    <span className="text-red-400 font-mono">Empty</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
