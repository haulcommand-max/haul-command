import { MapPin, DollarSign, Truck } from "lucide-react";

interface LoadTypes {
    origin: string;
    destination: string;
    rate: string;
    equipment: string;
    miles: number;
}

export function BlurLoadCard({ load, index }: { load: LoadTypes; index: number }) {
    return (
        <div
            className="relative p-4 rounded-xl border border-brand-steel/50 bg-brand-charcoal/40 backdrop-blur-sm mb-3 overflow-hidden"
            style={{ animationDelay: `${index * 100}ms` }}
        >
            {/* Header: Origin -> Dest */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-brand-steel/30 flex items-center justify-center text-brand-gold">
                        <MapPin size={16} />
                    </div>
                    <div>
                        <div className="font-bold text-brand-text text-sm md:text-base">
                            {load.origin} <span className="text-brand-muted">→</span> {load.destination}
                        </div>
                        <div className="text-xs text-brand-muted">{load.miles} mi • Ready Now</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="font-mono font-bold text-brand-gold text-lg">{load.rate}</div>
                    <div className="text-[10px] text-brand-muted uppercase tracking-wider">Per Mile</div>
                </div>
            </div>

            {/* Equipment Tag */}
            <div className="flex items-center gap-2 mb-4">
                <div className="bg-brand-steel/20 text-brand-muted text-xs px-2 py-1 rounded border border-brand-steel/30 flex items-center gap-1">
                    <Truck size={12} />
                    {load.equipment}
                </div>
            </div>

            {/* BLURRED SECTION - The Hook */}
            <div className="relative group cursor-not-allowed">
                <div className="absolute inset-0 z-10 flex items-center justify-center">
                    {/* Lock Icon or generic overlay could go here, but pure blur is cleaner */}
                </div>
                <div className="filter blur-md select-none opacity-50">
                    <div className="flex justify-between items-center py-2 border-t border-brand-steel/30">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-500"></div>
                            <div className="h-3 w-24 bg-gray-600 rounded"></div>
                        </div>
                        <div className="h-8 w-20 bg-brand-primary/20 rounded"></div>
                    </div>
                </div>
            </div>

            {/* Teaser text overlaying the bottom/blur area slightly if needed, or just let the blur speak */}
            <div className="absolute bottom-2 right-4 z-20">
                <span className="text-[10px] text-brand-gold font-bold uppercase tracking-widest bg-black/80 px-2 py-1 rounded">
                    Login to Call
                </span>
            </div>
        </div>
    );
}
