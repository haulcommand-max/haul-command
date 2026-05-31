'use client';

import { useEffect } from 'react';

type AdGridEventBeaconProps = {
    pageKind: string;
    placementKey: string;
    pagePath: string;
    countryCode?: string;
    stateCode?: string;
    corridorSlug?: string;
    audienceRole?: string;
    variant?: string;
    outcomeEvent?: string;
    outcomeValueCents?: number;
};

export default function AdGridEventBeacon(props: AdGridEventBeaconProps) {
    useEffect(() => {
        const storageKey = [
            'hc-adgrid-impression',
            props.pageKind,
            props.placementKey,
            props.pagePath,
            props.countryCode ?? '',
            props.audienceRole ?? '',
            props.variant ?? '',
        ].join(':');

        if (sessionStorage.getItem(storageKey)) return;
        sessionStorage.setItem(storageKey, '1');
        void recordAdGridEvent('impression', props);
    }, [props]);

    return null;
}

export function recordAdGridClick(props: AdGridEventBeaconProps) {
    void recordAdGridEvent('click', props);
}

export function recordAdGridOutcome(props: AdGridEventBeaconProps) {
    void recordAdGridEvent('outcome', props);
}

export function AdGridOutcomeBeacon(props: AdGridEventBeaconProps) {
    useEffect(() => {
        const storageKey = [
            'hc-adgrid-outcome',
            props.outcomeEvent ?? 'sponsor_activation_request_started',
            props.pagePath,
            props.countryCode ?? '',
            props.audienceRole ?? '',
            props.variant ?? '',
        ].join(':');

        if (sessionStorage.getItem(storageKey)) return;
        sessionStorage.setItem(storageKey, '1');
        recordAdGridOutcome(props);
    }, [props]);

    return null;
}

async function recordAdGridEvent(eventType: 'impression' | 'click' | 'outcome', props: AdGridEventBeaconProps) {
    try {
        await fetch('/api/adgrid/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
            body: JSON.stringify({
                eventType,
                pageKind: props.pageKind,
                placementKey: props.placementKey,
                pagePath: props.pagePath,
                countryCode: props.countryCode,
                stateCode: props.stateCode,
                corridorSlug: props.corridorSlug,
                audienceRole: props.audienceRole,
                variant: props.variant,
                outcomeEvent: props.outcomeEvent,
                outcomeValueCents: props.outcomeValueCents,
            }),
        });
    } catch {
        // AdGrid metrics should never block the public conversion path.
    }
}
