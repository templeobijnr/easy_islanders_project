import React, { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import axios from 'axios';
import config from '../../config';

const DeleteConfirmModal = ({ listing, isOpen, onClose, onDelete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      await axios.delete(
        `${config.API_BASE_URL}/api/listings/${listing.id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Call parent callback
      onDelete(listing.id);
      onClose();
    } catch (err) {
      console.error('Error deleting listing:', err);
      setError(err.response?.data?.error || 'Failed to delete listing');
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
            <h2 className="text-2xl font-bold text-gray-800">Delete Listing</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Warning Icon & Message */}
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <p className="text-gray-800 font-semibold mb-2">
                  Are you sure you want to delete this listing?
                </p>
                <p className="text-gray-600 text-sm mb-4">
                  <strong>This action cannot be undone.</strong>
                </p>
                <p className="text-gray-700 font-medium">
                  Listing: <span className="text-gray-900">{listing?.title}</span>
                </p>
              </div>
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
              onClick={handleDelete}
              className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Deleting...' : 'Delete'}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeleteConfirmModal;
