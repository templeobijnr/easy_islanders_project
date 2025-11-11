import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Save, Loader2, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import config from '../config';

const Profile = () => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${config.API_BASE_URL}/api/auth/profile/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfileData(response.data);
      setFormData({
        username: response.data.username || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
      });
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setMessage({ type: '', text: '' }); // Clear message on input change
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${config.API_BASE_URL}/api/auth/profile/`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      await fetchProfile(); // Refresh profile data
    } catch (err) {
      console.error('Failed to update profile:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to update profile'
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-lg border border-slate-200">
          <AlertCircle className="w-16 h-16 text-lime-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-ink-700 mb-2">Authentication Required</h1>
          <p className="text-ink-500">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-lime-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-ink-700">Profile</h1>
          <p className="text-ink-500 mt-1">Manage your account information</p>
        </motion.div>

        {/* Success/Error Message */}
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <p className="text-sm font-medium">{message.text}</p>
          </motion.div>
        )}

        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mb-6"
        >
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl bg-lime-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {getInitials(profileData?.username)}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-ink-700">{profileData?.username}</h2>
              <p className="text-ink-500 flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4" />
                {profileData?.email}
              </p>
              {profileData?.user_type && (
                <div className="mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    profileData.user_type === 'business'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-lime-100 text-lime-700'
                  }`}>
                    {profileData.user_type === 'business' ? '💼 Business' : '👤 Consumer'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Edit Profile Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8"
        >
          <h3 className="text-xl font-bold text-ink-700 mb-6">Personal Information</h3>

          <div className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="w-full bg-gray-50 border border-slate-200 rounded-xl px-4 py-3 text-ink-700 focus:outline-none focus:ring-2 focus:ring-lime-600 focus:border-transparent transition-all"
                placeholder="Enter your username"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full bg-gray-50 border border-slate-200 rounded-xl px-4 py-3 text-ink-700 focus:outline-none focus:ring-2 focus:ring-lime-600 focus:border-transparent transition-all"
                placeholder="Enter your email"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full bg-gray-50 border border-slate-200 rounded-xl px-4 py-3 text-ink-700 focus:outline-none focus:ring-2 focus:ring-lime-600 focus:border-transparent transition-all"
                placeholder="Enter your phone number"
              />
            </div>

            {/* Save Button */}
            <motion.button
              onClick={handleSave}
              disabled={saving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-lime-600 text-white py-3 px-6 rounded-xl hover:bg-lime-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-colors shadow-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Business Profile (if applicable) */}
        {profileData?.business_profile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mt-6"
          >
            <h3 className="text-xl font-bold text-ink-700 mb-4">Business Information</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-slate-200">
                <span className="text-ink-500 text-sm">Business Name</span>
                <span className="text-ink-700 font-semibold">
                  {profileData.business_profile.business_name || 'Not set'}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-ink-500 text-sm">Verification Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  profileData.business_profile.is_verified_by_admin
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {profileData.business_profile.is_verified_by_admin ? '✓ Verified' : '⏳ Pending'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Profile;
