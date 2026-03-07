import { notFound } from "next/navigation";

export function requireActivePageKey<T>(pageKey: T | null): T {
    if (!pageKey) notFound();
    return pageKey;
}

export function isNoindexPage(pageKey: any): boolean {
    return !pageKey.indexable;
}
