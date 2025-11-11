import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Globe, DollarSign, Clock, Bell, Mail, Smartphone, Lock, Trash2,
  Save, Loader2, Check, AlertCircle, Shield, Eye, EyeOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import config from '../config';

const Settings = () => {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const [preferences, setPreferences] = useState({
    language: 'en',
    currency: 'EUR',
    timezone: 'UTC',
  });

  const [notifications, setNotifications] = useState({
    email_notifications: true,
    push_notifications: true,
    marketing_notifications: false,
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirmPassword: '',
  });

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'pl', name: 'Polski', flag: '🇵🇱' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  ];

  const currencies = ['EUR', 'USD', 'GBP', 'TRY'];
  const timezones = ['UTC', 'UTC+1', 'UTC+2', 'UTC+3', 'UTC+4'];

  // Fetch user preferences on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchPreferences();
    }
  }, [isAuthenticated]);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${config.API_BASE_URL}/api/auth/preferences/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPreferences({
        language: response.data.language || 'en',
        currency: response.data.currency || 'EUR',
        timezone: response.data.timezone || 'UTC',
      });

      setNotifications({
        email_notifications: response.data.email_notifications !== undefined ? response.data.email_notifications : true,
        push_notifications: response.data.push_notifications !== undefined ? response.data.push_notifications : true,
        marketing_notifications: response.data.marketing_notifications || false,
      });
    } catch (error) {
      console.error('Error fetching preferences:', error);
      showMessage('error', 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${config.API_BASE_URL}/api/auth/preferences/`,
        {
          ...preferences,
          ...notifications,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showMessage('success', 'Preferences saved successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      showMessage('error', error.response?.data?.error || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const toggleNotification = async (key) => {
    const newValue = !notifications[key];
    setNotifications(prev => ({ ...prev, [key]: newValue }));

    // Auto-save on toggle
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${config.API_BASE_URL}/api/auth/preferences/`,
        {
          [key]: newValue,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error updating notification:', error);
      // Revert on error
      setNotifications(prev => ({ ...prev, [key]: !newValue }));
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirmPassword) {
      showMessage('error', 'Passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 8) {
      showMessage('error', 'Password must be at least 8 characters');
      return;
    }

    if (!passwordData.current_password) {
      showMessage('error', 'Current password is required');
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${config.API_BASE_URL}/api/auth/change-password/`,
        {
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showMessage('success', 'Password changed successfully!');
      setPasswordData({ current_password: '', new_password: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (error) {
      console.error('Error changing password:', error);
      showMessage('error', error.response?.data?.error || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      showMessage('error', 'Password is required to delete account');
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${config.API_BASE_URL}/api/auth/delete-account/`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { password: deletePassword }
        }
      );

      showMessage('success', 'Account deleted successfully. Logging out...');

      // Clear auth and redirect to login after 2 seconds
      setTimeout(() => {
        localStorage.removeItem('token');
        window.location.href = '/';
      }, 2000);
    } catch (error) {
      console.error('Error deleting account:', error);
      showMessage('error', error.response?.data?.error || 'Failed to delete account');
      setSaving(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-lg border border-slate-200">
          <AlertCircle className="w-16 h-16 text-lime-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-ink-700 mb-2">Authentication Required</h1>
          <p className="text-ink-500">Please log in to access settings.</p>
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
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Success/Error Message */}
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{message.text}</span>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-ink-700 mb-2">Settings</h1>
          <p className="text-ink-500">Manage your preferences and account settings</p>
        </motion.div>

        {/* Preferences Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 mb-6"
        >
          <h2 className="text-xl font-bold text-ink-700 mb-6 flex items-center gap-2">
            <Globe className="w-6 h-6 text-lime-600" />
            Preferences
          </h2>

          <div className="space-y-6">
            {/* Language */}
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">Language</label>
              <select
                value={preferences.language}
                onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                className="w-full bg-gray-50 border border-slate-200 rounded-xl px-4 py-3 text-ink-700 focus:outline-none focus:ring-2 focus:ring-lime-600 focus:border-transparent transition-all"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">Currency</label>
              <select
                value={preferences.currency}
                onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                className="w-full bg-gray-50 border border-slate-200 rounded-xl px-4 py-3 text-ink-700 focus:outline-none focus:ring-2 focus:ring-lime-600 focus:border-transparent transition-all"
              >
                {currencies.map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </select>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">Timezone</label>
              <select
                value={preferences.timezone}
                onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                className="w-full bg-gray-50 border border-slate-200 rounded-xl px-4 py-3 text-ink-700 focus:outline-none focus:ring-2 focus:ring-lime-600 focus:border-transparent transition-all"
              >
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <motion.button
            onClick={handleSavePreferences}
            disabled={saving}
            whileHover={{ scale: saving ? 1 : 1.02 }}
            whileTap={{ scale: saving ? 1 : 0.98 }}
            className="mt-6 w-full bg-lime-600 text-white py-3 px-6 rounded-xl hover:bg-lime-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-colors shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Preferences
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Notifications Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 mb-6"
        >
          <h2 className="text-xl font-bold text-ink-700 mb-6 flex items-center gap-2">
            <Bell className="w-6 h-6 text-lime-600" />
            Notifications
          </h2>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-ink-600" />
                <div>
                  <p className="font-semibold text-ink-700">Email Notifications</p>
                  <p className="text-sm text-ink-500">Receive booking and message notifications via email</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifications.email_notifications}
                onChange={() => toggleNotification('email_notifications')}
                className="w-5 h-5 text-lime-600 rounded focus:ring-2 focus:ring-lime-600"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-ink-600" />
                <div>
                  <p className="font-semibold text-ink-700">Push Notifications</p>
                  <p className="text-sm text-ink-500">Receive real-time push notifications on your device</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifications.push_notifications}
                onChange={() => toggleNotification('push_notifications')}
                className="w-5 h-5 text-lime-600 rounded focus:ring-2 focus:ring-lime-600"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-ink-600" />
                <div>
                  <p className="font-semibold text-ink-700">Marketing Communications</p>
                  <p className="text-sm text-ink-500">Receive newsletters and promotional offers</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifications.marketing_notifications}
                onChange={() => toggleNotification('marketing_notifications')}
                className="w-5 h-5 text-lime-600 rounded focus:ring-2 focus:ring-lime-600"
              />
            </label>
          </div>
        </motion.div>

        {/* Account Security Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 mb-6"
        >
          <h2 className="text-xl font-bold text-ink-700 mb-6 flex items-center gap-2">
            <Shield className="w-6 h-6 text-lime-600" />
            Account Security
          </h2>

          <div className="space-y-4">
            {/* Change Password */}
            {!showPasswordForm ? (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-ink-600" />
                  <div>
                    <p className="font-semibold text-ink-700">Change Password</p>
                    <p className="text-sm text-ink-500">Update your account password</p>
                  </div>
                </div>
              </button>
            ) : (
              <div className="p-6 bg-gray-50 rounded-xl space-y-4">
                <h3 className="font-semibold text-ink-700 mb-4">Change Password</h3>

                {/* Current Password */}
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pr-10 text-ink-700 focus:outline-none focus:ring-2 focus:ring-lime-600"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-3 text-ink-400 hover:text-ink-600"
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pr-10 text-ink-700 focus:outline-none focus:ring-2 focus:ring-lime-600"
                      placeholder="Enter new password (min 8 characters)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-ink-400 hover:text-ink-600"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-ink-700 focus:outline-none focus:ring-2 focus:ring-lime-600"
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordData({ current_password: '', new_password: '', confirmPassword: '' });
                    }}
                    className="flex-1 px-4 py-2 border border-slate-200 text-ink-700 rounded-xl hover:bg-slate-50 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <motion.button
                    onClick={handleChangePassword}
                    disabled={saving}
                    whileHover={{ scale: saving ? 1 : 1.02 }}
                    whileTap={{ scale: saving ? 1 : 0.98 }}
                    className="flex-1 bg-lime-600 text-white px-4 py-2 rounded-xl hover:bg-lime-700 disabled:opacity-50 flex items-center justify-center gap-2 font-semibold transition-colors"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </motion.button>
                </div>
              </div>
            )}

            {/* Delete Account */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-semibold text-red-700">Delete Account</p>
                  <p className="text-sm text-red-600">Permanently delete your account and data</p>
                </div>
              </div>
            </button>
          </div>
        </motion.div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => !saving && setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-ink-700 mb-2">Delete Account?</h3>
                <p className="text-ink-500 mb-4">
                  This action cannot be undone. All your data will be permanently deleted.
                </p>

                {/* Password Input */}
                <div className="text-left mb-4">
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Enter your password to confirm
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full bg-gray-50 border border-slate-200 rounded-xl px-4 py-3 text-ink-700 focus:outline-none focus:ring-2 focus:ring-red-600"
                    placeholder="Your password"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword('');
                  }}
                  disabled={saving}
                  className="flex-1 px-6 py-3 border border-slate-200 text-ink-700 rounded-xl hover:bg-slate-50 transition-colors font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={handleDeleteAccount}
                  disabled={saving || !deletePassword}
                  whileHover={{ scale: (saving || !deletePassword) ? 1 : 1.02 }}
                  whileTap={{ scale: (saving || !deletePassword) ? 1 : 0.98 }}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-colors shadow-sm"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      Delete My Account
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Settings;
