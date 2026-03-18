'use client';
import type { HCContact } from '@/lib/hc-types';

export function HCStickyContactBar({ contact, claimHref, entityName }: { contact: HCContact; claimHref: string; entityName: string }) {
  const hasPhone = !!contact.phoneE164;
  const hasSms = !!contact.smsE164;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0a0e1a]/95 backdrop-blur-lg border-t border-white/10 px-4 py-3 safe-area-bottom">
      <div className="flex gap-2 max-w-lg mx-auto">
        {hasPhone && (
          <a href={`tel:${contact.phoneE164}`} className="flex-1 bg-green-600 text-white text-center py-3 rounded-xl font-bold text-sm hover:bg-green-500 transition-colors">
            📞 Call
          </a>
        )}
        {hasSms && (
          <a href={`sms:${contact.smsE164}`} className="flex-1 bg-blue-600 text-white text-center py-3 rounded-xl font-bold text-sm hover:bg-blue-500 transition-colors">
            💬 Text
          </a>
        )}
        <a href={claimHref} className="flex-1 bg-accent text-black text-center py-3 rounded-xl font-bold text-sm hover:bg-yellow-400 transition-colors">
          🏷️ Claim
        </a>
      </div>
    </div>
  );
}
