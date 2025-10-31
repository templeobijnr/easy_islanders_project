import React from 'react';
import { motion } from 'framer-motion';
import { cardHover } from '../../../shared/motion/variants';
import { Heart, Star, MapPin } from '../../../shared/icons';
import { Card } from '../../../shared/components/index';
import { Button } from '../../../shared/components/index';

interface RecommendationCardProps {
  title: string;
  description: string;
  price?: string;
  location?: string;
  rating?: number;
  image?: string;
  onViewDetails?: () => void;
  onFavorite?: () => void;
  isFavorited?: boolean;
}

const RecommendationCard = ({
  title,
  description,
  price,
  location,
  rating,
  image,
  onViewDetails,
  onFavorite,
  isFavorited = false
}: RecommendationCardProps) => {
  return (
    <motion.div variants={cardHover} initial="rest" whileHover="hover">
      <Card className="overflow-hidden">
        {image && (
          <div className="relative">
            <img
              src={image}
              alt={title}
              className="w-full h-48 object-cover"
            />
            {onFavorite && (
              <button
                onClick={onFavorite}
                className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-md rounded-2xl hover:bg-white/30 transition-colors"
              >
                <Heart className={`w-5 h-5 ${isFavorited ? 'text-red-500 fill-current' : 'text-white'}`} />
              </button>
            )}
          </div>
        )}

        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-slate-900 text-lg">{title}</h3>
            {rating && (
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-sm text-slate-600">{rating}</span>
              </div>
            )}
          </div>

          {location && (
            <div className="flex items-center space-x-1 mb-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">{location}</span>
            </div>
          )}

          <p className="text-sm text-slate-600 mb-3 line-clamp-2">{description}</p>

          <div className="flex items-center justify-between">
            {price && (
              <span className="font-semibold text-lg text-slate-900">{price}</span>
            )}
            {onViewDetails && (
              <Button variant="primary" size="sm" onClick={onViewDetails}>
                View Details
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default RecommendationCard;