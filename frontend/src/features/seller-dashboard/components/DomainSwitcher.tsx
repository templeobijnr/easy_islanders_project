import React from 'react';
import { useDomainContext } from '../hooks/useDomainContext';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import { DOMAIN_LABELS, DOMAIN_COLORS } from './DomainProvider';
import { 
  Home, 
  Calendar, 
  Briefcase, 
  Users, 
  Zap, 
  Package, 
  Wrench, 
  UtensilsCrossed, 
  Share2 
} from 'lucide-react';

const DOMAIN_ICONS: Record<string, React.ReactNode> = {
  real_estate: <Home className="w-4 h-4" />,
  events: <Calendar className="w-4 h-4" />,
  activities: <Zap className="w-4 h-4" />,
  appointments: <Users className="w-4 h-4" />,
  vehicles: <Briefcase className="w-4 h-4" />,
  products: <Package className="w-4 h-4" />,
  services: <Wrench className="w-4 h-4" />,
  restaurants: <UtensilsCrossed className="w-4 h-4" />,
  p2p: <Share2 className="w-4 h-4" />,
};

export const DomainSwitcher: React.FC = () => {
  const { activeDomain, setActiveDomain, availableDomains } = useDomainContext();

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-700">Domain:</span>
      <Select value={activeDomain} onValueChange={setActiveDomain}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableDomains.map((domain) => (
            <SelectItem key={domain} value={domain}>
              <div className="flex items-center gap-2">
                {DOMAIN_ICONS[domain]}
                <span>{DOMAIN_LABELS[domain]}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Badge className={DOMAIN_COLORS[activeDomain]}>
        {DOMAIN_LABELS[activeDomain]}
      </Badge>
    </div>
  );
};
