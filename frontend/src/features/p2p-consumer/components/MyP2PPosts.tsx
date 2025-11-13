import React, { useState } from 'react';
import { useMyP2PPosts, useDeleteP2PPost } from '../hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const MyP2PPosts: React.FC = () => {
  const { data: posts, isLoading, error } = useMyP2PPosts();
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const deletePost = useDeleteP2PPost(selectedPostId || '');

  const handleDelete = (postId: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      setSelectedPostId(postId);
      deletePost.mutate();
    }
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load your posts</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">You haven't created any P2P posts yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{post.title}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">{post.location}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={post.status === 'active' ? 'default' : 'secondary'}>
                  {post.status}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(post.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600 line-clamp-2">{post.description}</p>
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
              <span className="text-xs text-gray-500">
                {new Date(post.created_at).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
