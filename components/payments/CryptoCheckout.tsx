'use client';

import React, { useState, useEffect } from 'react';

interface CryptoCheckoutProps {
    amount: number;
    currency?: string;
    orderId: string;
    description: string;
    countryCode: string;
    onSuccess?: (payment: any) => void;
    onError?: (error: string) => void;
}

const CRYPTO_OPTIONS = [
    { code: 'btc', name: 'Bitcoin', icon: '₿', color: '#F7931A' },
    { code: 'eth', name: 'Ethereum', icon: 'Ξ', color: '#627EEA' },
    { code: 'usdt', name: 'Tether', icon: '₮', color: '#26A17B' },
    { code: 'usdc', name: 'USD Coin', icon: '$', color: '#2775CA' },
    { code: 'sol', name: 'Solana', icon: '◎', color: '#9945FF' },
    { code: 'ltc', name: 'Litecoin', icon: 'Ł', color: '#BFBBBB' },
];

export default function CryptoCheckout({ amount, currency = 'usd', orderId, description, countryCode, onSuccess, onError }: CryptoCheckoutProps) {
    const [selectedCrypto, setSelectedCrypto] = useState('');
    const [loading, setLoading] = useState(false);
    const [payment, setPayment] = useState<any>(null);
    const [legality, setLegality] = useState<any>(null);
    const [error, setError] = useState('');
    const [availableCryptos, setAvailableCryptos] = useState(CRYPTO_OPTIONS);

    useEffect(() => {
        // Check legality on mount
        fetch(`/api/crypto/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: 0.01, order_id: 'check', country_code: countryCode }),
        })
            .then(r => r.json())
            .then(data => {
                if (data.legality) {
                    setLegality(data.legality);
                    if (data.legality.restricted && data.legality.stablecoin_only) {
                        setAvailableCryptos(CRYPTO_OPTIONS.filter(c => ['usdt', 'usdc'].includes(c.code)));
                    }
                }
            })
            .catch(() => { });
    }, [countryCode]);

    const handlePayment = async () => {
        if (!selectedCrypto) return;
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/crypto/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount,
                    currency,
                    pay_currency: selectedCrypto,
                    order_id: orderId,
                    description,
                    country_code: countryCode,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Payment creation failed');
                onError?.(data.error);
                return;
            }

            setPayment(data.payment);
            onSuccess?.(data.payment);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Network error';
            setError(msg);
            onError?.(msg);
        } finally {
            setLoading(false);
        }
    };

    if (legality && !legality.allowed) {
        return null; // Don't show crypto option in banned countries
    }

    return (
        <div className="crypto-checkout">
            <div className="crypto-header">
                <div className="crypto-shield">🔐</div>
                <div>
                    <h3>Pay with Crypto</h3>
                    <p className="crypto-subtitle">Powered by HAUL COMMAND • 300+ currencies</p>
                </div>
            </div>

            {legality?.restricted && (
                <div className="crypto-warning">
                    ⚠️ Only stablecoin payments available in your region ({legality.regulatory_body})
                </div>
            )}

            {!payment ? (
                <>
                    <div className="crypto-amount">
                        <span className="crypto-label">Amount</span>
                        <span className="crypto-value">${amount.toLocaleString()} {currency.toUpperCase()}</span>
                    </div>

                    <div className="crypto-grid">
                        {availableCryptos.map(c => (
                            <button
                                key={c.code}
                                className={`crypto-option ${selectedCrypto === c.code ? 'selected' : ''}`}
                                onClick={() => setSelectedCrypto(c.code)}
                                style={{ '--crypto-color': c.color } as React.CSSProperties}
                            >
                                <span className="crypto-icon">{c.icon}</span>
                                <span className="crypto-name">{c.name}</span>
                                <span className="crypto-code">{c.code.toUpperCase()}</span>
                            </button>
                        ))}
                    </div>

                    {error && <div className="crypto-error">❌ {error}</div>}

                    <button
                        className="crypto-pay-btn"
                        onClick={handlePayment}
                        disabled={!selectedCrypto || loading}
                    >
                        {loading ? (
                            <span className="crypto-spinner" />
                        ) : (
                            `Pay ${amount.toLocaleString()} ${currency.toUpperCase()} with ${selectedCrypto.toUpperCase() || '...'}`
                        )}
                    </button>
                </>
            ) : (
                <div className="crypto-payment-info">
                    <div className="crypto-status">
                        <span className="status-dot active" />
                        Awaiting Payment
                    </div>
                    <div className="crypto-detail">
                        <span className="crypto-label">Send exactly</span>
                        <span className="crypto-value highlight">
                            {payment.pay_amount} {payment.pay_currency?.toUpperCase()}
                        </span>
                    </div>
                    <div className="crypto-detail">
                        <span className="crypto-label">To address</span>
                        <code className="crypto-address">{payment.pay_address}</code>
                    </div>
                    <button
                        className="crypto-copy-btn"
                        onClick={() => navigator.clipboard.writeText(payment.pay_address)}
                    >
                        📋 Copy Address
                    </button>
                    <p className="crypto-note">
                        Payment will be confirmed automatically via blockchain verification.
                    </p>
                </div>
            )}

            <style jsx>{`
                .crypto-checkout {
                    background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
                    border: 1px solid rgba(241, 169, 27, 0.3);
                    border-radius: 16px;
                    padding: 24px;
                    color: #e0e0e0;
                    font-family: var(--font-inter, 'Inter', sans-serif);
                }
                .crypto-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 20px;
                }
                .crypto-shield { font-size: 28px; }
                .crypto-header h3 {
                    margin: 0;
                    font-size: 18px;
                    color: #F1A91B;
                    font-weight: 700;
                }
                .crypto-subtitle {
                    margin: 2px 0 0;
                    font-size: 12px;
                    color: #888;
                }
                .crypto-warning {
                    background: rgba(255, 165, 0, 0.1);
                    border: 1px solid rgba(255, 165, 0, 0.3);
                    padding: 10px;
                    border-radius: 8px;
                    font-size: 13px;
                    margin-bottom: 16px;
                    color: #ffa500;
                }
                .crypto-amount {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 16px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 10px;
                    margin-bottom: 16px;
                }
                .crypto-label {
                    font-size: 13px;
                    color: #888;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .crypto-value {
                    font-size: 20px;
                    font-weight: 700;
                    color: #fff;
                }
                .crypto-value.highlight { color: #F1A91B; }
                .crypto-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 10px;
                    margin-bottom: 16px;
                }
                .crypto-option {
                    background: rgba(255,255,255,0.05);
                    border: 2px solid transparent;
                    border-radius: 12px;
                    padding: 14px 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                    color: #ccc;
                }
                .crypto-option:hover {
                    background: rgba(255,255,255,0.08);
                    border-color: var(--crypto-color);
                }
                .crypto-option.selected {
                    background: rgba(241, 169, 27, 0.1);
                    border-color: #F1A91B;
                    color: #fff;
                }
                .crypto-icon {
                    font-size: 24px;
                    font-weight: bold;
                    color: var(--crypto-color);
                }
                .crypto-name { font-size: 12px; }
                .crypto-code { font-size: 11px; color: #666; }
                .crypto-error {
                    color: #ff4444;
                    font-size: 13px;
                    padding: 8px;
                    margin-bottom: 12px;
                }
                .crypto-pay-btn {
                    width: 100%;
                    padding: 16px;
                    background: linear-gradient(135deg, #F1A91B, #e09800);
                    border: none;
                    border-radius: 12px;
                    color: #000;
                    font-weight: 700;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .crypto-pay-btn:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 20px rgba(241, 169, 27, 0.4);
                }
                .crypto-pay-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .crypto-spinner {
                    display: inline-block;
                    width: 20px;
                    height: 20px;
                    border: 3px solid rgba(0,0,0,0.2);
                    border-top-color: #000;
                    border-radius: 50%;
                    animation: spin 0.6s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                .crypto-payment-info {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }
                .crypto-status {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 600;
                }
                .status-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    animation: pulse 1.5s infinite;
                }
                .status-dot.active { background: #F1A91B; }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
                .crypto-detail {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .crypto-address {
                    font-size: 12px;
                    word-break: break-all;
                    background: rgba(255,255,255,0.05);
                    padding: 10px;
                    border-radius: 8px;
                    color: #F1A91B;
                }
                .crypto-copy-btn {
                    background: rgba(255,255,255,0.08);
                    border: 1px solid rgba(255,255,255,0.15);
                    color: #ccc;
                    padding: 10px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .crypto-copy-btn:hover {
                    background: rgba(255,255,255,0.12);
                    color: #fff;
                }
                .crypto-note {
                    font-size: 12px;
                    color: #666;
                    text-align: center;
                }
            `}</style>
        </div>
    );
}
