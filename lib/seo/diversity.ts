export interface DiversityOptions {
    maxPerMetroCluster?: number; // e.g. 2
    maxPerH3r6?: number;         // e.g. 3
}

export function applyDiversityGuard<T extends {
    path: string;
    metro_cluster_id?: string | null;
    h3_r6?: string | null;
}>(items: T[], opts?: DiversityOptions): T[] {
    const maxPerMetroCluster = opts?.maxPerMetroCluster ?? 2;
    const maxPerH3r6 = opts?.maxPerH3r6 ?? 3;

    const metroCounts = new Map<string, number>();
    const h3Counts = new Map<string, number>();

    const out: T[] = [];
    const seenPath = new Set<string>();

    for (const it of items) {
        if (seenPath.has(it.path)) continue;

        const metro = it.metro_cluster_id ?? "";
        const h3 = it.h3_r6 ?? "";

        if (metro) {
            const c = metroCounts.get(metro) ?? 0;
            if (c >= maxPerMetroCluster) continue;
            metroCounts.set(metro, c + 1);
        }

        if (h3) {
            const c = h3Counts.get(h3) ?? 0;
            if (c >= maxPerH3r6) continue;
            h3Counts.set(h3, c + 1);
        }

        seenPath.add(it.path);
        out.push(it);
    }

    return out;
}
