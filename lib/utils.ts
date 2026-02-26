import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes without conflicts.
 * Standard shadcn/ui pattern — used across the whole app.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
