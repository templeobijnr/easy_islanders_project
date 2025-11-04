import React, { useEffect, useMemo, useState } from 'react';
import api from '../../../api';
import { Chip } from '../../../shared/components/Chip';
import { PreferencesModal } from './modals/PreferencesModal';
import { useChat } from '../../../shared/context/ChatContext';
import config from '../../../config';

type PrefItem = { type: string; value: any; confidence?: number; source?: string };

export const ChatHeader: React.FC = () => {
  const { threadId } = useChat();
  const [prefs, setPrefs] = useState<PrefItem[]>([]);
  const [paused, setPaused] = useState<boolean>(false);
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const prefsUiEnabled = config?.FEATURES?.PREFS_UI ?? (process.env.REACT_APP_PREFS_UI_ENABLED !== 'false');

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      try {
        const res = await api.getActivePreferences('real_estate', 0.5);
        const list = (res?.preferences?.real_estate || []) as PrefItem[];
        if (mounted) setPrefs(list);
      } catch (e) {
        // ignore
      }
      try {
        if (threadId) {
          const st = await api.getThreadPersonalization(threadId);
          if (mounted && st?.ok === true && typeof st.paused === 'boolean') setPaused(st.paused);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchAll();
    return () => {
      mounted = false;
    };
  }, [threadId]);

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
