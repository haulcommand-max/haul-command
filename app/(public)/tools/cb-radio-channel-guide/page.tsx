import Link from 'next/link';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';

const canonicalUrl = 'https://www.haulcommand.com/tools/cb-radio-channel-guide';

export const metadata: Metadata = {
  title: 'CB Radio Channel Guide for Heavy-Haul Planning | Haul Command',
  description:
    'A source-cautious CB radio channel guide for heavy-haul, pilot car, convoy, and corridor planning. Includes jurisdiction caveats, planning prompts, and official source links.',
  alternates: { canonical: canonicalUrl },
};

const channelGroups = [
  {
    title: 'Default highway monitor',
    channel: '19',
    frequency: '27.185 MHz',
    guidance:
      'Common North American highway and truck traffic channel. Treat it as a coordination starting point, not a dispatch guarantee or legal requirement.',
  },
  {
    title: 'Emergency and traveler assistance',
    channel: '9',
    frequency: '27.065 MHz',
    guidance:
      'Reserved or specially treated in some rule sets. Keep it clear unless the local rule set and situation support emergency or traveler-assistance use.',
  },
  {
    title: 'Convoy working channel',
    channel: 'Agree before roll',
    frequency: 'Write it on the trip sheet',
    guidance:
      'Pick a primary and backup channel during the pre-trip briefing. Confirm radio check, handoff points, and what happens when the channel is congested.',
  },
  {
    title: 'Site, scale, yard, or port channel',
    channel: 'Local instruction',
    frequency: 'Posted or assigned locally',
    guidance:
      'Use the channel assigned by the facility, port, mine, yard, police escort, or traffic-control lead. Do not assume Channel 19 applies inside a controlled site.',
  },
];

const planningPrompts = [
  {
    label: 'Country',
    prompt:
      'What radio service rules apply in each country crossed, and does CB equipment need local certification, marking, or a different mode?',
  },
  {
    label: 'Region',
    prompt:
      'Which state, province, territory, prefecture, or corridor authority has operating rules, escort instructions, permit notes, or police-escort radio requirements?',
  },
  {
    label: 'Role',
    prompt:
      'Who owns each transmission: driver, front escort, rear escort, high-pole, steerman, traffic control, yard, broker, or route manager?',
  },
  {
    label: 'Convoy',
    prompt:
      'What are the primary channel, backup channel, call signs, silence periods, radio-check timing, and emergency escalation path?',
  },
  {
    label: 'Corridor',
    prompt:
      'Where will channel handoffs happen: border, weigh station, construction zone, port gate, plant entrance, mountain pass, bridge crossing, or urban detour?',
  },
];

const frequencies = [
  ['1', '26.965'], ['2', '26.975'], ['3', '26.985'], ['4', '27.005'],
  ['5', '27.015'], ['6', '27.025'], ['7', '27.035'], ['8', '27.055'],
  ['9', '27.065'], ['10', '27.075'], ['11', '27.085'], ['12', '27.105'],
  ['13', '27.115'], ['14', '27.125'], ['15', '27.135'], ['16', '27.155'],
  ['17', '27.165'], ['18', '27.175'], ['19', '27.185'], ['20', '27.205'],
  ['21', '27.215'], ['22', '27.225'], ['23', '27.255'], ['24', '27.235'],
  ['25', '27.245'], ['26', '27.265'], ['27', '27.275'], ['28', '27.285'],
  ['29', '27.295'], ['30', '27.305'], ['31', '27.315'], ['32', '27.325'],
  ['33', '27.335'], ['34', '27.345'], ['35', '27.355'], ['36', '27.365'],
  ['37', '27.375'], ['38', '27.385'], ['39', '27.395'], ['40', '27.405'],
];

const relatedLinks = [
  ['/tools/route-survey', 'Route survey field log'],
  ['/tools/permit-checker', 'Permit checker'],
  ['/tools/escort-count-calculator', 'Escort count calculator'],
  ['/tools/load-dimension-checker', 'Load dimension checker'],
  ['/route-check', 'Route check intake'],
  ['/regulations', 'Regulation library'],
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'CB Radio Channel Guide for Heavy-Haul Planning',
  description:
    'Source-cautious CB radio planning guide for heavy-haul, convoy, pilot car, and corridor operations.',
  url: canonicalUrl,
  mainEntityOfPage: canonicalUrl,
  publisher: {
    '@type': 'Organization',
    name: 'Haul Command',
    url: 'https://www.haulcommand.com',
  },
  about: [
    'CB radio',
    'heavy-haul convoy communications',
    'pilot car communications',
    'oversize load planning',
  ],
  isAccessibleForFree: true,
  inLanguage: 'en',
};

