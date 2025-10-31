import React, { useState } from 'react';
import { X, Loader2, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import config from '../../config';

const PublishActionModal = ({ listing, isOpen, onClose, onPublish }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const isPublished = listing?.status === 'published';
  const actionText = isPublished ? 'Unpublish' : 'Publish';
  const actionDescription = isPublished
    ? 'This listing will no longer be visible to other users.'
    : 'This listing will be visible to all users on the platform.';

  const handlePublish = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      const newStatus = isPublished ? 'draft' : 'published';

      const response = await axios.patch(
        `${config.API_BASE_URL}/api/listings/${listing.id}/`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Call parent callback with updated listing
      onPublish(response.data);
      onClose();
    } catch (err) {
      console.error('Error updating listing status:', err);
      setError(err.response?.data?.error || 'Failed to update listing status');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">
              {actionText} Listing
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Icon & Status */}
            <div className="flex items-center justify-center mb-6">
              <div className={`
                p-4 rounded-full
                ${isPublished ? 'bg-gray-100' : 'bg-green-100'}
              `}>
                {isPublished ? (
                  <EyeOff className="w-8 h-8 text-gray-600" />
                ) : (
                  <Eye className="w-8 h-8 text-green-600" />
                )}
              </div>
            </div>

            {/* Current Status */}
            <div className="text-center mb-6">
              <p className="text-gray-600 text-sm mb-2">Current status:</p>
              <p className="text-lg font-semibold text-gray-800 mb-4">
                {isPublished ? 'Published' : 'Draft'}
              </p>
              <p className="text-gray-600 text-sm">
                {actionDescription}
              </p>
            </div>

            {/* Listing Title */}
            <div className="p-4 bg-gray-50 rounded-lg mb-6">
              <p className="text-xs font-medium text-gray-600 mb-1">Listing Title</p>
              <p className="font-medium text-gray-800">{listing?.title}</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handlePublish}
              className={`
                flex items-center gap-2 px-6 py-2 rounded-lg text-white
                transition-colors font-medium disabled:opacity-50
                ${isPublished
                  ? 'bg-gray-600 hover:bg-gray-700'
                  : 'bg-green-600 hover:bg-green-700'
                }
              `}
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Updating...' : actionText}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PublishActionModal;
