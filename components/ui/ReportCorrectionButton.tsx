'use client';

import React, { useState } from 'react';

interface ReportCorrectionButtonProps {
    entityId: string;
    entityType: 'directory_listing' | 'regulation' | 'tool_result' | 'corridor_data';
    text?: string;
}

export function ReportCorrectionButton({ 
    entityId, 
    entityType, 
    text = "Report incorrect data" 
}: ReportCorrectionButtonProps) {
    const [status, setStatus] = useState<'idle' | 'reporting' | 'success'>('idle');

    const handleReport = async () => {
        setStatus('reporting');
        
        // In a real implementation this would open a modal with a form
        // For now, we simulate the API call that would happen after form submission
        setTimeout(() => {
            setStatus('success');
            setTimeout(() => setStatus('idle'), 3000);
        }, 800);
    };

    if (status === 'success') {
        return (
            <span style={{ 
                fontSize: 11, 
                color: '#22C55E', 
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
            }}>
                ✓ Thanks for reporting
            </span>
        );
    }

    return (
        <button 
            onClick={handleReport}
            disabled={status === 'reporting'}
            style={{
                background: 'transparent',
                border: 'none',
                color: '#6B7280',
                fontSize: 11,
                cursor: status === 'reporting' ? 'wait' : 'pointer',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                opacity: status === 'reporting' ? 0.5 : 1,
                transition: 'color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#9CA3AF'}
            onMouseOut={(e) => e.currentTarget.style.color = '#6B7280'}
            aria-label={`Report issue with ${entityType}`}
        >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span style={{ textDecoration: 'underline' }}>{status === 'reporting' ? 'Reporting...' : text}</span>
        </button>
    );
}

export default ReportCorrectionButton;
