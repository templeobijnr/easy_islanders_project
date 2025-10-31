import React from 'react';

export interface RecommendationCardProps {
  item: { id: string; title: string; reason?: string; price?: string };
  onUse: (item: { id: string; title: string }) => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ item, onUse }) => {
  return (
    <button
      onClick={() => onUse(item)}
      className="w-72 text-left shrink-0 rounded-2xl border border-slate-200 bg-white hover:shadow-md overflow-hidden transition"
    >
      <div className="h-28 bg-slate-100 flex items-center justify-center text-slate-400">image</div>
      <div className="p-3">
        <div className="text-sm font-semibold line-clamp-1">{item.title}</div>
        {item.reason && <div className="text-xs text-slate-600 line-clamp-2">{item.reason}</div>}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-semibold">{item.price}</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full border">⭐ 4.6</span>
        </div>
      </div>
    </button>
  );
};

export default RecommendationCard;
