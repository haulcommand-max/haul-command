'use client';

import React, { useState, useCallback } from 'react';

const NETWORKS: Record<string, { label: string; placeholder: string; warning?: string }> = {
  'USDC_SOL':  { label: 'USDC (Solana)',  placeholder: 'Solana wallet address (starts with a capital letter)' },
  'USDC_MATIC':{ label: 'USDC (Polygon)', placeholder: '0x... Polygon wallet address' },
  'USDT_TRX':  { label: 'USDT (Tron)',    placeholder: 'Tron wallet address (starts with T...)' },
  'USDT_BSC':  { label: 'USDT (BNB Chain)',placeholder: '0x... BNB Chain wallet address' },
};

interface UserBalance { availableUsd: number; pendingUsd: number; }
interface Props { balance: UserBalance; onSuccess?: (txId: string) => void; }

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function TreasuryWithdrawalForm({ balance, onSuccess }: Props) {
  const [currency, setCurrency] = useState('USDC_SOL');
  const [walletAddress, setWalletAddress] = useState('');
  const [amountUsd, setAmountUsd] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [err, setErr] = useState<string | null>(null);
  const [txId, setTxId] = useState<string | null>(null);

  const maxAmount = balance.availableUsd;
  const parsedAmount = parseFloat(amountUsd) || 0;
  const isValid = walletAddress.trim().length > 8 && parsedAmount >= 10 && parsedAmount <= maxAmount;

  const submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setStatus('loading'); setErr(null);

    try {
      const [asset, network] = currency.split('_');
      const res = await fetch('/api/treasury/nowpayments-withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountUsd: parsedAmount, walletAddress: walletAddress.trim(), asset, network }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Withdrawal failed');
      setTxId(json.paymentId || json.txId);
      setStatus('success');
      onSuccess?.(json.paymentId);
    } catch (e: any) {
      setErr(e.message);
      setStatus('error');
    }
  }, [isValid, currency, walletAddress, parsedAmount, onSuccess]);

  if (status === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '40px 24px', fontFamily: 'Inter,sans-serif' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>💸</div>
        <h3 style={{ color: '#00c864', fontWeight: 700, fontSize: '22px', margin: '0 0 10px' }}>Withdrawal Initiated!</h3>
        <p style={{ color: '#aaa', fontSize: '14px', lineHeight: 1.6, marginBottom: '8px' }}>
          ${parsedAmount.toFixed(2)} → {NETWORKS[currency].label}
        </p>
        {txId && <p style={{ color: '#555', fontSize: '12px', fontFamily: 'monospace', marginBottom: '24px', wordBreak: 'break-all' }}>TX: {txId}</p>}
        <div style={{ background: 'rgba(255,140,0,0.08)', border: '1px solid rgba(255,140,0,0.25)', borderRadius: '12px', padding: '14px', marginBottom: '24px' }}>
          <p style={{ color: '#ff8c00', fontSize: '13px', margin: 0, lineHeight: 1.6 }}>
            ⏳ <strong>T+3 Settlement:</strong> Funds clear escrow in 3 business days to prevent chargebacks. You'll receive a confirmation email once released.
          </p>
        </div>
        <button onClick={() => { setStatus('idle'); setAmountUsd(''); setWalletAddress(''); }} style={{ padding: '13px 28px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#aaa', fontSize: '14px', cursor: 'pointer' }}>New Withdrawal</button>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: '440px', margin: '0 auto' }}>
      <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '22px', marginBottom: '6px' }}>💰 Crypto Payout</h2>
      <p style={{ color: '#666', fontSize: '13px', marginBottom: '24px' }}>Withdraw your earnings to a self-custody crypto wallet.</p>

      {/* Balance card */}
      <div style={{ background: 'linear-gradient(135deg,rgba(255,140,0,0.1),rgba(255,100,0,0.05))', border: '1px solid rgba(255,140,0,0.25)', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
        <div style={{ color: '#888', fontSize: '11px', fontWeight: 600, letterSpacing: '.05em', marginBottom: '8px' }}>AVAILABLE BALANCE</div>
        <div style={{ color: '#fff', fontSize: '32px', fontWeight: 700 }}>${maxAmount.toFixed(2)}</div>
        {balance.pendingUsd > 0 && <div style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>${balance.pendingUsd.toFixed(2)} pending (T+3 settlement)</div>}
      </div>

      {/* ERC-20 warning banner */}
      <div style={{ background: 'rgba(255,50,50,0.08)', border: '1px solid rgba(255,50,50,0.25)', borderRadius: '12px', padding: '12px 14px', marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <span>⛔</span>
        <span style={{ color: '#ff6666', fontSize: '12px', lineHeight: 1.5 }}>
          <strong>ETH / ERC-20 networks are disabled.</strong> Ethereum gas costs make micro-payouts economically unviable. Please use Solana, Polygon, Tron, or BNB Chain below.
        </span>
      </div>

      <form onSubmit={submit}>
        {/* Network selector */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ color: '#888', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '10px', letterSpacing: '.05em' }}>PAYOUT NETWORK</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {Object.entries(NETWORKS).map(([key, cfg]) => (
              <button
                key={key} type="button"
                onClick={() => { setCurrency(key); setWalletAddress(''); }}
                style={{
                  padding: '12px', borderRadius: '12px', cursor: 'pointer',
                  background: currency === key ? 'rgba(255,140,0,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${currency === key ? 'rgba(255,140,0,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  color: currency === key ? '#ff8c00' : '#888',
                  fontWeight: currency === key ? 700 : 500,
                  fontSize: '13px',
                  transition: 'all .15s',
                }}
              >{cfg.label}</button>
            ))}
          </div>
        </div>

        {/* Wallet address */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ color: '#888', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '10px', letterSpacing: '.05em' }}>WALLET ADDRESS</label>
          <input
            value={walletAddress} onChange={e => setWalletAddress(e.target.value)}
            placeholder={NETWORKS[currency].placeholder}
            style={{ width: '100%', padding: '13px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'monospace', outline: 'none' }}
          />
          <p style={{ color: '#555', fontSize: '11px', marginTop: '6px' }}>⚠️ Double-check your address. Crypto transfers are irreversible.</p>
        </div>

        {/* Amount */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ color: '#888', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '10px', letterSpacing: '.05em' }}>AMOUNT (USD)</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#666', fontSize: '16px' }}>$</span>
            <input
              type="number" value={amountUsd} onChange={e => setAmountUsd(e.target.value)}
              min="10" max={maxAmount} step="0.01" placeholder="0.00"
              style={{ width: '100%', padding: '13px 14px 13px 30px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '15px', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            <span style={{ color: '#555', fontSize: '11px' }}>Minimum: $10.00</span>
            <button type="button" onClick={() => setAmountUsd(maxAmount.toFixed(2))} style={{ background: 'none', border: 'none', color: '#ff8c00', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>MAX ${maxAmount.toFixed(2)}</button>
          </div>
        </div>

        {/* T+3 warning */}
        <div style={{ background: 'rgba(255,140,0,0.07)', border: '1px solid rgba(255,140,0,0.2)', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
          <p style={{ color: '#ff8c00', fontSize: '12px', margin: 0, lineHeight: 1.6 }}>
            ⏳ <strong>T+3 Business Day Settlement:</strong> All payouts are subject to a 3-business-day escrow hold to prevent payment reversals and chargebacks. Your funds will arrive after this window.
          </p>
        </div>

        {status === 'error' && err && (
          <div style={{ background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.3)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', color: '#f66', fontSize: '13px' }}>⚠️ {err}</div>
        )}

        <button
          type="submit" disabled={!isValid || status === 'loading'}
          style={{ width: '100%', padding: '16px', background: !isValid || status === 'loading' ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#ff8c00,#ff6b00)', border: 'none', borderRadius: '14px', color: isValid ? '#fff' : '#555', fontWeight: 700, fontSize: '16px', cursor: !isValid || status === 'loading' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all .2s' }}
        >
          {status === 'loading' ? <><div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin .7s linear infinite' }} />Processing…</> : <>💸 Withdraw ${parsedAmount > 0 ? parsedAmount.toFixed(2) : '0.00'} via {NETWORKS[currency].label}</>}
        </button>
      </form>

      <style>{`
        input::placeholder{color:#555}
        input:focus{border-color:rgba(255,140,0,0.4)!important}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}
