import React, { useState, useEffect } from 'react';
import { DomainContext, DomainContextType } from '../hooks/useDomainContext';

interface DomainProviderProps {
  children: React.ReactNode;
  initialDomain?: string;
}

const AVAILABLE_DOMAINS = [
  'real_estate',
  'events',
  'activities',
  'appointments',
  'vehicles',
  'products',
  'services',
  'restaurants',
  'p2p',
];

const DOMAIN_LABELS: Record<string, string> = {
  real_estate: 'Real Estate',
  events: 'Events',
  activities: 'Activities',
  appointments: 'Appointments',
  vehicles: 'Vehicles',
  products: 'Products',
  services: 'Services',
  restaurants: 'Restaurants',
  p2p: 'P2P',
};

const DOMAIN_COLORS: Record<string, string> = {
  real_estate: 'bg-blue-100 text-blue-800',
  events: 'bg-purple-100 text-purple-800',
  activities: 'bg-green-100 text-green-800',
  appointments: 'bg-pink-100 text-pink-800',
  vehicles: 'bg-orange-100 text-orange-800',
  products: 'bg-yellow-100 text-yellow-800',
  services: 'bg-indigo-100 text-indigo-800',
  restaurants: 'bg-red-100 text-red-800',
  p2p: 'bg-teal-100 text-teal-800',
};

export const DomainProvider: React.FC<DomainProviderProps> = ({
  children,
  initialDomain = 'real_estate',
}) => {
  const [activeDomain, setActiveDomain] = useState(initialDomain);
  const [domainSettings, setDomainSettings] = useState<Record<string, any>>({});

  // Load domain settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('activeDomain');
    if (saved && AVAILABLE_DOMAINS.includes(saved)) {
      setActiveDomain(saved);
    }
  }, []);

  // Save active domain to localStorage
  useEffect(() => {
    localStorage.setItem('activeDomain', activeDomain);
  }, [activeDomain]);

  const value: DomainContextType = {
    activeDomain,
    setActiveDomain,
    availableDomains: AVAILABLE_DOMAINS,
    domainSettings,
  };

  return (
    <DomainContext.Provider value={value}>
      {children}
    </DomainContext.Provider>
  );
};

export { AVAILABLE_DOMAINS, DOMAIN_LABELS, DOMAIN_COLORS };
