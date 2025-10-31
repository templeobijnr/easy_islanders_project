import { useEffect, useMemo, useState } from 'react';
import { SPOTLIGHT_BY_TAB } from '../constants';
import { useUi } from '../context/UiContext';

export function useSpotlight(){
  const { activeTab } = useUi();
  const [idx, setIdx] = useState(0);
  useEffect(()=>{
    const id = setInterval(()=> setIdx((i) => (i + 1) % SPOTLIGHT_BY_TAB[activeTab].length), 3500);
    return () => clearInterval(id);
  }, [activeTab]);
  return useMemo(()=> SPOTLIGHT_BY_TAB[activeTab][idx], [activeTab, idx]);
}