import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import BrokerVerifyClient from './BrokerVerifyClient';

export const metadata: Metadata = {
  title: 'Broker & Dispatcher Verification Tool | Haul Command',
  description: 'Instantly verify heavy haul and oversize freight brokers via MC Number. Check risk scores, bond status, and business legitimacy.',
  alternates: {
    canonical: 'https://haulcommand.com/tools/broker-verify',
  }
};

export default function BrokerVerifyPage() {

  return (
    <>
      <Navbar />
      <main className="flex-grow pt-[80px] sm:pt-[100px] px-4 pb-20">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-10 text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4 uppercase">
              Broker <span className="text-accent underline decoration-[6px] underline-offset-4">Verify</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Verify freight brokers and dispatchers instantly. We cross-reference FMCSA databases, bond status, and community risk scoring to keep you protected.
            </p>
          </div>

          <BrokerVerifyClient />

          {/* Marketing/SEO Text Block */}
          <div className="mt-16 bg-white/[0.02] border border-white/5 rounded-2xl p-8 lg:p-12">
            <h2 className="text-2xl font-bold text-white mb-6">Why run a broker background check?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 text-sm text-gray-400 leading-relaxed">
              <div>
                <h3 className="text-white font-bold mb-2 uppercase tracking-wide">1. Double Brokering Scams</h3>
                <p>
                  Identity theft is rising in logistics. Our verification engine cross-checks the registered phone numbers against known fraudulent aliases to ensure you are talking to the actual bond holder.
                </p>
              </div>
              <div>
                <h3 className="text-white font-bold mb-2 uppercase tracking-wide">2. Bond & Insurance Lapses</h3>
                <p>
                  A broker operating without a valid $75,000 BMC-84 bond leaves the carrier legally exposed. We map their FMCSA operational status directly to their profile to confirm active bonding.
                </p>
              </div>
              <div>
                <h3 className="text-white font-bold mb-2 uppercase tracking-wide">3. Community Risk Scores</h3>
                <p>
                  We aggregate payment history, average days-to-pay, and user reports from pilot car drivers and heavy haul carriers who have previously moved freight for the entity.
                </p>
              </div>
            </div>
          </div>
          
        </div>
      </main>
    </>
  );
}
