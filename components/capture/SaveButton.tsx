'use client';

import { useState, useCallback } from 'react';
import { Bookmark, BookmarkCheck, Bell, BellRing, MapPin, FileText } from 'lucide-react';
import { track } from '@/lib/telemetry';
import type { SavedEntityType } from '@/lib/capture';

// ══════════════════════════════════════════════════════════════
// SAVE BUTTON — Universal "save this entity" button
// Used on: state pages, corridor pages, operator profiles,
// regulation pages, glossary pages, search results
// ══════════════════════════════════════════════════════════════

interface SaveButtonProps {
  entityType: SavedEntityType;
  entityId: string;
  entityLabel: string;
  metadata?: Record<string, string>;
  isSaved?: boolean;
  variant?: 'button' | 'icon' | 'pill';
  showAlertOption?: boolean;
}

const ENTITY_ICON_MAP: Partial<Record<SavedEntityType, React.ReactNode>> = {
  state: <MapPin className="w-4 h-4" />,
  corridor: <MapPin className="w-4 h-4" />,
  regulation: <FileText className="w-4 h-4" />,
};

const ENTITY_VERB_MAP: Partial<Record<SavedEntityType, string>> = {
  state: 'Follow',
  corridor: 'Follow',
  operator: 'Save',
  company: 'Save',
  regulation: 'Follow',
  glossary_topic: 'Follow',
  search: 'Save',
  border_crossing: 'Follow',
  certification: 'Follow',
  equipment_type: 'Follow',
};

export default function SaveButton({
  entityType,
  entityId,
  entityLabel,
  metadata = {},
  isSaved: initialSaved = false,
  variant = 'button',
  showAlertOption = true,
}: SaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [saving, setSaving] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  const verb = ENTITY_VERB_MAP[entityType] || 'Save';
  const savedVerb = verb === 'Follow' ? 'Following' : 'Saved';

  const handleSave = useCallback(async () => {
    if (saved) {
      // TODO: unsave logic
      setSaved(false);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/capture/save-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          entityId,
          entityLabel,
          metadata,
        }),
      });

      if (res.ok) {
        setSaved(true);
        if (showAlertOption) setShowAlerts(true);

        track('entity_saved' as any, {
          entity_type: entityType,
          entity_id: entityId,
          metadata: { entity_label: entityLabel },
        });

        // Auto-hide alert option after 5s
        setTimeout(() => setShowAlerts(false), 5000);
      }
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  }, [saved, entityType, entityId, entityLabel, metadata, showAlertOption]);

  // ── Icon variant ──
  if (variant === 'icon') {
    return (
      <button
        onClick={handleSave}
        disabled={saving}
        className={`p-2 rounded-lg transition-all ${
          saved
            ? 'text-amber-400 bg-amber-500/10'
            : 'text-slate-500 hover:text-amber-400 hover:bg-white/5'
        }`}
        aria-label={saved ? `${savedVerb} ${entityLabel}` : `${verb} ${entityLabel}`}
        title={saved ? `${savedVerb}` : `${verb} ${entityLabel}`}
      >
        {saved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
      </button>
    );
  }

  // ── Pill variant ──
  if (variant === 'pill') {
    return (
      <div className="inline-flex flex-col items-start gap-1.5">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            saved
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              : 'bg-white/5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30'
          } ${saving ? 'opacity-50' : ''}`}
          aria-label={saved ? `${savedVerb} ${entityLabel}` : `${verb} ${entityLabel}`}
        >
          {saved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
          {saved ? savedVerb : verb}
        </button>

        {showAlerts && (
          <button
            onClick={() => {
              setAlertsEnabled(!alertsEnabled);
              track('alert_toggle' as any, {
                entity_type: entityType,
                entity_id: entityId,
                metadata: { alerts_enabled: (!alertsEnabled).toString() },
              });
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all animate-in slide-in-from-top duration-200 ${
              alertsEnabled
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                : 'bg-white/5 text-slate-500 border border-white/10'
            }`}
            aria-label={alertsEnabled ? 'Alerts enabled' : 'Alerts disabled'}
          >
            {alertsEnabled ? <BellRing className="w-3 h-3" /> : <Bell className="w-3 h-3" />}
            {alertsEnabled ? 'Alerts on' : 'Alerts off'}
          </button>
        )}
      </div>
    );
  }

  // ── Full button variant ──
  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleSave}
        disabled={saving}
        className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
          saved
            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
            : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/30'
        } ${saving ? 'opacity-50 cursor-wait' : ''}`}
        aria-label={saved ? `${savedVerb} ${entityLabel}` : `${verb} ${entityLabel}`}
      >
        {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
        {saving ? 'Saving...' : saved ? savedVerb : `${verb} ${entityLabel}`}
      </button>

      {showAlerts && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/5 border border-blue-500/10 rounded-lg animate-in slide-in-from-top duration-200">
          <BellRing className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="text-xs text-blue-300 flex-1">
            You&apos;ll get alerts when things change
          </span>
          <button
            onClick={() => setShowAlerts(false)}
            className="text-xs text-slate-500 hover:text-slate-300"
            aria-label="Close alert confirmation"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
