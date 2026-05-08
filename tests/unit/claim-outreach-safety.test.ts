/// <reference types="vitest" />
import { describe, expect, it } from 'vitest';
import {
  CLAIM_OUTREACH_LADDER,
  CLAIM_OUTREACH_TEMPLATES,
} from '../../lib/claims/outreach-engine';
import {
  PRIORITY_SMS_EVENTS,
  buildSmsPayload,
  shouldSendSms,
  type HcEventType,
} from '../../lib/comms/smsFailover';

describe('claim outreach safety', () => {
  it('keeps seeded claim outreach out of SMS channels', () => {
    expect(CLAIM_OUTREACH_LADDER).toHaveLength(8);
    expect(CLAIM_OUTREACH_LADDER.map((step) => step.channel)).not.toContain('sms');
    expect(Object.keys(CLAIM_OUTREACH_TEMPLATES)).not.toContain('sms');
  });

  it('keeps claim copy evidence-based instead of fake-urgent', () => {
    const allTemplateText = Object.values(CLAIM_OUTREACH_TEMPLATES)
      .flatMap((channelTemplates) => Object.values(channelTemplates))
      .map((template) => `${template.subject ?? ''} ${template.body}`)
      .join(' ')
      .toLowerCase();

    expect(allTemplateText).not.toContain('verification will close');
    expect(allTemplateText).not.toContain('unlock your trust badge');
    expect(allTemplateText).not.toContain('visibility boost');
    expect(allTemplateText).not.toContain('verify now');
    expect(allTemplateText).toContain('haul command does not mark a profile verified until evidence exists');
  });

  it('does not treat claim nudges as SMS fallback events', () => {
    expect(Object.keys(PRIORITY_SMS_EVENTS)).not.toContain('claim.verification_required');
    expect(Object.keys(PRIORITY_SMS_EVENTS)).not.toContain('claim.abandoned_7d');
  });

  it('requires explicit SMS opt-in even for transactional SMS fallback events', () => {
    const params = {
      eventType: 'load.match_found' as HcEventType,
      pushDelivered: false,
      hasDeviceToken: false,
    };

    expect(shouldSendSms(params)).toBe(false);
    expect(shouldSendSms({ ...params, userOptedIntoSms: true })).toBe(true);
  });

  it('keeps SMS payloads focused on transactional events', () => {
    const payload = buildSmsPayload('load.match_found', { region: 'North Florida' });

    expect(payload).toContain('New load match');
    expect(payload).toHaveLength(Math.min(payload.length, 160));
    expect(payload.toLowerCase()).not.toContain('claim');
  });
});
