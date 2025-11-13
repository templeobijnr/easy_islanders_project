// P2P Consumer Hooks - Data fetching for P2P marketplace

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Types
export interface P2PPost {
  id: string;
  title: string;
  description: string;
  price: number;
  status: 'active' | 'inactive' | 'completed' | 'cancelled';
  exchange_type: string;
  condition: string;
  created_at: string;
  image_url?: string;
  location: string;
  exchanges_count: number;
}

export interface P2PProposal {
  id: string;
  post_id: string;
  post_title: string;
  proposer_name: string;
  proposer_email: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  message: string;
  proposed_exchange: string;
  created_at: string;
}

export interface BrowsePost extends P2PPost {
  seller_name: string;
  active_exchanges?: number;
}

// Hooks
export const useMyP2PPosts = () => {
  return useQuery({
    queryKey: ['p2p', 'my-posts'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/p2p/my-posts/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch posts');
      return response.json() as Promise<P2PPost[]>;
    },
  });
};

export const useBrowseP2PPosts = (filters?: {
  location?: string;
  exchange_type?: string;
  condition?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (filters?.location) queryParams.append('location', filters.location);
  if (filters?.exchange_type) queryParams.append('exchange_type', filters.exchange_type);
  if (filters?.condition) queryParams.append('condition', filters.condition);

  return useQuery({
    queryKey: ['p2p', 'browse', filters],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/p2p/browse/?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch posts');
      return response.json() as Promise<BrowsePost[]>;
    },
  });
};

export const useP2PPostDetail = (postId: string) => {
  return useQuery({
    queryKey: ['p2p', 'post', postId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/p2p/posts/${postId}/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch post');
      return response.json() as Promise<P2PPost>;
    },
    enabled: !!postId,
  });
};

export const useCreateP2PPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<P2PPost>) => {
      const response = await fetch(`${API_BASE_URL}/p2p/posts/create/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create post');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['p2p', 'my-posts'] });
    },
  });
};

export const useUpdateP2PPost = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<P2PPost>) => {
      const response = await fetch(`${API_BASE_URL}/p2p/posts/${postId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update post');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['p2p', 'my-posts'] });
      queryClient.invalidateQueries({ queryKey: ['p2p', 'post', postId] });
    },
  });
};

export const useDeleteP2PPost = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE_URL}/p2p/posts/${postId}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete post');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['p2p', 'my-posts'] });
    },
  });
};

export const useProposeExchange = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      contact_name: string;
      contact_email: string;
      contact_phone: string;
      message: string;
      proposed_exchange: string;
    }) => {
      const response = await fetch(
        `${API_BASE_URL}/p2p/posts/${postId}/propose-exchange/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) throw new Error('Failed to propose exchange');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['p2p', 'browse'] });
    },
  });
};

export const useMyExchangeProposals = () => {
  return useQuery({
    queryKey: ['p2p', 'my-proposals'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/p2p/my-proposals/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch proposals');
      return response.json() as Promise<P2PProposal[]>;
    },
  });
};

export const useRespondToProposal = (proposalId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (action: 'accept' | 'reject') => {
      const response = await fetch(
        `${API_BASE_URL}/p2p/proposals/${proposalId}/respond/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action }),
        }
      );
      if (!response.ok) throw new Error('Failed to respond to proposal');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['p2p', 'my-proposals'] });
    },
  });
};
