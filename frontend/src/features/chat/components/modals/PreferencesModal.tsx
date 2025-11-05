import React, { useEffect, useMemo, useState } from 'react';
import api from '../../../../api';
import { useChat } from '../../../../shared/context/ChatContext';

type Props = {
  open: boolean;
  onClose: () => void;
};

type PrefsForm = {
  location: string;
  budgetMin: string;
  budgetMax: string;
  budgetCurrency: string;
  bedrooms: string;
  propertyType: string;
  amenities: string;
};

export const PreferencesModal: React.FC<Props> = ({ open, onClose }) => {
  const { rehydrationData } = useChat();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<PrefsForm>({
    location: '',
    budgetMin: '',
    budgetMax: '',
    budgetCurrency: 'EUR',
    bedrooms: '',
    propertyType: '',
    amenities: '',
  });

  // Load preferences from rehydration data (server-side push)
  // No more REST calls - eliminates 403 errors
  useEffect(() => {
    if (!open || !rehydrationData) return;

    const next = { ...form };
    const sharedCtx = rehydrationData.shared_context;

    if (sharedCtx) {
      // Location
      if (sharedCtx.location) {
        const v = sharedCtx.location.value || sharedCtx.location.city || sharedCtx.location;
        if (v) next.location = String(v);
      }

      // Budget
      if (sharedCtx.budget) {
        const min = sharedCtx.budget.min;
        const max = sharedCtx.budget.max;
        const cur = sharedCtx.budget.currency || sharedCtx.budget.unit || 'EUR';
        if (min != null) next.budgetMin = String(min);
        if (max != null) next.budgetMax = String(max);
        if (cur) next.budgetCurrency = String(cur).toUpperCase();
      }

      // Bedrooms
      if (sharedCtx.bedrooms !== undefined) {
        next.bedrooms = String(sharedCtx.bedrooms);
      }

      // Property type
      if (sharedCtx.property_type) {
        next.propertyType = String(sharedCtx.property_type);
      }

      // Amenities
      if (sharedCtx.amenities && Array.isArray(sharedCtx.amenities)) {
        next.amenities = sharedCtx.amenities.join(', ');
      }
    }

    setForm(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rehydrationData]);

  const canSave = useMemo(() => !loading, [loading]);

  const onSave = async () => {
    if (!canSave) return;
    setLoading(true);
    try {
      const ops: Promise<any>[] = [];
      if (form.location.trim()) {
        ops.push(api.upsertPreference({
          category: 'real_estate',
          preference_type: 'location',
          value: { type: 'single', value: form.location.trim() },
          source: 'explicit',
          confidence: 0.95,
        }));
      }
      if (form.budgetMin || form.budgetMax) {
        const min = Number(form.budgetMin || '0');
        const max = Number(form.budgetMax || min || 0);
        ops.push(api.upsertPreference({
          category: 'real_estate',
          preference_type: 'budget',
          value: { min, max, currency: form.budgetCurrency || 'EUR' },
          source: 'explicit',
          confidence: 0.9,
        }));
      }
      if (form.bedrooms) {
        const count = Number(form.bedrooms);
        ops.push(api.upsertPreference({
          category: 'real_estate',
          preference_type: 'bedrooms',
          value: { count },
          source: 'explicit',
          confidence: 0.9,
        }));
      }
      if (form.propertyType.trim()) {
        ops.push(api.upsertPreference({
          category: 'real_estate',
          preference_type: 'property_type',
          value: { type: 'single', value: form.propertyType.trim() },
          source: 'explicit',
          confidence: 0.85,
        }));
      }
      if (form.amenities.trim()) {
        const values = form.amenities.split(',').map((s) => s.trim()).filter(Boolean);
        ops.push(api.upsertPreference({
          category: 'real_estate',
          preference_type: 'amenities',
          value: { type: 'list', values },
          source: 'explicit',
          confidence: 0.8,
        }));
      }
      await Promise.all(ops);
      onClose();
    } catch (e) {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold">Edit Preferences</div>
          <button onClick={onClose} className="text-xs px-2 py-1 border rounded">Close</button>
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <label className="block text-slate-600 mb-1">Location</label>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full border rounded px-2 py-1" placeholder="e.g., Girne" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-slate-600 mb-1">Budget Min</label>
              <input value={form.budgetMin} onChange={(e) => setForm({ ...form, budgetMin: e.target.value })} className="w-full border rounded px-2 py-1" placeholder="500" />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Budget Max</label>
              <input value={form.budgetMax} onChange={(e) => setForm({ ...form, budgetMax: e.target.value })} className="w-full border rounded px-2 py-1" placeholder="700" />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Currency</label>
              <select value={form.budgetCurrency} onChange={(e) => setForm({ ...form, budgetCurrency: e.target.value })} className="w-full border rounded px-2 py-1">
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="TRY">TRY</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-600 mb-1">Bedrooms</label>
              <input value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} className="w-full border rounded px-2 py-1" placeholder="2" />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Property Type</label>
              <input value={form.propertyType} onChange={(e) => setForm({ ...form, propertyType: e.target.value })} className="w-full border rounded px-2 py-1" placeholder="apartment" />
            </div>
          </div>
          <div>
            <label className="block text-slate-600 mb-1">Amenities (comma‑separated)</label>
            <input value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} className="w-full border rounded px-2 py-1" placeholder="pool, sea_view" />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="text-xs px-3 py-1.5 border rounded">Cancel</button>
          <button onClick={onSave} disabled={!canSave} className="text-xs px-3 py-1.5 rounded bg-blue-600 text-white disabled:opacity-50">
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreferencesModal;

