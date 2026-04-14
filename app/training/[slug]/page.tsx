import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { HCContentPageShell } from "@/components/content-system/shell/HCContentPageShell";

export const dynamic = 'force-dynamic';

export default async function TrainingCoursePage({ params }: { params: { slug: string } }) {
    const { slug } = await params;
    const formattedTitle = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    return (
        <HCContentPageShell>
            <div className="max-w-4xl mx-auto pt-32 pb-24 px-4 text-center">
                <ShieldAlert className="w-16 h-16 text-hc-gold-500 mx-auto mb-6" />
                <h1 className="text-3xl md:text-5xl font-black text-white mb-4">{formattedTitle}</h1>
                <p className="text-hc-muted mb-8 text-xl max-w-2xl mx-auto">
                    This training module is currently being verified and will be available for enrollment shortly.
                </p>
                <Link href="/training" className="inline-flex items-center gap-2 px-8 py-4 bg-hc-surface border border-white/10 text-white font-bold uppercase tracking-widest text-sm rounded-full hover:bg-hc-high transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Return to Training Hub
                </Link>
            </div>
        </HCContentPageShell>
    );
}
