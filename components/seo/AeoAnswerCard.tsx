import Link from "next/link";

type AeoAnswerFact = {
  label: string;
  value: string | number;
};

type AeoAnswerCardProps = {
  eyebrow?: string;
  question: string;
  answer: string;
  confidenceLabel: string;
  sourceLabel: string;
  sourceHref: string;
  ctaLabel: string;
  ctaHref: string;
  facts?: AeoAnswerFact[];
};

export function AeoAnswerCard({
  eyebrow = "Direct answer",
  question,
  answer,
  confidenceLabel,
  sourceLabel,
  sourceHref,
  ctaLabel,
  ctaHref,
  facts = [],
}: AeoAnswerCardProps) {
  return (
    <section className="rounded-xl border border-[#C6923A]/25 bg-[#0b0b0b] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
      <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#C6923A]">
        <span>{eyebrow}</span>
        <span className="rounded-md border border-white/10 bg-white/[0.06] px-2 py-1 text-[10px] text-[#d8c6a3]">
          {confidenceLabel}
        </span>
      </div>
      <h2 className="mt-3 text-2xl font-black tracking-tight text-white">{question}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-[#d8c6a3]">{answer}</p>
      {facts.length > 0 ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {facts.map((fact) => (
            <div key={fact.label} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-white/45">{fact.label}</div>
              <div className="mt-1 text-sm font-black text-white">{fact.value}</div>
            </div>
          ))}
        </div>
      ) : null}
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4 text-sm">
        <Link className="font-bold text-[#C6923A] hover:text-white" href={sourceHref}>
          Source: {sourceLabel}
        </Link>
        <Link className="rounded-lg bg-[#C6923A] px-4 py-2 font-black text-black" href={ctaHref}>
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
