'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowDownToLine,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Lock,
  Clock,
  Wallet,
  ChevronDown,
} from 'lucide-react';

const STABLECOIN_NETWORKS = [
  { id: 'usdt_trx', label: 'USDT', network: 'Tron (TRC-20)', icon: '₮', color: '#26A17B', gradient: 'linear-gradient(135deg, #26A17B, #1a7a5e)', gasFee: '~$0.001', confirmTime: '~3 min', minWithdraw: 10 },
  { id: 'usdt_bsc', label: 'USDT', network: 'BNB Chain (BEP-20)', icon: '₮', color: '#F0B90B', gradient: 'linear-gradient(135deg, #F0B90B, #c4960a)', gasFee: '~$0.05', confirmTime: '~15 sec', minWithdraw: 10 },
  { id: 'usdc_sol', label: 'USDC', network: 'Solana (SPL)', icon: '$', color: '#2775CA', gradient: 'linear-gradient(135deg, #2775CA, #1a5fa8)', gasFee: '~$0.00025', confirmTime: '~30 sec', minWithdraw: 5 },
  { id: 'usdc_matic', label: 'USDC', network: 'Polygon (PoS)', icon: '$', color: '#8247E5', gradient: 'linear-gradient(135deg, #8247E5, #6a35c7)', gasFee: '~$0.001', confirmTime: '~2 min', minWithdraw: 5 },
];

type Step = 'form' | 'confirm' | 'processing' | 'success' | 'error';

interface WalletBalance {
  balance_usd: number;
  pending_usd: number;
  available_usd: number;
  kyc_status: 'unverified' | 'pending' | 'verified';
}

interface TreasuryWithdrawalFormProps {
  operatorId: string;
  onSuccess?: (txRef: string) => void;
}

