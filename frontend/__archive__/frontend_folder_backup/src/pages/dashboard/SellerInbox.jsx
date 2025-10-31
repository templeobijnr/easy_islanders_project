import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import HITLApprovalsList from '../../components/HITLApprovalsList';

const SellerInbox = () => {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState('approvals'); // 'approvals' | 'inbox'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load broadcast inbox items (RFQs that have already been sent)
  React.useEffect(() => {
    let mounted = true;
    async function load() {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        const resp = await fetch('/api/agent/seller/inbox/', {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (!resp.ok) {
          throw new Error('Failed to load inbox');
        }
        const data = await resp.json();
        if (mounted) {
          setItems(data.items || []);
        }
      } catch (e) {
        if (mounted) setError(e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-gray-700">Please log in to view your seller inbox.</p>
        </div>
      </div>
    );
  }

  // Only show for business users
  if (user?.user_type !== 'business') {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-gray-700">This dashboard is for business users only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Seller Dashboard</h1>
        <p className="text-gray-600">Manage RFQ approvals and view broadcast results</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'approvals'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          ⏳ Pending Approvals
        </button>
        <button
          onClick={() => setActiveTab('inbox')}
          className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'inbox'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          📬 Broadcast Inbox
        </button>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Approvals Tab */}
        {activeTab === 'approvals' && (
          <div>
            <HITLApprovalsList
              isAuthenticated={isAuthenticated}
              userType={user?.user_type}
            />
          </div>
        )}

        {/* Inbox Tab */}
        {activeTab === 'inbox' && (
          <div>
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading broadcast results...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <p className="text-red-900 font-semibold">Error</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            )}

            {!loading && !error && items.length === 0 && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border border-gray-200 text-center">
                <div className="text-5xl mb-4">📭</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Broadcasts Yet</h3>
                <p className="text-gray-600">RFQs will appear here after they are approved and broadcast to sellers.</p>
              </div>
            )}

            {!loading && !error && items.length > 0 && (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.broadcast_id}
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          RFQ #{item.request_id}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.description || 'Request for Quote'}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          item.status === 'sent'
                            ? 'bg-green-100 text-green-800'
                            : item.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {item.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                      <div className="flex gap-4">
                        <div>
                          <p className="text-gray-600 font-medium">Medium</p>
                          <p className="font-semibold">{item.medium?.toUpperCase() || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 font-medium">Sent</p>
                          <p className="font-semibold">
                            {item.sent_at
                              ? new Date(item.sent_at).toLocaleDateString()
                              : 'Queued'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-xs text-gray-600">
                        ID: {item.broadcast_id?.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerInbox;
