import React from 'react';

const TrustStrip: React.FC = () => (
  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] text-slate-600">
    <div className="rounded-xl border border-slate-200 p-2">✅ Protected bookings</div>
    <div className="rounded-xl border border-slate-200 p-2">🧾 Clear receipts & changes</div>
    <div className="rounded-xl border border-slate-200 p-2">🤝 No auto-charges — explicit confirm</div>
  </div>
);

export default TrustStrip;