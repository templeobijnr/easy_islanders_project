import React, { useState, useEffect } from 'react';
import {
  FEATURED_TABS,
  SPOTLIGHT_BY_TAB,
  EVENTS,
  TODO,
  DEALS,
} from '../../shared/constants';
import { useUi } from '../../shared/context/UiContext';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

const Tabs: React.FC = () => {
  const { activeTab, setActiveTab } = useUi();
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold">Featured for you</h3>
      <div className="flex gap-2">
        {FEATURED_TABS.map((t) => (
          <Button
            key={t}
            onClick={() => setActiveTab(t)}
            variant={activeTab === t ? 'default' : 'outline'}
            size="sm"
            className="rounded-full"
          >
            {t}
          </Button>
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
    <div className="mt-3 p-4 rounded-2xl border border-border bg-gradient-to-r from-primary/10 to-cyan-500/10 flex items-center justify-between">
      <div>
        <div className="text-sm font-semibold">{item.title}</div>
        <div className="text-xs text-muted-foreground">{item.blurb}</div>
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
        <Card key={f.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardContent className="p-0">
            <div className="h-36 bg-muted flex items-center justify-center text-muted-foreground">
              image
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{f.title}</div>
                <div className="text-xs">{f.emoji}</div>
              </div>
              <div className="text-xs text-muted-foreground">{f.blurb}</div>
              <div className="mt-2 flex flex-wrap gap-1 text-[11px]">
                <Badge variant="secondary" className="text-[11px]">⭐ 4.7</Badge>
                <Badge variant="secondary" className="text-[11px]">Free cancel</Badge>
                <Badge variant="secondary" className="text-[11px]">Near harbor</Badge>
              </div>
              <div className="mt-3 text-xs text-primary">Tap to ask the agent for this</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const Lane: React.FC<{ title: string; data: any[]; cta: string }> = ({ title, data, cta }) => (
  <div className="mt-6">
    <div className="flex items-center justify-between mb-2">
      <div className="font-medium">{title}</div>
      <Button variant="ghost" size="sm" className="text-xs">View all</Button>
    </div>
    <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="flex gap-3 min-w-max pr-2">
        {data.map((d) => (
          <Card key={d.id} className="w-64 text-left shrink-0 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="text-xl">{d.emoji}</div>
              <div className="text-sm font-medium mt-1">{d.title}</div>
              <div className="text-xs text-muted-foreground">{d.meta}</div>
              <div className="mt-2 text-xs text-primary">{cta}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

const TrustStrip: React.FC = () => (
  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
    <Badge variant="outline" className="rounded-xl p-2 text-[11px]">✅ Protected bookings</Badge>
    <Badge variant="outline" className="rounded-xl p-2 text-[11px]">🧾 Clear receipts & changes</Badge>
    <Badge variant="outline" className="rounded-xl p-2 text-[11px]">🤝 No auto-charges — explicit confirm</Badge>
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
