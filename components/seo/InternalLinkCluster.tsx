import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Scale, Wrench, Shield } from 'lucide-react';

export interface InternalLinkClusterProps {
    currentCategory: 'glossary' | 'regulation' | 'tool' | 'corridor' | 'role' | 'city';
    entityName: string;
    links: {
        glossary?: Array<{ label: string; href: string }>;
        regulations?: Array<{ label: string; href: string }>;
        tools?: Array<{ label: string; href: string }>;
        roles?: Array<{ label: string; href: string }>;
        corridors?: Array<{ label: string; href: string }>;
    };
    className?: string;
}

export function InternalLinkCluster({ currentCategory, entityName, links, className = "" }: InternalLinkClusterProps) {
    return (
        <div className={`w-full py-8 ${className}`}>
            <h3 className="text-sm font-bold text-[#C6923A] uppercase tracking-[0.1em] mb-6">
                Explore The {entityName} Ecosystem
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {links.glossary && links.glossary.length > 0 && (
                    <div className="flex flex-col gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <div className="flex items-center gap-2 text-white font-semibold mb-2">
                            <BookOpen className="w-4 h-4 text-[#8fa3b8]" />
                            Related Terminology
                        </div>
                        {links.glossary.map(link => (
                            <Link key={link.href} href={link.href} className="text-sm text-[#8fa3b8] hover:text-[#C6923A] transition-colors flex items-center group">
                                <ArrowRight className="w-3 h-3 mr-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                {link.label}
                            </Link>
                        ))}
                    </div>
                )}

                {links.regulations && links.regulations.length > 0 && (
                    <div className="flex flex-col gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <div className="flex items-center gap-2 text-white font-semibold mb-2">
                            <Scale className="w-4 h-4 text-[#8fa3b8]" />
                            Compliance Requirements
                        </div>
                        {links.regulations.map(link => (
                            <Link key={link.href} href={link.href} className="text-sm text-[#8fa3b8] hover:text-[#C6923A] transition-colors flex items-center group">
                                <ArrowRight className="w-3 h-3 mr-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                {link.label}
                            </Link>
                        ))}
                    </div>
                )}

                {links.tools && links.tools.length > 0 && (
                    <div className="flex flex-col gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <div className="flex items-center gap-2 text-white font-semibold mb-2">
                            <Wrench className="w-4 h-4 text-[#8fa3b8]" />
                            Ecosystem Tools
                        </div>
                        {links.tools.map(link => (
                            <Link key={link.href} href={link.href} className="text-sm text-[#8fa3b8] hover:text-[#C6923A] transition-colors flex items-center group">
                                <ArrowRight className="w-3 h-3 mr-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                {link.label}
                            </Link>
                        ))}
                    </div>
                )}

                {links.roles && links.roles.length > 0 && (
                    <div className="flex flex-col gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <div className="flex items-center gap-2 text-white font-semibold mb-2">
                            <Shield className="w-4 h-4 text-[#8fa3b8]" />
                            Certified Providers
                        </div>
                        {links.roles.map(link => (
                            <Link key={link.href} href={link.href} className="text-sm text-[#8fa3b8] hover:text-[#C6923A] transition-colors flex items-center group">
                                <ArrowRight className="w-3 h-3 mr-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                {link.label}
                            </Link>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}
