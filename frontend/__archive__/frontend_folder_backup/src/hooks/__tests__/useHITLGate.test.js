import { renderHook, act, waitFor } from '@testing-library/react';
import axios from 'axios';
import useHITLGate from '../useHITLGate';

jest.mock('axios');

describe('useHITLGate Hook', () => {
  const mockApprovals = [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      target_seller_count: 42,
      medium: 'whatsapp',
      created_at: '2025-10-22T10:00:00Z',
      rfd_summary: '2BR apartment',
      contact_info: 'user@example.com',
      location: 'Kyrenia',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    test('should initialize with empty approvals when not authenticated', () => {
      const { result } = renderHook(() => useHITLGate(false));

      expect(result.current.pendingApprovals).toEqual([]);
      expect(result.current.pendingCount).toBe(0);
      expect(axios.get).not.toHaveBeenCalled();
    });
  });

  describe('Fetching Approvals', () => {
    test('should call pending endpoint when authenticated', async () => {
      axios.get.mockResolvedValueOnce({
        data: { approvals: mockApprovals, pending_count: 1 },
      });

      renderHook(() => useHITLGate(true));

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining('/api/broadcasts/pending/'),
          expect.objectContaining({ withCredentials: true })
        );
      });
    });

    test('should set approvals after successful fetch', async () => {
      axios.get.mockResolvedValueOnce({
        data: { approvals: mockApprovals, pending_count: 1 },
      });

      const { result } = renderHook(() => useHITLGate(true));

      await waitFor(() => {
        expect(result.current.pendingApprovals).toEqual(mockApprovals);
        expect(result.current.pendingCount).toBe(1);
      });
    });

    test('should handle fetch error', async () => {
      axios.get.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useHITLGate(true));

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to fetch pending approvals');
      });
    });
  });

  describe('Approve Broadcast', () => {
    test('should call approve endpoint with correct data', async () => {
      axios.get.mockResolvedValueOnce({
        data: { approvals: [], pending_count: 0 },
      });
      axios.post.mockResolvedValueOnce({
        data: { status: 'success' },
      });

      const { result } = renderHook(() => useHITLGate(true));

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });

      const response = await act(async () => {
        return await result.current.approveBroadcast('approval-id', 'Test notes');
      });

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/broadcasts/approve/'),
        {
          approval_id: 'approval-id',
          notes: 'Test notes',
        },
        expect.objectContaining({ withCredentials: true })
      );

      expect(response.success).toBe(true);
    });

    test('should handle approval error', async () => {
      axios.get.mockResolvedValueOnce({
        data: { approvals: [], pending_count: 0 },
      });
      axios.post.mockRejectedValueOnce({
        response: { data: { error: 'Approval failed' } },
      });

      const { result } = renderHook(() => useHITLGate(true));

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });

      const response = await act(async () => {
        return await result.current.approveBroadcast('approval-id', 'Notes');
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Approval failed');
    });
  });

  describe('Reject Broadcast', () => {
    test('should call reject endpoint with correct data', async () => {
      axios.get.mockResolvedValueOnce({
        data: { approvals: [], pending_count: 0 },
      });
      axios.post.mockResolvedValueOnce({
        data: { status: 'success' },
      });

      const { result } = renderHook(() => useHITLGate(true));

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });

      const response = await act(async () => {
        return await result.current.rejectBroadcast('approval-id', 'Invalid RFQ');
      });

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/broadcasts/reject/'),
        {
          approval_id: 'approval-id',
          reason: 'Invalid RFQ',
        },
        expect.objectContaining({ withCredentials: true })
      );

      expect(response.success).toBe(true);
    });

    test('should reject empty reason', async () => {
      axios.get.mockResolvedValueOnce({
        data: { approvals: [], pending_count: 0 },
      });

      const { result } = renderHook(() => useHITLGate(true));

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });

      const response = await act(async () => {
        return await result.current.rejectBroadcast('approval-id', '   ');
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Rejection reason is required');
      expect(axios.post).not.toHaveBeenCalled();
    });

    test('should handle rejection error', async () => {
      axios.get.mockResolvedValueOnce({
        data: { approvals: [], pending_count: 0 },
      });
      axios.post.mockRejectedValueOnce({
        response: { data: { error: 'Rejection failed' } },
      });

      const { result } = renderHook(() => useHITLGate(true));

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });

      const response = await act(async () => {
        return await result.current.rejectBroadcast('approval-id', 'Invalid');
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Rejection failed');
    });
  });

  describe('Manual Refresh', () => {
    test('should provide manual refresh function', async () => {
      axios.get.mockResolvedValue({
        data: { approvals: mockApprovals, pending_count: 1 },
      });

      const { result } = renderHook(() => useHITLGate(true));

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledTimes(1);
      });

      // Manual refresh
      await act(async () => {
        await result.current.refreshPending();
      });

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledTimes(2);
      });
    });

    test('should clear error on successful refresh', async () => {
      // First call fails
      axios.get.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useHITLGate(true));

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to fetch pending approvals');
      });

      // Second call succeeds
      axios.get.mockResolvedValueOnce({
        data: { approvals: mockApprovals, pending_count: 1 },
      });

      await act(async () => {
        await result.current.refreshPending();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.pendingApprovals).toEqual(mockApprovals);
      });
    });
  });

  describe('Multiple Approvals', () => {
    test('should handle multiple approvals', async () => {
      const multipleApprovals = [
        ...mockApprovals,
        {
          id: 'second-id',
          target_seller_count: 15,
          medium: 'email',
          created_at: '2025-10-22T09:00:00Z',
          rfd_summary: 'Studio apartment',
          contact_info: 'another@example.com',
          location: 'Nicosia',
        },
      ];

      axios.get.mockResolvedValue({
        data: { approvals: multipleApprovals, pending_count: 2 },
      });

      const { result } = renderHook(() => useHITLGate(true));

      await waitFor(() => {
        expect(result.current.pendingCount).toBe(2);
        expect(result.current.pendingApprovals).toHaveLength(2);
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty response', async () => {
      axios.get.mockResolvedValueOnce({
        data: { approvals: null, pending_count: 0 },
      });

      const { result } = renderHook(() => useHITLGate(true));

      await waitFor(() => {
        expect(result.current.pendingApprovals).toEqual([]);
      });
    });

    test('should handle missing pending_count', async () => {
      axios.get.mockResolvedValueOnce({
        data: { approvals: mockApprovals },
      });

      const { result } = renderHook(() => useHITLGate(true));

      await waitFor(() => {
        expect(result.current.pendingApprovals).toEqual(mockApprovals);
        expect(result.current.pendingCount).toBe(1);
      });
    });
  });
});

