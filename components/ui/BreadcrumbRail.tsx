import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbCrumb {
    label: string;
    href?: string;
}

interface BreadcrumbRailProps {
    crumbs: BreadcrumbCrumb[];
    className?: string;
}

export function BreadcrumbRail({ crumbs, className = "" }: BreadcrumbRailProps) {
    // Generate BreadcrumbList JSON-LD
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://www.haulcommand.com/"
            },
            ...crumbs.map((crumb, index) => ({
                "@type": "ListItem",
                "position": index + 2,
                "name": crumb.label,
                "item": crumb.href ? `https://www.haulcommand.com${crumb.href}` : undefined
            }))
        ]
    };

    return (
        <nav aria-label="Breadcrumb" className={`w-full py-3 ${className}`}>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ol className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-medium text-[#8fa3b8]">
                <li className="flex items-center">
                    <Link href="/" aria-label="Home" className="hover:text-white transition-colors duration-200">
                        <Home className="w-4 h-4" />
                    </Link>
                </li>
                {crumbs.map((crumb, index) => {
                    const isLast = index === crumbs.length - 1;
                    return (
                        <li key={crumb.label} className="flex items-center gap-2">
                            <ChevronRight className="w-3 h-3 text-[#5A6577] flex-shrink-0" />
                            {isLast || !crumb.href ? (
                                <span className="text-[#C6923A] truncate max-w-[150px] sm:max-w-[200px]" aria-current="page">
                                    {crumb.label}
                                </span>
                            ) : (
                                <Link 
                                    href={crumb.href} 
                                    className="hover:text-white transition-colors duration-200 truncate max-w-[120px] sm:max-w-[200px]"
                                >
                                    {crumb.label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
