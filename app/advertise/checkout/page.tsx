import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'AdGrid Checkout | Haul Command' };

interface Props { searchParams: Promise<{ plan?: string }> }

export default async function CheckoutPage({ searchParams }: Props) {
  const { plan } = await searchParams;

  const PLANS: Record<string, { name: string; price: number; desc: string }> = {
    starter: { name: 'Starter', price: 49, desc: '1 sponsored listing, state targeting, 5,000 impressions/mo' },
    corridor: { name: 'Corridor Sponsor', price: 149, desc: '1 corridor banner, 25,000 impressions/mo, corridor intel pages' },
    featured: { name: 'Featured Profile', price: 99, desc: 'Gold badge + top-3 placement, 15,000 impressions/mo' },
  };

  const selected = plan && PLANS[plan] ? PLANS[plan] : PLANS.starter;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <div className="text-center mb-6">
            <div className="text-xs font-bold text-[#C6923A] uppercase tracking-widest mb-2">AdGrid</div>
            <h1 className="text-2xl font-black text-gray-900">{selected.name}</h1>
            <div className="text-4xl font-black text-[#F1A91B] my-3">${selected.price}<span className="text-base text-gray-400">/mo</span></div>
            <p className="text-sm text-gray-500">{selected.desc}</p>
          </div>

          <div className="p-4 bg-[#F1A91B]/5 border border-[#F1A91B]/20 rounded-xl text-sm text-gray-600 mb-6">
            💳 Sign in or create an account to complete checkout. Billing is handled securely via Stripe.
          </div>

          <div className="flex gap-3">
            <Link href={`/login?redirect=/advertise/checkout?plan=${plan ?? 'starter'}`}
              className="flex-1 text-center py-3 bg-[#F1A91B] hover:bg-[#D4951A] text-black font-bold rounded-xl transition-colors text-sm">
              Sign In & Purchase
            </Link>
            <Link href={`/register?redirect=/advertise/checkout?plan=${plan ?? 'starter'}`}
              className="flex-1 text-center py-3 bg-[#0B0F14] text-white font-bold rounded-xl text-sm hover:bg-[#1a2332] transition-colors">
              Create Account
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link href="/advertise/buy" className="text-xs text-gray-400 hover:text-[#C6923A]">← Back to plans</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
