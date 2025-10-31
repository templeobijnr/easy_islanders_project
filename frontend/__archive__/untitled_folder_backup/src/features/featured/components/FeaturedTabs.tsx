import React from 'react';

type TabDef = {
  id: string;
  label: string;
  content: React.ReactNode;
};

interface FeaturedTabsProps {
  tabs: TabDef[];
}

const FeaturedTabs: React.FC<FeaturedTabsProps> = ({ tabs }) => {
  const [activeId, setActiveId] = React.useState(tabs?.[0]?.id);

  const active = tabs.find((t) => t.id === activeId);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Featured for you</h3>
        <div className="flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveId(t.id)}
              className={`px-3 py-1.5 rounded-2xl border text-xs ${
                activeId === t.id ? 'bg-lime-100 border-lime-300' : 'bg-white border-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>{active?.content}</div>
    </div>
  );
};

export default FeaturedTabs;