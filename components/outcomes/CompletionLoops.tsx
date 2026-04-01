'use client';

/**
 * CompletionLoops — Band D Rank 2
 * 
 * Universal completion state patterns for every high-value action.
 * Every action ends in a clear result state with next steps.
 * 
 * Components:
 *   - ActionResult:       Universal completion display
 *   - NextStepEngine:     Post-action next best action suggestions
 *   - CompletionToast:    Transient success/pending notification
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { track } from '@/lib/telemetry';

type ActionStatus = 'success' | 'partial' | 'pending' | 'failed';
type ActionType = 'post_load' | 'contact_operator' | 'rescue_action' | 'claim_profile' | 'apply_partner' | 'inbox_action' | 'generic';

interface ActionResultProps {
    actionType: ActionType;
    status: ActionStatus;
    title?: string;
    detail?: string;
    entityName?: string;
    onDismiss?: () => void;
}

const statusConfig: Record<ActionStatus, { color: string; icon: string; defaultTitle: string }> = {
    success: { color: '#22C55E', icon: '✓', defaultTitle: 'Done' },
    partial: { color: '#F59E0B', icon: '◐', defaultTitle: 'In Progress' },
    pending: { color: '#3B82F6', icon: '◷', defaultTitle: 'Processing' },
    failed: { color: '#EF4444', icon: '✗', defaultTitle: 'Issue Detected' },
};

const actionMessages: Record<ActionType, Record<ActionStatus, { title: string; detail: string }>> = {
    post_load: {
        success: { title: 'Load Live & Routing', detail: 'Your load is visible to verified operators. Watch for responses in your inbox.' },
        partial: { title: 'Load Saved', detail: 'Some fields need attention before routing begins.' },
        pending: { title: 'Publishing...', detail: 'Your load is being distributed to matching operators.' },
        failed: { title: 'Post Failed', detail: 'We couldn\'t publish this load. Check your connection and try again.' },
    },
    contact_operator: {
        success: { title: 'Message Delivered', detail: 'Your message was sent. Watch for a response in your inbox.' },
        partial: { title: 'Contact Queued', detail: 'We\'ll deliver your message when the operator is available.' },
        pending: { title: 'Sending...', detail: 'Connecting you with the operator.' },
        failed: { title: 'Contact Failed', detail: 'We couldn\'t reach this operator right now. Try phone or try again later.' },
    },
    rescue_action: {
        success: { title: 'Rescue Sent', detail: 'Verified specialists in this corridor have been alerted.' },
        partial: { title: 'Rescue Queued', detail: 'Your rescue request is being matched to available supply.' },
        pending: { title: 'Routing Rescue...', detail: 'Finding the best available operators for this load.' },
        failed: { title: 'Rescue Unavailable', detail: 'No verified supply available right now. Try widening your radius.' },
    },
    claim_profile: {
        success: { title: 'Claim Received', detail: 'Continue verification to unlock rankings, matching, and visibility.' },
        partial: { title: 'Verification Needed', detail: 'Your claim is saved but needs verification to go live.' },
        pending: { title: 'Processing Claim...', detail: 'We\'re verifying your identity.' },
        failed: { title: 'Claim Issue', detail: 'There was a problem processing your claim. Please contact support.' },
    },
    apply_partner: {
        success: { title: 'Application Received', detail: 'We\'ll review and get back within 48 hours. Vetted partners get priority placement.' },
        partial: { title: 'Application Incomplete', detail: 'Please complete all required fields to submit.' },
        pending: { title: 'Submitting...', detail: 'Processing your partner application.' },
        failed: { title: 'Submission Failed', detail: 'We couldn\'t process your application. Please try again.' },
    },
    inbox_action: {
        success: { title: 'Action Complete', detail: 'Your response has been recorded and sent.' },
        partial: { title: 'Partially Sent', detail: 'Your action was recorded but delivery is pending.' },
        pending: { title: 'Processing...', detail: 'Handling your inbox action.' },
        failed: { title: 'Action Failed', detail: 'We couldn\'t complete this action. Try again.' },
    },
    generic: {
        success: { title: 'Done', detail: 'Your action was completed successfully.' },
        partial: { title: 'In Progress', detail: 'Your action is partially complete.' },
        pending: { title: 'Processing', detail: 'Working on it...' },
        failed: { title: 'Failed', detail: 'Something went wrong. Please try again.' },
    },
};

/* ── Action Result ── */
export function ActionResult({
    actionType, status, title, detail, entityName, onDismiss,
}: ActionResultProps) {
    const config = statusConfig[status];
    const messages = actionMessages[actionType]?.[status] || actionMessages.generic[status];
    const displayTitle = title || messages.title;
    const displayDetail = detail || (entityName ? `${messages.detail} (${entityName})` : messages.detail);

    useEffect(() => {
        track('completion_state_shown' as any, {
            metadata: { action_type: actionType, status, entity: entityName },
        });
    }, [actionType, status, entityName]);

    return (
        <div style={{
            borderRadius: 18, overflow: 'hidden',
            border: `1px solid ${config.color}15`,
            background: `${config.color}04`,
        }}>
            <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 14, padding: '20px',
            }}>
                <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: `${config.color}10`, border: `1px solid ${config.color}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, fontWeight: 900, color: config.color,
                }}>
                    {config.icon}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 4 }}>
                        {displayTitle}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                        {displayDetail}
                    </div>
                </div>
                {onDismiss && (
                    <button onClick={onDismiss} style={{
                        width: 28, height: 28, borderRadius: 8, border: 'none',
                        background: 'rgba(255,255,255,0.05)', color: '#888',
                        cursor: 'pointer', fontSize: 14, fontWeight: 700,
                    }}>
                        ×
                    </button>
                )}
            </div>

            {/* Next steps */}
            <div style={{
                padding: '12px 20px 16px',
                borderTop: `1px solid ${config.color}08`,
            }}>
                <NextStepEngine actionType={actionType} status={status} />
            </div>
        </div>
    );
}

/* ── Next Step Engine ── */
interface NextStep {
    label: string;
    href: string;
    icon: string;
    primary?: boolean;
}

function getNextSteps(actionType: ActionType, status: ActionStatus): NextStep[] {
    if (status === 'failed') {
        return [{ label: 'Try Again', href: '#retry', icon: '↻', primary: true }];
    }

    const stepMap: Record<ActionType, NextStep[]> = {
        post_load: [
            { label: 'View in Load Board', href: '/loads', icon: '📋', primary: true },
            { label: 'Find Operators', href: '/directory', icon: '🔍' },
        ],
        contact_operator: [
            { label: 'Check Inbox', href: '#inbox', icon: '📥', primary: true },
            { label: 'Find More Operators', href: '/directory', icon: '🔍' },
        ],
        rescue_action: [
            { label: 'View Load Board', href: '/loads', icon: '📋', primary: true },
            { label: 'Widen Radius', href: '#widen', icon: '🔄' },
        ],
        claim_profile: [
            { label: 'Complete Verification', href: '/profile/verify', icon: '🛡', primary: true },
            { label: 'View Profile', href: '/directory', icon: '👤' },
        ],
        apply_partner: [
            { label: 'Return Home', href: '/', icon: '🏠', primary: true },
            { label: 'Browse Infrastructure', href: '/infrastructure', icon: '🏗' },
        ],
        inbox_action: [
            { label: 'Back to Inbox', href: '#inbox', icon: '📥', primary: true },
        ],
        generic: [
            { label: 'Continue', href: '/', icon: '→', primary: true },
        ],
    };

    return stepMap[actionType] || stepMap.generic;
}

export function NextStepEngine({
    actionType, status,
}: {
    actionType: ActionType; status: ActionStatus;
}) {
    const steps = getNextSteps(actionType, status);

    return (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {steps.map(step => (
                <Link
                    key={step.label}
                    href={step.href}
                    onClick={() => {
                        track('completion_next_step' as any, {
                            metadata: { action_type: actionType, next_step: step.label },
                        });
                    }}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '8px 14px', borderRadius: 10,
                        background: step.primary ? 'rgba(241,169,27,0.1)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${step.primary ? 'rgba(241,169,27,0.2)' : 'rgba(255,255,255,0.06)'}`,
                        color: step.primary ? '#F1A91B' : '#bbb',
                        fontWeight: 700, fontSize: 11, textDecoration: 'none',
                    }}
                >
                    <span>{step.icon}</span> {step.label}
                </Link>
            ))}
        </div>
    );
}

/* ── Completion Toast ── */
export function CompletionToast({
    message, status = 'success', duration = 4000, onClose,
}: {
    message: string; status?: ActionStatus; duration?: number; onClose?: () => void;
}) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            onClose?.();
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    if (!visible) return null;
    const config = statusConfig[status];

    return (
        <div style={{
            position: 'fixed', top: 'calc(env(safe-area-inset-top, 0px) + 16px)',
            left: 16, right: 16, zIndex: 9999,
            padding: '12px 16px', borderRadius: 14,
            background: 'rgba(6,11,18,0.95)', backdropFilter: 'blur(20px)',
            border: `1px solid ${config.color}20`,
            display: 'flex', alignItems: 'center', gap: 10,
            animation: 'slideDown 0.3s ease',
        }}>
            <span style={{
                fontSize: 16, fontWeight: 900, color: config.color,
            }}>
                {config.icon}
            </span>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#fff' }}>
                {message}
            </span>
            <button onClick={() => { setVisible(false); onClose?.(); }} style={{
                background: 'none', border: 'none', color: '#888', cursor: 'pointer',
                fontSize: 14, fontWeight: 700, padding: 4,
            }}>
                ×
            </button>
        </div>
    );
}
