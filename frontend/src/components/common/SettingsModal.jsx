import React from 'react';

export default function SettingsModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-start justify-center pt-24" onClick={() => onClose(false)}>
      <div className="w-full max-w-lg bg-white rounded-2xl border shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="text-lg font-semibold mb-4">Settings</div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">Notifications</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded border-slate-300" defaultChecked />
                Receive email updates
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded border-slate-300" defaultChecked />
                Push notifications for messages
              </label>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">Appearance</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded border-slate-300" />
                Enable compact chat view
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded border-slate-300" />
                Show job status indicators
              </label>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">Language</h3>
            <select className="w-full px-3 py-2 border border-slate-300 rounded-xl">
              <option>English</option>
              <option>Türkçe</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => onClose(false)}
            className="px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={() => onClose(false)}
            className="px-4 py-2 rounded-full bg-lime-600 text-white hover:bg-lime-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
