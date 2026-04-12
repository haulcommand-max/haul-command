import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import CheckoutContent from './CheckoutContent';

export const metadata = {
  title: 'Secure Your Territory | AdGrid Checkout | Haul Command',
  description: 'Lock the exclusive AdGrid Sponsor slot for your market territory. 100% Share-of-Voice for all broker routing searches.',
};

export default function AdGridCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400 font-mono tracking-widest uppercase">
          <Loader2 className="animate-spin h-8 w-8 mr-4" /> Initiating Gateway...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
