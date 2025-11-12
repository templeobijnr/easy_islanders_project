import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Globe, Bell, Mail, Smartphone, Lock, Trash2,
  Save, Loader2, Check, AlertCircle, Shield, Eye, EyeOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import config from '../config';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

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

  const fetchPreferences = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPreferences();
    }
  }, [isAuthenticated, fetchPreferences]);

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
      <div className="min-h-[calc(100vh-80px)] bg-muted flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card rounded-3xl p-8 text-center shadow-lg border border-border">
          <AlertCircle className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Authentication Required</h1>
          <p className="text-muted-foreground">Please log in to access settings.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-muted flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-muted p-6">
      <div className="max-w-4xl mx-auto">
        {/* Success/Error Message */}
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-success/10 border border-success/30 text-success'
                : 'bg-destructive/10 border border-destructive/30 text-destructive'
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your preferences and account settings</p>
        </motion.div>

        {/* Preferences Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-6 h-6 text-primary" />
                Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Language */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Language</label>
                  <select
                    value={preferences.language}
                    onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
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
                  <label className="block text-sm font-semibold text-foreground mb-2">Currency</label>
                  <select
                    value={preferences.currency}
                    onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
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
                  <label className="block text-sm font-semibold text-foreground mb-2">Timezone</label>
                  <select
                    value={preferences.timezone}
                    onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    {timezones.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Button
                onClick={handleSavePreferences}
                disabled={saving}
                className="mt-6 w-full"
                variant="premium"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Preferences
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-6 h-6 text-primary" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-muted rounded-xl cursor-pointer hover:bg-muted/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-foreground" />
                    <div>
                      <p className="font-semibold text-foreground">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive booking and message notifications via email</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.email_notifications}
                    onChange={() => toggleNotification('email_notifications')}
                    className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-muted rounded-xl cursor-pointer hover:bg-muted/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-foreground" />
                    <div>
                      <p className="font-semibold text-foreground">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive real-time push notifications on your device</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.push_notifications}
                    onChange={() => toggleNotification('push_notifications')}
                    className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-muted rounded-xl cursor-pointer hover:bg-muted/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-foreground" />
                    <div>
                      <p className="font-semibold text-foreground">Marketing Communications</p>
                      <p className="text-sm text-muted-foreground">Receive newsletters and promotional offers</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.marketing_notifications}
                    onChange={() => toggleNotification('marketing_notifications')}
                    className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
                  />
                </label>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Account Security Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                Account Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Change Password */}
                {!showPasswordForm ? (
                  <Button
                    onClick={() => setShowPasswordForm(true)}
                    variant="ghost"
                    className="w-full justify-start p-4"
                  >
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5" />
                      <div>
                        <p className="font-semibold">Change Password</p>
                        <p className="text-sm text-muted-foreground">Update your account password</p>
                      </div>
                    </div>
                  </Button>
                ) : (
                  <div className="p-6 bg-muted rounded-xl space-y-4">
                    <h3 className="font-semibold text-foreground mb-4">Change Password</h3>

                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Current Password</label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwordData.current_password}
                          onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                          className="w-full bg-card border border-border rounded-xl px-4 py-3 pr-10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        >
                          {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordData.new_password}
                          onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                          className="w-full bg-card border border-border rounded-xl px-4 py-3 pr-10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Enter new password (min 8 characters)"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        >
                          {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Confirm new password"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={() => {
                          setShowPasswordForm(false);
                          setPasswordData({ current_password: '', new_password: '', confirmPassword: '' });
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleChangePassword}
                        disabled={saving}
                        variant="premium"
                        className="flex-1"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Updating...
                          </>
                        ) : (
                          'Update Password'
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Delete Account */}
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  variant="ghost"
                  className="w-full justify-start p-4 bg-destructive/10 border border-destructive/30 hover:bg-destructive/20"
                >
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-5 h-5 text-destructive" />
                    <div>
                      <p className="font-semibold text-destructive">Delete Account</p>
                      <p className="text-sm text-destructive">Permanently delete your account and data</p>
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
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
              className="bg-card rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-destructive" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Delete Account?</h3>
                <p className="text-muted-foreground mb-4">
                  This action cannot be undone. All your data will be permanently deleted.
                </p>

                {/* Password Input */}
                <div className="text-left mb-4">
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Enter your password to confirm
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-destructive"
                    placeholder="Your password"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword('');
                  }}
                  disabled={saving}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteAccount}
                  disabled={saving || !deletePassword}
                  variant="destructive"
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5 mr-2" />
                      Delete My Account
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Settings;
