import React from 'react';
import JobChip from './JobChip';
import { JOB_CHIPS } from '../../shared/constants';
import { useUi } from '../../shared/context/UiContext';

const LeftRail: React.FC = () => {
  const { activeJob, setActiveJob } = useUi();
  return (
    <aside className="w-72 shrink-0 p-4 border-r border-slate-200 bg-white/90 backdrop-blur">
      <div className="relative overflow-hidden rounded-xl mb-4 p-3 bg-gradient-to-r from-lime-200 via-emerald-200 to-sky-200">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-lime-600 shadow-inner" />
          <div className="font-semibold">EasyIslanders</div>
        </div>
        <div className="text-xs text-slate-700 mt-1">Ask once. Get it done—locally.</div>
        <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-white/40" />
      </div>

      <div className="text-xs text-slate-500 mb-2">Jobs to do</div>
      <div className="space-y-2">
        {JOB_CHIPS.map((c) => (
          <JobChip
            key={c.id}
            label={c.label}
            icon={c.icon}
            active={activeJob === c.id}
            onClick={() => setActiveJob(c.id)}
          />
        ))}
      </div>

      <div className="mt-6 text-[11px] text-slate-500">
        Powered by your agent • Explicit confirmations only
      </div>
    </aside>
  );
};

export default LeftRail;