export function TreasuryWithdrawalForm({ operatorId, onSuccess }: TreasuryWithdrawalFormProps) {
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [selectedNetwork, setSelectedNetwork] = useState(STABLECOIN_NETWORKS[2]);
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const [step, setStep] = useState<Step>('form');
  const [errorMsg, setErrorMsg] = useState('');
  const [txRef, setTxRef] = useState('');
  const [showNetworkPicker, setShowNetworkPicker] = useState(false);

  useEffect(() => {
    fetch(`/api/crypto/wallet?user_id=${operatorId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setWallet(data); setWalletLoading(false); })
      .catch(() => setWalletLoading(false));
  }, [operatorId]);

  const amountNum = parseFloat(amount) || 0;
  const isAmountValid = amountNum >= selectedNetwork.minWithdraw && amountNum <= (wallet?.available_usd ?? 0);

  const validateAddress = useCallback((addr: string) => {
    if (!addr) { setAddressError(''); return; }
    const id = selectedNetwork.id;
    if (id === 'usdt_trx' && !addr.startsWith('T')) setAddressError('Tron addresses start with "T"');
    else if ((id === 'usdt_bsc' || id === 'usdc_matic') && !addr.startsWith('0x')) setAddressError('BSC/Polygon addresses start with "0x"');
    else if (addr.length < 32) setAddressError('Address appears too short');
    else setAddressError('');
  }, [selectedNetwork.id]);

  const handleSubmit = async () => {
    if (!isAmountValid || !address || addressError) return;
    setStep('processing');
    setErrorMsg('');
    try {
      const res = await fetch('/api/treasury/nowpayments-withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator_id: operatorId, amount_usd: amountNum, payout_currency: selectedNetwork.id, destination_address: address }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error ?? 'Withdrawal failed.'); setStep('error'); return; }
      setTxRef(data.payout_id ?? `HC-${Date.now()}`);
      setStep('success');
      onSuccess?.(data.payout_id ?? '');
    } catch (err: any) { setErrorMsg(err.message ?? 'Network error'); setStep('error'); }
  };

  if (!walletLoading && wallet?.kyc_status !== 'verified') {
    return (
      <div style={S.kycGate}>
        <div style={S.kycIcon}><Shield size={32} color="#F59E0B" /></div>
        <h3 style={S.kycTitle}>Identity Verification Required</h3>
        <p style={S.kycBody}>Under FATF Travel Rule and FinCEN regulations, crypto payouts require KYC/W-9 verification.</p>
        <button style={S.kycBtn} onClick={() => window.location.href = '/dashboard/settings/kyc'}>Complete Verification →</button>
      </div>
    );
  }

  return (
    <div style={S.root}>
      <div style={S.header}>
        <div style={S.headerIcon}><ArrowDownToLine size={22} color="#34d399" /></div>
        <div>
          <h2 style={S.headerTitle}>Crypto Payout</h2>
          <p style={S.headerSub}>Stablecoin withdrawal · Settled instantly</p>
        </div>
        <div style={S.kycBadge}><CheckCircle2 size={12} color="#34d399" /><span>KYC ✓</span></div>
      </div>

      <div style={S.balanceCard}>
        <div style={S.balanceRow}>
          <div>
            <div style={S.balanceLabel}><Wallet size={12} style={{ marginRight: 4 }} />Available Balance</div>
            <div style={S.balanceAmount}>{walletLoading ? '—' : `$${(wallet?.available_usd ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={S.balanceLabel}><Clock size={12} style={{ marginRight: 4 }} />T+3 Pending</div>
            <div style={{ ...S.balanceAmount, color: '#94a3b8', fontSize: 18 }}>{walletLoading ? '—' : `$${(wallet?.pending_usd ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}</div>
          </div>
        </div>
        <div style={S.tPlusNotice}><Lock size={11} /><span>Escrow funds unlock T+3 (72h) after delivery to prevent card chargebacks</span></div>
      </div>

      {step === 'success' && (
        <div style={S.success}>
          <CheckCircle2 size={48} color="#34d399" />
          <h3 style={{ color: '#fff', margin: '12px 0 6px', fontSize: 20, fontWeight: 800 }}>Payout Queued</h3>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>Your {selectedNetwork.label} is en route via {selectedNetwork.network}</p>
          <div style={S.txRef}>REF: {txRef}</div>
          <p style={{ color: '#64748b', fontSize: 11, marginTop: 8 }}>Typical confirmation: {selectedNetwork.confirmTime}</p>
          <button style={S.resetBtn} onClick={() => { setStep('form'); setAmount(''); setAddress(''); }}>New Withdrawal</button>
        </div>
      )}

      {step === 'error' && (
        <div style={S.errorBox}>
          <AlertTriangle size={20} color="#f87171" />
          <div>
            <p style={{ color: '#f87171', fontWeight: 700, margin: '0 0 4px', fontSize: 14 }}>Withdrawal Blocked</p>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: 13 }}>{errorMsg}</p>
          </div>
          <button style={S.errorRetry} onClick={() => setStep('form')}>← Back</button>
        </div>
      )}

      {step === 'processing' && (
        <div style={S.processing}>
          <Loader2 size={40} color="#34d399" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ color: '#94a3b8', marginTop: 16, fontSize: 14 }}>Running compliance checks...</p>
          <p style={{ color: '#475569', fontSize: 12 }}>KYC · OFAC · T+3 Liquidity Guard</p>
        </div>
      )}

      {(step === 'form' || step === 'confirm') && (
        <>
          <div style={{ ...S.fieldGroup, position: 'relative' }}>
            <label style={S.label}>Payout Network</label>
            <button style={S.networkBtn} onClick={() => setShowNetworkPicker(v => !v)}>
              <div style={{ ...S.networkDot, background: selectedNetwork.color }} />
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{selectedNetwork.label}</span>
              <span style={{ color: '#64748b', fontSize: 12, flex: 1, textAlign: 'left' }}>{selectedNetwork.network}</span>
              <span style={{ color: '#475569', fontSize: 11 }}>Gas {selectedNetwork.gasFee}</span>
              <ChevronDown size={14} color="#64748b" style={{ transform: showNetworkPicker ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
            </button>
            {showNetworkPicker && (
              <div style={S.networkDropdown}>
                {STABLECOIN_NETWORKS.map(n => (
                  <button key={n.id} style={{ ...S.networkOption, background: selectedNetwork.id === n.id ? 'rgba(52,211,153,0.06)' : 'transparent' }}
                    onClick={() => { setSelectedNetwork(n); setShowNetworkPicker(false); validateAddress(address); }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{n.label} · {n.network}</span>
                      <span style={{ color: '#64748b', fontSize: 11, marginLeft: 8 }}>Min ${n.minWithdraw}</span>
                    </div>
                    <span style={{ color: '#475569', fontSize: 11 }}>{n.gasFee} gas</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={S.fieldGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={S.label}>Amount (USD)</label>
              <button style={{ background: 'none', border: 'none', color: '#34d399', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}
                onClick={() => setAmount(String((wallet?.available_usd ?? 0).toFixed(2)))}>MAX</button>
            </div>
            <div style={S.amountWrap}>
              <span style={S.dollarSign}>$</span>
              <input style={S.amountInput} type="number" placeholder="0.00" min={selectedNetwork.minWithdraw} max={wallet?.available_usd ?? 0} value={amount} onChange={e => setAmount(e.target.value)} />
              <span style={{ color: '#475569', fontSize: 12, paddingRight: 12 }}>{selectedNetwork.label}</span>
            </div>
            {amount && !isAmountValid && <p style={S.fieldError}>{amountNum < selectedNetwork.minWithdraw ? `Minimum ${selectedNetwork.minWithdraw} USD for this network` : 'Exceeds available balance'}</p>}
          </div>

          <div style={S.fieldGroup}>
            <label style={S.label}>{selectedNetwork.network} Destination Address</label>
            <input style={{ ...S.addressInput, borderColor: addressError ? '#f87171' : 'rgba(255,255,255,0.08)' }}
              placeholder={selectedNetwork.id === 'usdt_trx' ? 'T...' : selectedNetwork.id === 'usdc_sol' ? 'Solana wallet address...' : '0x...'}
              value={address} onChange={e => { setAddress(e.target.value); validateAddress(e.target.value); }} />
            {addressError && <p style={S.fieldError}>{addressError}</p>}
          </div>

          {amountNum > 0 && isAmountValid && address && !addressError && (
            <div style={S.summary}>
              <div style={S.summaryRow}><span>Withdrawal amount</span><span style={{ color: '#fff' }}>${amountNum.toFixed(2)}</span></div>
              <div style={S.summaryRow}><span>Network</span><span style={{ color: selectedNetwork.color }}>{selectedNetwork.network}</span></div>
              <div style={S.summaryRow}><span>Est. gas fee</span><span style={{ color: '#94a3b8' }}>{selectedNetwork.gasFee} (absorbed by operator)</span></div>
              <div style={S.summaryRow}><span>Confirmation</span><span style={{ color: '#94a3b8' }}>{selectedNetwork.confirmTime}</span></div>
              <div style={{ ...S.summaryRow, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, marginTop: 4 }}>
                <span style={{ fontWeight: 700, color: '#fff' }}>You receive</span>
                <span style={{ fontWeight: 800, color: '#34d399', fontSize: 16 }}>${amountNum.toFixed(2)} {selectedNetwork.label}</span>
              </div>
            </div>
          )}

          <div style={S.legalNote}><Lock size={11} color="#475569" /><span>By submitting you confirm this wallet belongs to you. Crypto payouts are irreversible. Haul Command complies with FATF Travel Rule, FinCEN, and OFAC regulations.</span></div>

          <button style={{ ...S.submitBtn, opacity: (!isAmountValid || !address || !!addressError) ? 0.4 : 1, cursor: (!isAmountValid || !address || !!addressError) ? 'not-allowed' : 'pointer' }}
            disabled={!isAmountValid || !address || !!addressError} onClick={handleSubmit}>
            <ArrowDownToLine size={16} />Withdraw ${amount || '0.00'} {selectedNetwork.label}
          </button>
        </>
      )}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  root: { background: 'linear-gradient(160deg, #0a0f1a, #060810)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 24, maxWidth: 480, fontFamily: "'Inter', system-ui, sans-serif", color: '#e2e8f0' },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
  headerIcon: { width: 44, height: 44, borderRadius: 12, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { margin: 0, fontSize: 18, fontWeight: 800, color: '#fff' },
  headerSub: { margin: '2px 0 0', fontSize: 12, color: '#64748b' },
  kycBadge: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', padding: '4px 10px', borderRadius: 20 },
  balanceCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 18px', marginBottom: 20 },
  balanceRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  balanceLabel: { display: 'flex', alignItems: 'center', fontSize: 11, color: '#64748b', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' },
  balanceAmount: { fontSize: 26, fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' },
  tPlusNotice: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 11, color: '#475569', background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: '6px 10px', border: '1px solid rgba(255,255,255,0.04)' },
  fieldGroup: { marginBottom: 16 },
  label: { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 },
  networkBtn: { width: '100%', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 14px', cursor: 'pointer' },
  networkDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  networkDropdown: { position: 'absolute', zIndex: 10, background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, marginTop: 4, overflow: 'hidden', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' },
  networkOption: { width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', cursor: 'pointer', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)' },
  amountWrap: { display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' },
  dollarSign: { padding: '0 12px', color: '#64748b', fontSize: 16, fontWeight: 700 },
  amountInput: { flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 20, fontWeight: 700, padding: '14px 0', fontVariantNumeric: 'tabular-nums' },
  addressInput: { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.03)', border: '1px solid', borderRadius: 12, padding: '13px 14px', color: '#fff', fontSize: 13, outline: 'none', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.02em' },
  fieldError: { color: '#f87171', fontSize: 11, margin: '4px 0 0' },
  summary: { background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.12)', borderRadius: 12, padding: 14, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 },
  summaryRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' },
  legalNote: { display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 10, color: '#475569', marginBottom: 16, lineHeight: 1.5 },
  submitBtn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg, #34d399, #059669)', border: 'none', borderRadius: 14, padding: '15px 20px', color: '#000', fontSize: 15, fontWeight: 800 },
  kycGate: { background: 'linear-gradient(160deg, #0a0f1a, #060810)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 20, padding: 28, textAlign: 'center', maxWidth: 400 },
  kycIcon: { marginBottom: 16 },
  kycTitle: { color: '#fff', fontSize: 18, fontWeight: 800, margin: '0 0 10px' },
  kycBody: { color: '#64748b', fontSize: 13, lineHeight: 1.6, margin: '0 0 20px' },
  kycBtn: { background: 'linear-gradient(135deg, #F59E0B, #D97706)', border: 'none', borderRadius: 12, padding: '12px 24px', color: '#000', fontWeight: 700, cursor: 'pointer' },
  success: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', textAlign: 'center' },
  txRef: { background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontFamily: 'monospace', color: '#34d399', marginTop: 10 },
  resetBtn: { marginTop: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 20px', color: '#94a3b8', fontSize: 13, cursor: 'pointer' },
  errorBox: { display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: 16, marginBottom: 16 },
  errorRetry: { background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 16px', color: '#94a3b8', fontSize: 12, cursor: 'pointer' },
  processing: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0' },
};
