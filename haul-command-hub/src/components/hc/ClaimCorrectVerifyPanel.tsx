import type { HCAction } from '@/lib/hc-types';

interface ClaimCorrectVerifyPanelProps {
  claimAction?: HCAction;
  correctAction?: HCAction;
  verifyAction?: HCAction;
  reportAction?: HCAction;
  contextCopy?: string;
}

export default function HCClaimCorrectVerifyPanel({
  claimAction,
  correctAction,
  verifyAction,
  reportAction,
  contextCopy,
}: ClaimCorrectVerifyPanelProps) {
  return (
    <div className="bg-gradient-to-r from-accent/[0.06] to-transparent border border-accent/20 rounded-2xl p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg mb-1">
            Own Your Profile on Haul Command
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            {contextCopy || 'Claim your listing to unlock premium features, respond to loads, and build your verified reputation in the heavy haul industry.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {claimAction && (
            <a
              href={claimAction.href}
              className="bg-accent text-black px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-all"
            >
              {claimAction.label}
            </a>
          )}
          {verifyAction && (
            <a
              href={verifyAction.href}
              className="bg-white/10 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/20 transition-all"
            >
              {verifyAction.label}
            </a>
          )}
          {correctAction && (
            <a
              href={correctAction.href}
              className="text-gray-400 hover:text-accent px-3 py-2.5 text-sm font-medium transition-colors"
            >
              {correctAction.label}
            </a>
          )}
          {reportAction && (
            <a
              href={reportAction.href}
              className="text-gray-500 hover:text-accent px-3 py-2.5 text-xs transition-colors"
            >
              {reportAction.label}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
