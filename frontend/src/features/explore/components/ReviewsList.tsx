/**
 * ReviewsList - Read-only reviews display for listings
 * Shows rating distribution, recent reviews with pagination
 */

import React, { useState } from 'react';
import { Star, ThumbsUp, MessageCircle } from 'lucide-react';

// Mock review type (TODO: Move to types.ts when backend is ready)
export interface Review {
  id: string;
  user: {
    name: string;
    avatar?: string;
    initials: string;
  };
  rating: number;
  comment: string;
  created_at: string;
  helpful_count: number;
  images?: string[];
}

interface ReviewsListProps {
  listingId: string;
  averageRating?: number;
  totalReviews?: number;
  className?: string;
}

// Mock reviews generator (TODO: Replace with API call)
const generateMockReviews = (count: number = 5): Review[] => {
  const sampleReviews = [
    {
      id: '1',
      user: { name: 'Sarah Johnson', initials: 'SJ' },
      rating: 5,
      comment: 'Absolutely stunning property! The location is perfect, and the host was incredibly helpful. Would definitely recommend to anyone looking for a peaceful getaway in North Cyprus.',
      created_at: '2025-01-10T14:30:00Z',
      helpful_count: 12,
    },
    {
      id: '2',
      user: { name: 'Michael Chen', initials: 'MC' },
      rating: 4,
      comment: 'Great experience overall. The property matched the description perfectly. Only minor issue was the Wi-Fi speed, but everything else was excellent.',
      created_at: '2025-01-08T10:15:00Z',
      helpful_count: 8,
    },
    {
      id: '3',
      user: { name: 'Emma Williams', initials: 'EW' },
      rating: 5,
      comment: 'We had an amazing time! The property is even more beautiful in person. Very clean, well-maintained, and the amenities are top-notch. Will definitely be back!',
      created_at: '2025-01-05T16:45:00Z',
      helpful_count: 15,
    },
    {
      id: '4',
      user: { name: 'David Martinez', initials: 'DM' },
      rating: 4,
      comment: 'Excellent location close to the beach and restaurants. The property manager was very responsive. A few small maintenance issues but they were addressed quickly.',
      created_at: '2025-01-02T09:20:00Z',
      helpful_count: 6,
    },
    {
      id: '5',
      user: { name: 'Lisa Thompson', initials: 'LT' },
      rating: 5,
      comment: 'Perfect for a family vacation! Spacious, comfortable, and the views are breathtaking. The kids loved the pool, and we enjoyed exploring the nearby area. Highly recommended!',
      created_at: '2024-12-28T12:00:00Z',
      helpful_count: 10,
    },
  ];

  return sampleReviews.slice(0, count);
};

// Format relative time (e.g., "2 days ago")
const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

// Star rating display component
const StarRating: React.FC<{ rating: number; size?: 'sm' | 'md' | 'lg' }> = ({
  rating,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClasses[size]} ${
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'fill-slate-200 text-slate-200'
          }`}
        />
      ))}
    </div>
  );
};

export const ReviewsList: React.FC<ReviewsListProps> = ({
  listingId,
  averageRating = 4.6,
  totalReviews = 127,
  className = '',
}) => {
  const [reviews] = useState<Review[]>(generateMockReviews(5));
  const [visibleCount, setVisibleCount] = useState(3);

  // Calculate rating distribution (mock data)
  const ratingDistribution = [
    { stars: 5, count: 89, percentage: 70 },
    { stars: 4, count: 28, percentage: 22 },
    { stars: 3, count: 8, percentage: 6 },
    { stars: 2, count: 2, percentage: 2 },
    { stars: 1, count: 0, percentage: 0 },
  ];

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + 3, reviews.length));
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header: Overall Rating */}
      <div className="flex flex-col md:flex-row md:items-center gap-6 pb-6 border-b border-slate-200">
        {/* Overall Score */}
        <div className="flex flex-col items-center md:items-start">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-5xl font-bold text-slate-900">{averageRating.toFixed(1)}</span>
            <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
          </div>
          <p className="text-slate-600 text-sm">
            Based on <span className="font-semibold">{totalReviews}</span> reviews
          </p>
        </div>

        {/* Rating Distribution */}
        <div className="flex-1 space-y-2">
          {ratingDistribution.map((rating) => (
            <div key={rating.stars} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-16">
                <span className="text-sm font-medium text-slate-700">{rating.stars}</span>
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              </div>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all"
                  style={{ width: `${rating.percentage}%` }}
                />
              </div>
              <span className="text-sm text-slate-600 w-12 text-right">{rating.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-5">
        {reviews.slice(0, visibleCount).map((review) => (
          <div
            key={review.id}
            className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* User Info & Rating */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-lime-500 to-emerald-500 text-white font-semibold text-sm">
                  {review.user.initials}
                </div>
                {/* Name & Date */}
                <div>
                  <h4 className="font-semibold text-slate-900">{review.user.name}</h4>
                  <p className="text-xs text-slate-500">{getRelativeTime(review.created_at)}</p>
                </div>
              </div>
              {/* Star Rating */}
              <StarRating rating={review.rating} size="sm" />
            </div>

            {/* Review Comment */}
            <p className="text-slate-700 leading-relaxed mb-3">{review.comment}</p>

            {/* Review Images (if any) */}
            {review.images && review.images.length > 0 && (
              <div className="flex gap-2 mb-3 overflow-x-auto">
                {review.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Review image ${idx + 1}`}
                    className="w-24 h-24 rounded-lg object-cover border border-slate-200"
                  />
                ))}
              </div>
            )}

            {/* Review Actions */}
            <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
              <button className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-lime-600 transition">
                <ThumbsUp className="w-4 h-4" />
                <span>Helpful ({review.helpful_count})</span>
              </button>
              <button className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-lime-600 transition">
                <MessageCircle className="w-4 h-4" />
                <span>Reply</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {visibleCount < reviews.length && (
        <div className="text-center pt-2">
          <button
            onClick={handleLoadMore}
            className="px-6 py-3 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl text-slate-700 font-medium hover:border-lime-600 hover:text-lime-600 hover:bg-lime-50 transition-all shadow-sm"
          >
            Load More Reviews ({reviews.length - visibleCount} remaining)
          </button>
        </div>
      )}

      {/* Empty State */}
      {reviews.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200">
          <MessageCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h4 className="text-lg font-semibold text-slate-900 mb-1">No reviews yet</h4>
          <p className="text-slate-600">Be the first to review this listing!</p>
        </div>
      )}
    </div>
  );
};

export default ReviewsList;
