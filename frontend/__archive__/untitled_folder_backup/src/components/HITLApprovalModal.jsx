import React, { useState } from 'react';
import { X, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Toast } from './common/Toast';

/**
 * HITLApprovalModal Component
 * 
 * Displays a single pending broadcast approval for business user review.
 * Features:
 * - RFQ details display (seller count, medium, location, contact info)
 * - Approval with optional notes
 * - Rejection with required reason
 * - Loading states and form validation
 * - Toast notifications for feedback
 * - Mobile-first responsive design
 * 
 * Props:
 * - approval: {id, demand_lead_id, target_seller_count, medium, created_at, rfd_summary, contact_info, location}
 * - isOpen: boolean
 * - onClose: callback when modal closes
 * - onApprove: (approvalId, notes) => Promise
 * - onReject: (approvalId, reason) => Promise
 * - isSubmitting: boolean
 */
export const HITLApprovalModal = ({ approval, isOpen, onClose, onApprove, onReject, isSubmitting }) => {
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success'); // 'success' | 'error'
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  if (!isOpen || !approval) {
    return null;
  }

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const result = await onApprove(approval.id, approvalNotes);
      if (result.success) {
        showToast(result.message, 'success');
        // Modal closes and list auto-refreshes via hook
        setTimeout(() => onClose(), 500);
      } else {
        showToast(result.error || 'Approval failed', 'error');
      }
    } catch (error) {
      showToast('Unexpected error during approval', 'error');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    // Validate reason is provided
    if (!rejectionReason.trim()) {
      setRejectionError('Rejection reason is required');
      return;
    }

    setRejectionError(null);
    setIsRejecting(true);
    try {
      const result = await onReject(approval.id, rejectionReason);
      if (result.success) {
        showToast(result.message, 'success');
        // Modal closes and list auto-refreshes via hook
        setTimeout(() => onClose(), 500);
      } else {
        showToast(result.error || 'Rejection failed', 'error');
      }
    } catch (error) {
      showToast('Unexpected error during rejection', 'error');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setApprovalNotes('');
    setRejectionReason('');
    setRejectionError(null);
    onClose();
  };

  return (
    <>
      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Container - Mobile: full-screen, Desktop: centered card */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 flex items-center justify-between rounded-t-2xl">
            <div>
              <h2 className="text-2xl font-bold">Broadcast Approval</h2>
              <p className="text-blue-100 text-sm mt-1">Review RFQ details before broadcasting</p>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* RFQ Details Card */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">📋 Request for Quote (RFQ)</h3>

              {/* Summary */}
              <p className="text-gray-800 font-medium mb-4">{approval.rfd_summary}</p>

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 font-medium">📍 Location</p>
                  <p className="text-gray-900">{approval.location || 'Not specified'}</p>
                </div>

                <div>
                  <p className="text-gray-600 font-medium">👤 Contact</p>
                  <p className="text-gray-900 truncate">{approval.contact_info}</p>
                </div>

                <div>
                  <p className="text-gray-600 font-medium">📱 Medium</p>
                  <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                    {approval.medium.toUpperCase()}
                  </span>
                </div>

                <div>
                  <p className="text-gray-600 font-medium">🎯 Target Sellers</p>
                  <p className="text-gray-900 font-semibold">{approval.target_seller_count}</p>
                </div>

                <div>
                  <p className="text-gray-600 font-medium">⏰ Created</p>
                  <p className="text-gray-900">
                    {new Date(approval.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <p className="text-gray-600 font-medium">🔑 ID</p>
                  <p className="text-gray-900 text-xs font-mono">{approval.id.slice(0, 8)}...</p>
                </div>
              </div>
            </div>

            {/* Approval Form */}
            <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
              <div className="flex items-center mb-4">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="font-semibold text-green-900">Approve Broadcast</h3>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Optional Notes (for audit trail)
              </label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="e.g., High priority lead, verified contact information..."
                disabled={isSubmitting || isApproving}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 resize-none h-20"
              />

              <button
                onClick={handleApprove}
                disabled={isSubmitting || isApproving}
                className="mt-3 w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Approve & Broadcast
                  </>
                )}
              </button>
            </div>

            {/* Rejection Form */}
            <div className="bg-red-50 rounded-xl p-4 border-2 border-red-200">
              <div className="flex items-center mb-4">
                <XCircle className="w-5 h-5 text-red-600 mr-2" />
                <h3 className="font-semibold text-red-900">Reject Broadcast</h3>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason <span className="text-red-600">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  setRejectionError(null);
                }}
                placeholder="e.g., Insufficient detail, Unverified contact, Policy violation..."
                disabled={isSubmitting || isRejecting}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 resize-none h-20 ${
                  rejectionError ? 'border-red-500' : 'border-gray-300'
                }`}
              />

              {rejectionError && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <span>⚠️</span>
                  {rejectionError}
                </p>
              )}

              <button
                onClick={handleReject}
                disabled={isSubmitting || isRejecting}
                className="mt-3 w-full bg-gradient-to-r from-red-600 to-rose-600 text-white py-3 rounded-lg font-semibold hover:from-red-700 hover:to-rose-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRejecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5" />
                    Reject Broadcast
                  </>
                )}
              </button>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
              <p className="font-semibold mb-1">ℹ️ About This Approval</p>
              <ul className="space-y-1 text-blue-800 list-disc list-inside">
                <li>This RFQ will be broadcast to {approval.target_seller_count} sellers if approved</li>
                <li>Your decision is permanently recorded for audit purposes</li>
                <li>Rejections require a reason for compliance tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
        />
      )}
    </>
  );
};

export default HITLApprovalModal;

