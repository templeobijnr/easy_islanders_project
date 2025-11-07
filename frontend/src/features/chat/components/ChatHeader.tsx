import React, { useEffect, useMemo, useState } from 'react';
import api from '../../../api';
import { Chip } from '../../../shared/components/Chip';
import { PreferencesModal } from './modals/PreferencesModal';
import { useChat } from '../../../shared/context/ChatContext';
import config from '../../../config';

type PrefItem = { type: string; value: any; confidence?: number; source?: string };

export const ChatHeader: React.FC = () => {
  const { threadId, rehydrationData } = useChat();
  const [prefs, setPrefs] = useState<PrefItem[]>([]);
  const [paused, setPaused] = useState<boolean>(false);
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const prefsUiEnabled = config?.FEATURES?.PREFS_UI ?? (process.env.REACT_APP_PREFS_UI_ENABLED !== 'false');

  // Extract preferences from rehydration data (server-side push)
  // No more REST calls - eliminates 403 errors on reconnect
  useEffect(() => {
    if (!rehydrationData) return;

    // Extract preferences from shared_context
    const extractedPrefs: PrefItem[] = [];
    const sharedCtx = rehydrationData.shared_context;

    if (sharedCtx) {
      // Location preference
      if (sharedCtx.location) {
        extractedPrefs.push({
          type: 'location',
          value: sharedCtx.location,
          confidence: 0.9,
          source: 'rehydration',
        });
      }

      // Budget preference
      if (sharedCtx.budget) {
        extractedPrefs.push({
          type: 'budget',
          value: sharedCtx.budget,
          confidence: 0.9,
          source: 'rehydration',
        });
      }

      // Bedrooms preference
      if (sharedCtx.bedrooms !== undefined) {
        extractedPrefs.push({
          type: 'bedrooms',
          value: { count: sharedCtx.bedrooms },
          confidence: 0.9,
          source: 'rehydration',
        });
      }

      // Property type preference
      if (sharedCtx.property_type) {
        extractedPrefs.push({
          type: 'property_type',
          value: sharedCtx.property_type,
          confidence: 0.9,
          source: 'rehydration',
        });
      }
    }

    setPrefs(extractedPrefs);
  }, [rehydrationData]);

  const prettyChips = useMemo(() => {
    const chips: string[] = [];
    for (const p of prefs) {
      const t = (p.type || '').toLowerCase();
      if (t === 'location') {
        const v = p.value?.value || p.value?.city || p.value;
        if (v) chips.push(String(v));
      } else if (t === 'budget') {
        const min = p.value?.min;
        const max = p.value?.max;
        const cur = p.value?.currency || p.value?.unit || 'EUR';
        if (min != null && max != null) chips.push(`${min}-${max} ${cur}`);
      } else if (t === 'bedrooms') {
        const c = p.value?.count ?? p.value?.value ?? p.value;
        if (c != null) chips.push(`${c} bedrooms`);
      } else if (t === 'property_type') {
        const v = p.value?.value || p.value;
        if (v) chips.push(String(v));
      } else if (t === 'amenities') {
        const vs = p.value?.values || p.value;
        if (Array.isArray(vs)) chips.push(...vs.map((x) => String(x)));
      }
    }
    return chips.slice(0, 6); // cap
  }, [prefs]);

  const togglePause = async () => {
    if (!threadId) return;
    try {
      const next = !paused;
      await api.setThreadPersonalization(threadId, next);
      setPaused(next);
    } catch (e) {
      // ignore for now
    }
  };

  return (
    <div className="px-4 pt-4 pb-2 sticky top-0 bg-white/90 backdrop-blur rounded-t-2xl border-b border-slate-200 z-10">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-ink-700">Chat</div>
        {prefsUiEnabled && threadId ? (
          <button
            onClick={togglePause}
            className={`text-xs px-2 py-1 rounded border ${paused ? 'bg-slate-100' : 'bg-white'}`}
          >
            {paused ? 'Resume Personalization' : 'Pause Personalization'}
          </button>
        ) : null}
      </div>
      {prefsUiEnabled ? (
        <div className="mt-2 flex items-center gap-2">
          <button onClick={() => setEditOpen(true)} className="text-xs px-2 py-1 border rounded">Edit</button>
        </div>
      ) : null}
      {prefsUiEnabled && prettyChips.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {prettyChips.map((c, idx) => (
            <Chip key={`${c}-${idx}`} className="border-slate-300 bg-slate-50 text-slate-700">
              {c}
            </Chip>
          ))}
        </div>
      ) : null}
      {prefsUiEnabled ? (
        <PreferencesModal open={editOpen} onClose={() => setEditOpen(false)} />
      ) : null}
    </div>
  );
};

export default ChatHeader;
