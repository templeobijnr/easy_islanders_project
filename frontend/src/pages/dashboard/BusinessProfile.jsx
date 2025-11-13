import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../shared/context/AuthContext';
import axios from 'axios';
import config from '../../config';

const BusinessProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Get profile from user context first
      if (user?.business_profile) {
        setProfile(user.business_profile);
      } else {
        // Fallback: fetch from API if available
        const response = await axios.get(
          `${config.API_BASE_URL}/api/auth/profile/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setProfile(response.data.business_profile);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Business Profile</h1>
        <p className="text-slate-600 mb-8">Manage your business information</p>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-lime-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Business Profile</h1>
        <p className="text-slate-600">Manage your business information</p>
      </div>

      <div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Verification Status */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 md:col-span-3">
            <div className="flex items-center gap-4">
              {profile?.is_verified_by_admin ? (
                <>
                  <CheckCircle className="w-12 h-12 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-gray-800">Verified Business</p>
                    <p className="text-sm text-gray-600">Your business has been verified by our team</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-12 h-12 text-yellow-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-gray-800">Pending Verification</p>
                    <p className="text-sm text-gray-600">Your business profile is under review</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Business Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 md:col-span-2">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Business Information</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Business Name</label>
                <p className="text-gray-800 font-medium">{profile?.business_name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Description</label>
                <p className="text-gray-800">{profile?.description || 'No description provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Website</label>
                <p className="text-gray-800">
                  {profile?.website ? (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-lime-600 hover:underline">
                      {profile.website}
                    </a>
                  ) : (
                    'No website provided'
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Contact Information</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Phone</label>
                <p className="text-gray-800 font-medium">{profile?.contact_phone || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Location</label>
                <p className="text-gray-800">{profile?.location || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 md:col-span-3">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Username</label>
                <p className="text-gray-800 font-medium">{user?.username || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Email</label>
                <p className="text-gray-800 font-medium">{user?.email || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Account Type</label>
                <p className="text-gray-800 font-medium capitalize">{user?.user_type || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Joined Date */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 md:col-span-3">
            <label className="block text-sm font-medium text-gray-600 mb-2">Joined</label>
            <p className="text-gray-800">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'N/A'}
            </p>
          </div>
        </div>

        {/* Future Edit Section */}
        <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
          <p className="text-gray-600">Profile editing features coming soon!</p>
        </div>
      </div>
    </div>
  );
};

export default BusinessProfile;
