import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import config from '../config';

/**
 * useHITLGate Hook
 * 
 * Manages HITL (Human-in-the-Loop) approval gate:
 * - Polls /api/broadcasts/pending/ every 10 seconds
 * - Handles approve/reject actions
 * - Auto-refreshes after submission
 * - Tracks loading and error states
 * 
 * Usage:
 * const { 
 *   pendingApprovals, 
 *   isLoading, 
 *   error,
 *   approveBroadcast,
 *   rejectBroadcast,
 *   refreshPending
 * } = useHITLGate(isAuthenticated);
 */
export const useHITLGate = (isAuthenticated) => {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Fetch pending approvals from backend
   */
  const refreshPending = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    try {
      setError(null);
      const response = await axios.get(
        `${config.API_BASE_URL}/api/broadcasts/pending/`,
        { withCredentials: true }
      );

      setPendingApprovals(response.data.approvals || []);
      console.log(`📋 Fetched ${response.data.pending_count} pending approvals`);
    } catch (err) {
      console.error('Error fetching pending approvals:', err);
      setError('Failed to fetch pending approvals');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * Approve a broadcast
   */
  const approveBroadcast = useCallback(
    async (approvalId, notes = '') => {
      setIsSubmitting(true);
      setError(null);

      try {
        // const response = await axios.post( // Removed - response not used
        await axios.post(
          `${config.API_BASE_URL}/api/broadcasts/approve/`,
          {
            approval_id: approvalId,
            notes,
          },
          { withCredentials: true }
        );

        console.log('✅ Broadcast approved:', approvalId);

        // Auto-refresh after successful approval
        await refreshPending();

        return { success: true, message: 'Broadcast approved and queued for delivery' };
      } catch (err) {
        const errorMsg =
          err.response?.data?.error || 'Failed to approve broadcast';
        console.error('Error approving broadcast:', errorMsg);
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsSubmitting(false);
      }
    },
    [refreshPending]
  );

  /**
   * Reject a broadcast
   */
  const rejectBroadcast = useCallback(
    async (approvalId, reason = '') => {
      if (!reason.trim()) {
        setError('Rejection reason is required');
        return { success: false, error: 'Rejection reason is required' };
      }

      setIsSubmitting(true);
      setError(null);

      try {
        // const response = await axios.post( // Removed - response not used
        await axios.post(
          `${config.API_BASE_URL}/api/broadcasts/reject/`,
          {
            approval_id: approvalId,
            reason,
          },
          { withCredentials: true }
        );

        console.log('❌ Broadcast rejected:', approvalId);

        // Auto-refresh after successful rejection
        await refreshPending();

        return { success: true, message: 'Broadcast rejected' };
      } catch (err) {
        const errorMsg =
          err.response?.data?.error || 'Failed to reject broadcast';
        console.error('Error rejecting broadcast:', errorMsg);
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsSubmitting(false);
      }
    },
    [refreshPending]
  );

  /**
   * Initialize polling on mount
   * Poll every 10 seconds for new pending approvals
   */
  useEffect(() => {
    if (!isAuthenticated) {
      setPendingApprovals([]);
      return;
    }

    // Initial fetch
    setIsLoading(true);
    refreshPending();

    // Poll every 10 seconds
    const pollInterval = setInterval(() => {
      refreshPending();
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [isAuthenticated, refreshPending]);

  return {
    pendingApprovals,
    pendingCount: pendingApprovals.length,
    isLoading,
    isSubmitting,
    error,
    refreshPending,
    approveBroadcast,
    rejectBroadcast,
  };
};

export default useHITLGate;

