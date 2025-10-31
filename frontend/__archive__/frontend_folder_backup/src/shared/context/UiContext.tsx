import React, { createContext, useContext, useState } from 'react';
import type { JobId, Tab } from '../types';
import { FEATURED_TABS } from '../constants';

interface UiState {
  activeJob: JobId | null;
  setActiveJob: (id: JobId | null) => void;
  activeTab: Tab;
  setActiveTab: (t: Tab) => void;
}

const UiCtx = createContext<UiState | null>(null);

export const UiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeJob, setActiveJob] = useState<JobId | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(FEATURED_TABS[0]);
  return <UiCtx.Provider value={{ activeJob, setActiveJob, activeTab, setActiveTab }}>{children}</UiCtx.Provider>;
};

export const useUi = () => {
  const ctx = useContext(UiCtx);
  if (!ctx) throw new Error('useUi must be used within UiProvider');
  return ctx;
};