import React from 'react';
import { TODO } from '../../../shared/constants';

const ThingsToDoLane: React.FC = () => (
  <div className="mt-6">
    <div className="flex items-center justify-between mb-2">
      <div className="font-medium">Things to do</div>
      <button className="text-xs underline">View all</button>
    </div>
    <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="flex gap-3 min-w-max pr-2">
        {TODO.map((t) => (
          <button key={t.id} className="w-64 p-4 rounded-2xl border border-slate-200 bg-white hover:shadow text-left shrink-0">
            <div className="text-xl">{t.emoji}</div>
            <div className="text-sm font-medium mt-1">{t.title}</div>
            <div className="text-xs text-slate-600">{t.meta}</div>
            <div className="mt-2 text-xs text-lime-700">Ask for a plan & timings</div>
          </button>
        ))}
      </div>
    </div>
  </div>
);

export default ThingsToDoLane;