import useHITLGate from '../useHITLGate';

jest.mock('axios');

describe('useHITLGate Hook', () => {
  const mockApprovals = [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      target_seller_count: 42,
      medium: 'whatsapp',
      created_at: '2025-10-22T10:00:00Z',
      rfd_summary: '2BR apartment',
      contact_info: 'user@example.com',
      location: 'Kyrenia',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    test('should initialize with empty approvals when not authenticated', () => {
      const { result } = renderHook(() => useHITLGate(false));

      expect(result.current.pendingApprovals).toEqual([]);
      expect(result.current.pendingCount).toBe(0);
      expect(axios.get).not.toHaveBeenCalled();
    });
  });

  describe('Fetching Approvals', () => {
    test('should call pending endpoint when authenticated', async () => {
      axios.get.mockResolvedValueOnce({
        data: { approvals: mockApprovals, pending_count: 1 },
      });

      renderHook(() => useHITLGate(true));

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining('/api/broadcasts/pending/'),
          expect.objectContaining({ withCredentials: true })
        );
      });
    });

    test('should set approvals after successful fetch', async () => {
      axios.get.mockResolvedValueOnce({
        data: { approvals: mockApprovals, pending_count: 1 },
      });

      const { result } = renderHook(() => useHITLGate(true));

      await waitFor(() => {
        expect(result.current.pendingApprovals).toEqual(mockApprovals);
        expect(result.current.pendingCount).toBe(1);
      });
    });

    test('should handle fetch error', async () => {
      axios.get.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useHITLGate(true));

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to fetch pending approvals');
      });
    });
  });

  describe('Approve Broadcast', () => {
    test('should call approve endpoint with correct data', async () => {
      axios.get.mockResolvedValueOnce({
        data: { approvals: [], pending_count: 0 },
      });
      axios.post.mockResolvedValueOnce({
        data: { status: 'success' },
      });

      const { result } = renderHook(() => useHITLGate(true));

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });

      const response = await act(async () => {
        return await result.current.approveBroadcast('approval-id', 'Test notes');
      });

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/broadcasts/approve/'),
        {
          approval_id: 'approval-id',
          notes: 'Test notes',
        },
        expect.objectContaining({ withCredentials: true })
      );

      expect(response.success).toBe(true);
    });

    test('should handle approval error', async () => {
      axios.get.mockResolvedValueOnce({
        data: { approvals: [], pending_count: 0 },
      });
      axios.post.mockRejectedValueOnce({
        response: { data: { error: 'Approval failed' } },
      });

      const { result } = renderHook(() => useHITLGate(true));

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });

      const response = await act(async () => {
        return await result.current.approveBroadcast('approval-id', 'Notes');
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Approval failed');
    });
  });

  describe('Reject Broadcast', () => {
    test('should call reject endpoint with correct data', async () => {
      axios.get.mockResolvedValueOnce({
        data: { approvals: [], pending_count: 0 },
      });
      axios.post.mockResolvedValueOnce({
        data: { status: 'success' },
      });

      const { result } = renderHook(() => useHITLGate(true));

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });

      const response = await act(async () => {
        return await result.current.rejectBroadcast('approval-id', 'Invalid RFQ');
      });

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/broadcasts/reject/'),
        {
          approval_id: 'approval-id',
          reason: 'Invalid RFQ',
        },
        expect.objectContaining({ withCredentials: true })
      );

      expect(response.success).toBe(true);
    });

    test('should reject empty reason', async () => {
      axios.get.mockResolvedValueOnce({
        data: { approvals: [], pending_count: 0 },
      });

      const { result } = renderHook(() => useHITLGate(true));

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });

      const response = await act(async () => {
        return await result.current.rejectBroadcast('approval-id', '   ');
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Rejection reason is required');
      expect(axios.post).not.toHaveBeenCalled();
    });

    test('should handle rejection error', async () => {
      axios.get.mockResolvedValueOnce({
        data: { approvals: [], pending_count: 0 },
      });
      axios.post.mockRejectedValueOnce({
        response: { data: { error: 'Rejection failed' } },
      });

      const { result } = renderHook(() => useHITLGate(true));

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });

      const response = await act(async () => {
        return await result.current.rejectBroadcast('approval-id', 'Invalid');
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Rejection failed');
    });
  });

  describe('Manual Refresh', () => {
    test('should provide manual refresh function', async () => {
      axios.get.mockResolvedValue({
        data: { approvals: mockApprovals, pending_count: 1 },
      });

      const { result } = renderHook(() => useHITLGate(true));

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledTimes(1);
      });

      // Manual refresh
      await act(async () => {
        await result.current.refreshPending();
      });

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledTimes(2);
      });
    });

    test('should clear error on successful refresh', async () => {
      // First call fails
      axios.get.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useHITLGate(true));

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to fetch pending approvals');
      });

      // Second call succeeds
      axios.get.mockResolvedValueOnce({
        data: { approvals: mockApprovals, pending_count: 1 },
      });

      await act(async () => {
        await result.current.refreshPending();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.pendingApprovals).toEqual(mockApprovals);
      });
    });
  });

  describe('Multiple Approvals', () => {
    test('should handle multiple approvals', async () => {
      const multipleApprovals = [
        ...mockApprovals,
        {
          id: 'second-id',
          target_seller_count: 15,
          medium: 'email',
          created_at: '2025-10-22T09:00:00Z',
          rfd_summary: 'Studio apartment',
          contact_info: 'another@example.com',
          location: 'Nicosia',
        },
      ];

      axios.get.mockResolvedValue({
        data: { approvals: multipleApprovals, pending_count: 2 },
      });

      const { result } = renderHook(() => useHITLGate(true));

      await waitFor(() => {
        expect(result.current.pendingCount).toBe(2);
        expect(result.current.pendingApprovals).toHaveLength(2);
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty response', async () => {
      axios.get.mockResolvedValueOnce({
        data: { approvals: null, pending_count: 0 },
      });

      const { result } = renderHook(() => useHITLGate(true));

      await waitFor(() => {
        expect(result.current.pendingApprovals).toEqual([]);
      });
    });

    test('should handle missing pending_count', async () => {
      axios.get.mockResolvedValueOnce({
        data: { approvals: mockApprovals },
      });

      const { result } = renderHook(() => useHITLGate(true));

      await waitFor(() => {
        expect(result.current.pendingApprovals).toEqual(mockApprovals);
        expect(result.current.pendingCount).toBe(1);
      });
    });
  });
});
