import { useEffect, useMemo, useState } from 'react';
import { SPOTLIGHT_BY_TAB } from '../../../shared/constants';
import { useUi } from '../../../shared/context/UiContext';

export function useSpotlight() {
  const { activeTab } = useUi();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const items = SPOTLIGHT_BY_TAB[activeTab] || [];
    if (!items.length) return;
    const id = setInterval(() => setIdx(i => (i + 1) % items.length), 3500);
    return () => clearInterval(id);
  }, [activeTab]);

  const items = SPOTLIGHT_BY_TAB[activeTab] || [];
  return useMemo(() => items[idx] ?? { id: 'na', title: '', blurb: '' }, [items, idx]);
}