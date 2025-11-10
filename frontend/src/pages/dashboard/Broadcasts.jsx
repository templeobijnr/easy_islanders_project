import React, { useState } from 'react';
import { Plus, Send, Eye, MessageCircle, Calendar, Trash2 } from 'lucide-react';
import { useBroadcasts } from '../../hooks/useSellerDashboard';

const Broadcasts = () => {
  const { broadcasts, loading, error, createBroadcast, publishBroadcast, deleteBroadcast } = useBroadcasts();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    category: '',
    status: 'draft',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await createBroadcast(formData);
      setShowCreateModal(false);
      setFormData({ title: '', message: '', category: '', status: 'draft' });
    } catch (err) {
      console.error('Failed to create broadcast:', err);
      alert('Failed to create broadcast. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (id) => {
    if (!window.confirm('Publish this broadcast? It will be visible to all users.')) return;
    try {
      await publishBroadcast(id);
    } catch (err) {
      alert('Failed to publish broadcast');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this broadcast? This action cannot be undone.')) return;
    try {
      await deleteBroadcast(id);
    } catch (err) {
      alert('Failed to delete broadcast');
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Broadcasts</h1>
          <p className="text-slate-600">Send promotional messages to potential customers</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-lime-600 text-white rounded-xl hover:bg-lime-700 transition-all duration-200 font-semibold text-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Create Broadcast</span>
        </button>
      </div>

      <div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-gray-600 text-sm font-medium">Total Broadcasts</p>
            <p className="text-4xl font-bold text-gray-800 mt-2">{broadcasts.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-gray-600 text-sm font-medium">Active</p>
            <p className="text-4xl font-bold text-green-600 mt-2">
              {broadcasts.filter((b) => b.status === 'active').length}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-gray-600 text-sm font-medium">Total Views</p>
            <p className="text-4xl font-bold text-blue-600 mt-2">
              {broadcasts.reduce((sum, b) => sum + (b.views_count || 0), 0)}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-gray-600 text-sm font-medium">Total Responses</p>
            <p className="text-4xl font-bold text-purple-600 mt-2">
              {broadcasts.reduce((sum, b) => sum + (b.response_count || 0), 0)}
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading broadcasts...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && broadcasts.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No broadcasts yet</h3>
            <p className="text-gray-600 mb-6">Create your first broadcast to reach potential customers</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-lime-600 text-white rounded-xl hover:bg-lime-700 transition-all duration-200 font-semibold"
            >
              <Plus className="w-5 h-5" />
              Create Broadcast
            </button>
          </div>
        )}

        {/* Broadcasts List */}
        {!loading && broadcasts.length > 0 && (
          <div className="space-y-4">
            {broadcasts.map((broadcast) => (
              <div
                key={broadcast.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">{broadcast.title}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          broadcast.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : broadcast.status === 'draft'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {broadcast.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">{broadcast.message}</p>

                    {/* Stats */}
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{broadcast.views_count || 0} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>{broadcast.response_count || 0} responses</span>
                      </div>
                      {broadcast.published_at && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(broadcast.published_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {broadcast.status === 'draft' && (
                      <button
                        onClick={() => handlePublish(broadcast.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        <Send className="w-4 h-4" />
                        Publish
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(broadcast.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Create New Broadcast</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-600"
                  placeholder="Enter broadcast title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-600"
                  placeholder="Enter your broadcast message"
                  rows={6}
                  required
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.status === 'active'}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.checked ? 'active' : 'draft' })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Publish immediately</span>
                </label>
              </div>
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-lime-600 text-white rounded-xl hover:bg-lime-700 transition-colors font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Broadcast'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Broadcasts;
