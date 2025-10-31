import React, { useEffect } from 'react';

export default function CommandPalette({ open, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onClose(!open); // toggle
      }
      if (e.key === 'Escape' && open) {
        onClose(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-start justify-center pt-24" onClick={() => onClose(false)}>
      <div className="w-full max-w-xl bg-white rounded-2xl border shadow-xl p-3" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          placeholder="Search commands or pages…"
          className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl focus:border-lime-400 outline-none"
        />
        <div className="text-xs text-slate-500 p-2 mt-2">
          Try: "messages", "requests", "bookings", "create listing"
        </div>
        <div className="mt-2 space-y-1">
          <div className="px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer text-sm">
            💬 Messages
          </div>
          <div className="px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer text-sm">
            📋 My Requests
          </div>
          <div className="px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer text-sm">
            📅 Bookings
          </div>
          <div className="px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer text-sm">
            ➕ Create Listing
          </div>
        </div>
      </div>
    </div>
  );
}