export default function CbRadioChannelGuidePage() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <main className="min-h-screen bg-[#07090d] text-[#eef3f8]">
        <section className="border-b border-[#162233] bg-[#0a111b]">
          <div className="mx-auto max-w-5xl px-4 py-12 lg:px-10">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f1a91b]">
              Planning guide - source cautious
            </p>
            <h1 className="mb-4 max-w-3xl text-3xl font-black leading-tight text-white lg:text-5xl">
              CB Radio Channel Guide for Heavy-Haul Planning
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-[#a7b4c5] lg:text-base">
              Use this as a planning worksheet for convoy, escort, yard, and corridor communication.
              It is not a universal radio-law authority, not a permit condition, and not a substitute for
              current country, regional, facility, or escort-authority instructions.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4 py-10 lg:px-10">
          <section className="mb-8 grid gap-4 md:grid-cols-2">
            {channelGroups.map((item) => (
              <article key={item.title} className="rounded-lg border border-[#1e3048] bg-[#0f1a24] p-5">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <h2 className="text-base font-bold text-white">{item.title}</h2>
                  <span className="shrink-0 rounded-md border border-[#2d4564] px-3 py-1 text-xs font-bold text-[#f1a91b]">
                    Ch {item.channel}
                  </span>
                </div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6f8299]">
                  {item.frequency}
                </p>
                <p className="text-sm leading-6 text-[#b7c4d4]">{item.guidance}</p>
              </article>
            ))}
          </section>

          <section className="mb-8 rounded-lg border border-[#2b3f5c] bg-[#101923] p-6">
            <h2 className="mb-3 text-xl font-black text-white">Pre-Trip Radio Plan</h2>
            <p className="mb-5 text-sm leading-6 text-[#a7b4c5]">
              Capture these fields before dispatch. The point is to make radio assumptions visible before
              the load enters a border, controlled facility, construction zone, or escort handoff.
            </p>
            <div className="grid gap-3">
              {planningPrompts.map((item) => (
                <div key={item.label} className="rounded-md border border-[#1e3048] bg-[#07101a] p-4">
                  <h3 className="mb-2 text-sm font-bold text-[#f1a91b]">{item.label}</h3>
                  <p className="text-sm leading-6 text-[#c8d2df]">{item.prompt}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-8 rounded-lg border border-[#5d4320] bg-[#20170d] p-6">
            <h2 className="mb-3 text-lg font-black text-white">Jurisdiction Caveats</h2>
            <ul className="space-y-3 text-sm leading-6 text-[#ead9bd]">
              <li>CB channel customs are not the same thing as enforceable operating authority.</li>
              <li>Country rules can differ on equipment certification, allowed modes, power, antennas, and permitted use.</li>
              <li>Ports, mines, plants, wind farms, refineries, police escorts, and traffic-control teams may assign their own working channel.</li>
              <li>Use current official regulator, permit-office, and site instructions before treating any channel as approved for a move.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-lg font-black text-white">40-Channel Reference</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
              {frequencies.map(([channel, mhz]) => (
                <div key={channel} className="rounded-md border border-[#1e3048] bg-[#0f1a24] px-3 py-2">
                  <div className="text-xs font-bold text-[#f1a91b]">Channel {channel}</div>
                  <div className="text-sm text-[#c8d2df]">{mhz} MHz</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-[#76869a]">
              This table reflects the common 40-channel 26.965-27.405 MHz plan used in North America and
              CEPT-style references. Verify the applicable national allocation and equipment rules before use.
            </p>
          </section>

          <section className="mb-8 rounded-lg border border-[#1e3048] bg-[#0f1a24] p-6">
            <h2 className="mb-4 text-lg font-black text-white">Source Trail</h2>
            <div className="grid gap-3 md:grid-cols-3">
              <a
                href="https://www.law.cornell.edu/cfr/text/47/part-95/subpart-D"
                className="rounded-md border border-[#2d4564] p-4 text-sm text-[#9fc3e7] hover:border-[#f1a91b]"
              >
                US 47 CFR Part 95 Subpart D
              </a>
              <a
                href="https://ised-isde.canada.ca/site/spectrum-management-telecommunications/en/licences-and-certificates/radiocom-information-circulars-ric/ric-18-general-radio-service-grs"
                className="rounded-md border border-[#2d4564] p-4 text-sm text-[#9fc3e7] hover:border-[#f1a91b]"
              >
                Canada ISED RIC-18 GRS
              </a>
              <a
                href="https://www.ofcom.org.uk/__data/assets/pdf_file/0025/72169/citizen-band-radio.pdf"
                className="rounded-md border border-[#2d4564] p-4 text-sm text-[#9fc3e7] hover:border-[#f1a91b]"
              >
                UK Ofcom CB radio consultation
              </a>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-black text-white">Related Planning Links</h2>
            <div className="flex flex-wrap gap-3">
              {relatedLinks.map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-md border border-[#1e3048] bg-[#0f1a24] px-3 py-2 text-xs font-semibold text-[#9fc3e7] hover:border-[#f1a91b] hover:text-[#f1a91b]"
                >
                  {label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
