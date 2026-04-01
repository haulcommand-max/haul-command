"use client";

import React from "react";
import Link from "next/link";
import { Calculator, Map, ShieldAlert, Zap, FileText, Compass, ChevronRight } from "lucide-react";

const TOOLS_LIST = [
    {
        title: "Route IQ",
        description: "AI-driven route clearance and geometry analysis.",
        href: "/tools/route-iq",
        icon: Compass,
        color: "text-blue-400"
    },
    {
        title: "Heavy Haul Rate Index",
        description: "Live market rates and historical trends.",
        href: "/tools/heavy-haul-index",
        icon: Zap,
        color: "text-hc-primary-gold"
    },
    {
        title: "Permit Checker",
        description: "Verify state reciprocity and rules instantly.",
        href: "/tools/permit-checker",
        icon: FileText,
        color: "text-emerald-400"
    },
    {
        title: "Route Complexity",
        description: "Analyze turn radii and elevation constraints.",
        href: "/tools/route-complexity",
        icon: Map,
        color: "text-purple-400"
    },
    {
        title: "State Requirements",
        description: "Vehicle and equipment compliance by state.",
        href: "/tools/state-requirements",
        icon: ShieldAlert,
        color: "text-red-400"
    },
    {
        title: "Permit Calculator",
        description: "Estimate multi-state permit costs.",
        href: "/tools/permit-calculator",
        icon: Calculator,
        color: "text-orange-400"
    },
];

interface ToolsSidebarProps {
    currentPath: string;
}

export default function ToolsSidebar({ currentPath }: ToolsSidebarProps) {
    const filteredTools = TOOLS_LIST.filter(t => !currentPath.includes(t.href)).slice(0, 4);

    return (
        <div className="bg-hc-panel border border-hc-industrial-charcoal rounded-xl p-6 sticky top-24">
            <h3 className="text-lg font-bold text-hc-text mb-4 tracking-tight uppercase text-xs tracking-widest text-hc-muted">
                Related Free Tools
            </h3>

            <div className="space-y-3">
                {filteredTools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                        <Link
                            key={tool.href}
                            href={tool.href}
                            className="block p-4 rounded-lg border border-transparent hover:border-hc-industrial-charcoal hover:bg-hc-elevated transition-all group"
                        >
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-md bg-hc-bg border border-hc-industrial-charcoal ${tool.color}`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-hc-text group-hover:text-hc-primary-gold transition-colors flex items-center gap-1">
                                        {tool.title}
                                    </h4>
                                    <p className="text-xs text-hc-muted mt-1 leading-relaxed">
                                        {tool.description}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>

            <div className="mt-6 pt-6 border-t border-hc-industrial-charcoal">
                <Link href="/loads" className="w-full flex items-center justify-between px-4 py-3 bg-hc-bg rounded-lg border border-hc-industrial-charcoal hover:border-hc-primary-gold transition-all group">
                    <span className="text-sm font-bold text-hc-text">View Live Load Board</span>
                    <ChevronRight className="w-4 h-4 text-hc-primary-gold group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    );
}
