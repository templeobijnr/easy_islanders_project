import React from 'react';
import { motion } from 'framer-motion';
import { Heart, MapPin, Star, Calendar, Users } from 'lucide-react';
import { Listing } from '../../explore/types';

interface PremiumRecommendationCardProps {
  listing: Listing;
  onClick?: () => void;
  onSave?: (id: string) => void;
  isSaved?: boolean;
  isFeatured?: boolean;
}

const PremiumRecommendationCard: React.FC<PremiumRecommendationCardProps> = ({
  listing,
  onClick,
  onSave,
  isSaved = false,
  isFeatured = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border border-white/40 overflow-hidden hover:shadow-2xl transition-all duration-300">
        {/* Premium Image Section */}
        <div className="relative aspect-video overflow-hidden">
          <motion.img
            src={(listing.images && listing.images.length > 0 ? listing.images[0].image : null) || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop'}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.5 }}
          />
          
          {/* Premium Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Premium Save Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onSave?.(listing.id);
            }}
            className="absolute top-4 right-4 p-3 bg-white/95 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all"
          >
            <Heart 
              className={`w-5 h-5 ${isSaved ? 'text-rose-500 fill-current' : 'text-gray-600'} transition-colors`} 
            />
          </motion.button>

          {/* Premium Featured Badge */}
          {isFeatured && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute top-4 left-4 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1"
            >
              <Star className="w-3 h-3 fill-current" />
              Featured
            </motion.div>
          )}

          {/* Premium Quick Actions Overlay */}
          <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full py-3 bg-white/95 backdrop-blur-sm text-gray-900 font-semibold rounded-xl hover:bg-white transition-all shadow-lg"
            >
              View Details
            </motion.button>
          </div>
        </div>

        {/* Premium Content Section */}
        <div className="p-6">
          {/* Premium Title and Price */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <motion.h3 
                className="font-bold text-lg text-gray-900 mb-1 line-clamp-2 leading-tight"
                whileHover={{ color: '#dc2626' }}
                transition={{ duration: 0.2 }}
              >
                {listing.title}
              </motion.h3>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{listing.location || 'North Cyprus'}</span>
              </div>
            </div>
            <div className="text-right ml-4">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                £{listing.price || '0'}
              </div>
              <div className="text-xs text-gray-500 font-medium">per night</div>
            </div>
          </div>

          {/* Premium Features Row */}
          <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
            {listing.dynamic_fields?.guests && (
              <motion.div 
                className="flex items-center gap-1.5"
                whileHover={{ scale: 1.05 }}
              >
                <Users className="w-4 h-4" />
                <span>{listing.dynamic_fields.guests} guests</span>
              </motion.div>
            )}
            {listing.dynamic_fields?.bedrooms && (
              <motion.div 
                className="flex items-center gap-1.5"
                whileHover={{ scale: 1.05 }}
              >
                <span>{listing.dynamic_fields.bedrooms} beds</span>
              </motion.div>
            )}
            {listing.dynamic_fields?.rating && (
              <motion.div 
                className="flex items-center gap-1.5"
                whileHover={{ scale: 1.05 }}
              >
                <Star className="w-4 h-4 text-amber-500 fill-current" />
                <span className="font-medium">{listing.dynamic_fields.rating}</span>
              </motion.div>
            )}
          </div>

          {/* Premium Category and Availability */}
          <div className="flex items-center justify-between">
            {listing.category?.name && (
              <motion.div 
                className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 text-xs font-semibold rounded-full border border-gray-200"
                whileHover={{ scale: 1.05 }}
              >
                {listing.category.name}
              </motion.div>
            )}
            
            {/* Premium Availability Indicator */}
            <motion.div 
              className="flex items-center gap-1.5 text-xs text-green-600 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Available
            </motion.div>
          </div>
        </div>

        {/* Premium Hover Effect Border */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-rose-500 via-purple-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 group-hover:scale-105" />
      </div>
    </motion.div>
  );
};

// Premium Inline Recommendations Carousel
export const PremiumInlineRecsCarousel: React.FC<{ listings: Listing[] }> = ({ listings }) => {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Recommended for you</h3>
        <p className="text-gray-600">Based on your conversation and preferences</p>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing, index) => (
          <motion.div
            key={listing.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <PremiumRecommendationCard
              listing={listing}
              isFeatured={listing.is_featured}
              onClick={() => console.log('Card clicked:', listing.id)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PremiumRecommendationCard;