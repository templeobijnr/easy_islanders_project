import React from 'react';
import { motion } from 'framer-motion';
import { cardHover } from '../../../shared/motion/variants';
import { ExternalLink, Phone, Mail } from '../../../shared/icons';
import { Card } from '../../../shared/components/index';
import { Button } from '../../../shared/components/index';

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
  const getTypeColor = () => {
    switch (type) {
      case 'property': return 'bg-blue-100 text-blue-800';
      case 'agent': return 'bg-green-100 text-green-800';
      case 'service': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div variants={cardHover} initial="rest" whileHover="hover">
      <Card className="overflow-hidden">
        {image && (
          <img
            src={image}
            alt={title}
            className="w-full h-48 object-cover"
          />
        )}

        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <span className={`inline-block px-2 py-1 rounded-2xl text-xs font-medium mb-2 ${getTypeColor()}`}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
              <h3 className="font-semibold text-slate-900 text-lg mb-1">{title}</h3>
              {location && (
                <p className="text-sm text-slate-600">{location}</p>
              )}
            </div>
            {price && (
              <span className="font-bold text-lg text-slate-900 ml-4">{price}</span>
            )}
          </div>

          <p className="text-sm text-slate-600 mb-4 line-clamp-3">{description}</p>

          {contactInfo && (
            <div className="flex flex-wrap gap-2 mb-4">
              {contactInfo.phone && (
                <a
                  href={`tel:${contactInfo.phone}`}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <Phone className="w-4 h-4" />
                  <span>{contactInfo.phone}</span>
                </a>
              )}
              {contactInfo.email && (
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <Mail className="w-4 h-4" />
                  <span>{contactInfo.email}</span>
                </a>
              )}
              {contactInfo.website && (
                <a
                  href={contactInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Website</span>
                </a>
              )}
            </div>
          )}

          <div className="flex space-x-2">
            {onViewDetails && (
              <Button variant="secondary" size="sm" onClick={onViewDetails}>
                View Details
              </Button>
            )}
            {onContact && (
              <Button variant="primary" size="sm" onClick={onContact}>
                Contact
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default ResultCard;