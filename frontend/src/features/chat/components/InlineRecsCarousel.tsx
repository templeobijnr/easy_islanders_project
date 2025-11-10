import React from 'react';
import { useUi } from '../../../shared/context/UiContext';
import { useChat } from '../../../shared/context/ChatContext';
import RecommendationCard from './RecommendationCard';
import { MOCK_RESULTS } from '../../../shared/constants';

export default function InlineRecsCarousel() {
  const { activeJob } = useUi();
  const { results } = useChat();

  console.log('[InlineRecsCarousel] Render check:', {
    activeJob,
    resultsLength: results.length,
    results: results.slice(0, 2), // Log first 2 items
    hasActiveJob: !!activeJob
  });

  // Use API results if available, otherwise fall back to mock data for the active job
  const recs = results.length > 0
    ? results
    : (activeJob ? (MOCK_RESULTS as any)[activeJob] || [] : []);

  console.log('[InlineRecsCarousel] Final recs:', {
    recsLength: recs.length,
    usingApiResults: results.length > 0,
    usingMockData: results.length === 0 && !!activeJob
  });

  if (!recs.length) {
    console.log('[InlineRecsCarousel] No recommendations, not rendering');
    return null;
  }

  console.log('[InlineRecsCarousel] Rendering with', recs.length, 'recommendations');

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-ink-700">Recommended for you</p>
      </div>
      <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-3 min-w-max pr-2">
          {recs.map((it: any) => (
            <RecommendationCard key={it.id} item={it} />
          ))}
        </div>
      </div>
    </div>
  );
}
