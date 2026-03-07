export type AdGridSlotData = {
    id: string;
    inventory_key: string;
    page_key_id: string;
    placement_type: string;
    traffic_band: string;
    floor_price_usd: number;
    is_sellable: boolean;
};

export function shouldRenderAd(slot: AdGridSlotData | null): boolean {
    return !!slot && slot.is_sellable;
}

export function trafficBandLabel(band: string): string {
    const labels: Record<string, string> = {
        starter: "Starter",
        growth: "Growth",
        premium: "Premium",
        elite: "Elite",
    };
    return labels[band] ?? band;
}

export function trafficBandColor(band: string): string {
    const colors: Record<string, string> = {
        starter: "#9ca3af",
        growth: "#8090ff",
        premium: "#ffb400",
        elite: "#00c896",
    };
    return colors[band] ?? "#666";
}
