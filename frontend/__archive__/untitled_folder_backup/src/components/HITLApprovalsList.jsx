import React, { useState } from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import HITLApprovalModal from './HITLApprovalModal';
import useHITLGate from '../hooks/useHITLGate';

/**
 * HITLApprovalsList Component
 * 
 * Displays list of pending HITL approvals for business users.
 * Features:
 * - 10-second polling interval
 * - Modal for single approval at a time
 * - Manual refresh button
 * - Loading and error states
 * - Embedded in Seller Inbox
 * 
 * Props:
 * - isAuthenticated: boolean
 * - userType: string - User type to check access control
 */
export const HITLApprovalsList = ({ isAuthenticated, userType }) => {
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    pendingApprovals,
    pendingCount,
    isLoading,
    isSubmitting,
    error,
    approveBroadcast,
    rejectBroadcast,
    refreshPending,
  } = useHITLGate(isAuthenticated);

  // Access control: only business users can see this
  if (userType !== 'business') {
    return null;
  }

  const handleOpenApproval = (approval) => {
    setSelectedApproval(approval);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedApproval(null);
  };

  // Empty state
  if (pendingCount === 0 && !isLoading) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200 text-center">
        <div className="text-5xl mb-4">✨</div>
        <h3 className="text-xl font-bold text-green-900 mb-2">All Caught Up!</h3>
        <p className="text-green-700">No pending approvals. New RFQs will appear here.</p>
      </div>
    );
  }

  // Loading state
  if (isLoading && pendingCount === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading pending approvals...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900">Error Loading Approvals</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <button
              onClick={refreshPending}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header with Count Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">Pending Approvals</h2>
            {pendingCount > 0 && (
              <span className="inline-flex items-center justify-center bg-red-600 text-white rounded-full w-7 h-7 text-sm font-bold">
                {pendingCount}
              </span>
            )}
          </div>
          <button
            onClick={refreshPending}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh approvals"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Approvals List */}
        <div className="grid gap-3">
          {pendingApprovals.map((approval) => (
            <div
              key={approval.id}
              onClick={() => handleOpenApproval(approval)}
              className="bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer hover:bg-blue-50/30"
            >
              {/* Approval Card Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {approval.rfd_summary.substring(0, 50)}
                    {approval.rfd_summary.length > 50 ? '...' : ''}
                  </h3>
                  <p className="text-sm text-gray-600">
                    📍 {approval.location} • 👤 {approval.contact_info}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                    {approval.medium}
                  </span>
                </div>
              </div>

              {/* Approval Card Details */}
              <div className="flex items-center justify-between text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                <div className="flex gap-4">
                  <div>
                    <p className="text-gray-600 font-medium">🎯 Sellers</p>
                    <p className="font-semibold">{approval.target_seller_count}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">⏰ Created</p>
                    <p className="font-semibold">
                      {new Date(approval.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenApproval(approval);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-cyan-700 transition-all"
                  >
                    Review
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* HITL Approval Modal */}
      <HITLApprovalModal
        approval={selectedApproval}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onApprove={approveBroadcast}
        onReject={rejectBroadcast}
        isSubmitting={isSubmitting}
      />
    </>
  );
};

export default HITLApprovalsList;

