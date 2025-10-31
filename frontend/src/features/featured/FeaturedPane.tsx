import React, { useMemo, useState, useEffect } from 'react';
import {
  FEATURED_TABS,
  SPOTLIGHT_BY_TAB,
  EVENTS,
  TODO,
  DEALS,
} from '../../shared/constants';
import { useUi } from '../../shared/context/UiContext';
import { Card } from '../../shared/components';

const Tabs: React.FC = () => {
  const { activeTab, setActiveTab } = useUi();
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold">Featured for you</h3>
      <div className="flex gap-2">
        {FEATURED_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-3 py-1.5 rounded-2xl border text-xs ${
              activeTab === t ? 'bg-lime-100 border-lime-300' : 'bg-white border-slate-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
};

const Spotlight: React.FC = () => {
  const { activeTab } = useUi();
  const items = SPOTLIGHT_BY_TAB[activeTab];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % items.length), 3500);
    return () => clearInterval(id);
  }, [items.length]);
  const item = items[idx];
  return (
    <div className="mt-3 p-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-lime-50 to-emerald-50 flex items-center justify-between">
      <div>
        <div className="text-sm font-semibold">{item.title}</div>
        <div className="text-xs text-slate-600">{item.blurb}</div>
      </div>
      <div className="text-2xl">{item.emoji}</div>
    </div>
  );
};

const FeaturedGrid: React.FC = () => {
  const { activeTab } = useUi();
  const items = SPOTLIGHT_BY_TAB[activeTab];
  return (
    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {items.map((f) => (
        <Card key={f.id} className="p-0 overflow-hidden hover:shadow-md transition">
          <div className="h-36 bg-slate-100 flex items-center justify-center text-slate-400">
            image
          </div>
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">{f.title}</div>
              <div className="text-xs">{f.emoji}</div>
            </div>
            <div className="text-xs text-slate-600">{f.blurb}</div>
            <div className="mt-2 flex flex-wrap gap-1 text-[11px]">
              <span className="px-2 py-0.5 rounded-full border">⭐ 4.7</span>
              <span className="px-2 py-0.5 rounded-full border">Free cancel</span>
              <span className="px-2 py-0.5 rounded-full border">Near harbor</span>
            </div>
            <div className="mt-3 text-xs text-lime-700">Tap to ask the agent for this</div>
          </div>
        </Card>
      ))}
    </div>
  );
};

const Lane: React.FC<{ title: string; data: any[]; cta: string }> = ({ title, data, cta }) => (
  <div className="mt-6">
    <div className="flex items-center justify-between mb-2">
      <div className="font-medium">{title}</div>
      <button className="text-xs underline">View all</button>
    </div>
    <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="flex gap-3 min-w-max pr-2">
        {data.map((d) => (
          <Card key={d.id} className="w-64 p-4 text-left shrink-0 hover:shadow">
            <div className="text-xl">{d.emoji}</div>
            <div className="text-sm font-medium mt-1">{d.title}</div>
            <div className="text-xs text-slate-600">{d.meta}</div>
            <div className="mt-2 text-xs text-lime-700">{cta}</div>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

const TrustStrip: React.FC = () => (
  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] text-slate-600">
    <div className="rounded-xl border border-slate-200 p-2">✅ Protected bookings</div>
    <div className="rounded-xl border border-slate-200 p-2">🧾 Clear receipts & changes</div>
    <div className="rounded-xl border border-slate-200 p-2">🤝 No auto-charges — explicit confirm</div>
  </div>
);

const FeaturedPane: React.FC = () => {
  return (
    <div className="px-4 pb-4 mt-2 max-h-[42vh] overflow-auto">
      <Tabs />
      <Spotlight />
      <FeaturedGrid />
      <Lane title="Events this week" data={EVENTS} cta="Ask to book tickets/table" />
      <Lane title="Things to do" data={TODO} cta="Ask for a plan & timings" />
      <Lane title="Deals" data={DEALS} cta="Ask to apply this deal" />
      <TrustStrip />
    </div>
  );
};

export default FeaturedPane;