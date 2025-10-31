import React, { createContext, useContext, useState } from 'react';
import type { JobId, Tab, Job, JobStatus } from '../types';
import { FEATURED_TABS, JOB_CHIPS } from '../constants';

interface UiState {
  activeJob: JobId | null;
  setActiveJob: (id: JobId | null) => void;
  activeTab: Tab;
  setActiveTab: (t: Tab) => void;
  jobs: Job[];
  setJobStatus: (jobId: JobId, status: JobStatus) => void;
}

const UiCtx = createContext<UiState | null>(null);

export const UiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeJob, setActiveJob] = useState<JobId | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(FEATURED_TABS[0]);

  // Initialize jobs from JOB_CHIPS with default status
  const initialJobs: Job[] = JOB_CHIPS.map(chip => ({
    id: chip.id,
    status: 'idle',
    label: chip.label,
    icon: chip.icon,
  }));
  const [jobs, setJobs] = useState<Job[]>(initialJobs);

  const setJobStatus = (jobId: JobId, status: JobStatus) => {
    setJobs(prevJobs =>
      prevJobs.map(job =>
        job.id === jobId ? { ...job, status } : job
      )
    );
  };

  return (
    <UiCtx.Provider value={{ activeJob, setActiveJob, activeTab, setActiveTab, jobs, setJobStatus }}>
      {children}
    </UiCtx.Provider>
  );
};

export const useUi = () => {
  const ctx = useContext(UiCtx);
  if (!ctx) throw new Error('useUi must be used within UiProvider');
  return ctx;
};