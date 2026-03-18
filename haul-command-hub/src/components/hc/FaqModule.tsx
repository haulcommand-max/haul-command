import type { HCFaqItem } from '@/lib/hc-types';

interface FaqModuleProps {
  heading?: string;
  items: HCFaqItem[];
}

export default function HCFaqModule({ heading = 'Frequently Asked Questions', items }: FaqModuleProps) {
  if (!items.length) return null;

  return (
    <section className="py-8">
      <h2 className="text-2xl font-bold text-white mb-6">{heading}</h2>
      <div className="space-y-4">
        {items.map((item, i) => (
          <details
            key={i}
            className="group bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden"
          >
            <summary className="flex items-center justify-between cursor-pointer px-6 py-4 text-white font-medium text-sm hover:bg-white/[0.02] transition-colors list-none">
              <span>{item.question}</span>
              <span className="text-accent text-lg group-open:rotate-45 transition-transform ml-4">+</span>
            </summary>
            <div className="px-6 pb-4 text-gray-400 text-sm leading-relaxed">
              {item.answer}
            </div>
          </details>
        ))}
      </div>
      {/* FAQPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: items.map((item) => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
              },
            })),
          }),
        }}
      />
    </section>
  );
}
