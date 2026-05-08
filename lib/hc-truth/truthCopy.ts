export type PayerRiskCopyKey = 'unknown' | 'slowPay' | 'dispute' | 'verified';

export const payerRiskCopy: Record<PayerRiskCopyKey, string> = {
  unknown: 'Limited payment history available. Consider requesting escrow, deposit, or written payment terms.',
  slowPay: 'Operator-reported slow-payment signals exist. Confirm payment terms before accepting.',
  dispute: 'Payment dispute signals exist. Review documentation and consider payment protection.',
  verified: 'This payer has stronger verified payment signals than typical new payers.',
};

export type InsuranceCopyKey = 'uploaded' | 'expired' | 'missing' | 'verified';

export const insuranceCopy: Record<InsuranceCopyKey, string> = {
  uploaded: 'Insurance document uploaded. Coverage should be independently verified before dispatch.',
  expired: 'Insurance document appears expired or needs update.',
  missing: 'No insurance document is currently visible on this profile.',
  verified: 'Insurance document has been marked current in Haul Command.',
};

export function getPayerRiskCopy(key: PayerRiskCopyKey): string {
  return payerRiskCopy[key];
}

export function getInsuranceCopy(key: InsuranceCopyKey): string {
  return insuranceCopy[key];
}
