import React from 'react';

type Props = { label: string; icon: string; active?: boolean; onClick?: () => void };

const JobChip: React.FC<Props> = ({ label, icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm shadow-sm hover:shadow transition ${
      active ? 'bg-lime-100 border-lime-300' : 'bg-white border-slate-200'
    }`}
  >
    <span className="text-lg">{icon}</span>
    <span>{label}</span>
  </button>
);

export default JobChip;
