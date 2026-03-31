import Link from "next/link";

interface Item {
    path: string;
    label?: string;
}

/**
 * Reusable list component for signal-weighted internal links.
 * Auto-generates labels from path slugs if none provided.
 */
export default function WeightedLinkList({
    items,
    className,
}: {
    items: Item[];
    className?: string;
}) {
    if (!items?.length) return null;

    return (
        <ul className={className ?? "grid gap-2"}>
            {items.map((item) => (
                <li key={item.path}>
                    <Link aria-label="Navigation Link"
                        href={item.path}
                        className="text-sm text-hc-gold-400 hover:text-hc-gold-300 hover:underline transition-colors"
                    >
                        {item.label ?? item.path.split("/").pop()?.replace(/-/g, " ")}
                    </Link>
                </li>
            ))}
        </ul>
    );
}
