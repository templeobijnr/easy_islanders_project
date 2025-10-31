import React from 'react';
import { EVENTS } from '../../../shared/constants';

const EventsLane: React.FC = () => (
  <div className="mt-6">
    <div className="flex items-center justify-between mb-2">
      <div className="font-medium">Events this week</div>
      <button className="text-xs underline">View all</button>
    </div>
    <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="flex gap-3 min-w-max pr-2">
        {EVENTS.map((e) => (
          <button key={e.id} className="w-64 p-4 rounded-2xl border border-slate-200 bg-white hover:shadow text-left shrink-0">
            <div className="text-xl">{e.emoji}</div>
            <div className="text-sm font-medium mt-1">{e.title}</div>
            <div className="text-xs text-slate-600">{e.meta}</div>
            <div className="mt-2 text-xs text-lime-700">Ask to book a table/tickets</div>
          </button>
        ))}
      </div>
    </div>
  </div>
);

export default EventsLane;