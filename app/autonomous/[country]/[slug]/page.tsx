import { Metadata } from 'next';
import { AV_KEYWORDS, COUNTRY_LANGUAGE_MAP } from '@/lib/seo/av-keywords';
import { notFound } from 'next/navigation';

const COUNTRY_NAMES: Record<string, string> = {
  us:'United States',ca:'Canada',gb:'United Kingdom',au:'Australia',de:'Germany',nl:'Netherlands',
  es:'Spain',mx:'Mexico',co:'Colombia',ar:'Argentina',cl:'Chile',pe:'Peru',br:'Brazil',pt:'Portugal',
  fr:'France',be:'Belgium',se:'Sweden',ae:'United Arab Emirates',sa:'Saudi Arabia',qa:'Qatar',
  dk:'Denmark',no:'Norway',fi:'Finland',it:'Italy',at:'Austria',ch:'Switzerland',in:'India',
  sg:'Singapore',nz:'New Zealand',ie:'Ireland',za:'South Africa',jp:'Japan',kr:'South Korea',
  pl:'Poland',cz:'Czech Republic',hu:'Hungary',
};

type Props = { params: Promise<{ country: string; slug: string }> };

function findKeyword(country: string, slug: string) {
  const cc = country.toUpperCase();
  const langs = COUNTRY_LANGUAGE_MAP[cc] || ['en'];
  for (const lang of langs) {
    const kws = AV_KEYWORDS[lang] || [];
    const found = kws.find(k => k.slug === slug);
    if (found) return { ...found, countryCode: cc };
  }
  const enKws = AV_KEYWORDS.en || [];
  return enKws.find(k => k.slug === slug) ? { ...enKws.find(k => k.slug === slug)!, countryCode: cc } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, slug } = await params;
  const kw = findKeyword(country, slug);
  if (!kw) return { title: 'Page Not Found' };
  const cn = COUNTRY_NAMES[country.toLowerCase()] || country.toUpperCase();
  return {
    title: `${kw.title} in ${cn} | Haul Command`,
    description: `${kw.description} Coverage in ${cn}. Find AV-certified escort operators now.`,
  };
}

export default async function AVSeoPage({ params }: Props) {
  const { country, slug } = await params;
  const kw = findKeyword(country, slug);
  if (!kw) notFound();
  const cn = COUNTRY_NAMES[country.toLowerCase()] || country.toUpperCase();

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', color: '#fff' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <span style={{ padding: '4px 12px', borderRadius: 8, background: 'rgba(0,255,136,0.12)', color: '#00ff88', fontSize: 12, fontWeight: 600 }}>{cn}</span>
          <span style={{ padding: '4px 12px', borderRadius: 8, background: 'rgba(0,212,255,0.12)', color: '#00d4ff', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>{kw.language}</span>
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>{kw.title} in {cn}</h1>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 32 }}>{kw.description}</p>

        <div style={{ padding: 24, background: 'rgba(255,255,255,0.04)', borderRadius: 12, marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Escort Requirements in {cn}</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>Autonomous truck operations in {cn} require certified escort vehicles under current regulations. Requirements vary by jurisdiction, load dimensions, and corridor type. Haul Command provides real-time compliance verification for all escort assignments.</p>
        </div>

        <div style={{ padding: 24, background: 'rgba(255,255,255,0.04)', borderRadius: 12, marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Why Haul Command for {kw.keyword}?</h2>
          <ul style={{ margin: 0, padding: '0 0 0 20px', color: 'rgba(255,255,255,0.7)', lineHeight: 2 }}>
            <li>AV-certified escort operators available 24/7</li>
            <li>Real-time compliance verification for {cn} regulations</li>
            <li>Automated dispatch via API for autonomous fleet operators</li>
            <li>Trust-scored operators with verified insurance and certifications</li>
            <li>Coverage on all major {cn} freight corridors</li>
          </ul>
        </div>

        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <a href="/enterprise/autonomous" style={{ display: 'inline-block', padding: '14px 36px', borderRadius: 10, background: 'linear-gradient(135deg, #00ff88, #00d4ff)', color: '#000', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>Get Started with Haul Command</a>
        </div>
      </div>
    </div>
  );
}
