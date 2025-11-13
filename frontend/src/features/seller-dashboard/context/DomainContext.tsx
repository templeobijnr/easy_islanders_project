import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DomainId,
  DashboardSectionId,
  DomainConfig,
  getDomainConfig,
  getAllDomains,
  isSectionEnabled,
} from '../domainRegistry';

interface DomainContextValue {
  activeDomain: DomainConfig;
  setActiveDomain: (domainId: DomainId) => void;
  availableDomains: DomainConfig[];
  activeSection: DashboardSectionId;
  setActiveSection: (sectionId: DashboardSectionId) => void;
  isSectionEnabled: (sectionId: DashboardSectionId) => boolean;
  navigateToSection: (sectionId: DashboardSectionId) => void;
  navigateToDomainHome: (domainId: DomainId) => void;
}

const DomainContext = createContext<DomainContextValue | undefined>(undefined);

interface DomainProviderProps {
  children: ReactNode;
  domainId?: DomainId;
  initialSection?: DashboardSectionId;
}

export const DomainProvider: React.FC<DomainProviderProps> = ({
  children,
  domainId = 'real_estate',
  initialSection = 'home',
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeDomain, setActiveDomainState] = useState<DomainConfig>(
    getDomainConfig(domainId)
  );
  const [activeSection, setActiveSectionState] = useState<DashboardSectionId>(initialSection);

  // Sync with URL on mount
  useEffect(() => {
    const pathname = location.pathname;

    // Detect section from URL
    if (pathname.includes('/my-listings')) setActiveSectionState('my_listings');
    else if (pathname.includes('/bookings')) setActiveSectionState('bookings');
    else if (pathname.includes('/seller-inbox')) setActiveSectionState('seller_inbox');
    else if (pathname.includes('/broadcasts')) setActiveSectionState('broadcasts');
    else if (pathname.includes('/sales')) setActiveSectionState('sales');
    else if (pathname.includes('/messages')) setActiveSectionState('messages');
    else if (pathname.includes('/analytics')) setActiveSectionState('analytics');
    else if (pathname.includes('/profile')) setActiveSectionState('profile');
    else if (pathname.includes('/help')) setActiveSectionState('help');
    else if (pathname.includes('/home/')) setActiveSectionState('home');

    // Detect domain from URL (for home pages)
    if (pathname.includes('/home/real-estate')) setActiveDomainState(getDomainConfig('real_estate'));
    else if (pathname.includes('/home/cars')) setActiveDomainState(getDomainConfig('cars'));
    else if (pathname.includes('/home/events')) setActiveDomainState(getDomainConfig('events'));
    else if (pathname.includes('/home/services')) setActiveDomainState(getDomainConfig('services'));
    else if (pathname.includes('/home/restaurants')) setActiveDomainState(getDomainConfig('restaurants'));
    else if (pathname.includes('/home/p2p')) setActiveDomainState(getDomainConfig('p2p'));
  }, [location.pathname]);

  const setActiveDomain = (newDomainId: DomainId) => {
    const newDomain = getDomainConfig(newDomainId);
    setActiveDomainState(newDomain);
    console.info('[dashboard] domain switched', {
      from: activeDomain.id,
      to: newDomainId,
    });
  };

  const setActiveSection = (newSectionId: DashboardSectionId) => {
    setActiveSectionState(newSectionId);
    console.info('[dashboard] section changed', {
      domainId: activeDomain.id,
      sectionId: newSectionId,
    });
  };

  const navigateToSection = (sectionId: DashboardSectionId) => {
    const sectionPaths: Record<DashboardSectionId, string> = {
      home: activeDomain.homePath,
      my_listings: '/dashboard/my-listings',
      bookings: '/dashboard/bookings',
      seller_inbox: '/dashboard/seller-inbox',
      broadcasts: '/dashboard/broadcasts',
      sales: '/dashboard/sales',
      messages: '/dashboard/messages',
      analytics: '/dashboard/analytics',
      profile: '/dashboard/profile',
      help: '/dashboard/help',
    };

    const path = sectionPaths[sectionId];
    if (path) {
      navigate(path);
      setActiveSection(sectionId);
    }
  };

  const navigateToDomainHome = (domainId: DomainId) => {
    const domain = getDomainConfig(domainId);
    navigate(domain.homePath);
    setActiveDomain(domainId);
    setActiveSection('home');
  };

  const checkSectionEnabled = (sectionId: DashboardSectionId) => {
    return isSectionEnabled(activeDomain.id, sectionId);
  };

  const value: DomainContextValue = {
    activeDomain,
    setActiveDomain,
    availableDomains: getAllDomains(),
    activeSection,
    setActiveSection,
    isSectionEnabled: checkSectionEnabled,
    navigateToSection,
    navigateToDomainHome,
  };

  return <DomainContext.Provider value={value}>{children}</DomainContext.Provider>;
};

/**
 * Hook to access domain context
 * @throws Error if used outside DomainProvider
 */
export const useDomainContext = (): DomainContextValue => {
  const context = useContext(DomainContext);
  if (!context) {
    throw new Error('useDomainContext must be used within a DomainProvider');
  }
  return context;
};
