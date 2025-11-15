import React, { useState } from 'react';
import { useBrowseP2PPosts } from '../hooks';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, User, MessageSquare } from 'lucide-react';
import { ProposeExchangeDialog } from './ProposeExchangeDialog';

export const BrowseP2PPosts: React.FC = () => {
  const [filters, setFilters] = useState({
    location: '',
    exchange_type: '',
    condition: '',
  });
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [showProposeDialog, setShowProposeDialog] = useState(false);

  // Convert "all" back to empty string for API filtering
  const apiFilters = {
    location: filters.location,
    exchange_type: filters.exchange_type === 'all' ? '' : filters.exchange_type,
    condition: filters.condition === 'all' ? '' : filters.condition,
  };
  const { data: posts, isLoading, error } = useBrowseP2PPosts(apiFilters);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load posts</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          placeholder="Search by location..."
          value={filters.location}
          onChange={(e) => handleFilterChange('location', e.target.value)}
        />
        <Select value={filters.exchange_type} onValueChange={(value) => handleFilterChange('exchange_type', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Exchange Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="item_exchange">Item Exchange</SelectItem>
            <SelectItem value="service_exchange">Service Exchange</SelectItem>
            <SelectItem value="skill_exchange">Skill Exchange</SelectItem>
            <SelectItem value="time_exchange">Time Exchange</SelectItem>
            <SelectItem value="mixed_exchange">Mixed Exchange</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.condition} onValueChange={(value) => handleFilterChange('condition', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Conditions</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="like_new">Like New</SelectItem>
            <SelectItem value="good">Good</SelectItem>
            <SelectItem value="fair">Fair</SelectItem>
            <SelectItem value="poor">Poor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Posts Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      ) : posts && posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow">
              {post.image_url && (
                <div className="h-40 bg-gray-200 rounded-t-lg overflow-hidden">
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg line-clamp-2">{post.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600 line-clamp-2">{post.description}</p>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin className="w-4 h-4" />
                  {post.location}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <User className="w-4 h-4" />
                  {post.seller_name}
                </div>

                <div className="flex gap-2 flex-wrap">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {post.exchange_type}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                    {post.condition}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-gray-500">
                    {post.exchanges_count} exchange{post.exchanges_count !== 1 ? 's' : ''}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedPostId(post.id);
                      setShowProposeDialog(true);
                    }}
                    className="gap-1"
                  >
                    <MessageSquare className="w-3 h-3" />
                    Propose
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600">No posts found matching your filters</p>
        </div>
      )}

      {selectedPostId && (
        <ProposeExchangeDialog
          postId={selectedPostId}
          open={showProposeDialog}
          onOpenChange={setShowProposeDialog}
        />
      )}
    </div>
  );
};
