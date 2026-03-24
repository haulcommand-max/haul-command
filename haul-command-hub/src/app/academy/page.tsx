import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Haul Command Academy — Pilot Car & Escort Operator Certification',
  description:
    'Online certification for pilot car and escort vehicle operators. Country-specific courses in local languages. Recognized by transport ministries across 57 countries.',
};

const COURSES = [
  { country: '🇺🇸', name: 'United States', title: 'Certified Escort Vehicle Operator', price: '$149', duration: '8h · 12 modules', status: 'live', language: 'English' },
  { country: '🇨🇦', name: 'Canada', title: 'Pilot Car Operator Certification', price: '$149', duration: '8h · 10 modules', status: 'live', language: 'EN/FR' },
  { country: '🇦🇺', name: 'Australia', title: 'PBS Pilot Vehicle Operator (NHVR)', price: '$179', duration: '10h · 11 modules', status: 'live', language: 'English' },
  { country: '🇬🇧', name: 'United Kingdom', title: 'Abnormal Load Pilot — STGO', price: '£129', duration: '8h · 9 modules', status: 'live', language: 'English' },
  { country: '🇮🇳', name: 'India', title: 'Over-Dimensional Cargo Escort', price: '₹3,999', duration: '6h · 8 modules', status: 'beta', language: 'Hindi/EN' },
  { country: '🇧🇷', name: 'Brazil', title: 'Operador de Escolta de Cargas', price: 'R$499', duration: '8h · 10 modules', status: 'beta', language: 'Português' },
  { country: '🇸🇦', name: 'Saudi Arabia', title: 'قائد مركبات المرافقة', price: '449 SAR', duration: '8h · 9 modules', status: 'coming', language: 'AR/EN' },
  { country: '🇿🇦', name: 'South Africa', title: 'Abnormal Load Escort — RTMC', price: 'R$1,299', duration: '7h · 8 modules', status: 'coming', language: 'EN/AF' },
];

export default function AcademyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-12 overflow-x-hidden">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Academy</span>
        </nav>

        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-1.5 mb-6">
            <span className="text-purple-400 text-xs font-bold uppercase tracking-wider">🎓 57 Countries · Local Languages</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter mb-4">
            Get Certified.<br />
            <span className="text-purple-400">Get More Runs.</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            The first global training platform built for pilot car and escort operators. Country-specific
            curriculum, local language, officially recognized — zero marginal delivery cost per student.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/academy/enroll" className="bg-purple-500 text-white px-8 py-3.5 rounded-xl font-black text-sm hover:bg-purple-400 transition-colors shadow-lg shadow-purple-500/20">
              Start Course →
            </Link>
            <Link href="#courses" className="bg-white/5 text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-white/10 border border-white/10 transition-colors">
              Browse Courses
            </Link>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-16">
          {[
            { value: '57', label: 'Country curricula' },
            { value: '12+', label: 'Languages' },
            { value: '$149', label: 'Starting price' },
            { value: '$0', label: 'Marginal delivery cost' },
          ].map(s => (
            <div key={s.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 text-center">
              <div className="text-purple-400 font-black text-2xl">{s.value}</div>
              <div className="text-gray-500 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Courses */}
        <section id="courses" className="mb-16">
          <h2 className="text-3xl font-black text-white tracking-tighter mb-2 text-center">Available Courses</h2>
          <p className="text-gray-500 text-sm text-center mb-8">Country-specific certification covering local regulations, permit requirements, and safety standards</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {COURSES.map(c => (
              <div key={c.name} className={`bg-white/[0.03] border rounded-2xl p-5 hover:border-purple-500/20 transition-all relative ${c.status === 'coming' ? 'opacity-60 border-white/[0.04]' : 'border-white/[0.08]'}`}>
                {c.status === 'beta' && <div className="absolute top-3 right-3 bg-yellow-500/10 text-yellow-400 text-[9px] font-black px-2 py-0.5 rounded-full">Beta</div>}
                {c.status === 'coming' && <div className="absolute top-3 right-3 bg-white/[0.06] text-gray-500 text-[9px] font-bold px-2 py-0.5 rounded-full">Coming Soon</div>}
                <div className="text-3xl mb-2">{c.country}</div>
                <div className="text-white font-black text-sm mb-0.5">{c.name}</div>
                <div className="text-purple-400 font-bold text-xs mb-2">{c.title}</div>
                <div className="flex items-center justify-between text-[10px] text-gray-500 mb-3">
                  <span>{c.duration}</span>
                  <span>{c.language}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-accent font-black text-lg">{c.price}</span>
                  {c.status !== 'coming' && (
                    <Link href="/academy/enroll" className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-lg text-xs font-bold hover:bg-purple-500/20 transition-colors">
                      Enroll →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-600 text-xs mt-4">+ 49 additional country curricula in development</p>
        </section>

        {/* Value Props */}
        <section className="mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: '🤖', title: 'AI-Built Curriculum', desc: 'Regs extracted from each country\'s transport authority automatically. Stays current.' },
              { icon: '🎙️', title: 'Native Language Voice', desc: 'Audio narration in each country\'s language. Professional quality on demand.' },
              { icon: '🏆', title: 'Verifiable Certificates', desc: 'QR code on every cert. DOTs and project managers can verify instantly.' },
            ].map(v => (
              <div key={v.title} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:border-purple-500/20 transition-all">
                <div className="text-3xl mb-3">{v.icon}</div>
                <h3 className="text-white font-bold text-sm mb-1">{v.title}</h3>
                <p className="text-gray-500 text-xs">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Government partnership */}
        <div className="bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 rounded-2xl p-8 text-center mb-8">
          <h2 className="text-white font-black text-2xl tracking-tighter mb-3">Government & DOT Partnerships</h2>
          <p className="text-gray-400 text-sm mb-6 max-w-xl mx-auto">
            Transport ministries in Saudi Arabia, India, Brazil, and across Africa are seeking training partners for a workforce that has no formal certification pathway. We are the only partner who can deliver this at scale in local language.
          </p>
          <Link href="mailto:academy@haulcommand.com" className="text-purple-400 hover:underline text-sm font-bold">Contact Academy Partnerships →</Link>
        </div>

        <div className="bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-white font-black text-3xl tracking-tighter mb-3">Certified Operators Get Priority</h2>
          <p className="text-gray-400 text-sm mb-8 max-w-xl mx-auto">
            Academy-certified operators get priority placement in search, load matching, and standing order assignment.
          </p>
          <Link href="/academy/enroll" className="inline-flex bg-purple-500 text-white px-10 py-4 rounded-xl font-black text-base hover:bg-purple-400 transition-colors">
            Enroll — From $149 →
          </Link>
          <p className="text-gray-600 text-xs mt-4">Annual recertification from $49/yr · Certificates verifiable via QR code</p>
        </div>
      </main>
    </>
  );
}
