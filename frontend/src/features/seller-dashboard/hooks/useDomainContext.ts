import { useContext, createContext } from 'react';

export interface DomainContextType {
  activeDomain: string;
  setActiveDomain: (domain: string) => void;
  availableDomains: string[];
  domainSettings: Record<string, any>;
}

export const DomainContext = createContext<DomainContextType | undefined>(undefined);

export const useDomainContext = () => {
  const context = useContext(DomainContext);
  if (!context) {
    throw new Error('useDomainContext must be used within DomainProvider');
  }
  return context;
};
