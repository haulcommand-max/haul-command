'use client';

import React, { useState } from 'react';
import {
  MobileScreenHeader,
  MobileSegments,
  MobileList,
  MobileEmpty,
} from '@/components/mobile/MobileComponents';

/* ══════════════════════════════════════════════════════════════
   Mobile Inbox — Frame 11 (Alerts / Notifications)
   Segment tabs, unread/read cards, action buttons
   Approved spec: 390px, card-based, time-ordered
   ══════════════════════════════════════════════════════════════ */

interface Notification {
  id: string;
  type: 'offer' | 'message' | 'completed' | 'alert';
  title: string;
  description: string;
  time: string;
  unread: boolean;
  category: 'Offers' | 'Messages' | 'System';
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1', type: 'offer', title: 'New Offer',
    description: 'Broker XYZ sent you an offer for Houston→Dallas, $1,200 · 2 escorts',
    time: '2 min ago', unread: true, category: 'Offers',
  },
  {
    id: 'n2', type: 'message', title: 'Message from Texas Wide Load',
    description: 'Hey, are you available for a super load next week on the I-35 corridor?',
    time: '15 min ago', unread: true, category: 'Messages',
  },
  {
    id: 'n3', type: 'completed', title: 'Job Completed',
    description: 'Job #HC-1284 marked complete. Payment captured: $1,850',
    time: '1 hour ago', unread: false, category: 'System',
  },
  {
    id: 'n4', type: 'alert', title: 'Offer Expiring',
    description: 'Your offer for San Antonio→El Paso expires in 2 hours',
    time: '3 hours ago', unread: false, category: 'Offers',
  },
  {
    id: 'n5', type: 'completed', title: 'Review Request',
    description: 'Rate your experience with Lone Star Pilot Cars on job #HC-1280',
    time: '5 hours ago', unread: false, category: 'System',
  },
];

const ICON_STYLES: Record<string, { bg: string; color: string; icon: string }> = {
  offer: { bg: 'rgba(212,168,68,0.12)', color: 'var(--m-gold)', icon: '📋' },
  message: { bg: 'rgba(59,130,246,0.12)', color: '#3B82F6', icon: '💬' },
  completed: { bg: 'rgba(34,197,94,0.12)', color: '#22C55E', icon: '✓' },
  alert: { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', icon: '⚠' },
};

const TABS = ['All', 'Offers', 'Messages', 'System'];

export default function MobileInbox() {
  const [activeTab, setActiveTab] = useState('All');

  const filtered = activeTab === 'All'
    ? MOCK_NOTIFICATIONS
    : MOCK_NOTIFICATIONS.filter(n => n.category === activeTab);

  const unreadCount = MOCK_NOTIFICATIONS.filter(n => n.unread).length;

  return (
    <div style={{ background: 'var(--m-bg)', minHeight: '100dvh' }}>
      <MobileScreenHeader
        title="Inbox"
        rightAction={
          unreadCount > 0 ? (
            <button
              className="m-section-header__action"
              style={{ fontSize: 'var(--m-font-body-sm)' }}
            >
              Mark All Read
            </button>
          ) : undefined
        }
      />

      {/* Segment Tabs */}
      <MobileSegments
        tabs={TABS}
        active={activeTab}
        onChange={setActiveTab}
      />

      {/* Notification List */}
      <div style={{ paddingTop: 'var(--m-md)' }}>
        {filtered.length === 0 ? (
          <MobileEmpty
            title="No notifications"
            description={`No ${activeTab.toLowerCase()} notifications yet`}
          />
        ) : (
          <MobileList>
            {filtered.map((notif, i) => {
              const iconStyle = ICON_STYLES[notif.type];
              return (
                <div
                  key={notif.id}
                  className={`m-notif m-animate-slide-up ${notif.unread ? 'm-notif--unread' : ''}`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {/* Icon */}
                  <div
                    className="m-notif__icon"
                    style={{ background: iconStyle.bg, color: iconStyle.color }}
                  >
                    <span style={{ fontSize: 16 }}>{iconStyle.icon}</span>
                  </div>

                  {/* Body */}
                  <div className="m-notif__body">
                    <div className="m-notif__title">{notif.title}</div>
                    <div className="m-notif__desc">{notif.description}</div>
                    <div className="m-notif__time">{notif.time}</div>
                  </div>

                  {/* Action for unread offers */}
                  {notif.unread && notif.type === 'offer' && (
                    <button
                      className="m-section-header__action"
                      style={{ alignSelf: 'center', fontSize: 'var(--m-font-body-sm)' }}
                    >
                      View
                    </button>
                  )}
                </div>
              );
            })}
          </MobileList>
        )}
      </div>

      <div style={{ height: 'var(--m-3xl)' }} />
    </div>
  );
}
