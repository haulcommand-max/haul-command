import Link from 'next/link';

interface GlossaryTermProps {
    term: string;
    slug?: string;
    highlight?: boolean;
}

export function GlossaryTerm({ term, slug, highlight = true }: GlossaryTermProps) {
    const defaultSlug = term.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const finalSlug = slug || defaultSlug;

    return (
        <span 
            className="group relative inline-block border-b border-dashed border-[#d4950e40] hover:border-[#d4950e] transition-colors cursor-pointer"
            itemScope 
            itemType="https://schema.org/DefinedTerm"
        >
            <Link 
                href={`/glossary/${finalSlug}`}
                className={`${highlight ? 'text-[#e8a828]' : 'text-inherit font-semibold hover:text-[#d4950e]'} transition-colors`}
                itemProp="name"
            >
                {term}
            </Link>
            
            {/* SEO specific meta connection indicating this links to the authoritative definition */}
            <meta itemProp="url" content={`https://haulcommand.com/glossary/${finalSlug}`} />

            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs bg-[#141e28] border border-[#1e3048] text-xs text-[#8ab0d0] p-3 rounded-xl shadow-xl pointer-events-none z-50">
                <span className="font-bold text-[#f0f2f5] mb-1 block capitalize">{term}</span>
                <span className="block mb-1">Click to view official definition, requirements, and state compliance mapping.</span>
                <span className="text-[9px] uppercase tracking-wider text-[#d4950e] font-bold block mt-2">HC Official Glossary</span>
                {/* Arrow */}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#141e28] border-b border-r border-[#1e3048] transform rotate-45"></div>
            </div>
        </span>
    );
}
