import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getGlossaryTermLocalized, generateGlossaryHreflang } from '@/lib/glossary/localized';
import { getTermUsages } from '@/lib/glossary/api';
import { getLocale, showFrenchToggle } from '@/lib/i18n/locale';
import { GlossaryTermView } from '@/components/glossary/GlossaryTermView';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const locale = await getLocale();
    const term = await getGlossaryTermLocalized(slug, locale);

    if (!term) return { title: 'Term Not Found | Haul Command' };

    const hreflangTags = generateGlossaryHreflang(slug, term.available_locales);

    return {
        title: `${term.term_display} — ESC Glossary | Haul Command`,
        description: term.short_definition_display,
        alternates: {
            canonical: `/glossary/${slug}`,
            languages: Object.fromEntries(
                hreflangTags
                    .filter(t => t.hreflang !== 'x-default')
                    .map(t => [t.hreflang, t.href])
            ),
        },
        robots: 'index,follow',
        openGraph: {
            title: `${term.term_display} — ESC Glossary`,
            description: term.short_definition_display,
            url: `https://haulcommand.com/glossary/${slug}`,
        },
    };
}

export default async function GlossaryTermPage({ params }: Props) {
    const { slug } = await params;
    const locale = await getLocale();

    const term = await getGlossaryTermLocalized(slug, locale);
    if (!term) notFound();

    const usages = await getTermUsages(slug, 10);
    const showToggle = await showFrenchToggle();

    return (
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1rem' }}>
            <GlossaryTermView
                term={term}
                usages={usages}
                showFrenchToggle={showToggle}
            />
        </div>
    );
}
