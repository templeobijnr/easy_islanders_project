import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Phone, Mail, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ResultCardProps {
  title: string;
  description: string;
  type: 'property' | 'agent' | 'service';
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  image?: string;
  price?: string;
  location?: string;
  onContact?: () => void;
  onViewDetails?: () => void;
}

const ResultCard = ({
  title,
  description,
  type,
  contactInfo,
  image,
  price,
  location,
  onContact,
  onViewDetails
}: ResultCardProps) => {
  const getTypeBadgeVariant = () => {
    switch (type) {
      case 'property': return 'default';
      case 'agent': return 'success';
      case 'service': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Card className="overflow-hidden hover:shadow-softmd transition-shadow">
        {image && (
          <div className="relative overflow-hidden">
            <div className="w-full h-48 overflow-hidden">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <img
                  src={image}
                  alt={title}
                  className="w-full h-48 object-cover"
                />
              </motion.div>
            </div>
            {price && (
              <div className="absolute top-3 right-3">
                <Badge variant="premium" className="text-base px-3 py-1">
                  {price}
                </Badge>
              </div>
            )}
          </div>
        )}

        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <Badge variant={getTypeBadgeVariant() as any} className="mb-2">
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Badge>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg mb-1">
                {title}
              </h3>
              {location && (
                <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {location}
                </p>
              )}
            </div>
            {price && !image && (
              <Badge variant="premium" className="ml-4">
                {price}
              </Badge>
            )}
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-3">
            {description}
          </p>

          {contactInfo && (
            <div className="flex flex-wrap gap-2 mb-4">
              {contactInfo.phone && (
                <a href={`tel:${contactInfo.phone}`} className="flex items-center space-x-1 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Phone className="w-4 h-4" />
                    {contactInfo.phone}
                  </motion.div>
                </a>
              )}
              {contactInfo.email && (
                <a href={`mailto:${contactInfo.email}`} className="flex items-center space-x-1 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Mail className="w-4 h-4" />
                    {contactInfo.email}
                  </motion.div>
                </a>
              )}
              {contactInfo.website && (
                <a href={contactInfo.website} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Website
                  </motion.div>
                </a>
              )}
            </div>
          )}

          <div className="flex space-x-2">
            {onViewDetails && (
              <Button variant="outline" size="sm" onClick={onViewDetails} className="flex-1">
                View Details
              </Button>
            )}
            {onContact && (
              <Button variant="default" size="sm" onClick={onContact} className="flex-1">
                Contact
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ResultCard;