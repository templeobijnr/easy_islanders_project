import React from 'react';
import { useUi } from '../../../shared/context/UiContext';
import { useChat } from '../../../shared/context/ChatContext';
import RecommendationCard from './RecommendationCard';
import { MOCK_RESULTS } from '../../../shared/constants';

export default function InlineRecsCarousel() {
  const { activeJob } = useUi();
  const { sendMessage } = useChat();

  if (!activeJob) return null;

  const recs = (MOCK_RESULTS as any)[activeJob] || [];
  if (!recs.length) return null;

  const handleUseRecommendation = (item: any) => {
    sendMessage(`I'm interested in: ${item.title}`, 'user');
  };

  return (
    <div className="px-4 mt-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-ink-700">Recommended for your request</p>
      </div>
      <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex gap-3 min-w-max pr-2">
          {recs.map((it: any) => (
            <RecommendationCard
              key={it.id}
              item={it}
              onUse={handleUseRecommendation}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
