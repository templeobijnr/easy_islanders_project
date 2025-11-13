import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Calendar, 
  MapPin, 
  Car, 
  Package, 
  Wrench, 
  UtensilsCrossed, 
  Users,
  GraduationCap,
  Heart,
  CheckCircle,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import axios from 'axios';
import config from '../../config';

/**
 * Business Domain Selector for Onboarding
 * Allows new business users to select their primary industry/domain
 */

const DOMAIN_OPTIONS = [
  {
    domain: 'real_estate',
    name: 'Real Estate',
    icon: Building2,
    color: 'blue',
    description: 'Properties, rentals & sales',
    features: ['Property Management', 'Rental Calendar', 'Tenant Screening'],
    popular: true
  },
  {
    domain: 'events',
    name: 'Events & Entertainment',
    icon: Calendar,
    color: 'purple',
    description: 'Conferences, parties & gatherings',
    features: ['Event Planning', 'Ticket Sales', 'Venue Management'],
    popular: true
  },
  {
    domain: 'activities',
    name: 'Activities & Tours',
    icon: MapPin,
    color: 'green',
    description: 'Tours, experiences & adventures',
    features: ['Tour Scheduling', 'Group Bookings', 'Equipment Rental'],
    popular: true
  },
  {
    domain: 'appointments',
    name: 'Appointments & Services',
    icon: Calendar,
    color: 'red',
    description: 'Services, consultations & bookings',
    features: ['Appointment Scheduling', 'Service Catalog', 'Client Management'],
    popular: false
  },
  {
    domain: 'vehicles',
    name: 'Vehicle Rentals',
    icon: Car,
    color: 'orange',
    description: 'Car, bike & vehicle rentals',
    features: ['Fleet Management', 'Rental Tracking', 'Maintenance Scheduling'],
    popular: false
  },
  {
    domain: 'hospitality',
    name: 'Hospitality & Accommodation',
    icon: Building2,
    color: 'indigo',
    description: 'Hotels, B&Bs & accommodations',
    features: ['Room Management', 'Booking System', 'Guest Services'],
    popular: false
  },
  {
    domain: 'food_beverage',
    name: 'Food & Beverage',
    icon: UtensilsCrossed,
    color: 'yellow',
    description: 'Restaurants, cafes & catering',
    features: ['Menu Management', 'Table Reservations', 'Order Processing'],
    popular: false
  },
  {
    domain: 'health_wellness',
    name: 'Health & Wellness',
    icon: Heart,
    color: 'pink',
    description: 'Healthcare, fitness & wellness',
    features: ['Patient Management', 'Treatment Scheduling', 'Health Records'],
    popular: false
  },
  {
    domain: 'education',
    name: 'Education & Training',
    icon: GraduationCap,
    color: 'cyan',
    description: 'Schools, courses & training',
    features: ['Course Management', 'Student Enrollment', 'Progress Tracking'],
    popular: false
  },
  {
    domain: 'professional_services',
    name: 'Professional Services',
    icon: Wrench,
    color: 'gray',
    description: 'Consulting, legal & professional',
    features: ['Client Management', 'Project Tracking', 'Billing & Invoicing'],
    popular: false
  }
];

const BusinessDomainSelector = ({ onComplete, onSkip }) => {
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleDomainSelect = (domain) => {
    setSelectedDomain(domain);
    setError('');
  };

  const handleContinue = async () => {
    if (!selectedDomain) {
      setError('Please select a business domain to continue');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Add the selected domain as primary
      await axios.post(`${config.API_BASE_URL}/api/seller/domains/add/`, {
        domain: selectedDomain.domain,
        is_primary: true
      });

      // Call completion callback
      if (onComplete) {
        onComplete(selectedDomain);
      }
    } catch (err) {
      console.error('Failed to set business domain:', err);
      setError('Failed to set up your business domain. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sort domains: popular first, then alphabetical
  const sortedDomains = [...DOMAIN_OPTIONS].sort((a, b) => {
    if (a.popular && !b.popular) return -1;
    if (!a.popular && b.popular) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full"
      >
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold text-slate-900 mb-2">
              What's your business domain?
            </CardTitle>
            <p className="text-slate-600 text-lg">
              Choose your primary industry to get started with a personalized dashboard
            </p>
          </CardHeader>
          
          <CardContent className="p-8">
            {/* Popular domains section */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Popular Choices</h3>
                <Badge variant="secondary" className="bg-lime-100 text-lime-800 border-lime-200">
                  Most Selected
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {sortedDomains.filter(domain => domain.popular).map((domain) => {
                  const IconComponent = domain.icon;
                  const isSelected = selectedDomain?.domain === domain.domain;
                  
                  return (
                    <motion.div
                      key={domain.domain}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        className={`cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'border-lime-500 border-2 shadow-lg bg-lime-50' 
                            : 'border-slate-200 hover:border-lime-300 hover:shadow-md'
                        }`}
                        onClick={() => handleDomainSelect(domain)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-12 h-12 bg-${domain.color}-100 rounded-xl flex items-center justify-center`}>
                              <IconComponent className={`w-6 h-6 text-${domain.color}-600`} />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-900">{domain.name}</h4>
                              <p className="text-sm text-slate-600">{domain.description}</p>
                            </div>
                            {isSelected && (
                              <CheckCircle className="w-6 h-6 text-lime-600" />
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            {domain.features.map((feature) => (
                              <div key={feature} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                                <span className="text-xs text-slate-600">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* All other domains */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Other Industries</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedDomains.filter(domain => !domain.popular).map((domain) => {
                  const IconComponent = domain.icon;
                  const isSelected = selectedDomain?.domain === domain.domain;
                  
                  return (
                    <motion.div
                      key={domain.domain}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        className={`cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'border-lime-500 border-2 shadow-lg bg-lime-50' 
                            : 'border-slate-200 hover:border-lime-300 hover:shadow-md'
                        }`}
                        onClick={() => handleDomainSelect(domain)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-10 h-10 bg-${domain.color}-100 rounded-lg flex items-center justify-center`}>
                              <IconComponent className={`w-5 h-5 text-${domain.color}-600`} />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-900">{domain.name}</h4>
                              <p className="text-xs text-slate-600">{domain.description}</p>
                            </div>
                            {isSelected && (
                              <CheckCircle className="w-5 h-5 text-lime-600" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="text-red-800 text-sm">{error}</p>
              </motion.div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
              <Button 
                variant="ghost" 
                onClick={onSkip}
                className="text-slate-600"
              >
                Skip for now
              </Button>
              
              <Button 
                onClick={handleContinue}
                disabled={!selectedDomain || isSubmitting}
                className="bg-lime-600 hover:bg-lime-700 text-white px-8"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default BusinessDomainSelector;
