'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Truck, Hotel, MapPin, Phone, Fuel, Star } from 'lucide-react';

interface LogisticsNode {
    node_id: string;
    node_type: 'truck_stop' | 'hotel';
    name: string;
    city: string;
    state: string;
    abbr: string;
    is_pilot_car_friendly: boolean;
    quality_score: number;
    phone: string | null;
    rate_notes: string | null;
    corridor_slug: string | null;
}

interface Props {
    city?: string;
    state?: string;
    corridorSlug?: string;
    limit?: number;
    className?: string;
}

export default function NearbyLogisticsNodes({
    city,
    state,
    corridorSlug,
    limit = 6,
    className = '',
}: Props) {
    const [nodes, setNodes] = useState<LogisticsNode[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchNodes() {
            setLoading(true);
            try {
                let data: LogisticsNode[] = [];

                if (corridorSlug) {
                    // Corridor mode — use RPC
                    const { data: rpcData, error } = await supabase.rpc(
                        'get_logistics_nodes_for_corridor',
                        { p_corridor_slug: corridorSlug, p_limit: limit }
                    );
                    if (!error && rpcData) data = rpcData;
                } else if (state) {
                    // City mode — use RPC
                    const { data: rpcData, error } = await supabase.rpc(
                        'get_logistics_nodes_for_city',
                        { p_city: city ?? '', p_state: state, p_limit: limit }
                    );
                    if (!error && rpcData) data = rpcData;
                }

                setNodes(data ?? []);
            } catch {
                // Silently fail — logistics nodes are enrichment, not critical
                setNodes([]);
            } finally {
                setLoading(false);
            }
        }

        fetchNodes();
    }, [city, state, corridorSlug, limit]);

    if (loading) {
        return (
            <div className={`animate-pulse space-y-3 ${className}`}>
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-white/5 rounded-xl" />
                ))}
            </div>
        );
    }

    if (!nodes.length) return null;

    const truckStops = nodes.filter((n) => n.node_type === 'truck_stop');
    const hotels = nodes.filter((n) => n.node_type === 'hotel');

    return (
        <section className={`space-y-5 ${className}`}>
            <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                    Pilot Car Logistics Nodes
                </h3>
            </div>

            {/* Truck Stops */}
            {truckStops.length > 0 && (
                <div>
                    <p className="text-xs text-white/40 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <Truck className="w-3 h-3" /> Truck Stops &amp; Staging
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {truckStops.map((node) => (
                            <NodeCard key={node.node_id} node={node} />
                        ))}
                    </div>
                </div>
            )}

            {/* Hotels */}
            {hotels.length > 0 && (
                <div>
                    <p className="text-xs text-white/40 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <Hotel className="w-3 h-3" /> Pilot Car–Friendly Hotels
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {hotels.map((node) => (
                            <NodeCard key={node.node_id} node={node} />
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}

function NodeCard({ node }: { node: LogisticsNode }) {
    const isTruckStop = node.node_type === 'truck_stop';

    return (
        <div className="flex items-start gap-3 bg-white/5 hover:bg-white/8 border border-white/10 rounded-xl px-4 py-3 transition-colors group">
            {/* Icon */}
            <div
                className={`mt-0.5 p-2 rounded-lg ${isTruckStop ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400'
                    }`}
            >
                {isTruckStop ? <Fuel className="w-4 h-4" /> : <Hotel className="w-4 h-4" />}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{node.name}</p>
                <p className="text-xs text-white/50 mt-0.5">
                    {node.city}, {node.abbr}
                </p>
                {node.rate_notes && (
                    <p className="text-xs text-white/40 mt-1 truncate">{node.rate_notes}</p>
                )}
                {node.phone && (
                    <a
                        href={`tel:${node.phone}`}
                        className="mt-1 inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300"
                    >
                        <Phone className="w-3 h-3" /> Call
                    </a>
                )}
            </div>

            {/* Quality badge */}
            {node.quality_score > 0 && (
                <div className="flex items-center gap-0.5 text-xs text-white/30 group-hover:text-white/50 transition-colors">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{node.quality_score}</span>
                </div>
            )}
        </div>
    );
}
