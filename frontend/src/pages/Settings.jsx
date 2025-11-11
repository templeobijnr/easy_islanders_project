import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Globe, DollarSign, Clock, Bell, Mail, Smartphone, Lock, Trash2,
  Save, Loader2, Check, AlertCircle, Shield, Eye, EyeOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Settings = () => {
  const { user, isAuthenticated } = useAuth();
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [preferences, setPreferences] = useState({
    language: 'en',
    currency: 'EUR',
    timezone: 'UTC+3',
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
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
  const timezones = ['UTC+0', 'UTC+1', 'UTC+2', 'UTC+3', 'UTC+4'];

  const handleSavePreferences = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    // Simulate API call
    setTimeout(() => {
      setMessage({ type: 'success', text: 'Preferences saved successfully!' });
      setSaving(false);
    }, 1000);
  };

  const toggleNotification = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    // Simulate API call
    setTimeout(() => {
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      setSaving(false);
    }, 1000);
  };

  const handleDeleteAccount = async () => {
    // Simulate API call
    setSaving(true);
    setTimeout(() => {
      alert('Account deletion requested. This action requires admin confirmation.');
      setShowDeleteConfirm(false);
      setSaving(false);
    }, 1000);
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

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-ink-700">Settings</h1>
          <p className="text-ink-500 mt-1">Manage your account preferences and security</p>
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

        {/* Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mb-6"
        >
          <h3 className="text-xl font-bold text-ink-700 mb-6 flex items-center gap-2">
            <Globe className="w-5 h-5 text-lime-600" />
            Preferences
          </h3>

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
              <label className="block text-sm font-semibold text-ink-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Currency
              </label>
              <select
                value={preferences.currency}
                onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                className="w-full bg-gray-50 border border-slate-200 rounded-xl px-4 py-3 text-ink-700 focus:outline-none focus:ring-2 focus:ring-lime-600 focus:border-transparent transition-all"
              >
                {currencies.map((currency) => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Timezone
              </label>
              <select
                value={preferences.timezone}
                onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                className="w-full bg-gray-50 border border-slate-200 rounded-xl px-4 py-3 text-ink-700 focus:outline-none focus:ring-2 focus:ring-lime-600 focus:border-transparent transition-all"
              >
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>

            {/* Save Button */}
            <motion.button
              onClick={handleSavePreferences}
              disabled={saving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-lime-600 text-white py-3 px-6 rounded-xl hover:bg-lime-700 disabled:opacity-50 flex items-center justify-center gap-2 font-semibold transition-colors"
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
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mb-6"
        >
          <h3 className="text-xl font-bold text-ink-700 mb-6 flex items-center gap-2">
            <Bell className="w-5 h-5 text-lime-600" />
            Notifications
          </h3>

          <div className="space-y-4">
            {/* Email Notifications */}
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
                checked={notifications.emailNotifications}
                onChange={() => toggleNotification('emailNotifications')}
                className="w-5 h-5 text-lime-600 rounded focus:ring-2 focus:ring-lime-600"
              />
            </label>

            {/* Push Notifications */}
            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-ink-600" />
                <div>
                  <p className="font-semibold text-ink-700">Push Notifications</p>
                  <p className="text-sm text-ink-500">Receive real-time notifications on your device</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifications.pushNotifications}
                onChange={() => toggleNotification('pushNotifications')}
                className="w-5 h-5 text-lime-600 rounded focus:ring-2 focus:ring-lime-600"
              />
            </label>

            {/* Marketing Emails */}
            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-ink-600" />
                <div>
                  <p className="font-semibold text-ink-700">Marketing Emails</p>
                  <p className="text-sm text-ink-500">Receive promotional offers and updates</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifications.marketingEmails}
                onChange={() => toggleNotification('marketingEmails')}
                className="w-5 h-5 text-lime-600 rounded focus:ring-2 focus:ring-lime-600"
              />
            </label>
          </div>
        </motion.div>

        {/* Account Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mb-6"
        >
          <h3 className="text-xl font-bold text-ink-700 mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-lime-600" />
            Account Security
          </h3>

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
                <span className="text-ink-400">›</span>
              </button>
            ) : (
              <div className="p-4 bg-gray-50 rounded-xl space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-ink-700">Change Password</h4>
                  <button
                    onClick={() => setShowPasswordForm(false)}
                    className="text-ink-500 hover:text-ink-700"
                  >
                    Cancel
                  </button>
                </div>

                {/* Current Password */}
                <div className="relative">
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pr-10 text-ink-700 focus:outline-none focus:ring-2 focus:ring-lime-600"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-10 text-ink-400 hover:text-ink-600"
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* New Password */}
                <div className="relative">
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    New Password
                  </label>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pr-10 text-ink-700 focus:outline-none focus:ring-2 focus:ring-lime-600"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-10 text-ink-400 hover:text-ink-600"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-ink-700 focus:outline-none focus:ring-2 focus:ring-lime-600"
                    placeholder="Confirm new password"
                  />
                </div>

                <button
                  onClick={handleChangePassword}
                  disabled={saving}
                  className="w-full bg-lime-600 text-white py-3 px-6 rounded-xl hover:bg-lime-700 disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
                </button>
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
              <span className="text-red-400">›</span>
            </button>
          </div>
        </motion.div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteConfirm(false)}
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
                <p className="text-ink-500">
                  This action cannot be undone. All your data will be permanently deleted.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-gray-100 text-ink-700 py-3 px-6 rounded-xl hover:bg-gray-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={saving}
                  className="flex-1 bg-red-600 text-white py-3 px-6 rounded-xl hover:bg-red-700 disabled:opacity-50 font-semibold"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Settings;
