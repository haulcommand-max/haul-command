'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

const EQUIPMENT_OPTIONS = [
  { id: 'escort_vehicle', label: 'Escort Vehicle', icon: '🚗', maxAmount: 85000 },
  { id: 'height_pole', label: 'Height Pole System', icon: '📡', maxAmount: 4500 },
  { id: 'light_bar', label: 'Light Bar Package', icon: '💡', maxAmount: 2000 },
  { id: 'radio_comms', label: 'Radio & Comms', icon: '📻', maxAmount: 1200 },
  { id: 'safety_bundle', label: 'Safety Equipment Bundle', icon: '🛡️', maxAmount: 1800 },
  { id: 'vehicle_upfit', label: 'Vehicle Upfit', icon: '🔧', maxAmount: 15000 },
  { id: 'multiple', label: 'Multiple Items', icon: '📦', maxAmount: 100000 },
];

export default function FinancingApplyPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    equipment_type: '',
    amount: '',
    description: '',
    use_case: '',
    business_years: '',
    monthly_jobs: '',
    email: '',
    phone: '',
    country: 'US',
    agree_terms: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const selectedEquipment = EQUIPMENT_OPTIONS.find(e => e.id === form.equipment_type);

  const handleSubmit = async () => {
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <>
        <Navbar />
        <main className="flex-grow w-full max-w-xl mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-3xl font-black text-white tracking-tighter mb-4">Application Received</h1>
          <p className="text-gray-400 mb-2">We're analyzing your platform performance data.</p>
          <p className="text-gray-400 mb-8">You'll receive a pre-approval decision within <span className="text-accent font-bold">24 hours</span>.</p>
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 mb-8 text-left space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Equipment</span>
              <span className="text-white font-bold">{selectedEquipment?.label ?? form.equipment_type}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Amount Requested</span>
              <span className="text-accent font-black">${Number(form.amount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Status</span>
              <span className="text-yellow-400 font-bold">Under Review</span>
            </div>
          </div>
          <Link href="/financing" className="text-accent hover:underline text-sm">← Back to Financing</Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-xl mx-auto px-4 py-12">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/financing" className="hover:text-accent">Financing</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Apply</span>
        </nav>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                s < step ? 'bg-accent text-black' : s === step ? 'bg-accent/20 text-accent border border-accent/40' : 'bg-white/5 text-gray-600'
              }`}>{s < step ? '✓' : s}</div>
              {s < 3 && <div className={`flex-1 h-0.5 rounded ${s < step ? 'bg-accent' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div>
            <h1 className="text-2xl font-black text-white tracking-tighter mb-2">What do you need?</h1>
            <p className="text-gray-500 text-sm mb-6">Select the equipment type you're financing</p>
            <div className="grid grid-cols-1 gap-3 mb-8">
              {EQUIPMENT_OPTIONS.map(e => (
                <button
                  key={e.id}
                  onClick={() => setForm(f => ({ ...f, equipment_type: e.id }))}
                  className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                    form.equipment_type === e.id
                      ? 'border-accent bg-accent/5 text-white'
                      : 'border-white/[0.08] bg-white/[0.02] text-gray-400 hover:border-white/20'
                  }`}
                >
                  <span className="text-2xl">{e.icon}</span>
                  <div>
                    <div className="font-bold text-sm">{e.label}</div>
                    <div className="text-xs text-gray-500">Up to ${e.maxAmount.toLocaleString()}</div>
                  </div>
                  {form.equipment_type === e.id && <span className="ml-auto text-accent">✓</span>}
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!form.equipment_type}
              className="w-full bg-accent text-black py-4 rounded-xl font-black text-base disabled:opacity-30 hover:bg-yellow-500 transition-colors"
            >
              Continue →
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="text-2xl font-black text-white tracking-tighter mb-2">Financing Details</h1>
            <p className="text-gray-500 text-sm mb-6">Tell us about the equipment and your operation</p>
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-gray-400 text-xs block mb-1.5">Amount Needed ($)</label>
                <input
                  type="number"
                  placeholder={`Up to $${selectedEquipment?.maxAmount.toLocaleString() ?? '100,000'}`}
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-accent/50 tabular-nums"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1.5">What's it for?</label>
                <textarea
                  placeholder="Describe the equipment, model, or vendor if known..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-accent/50 h-24 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs block mb-1.5">Years in business</label>
                  <select
                    value={form.business_years}
                    onChange={e => setForm(f => ({ ...f, business_years: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent/50"
                  >
                    <option value="">Select</option>
                    <option value="lt1">Less than 1 year</option>
                    <option value="1-3">1–3 years</option>
                    <option value="3-5">3–5 years</option>
                    <option value="5+">5+ years</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs block mb-1.5">Avg. jobs per month</label>
                  <select
                    value={form.monthly_jobs}
                    onChange={e => setForm(f => ({ ...f, monthly_jobs: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent/50"
                  >
                    <option value="">Select</option>
                    <option value="1-5">1–5</option>
                    <option value="6-15">6–15</option>
                    <option value="16-30">16–30</option>
                    <option value="30+">30+</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 bg-white/5 text-gray-400 py-4 rounded-xl font-bold border border-white/10">← Back</button>
              <button
                onClick={() => setStep(3)}
                disabled={!form.amount || !form.description}
                className="flex-[2] bg-accent text-black py-4 rounded-xl font-black disabled:opacity-30 hover:bg-yellow-500 transition-colors"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="text-2xl font-black text-white tracking-tighter mb-2">Almost Done</h1>
            <p className="text-gray-500 text-sm mb-6">We'll link your Haul Command account for platform data scoring</p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-gray-400 text-xs block mb-1.5">Email address</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-accent/50"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1.5">Phone number</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-accent/50"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1.5">Country</label>
                <select
                  value={form.country}
                  onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent/50"
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="GB">United Kingdom</option>
                  <option value="ZA">South Africa</option>
                  <option value="BR">Brazil</option>
                  <option value="IN">India</option>
                  <option value="other">Other (120 countries)</option>
                </select>
              </div>
            </div>

            {/* Data Use Notice */}
            <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-4 mb-6">
              <p className="text-blue-400 text-xs font-bold mb-1">📊 Platform Intelligence Scoring</p>
              <p className="text-gray-500 text-xs">
                By applying, you authorize Haul Command to share your earnings history, job completion rate,
                and reputation score with our lending partners for underwriting purposes. This does not affect
                your credit score.
              </p>
            </div>

            <label className="flex items-start gap-3 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={form.agree_terms}
                onChange={e => setForm(f => ({ ...f, agree_terms: e.target.checked }))}
                className="mt-1 accent-yellow-400"
              />
              <span className="text-gray-400 text-xs">
                I agree to the <Link href="/terms" className="text-accent hover:underline">Terms of Service</Link> and
                authorize platform data sharing for loan evaluation purposes.
              </span>
            </label>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 bg-white/5 text-gray-400 py-4 rounded-xl font-bold border border-white/10">← Back</button>
              <button
                onClick={handleSubmit}
                disabled={!form.email || !form.agree_terms}
                className="flex-[2] bg-accent text-black py-4 rounded-xl font-black disabled:opacity-30 hover:bg-yellow-500 transition-colors"
              >
                Submit Application →
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
