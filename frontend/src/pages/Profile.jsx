import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Save, Loader2, Check, AlertCircle, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import config from '../config';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { PageTransition, StaggerContainer, StaggerItem, AnimatedWrapper } from '../components/ui/animated-wrapper';
import { spacing, layout } from '../lib/spacing';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';

const Profile = () => {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
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

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const token = localStorage.getItem('token');
      const formDataUpload = new FormData();
      formDataUpload.append('avatar', file);
      await axios.post(`${config.API_BASE_URL}/api/auth/profile/avatar/`, formDataUpload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchProfile(); // Refresh profile data
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      setMessage({ type: 'error', text: 'Failed to upload avatar' });
    } finally {
      setUploadingAvatar(false);
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
      <PageTransition>
        <div className={`min-h-[calc(100vh-80px)] bg-muted flex items-center justify-center ${spacing.cardPadding}`}>
          <div className="max-w-md w-full bg-card rounded-3xl p-8 text-center shadow-lg border border-border">
            <AlertCircle className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Authentication Required</h1>
            <p className="text-muted-foreground">Please log in to view your profile.</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (loading) {
    return (
      <PageTransition>
        <div className={`min-h-[calc(100vh-80px)] bg-muted ${spacing.pageContainer}`}>
          <div className="max-w-4xl mx-auto">
            <div className={spacing.formGap}>
              {/* CardSkeleton placeholder */}
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-64 w-full rounded-2xl" />
              <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className={`min-h-[calc(100vh-80px)] bg-muted ${spacing.pageContainer}`}>
        <div className={layout.containerSmall}>
        {/* Header */}
        <AnimatedWrapper animation="fadeInUp" className={spacing.section}>
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your account information</p>
        </AnimatedWrapper>

        {/* Success/Error Message */}
        {message.text && (
          <AnimatedWrapper animation="slideInFromTop" className="mb-6">
            <div className={`p-4 rounded-xl border flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-success/10 border-success/20 text-success'
                : 'bg-destructive/10 border-destructive/20 text-destructive'
            }`}>
              {message.type === 'success' ? (
                <Check className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          </AnimatedWrapper>
        )}

        {/* Profile Cards */}
        <StaggerContainer className={spacing.section}>
          {/* Profile Header Card */}
          <StaggerItem>
            <Card>
              <CardContent className={spacing.cardPadding}>
                <div className="flex items-center gap-6">
                  {/* Avatar */}
                  <div className="relative w-24 h-24 rounded-2xl bg-primary flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                    {profileData?.avatar ? (
                      <motion.img
                        src={profileData.avatar}
                        alt="Avatar"
                        className="w-full h-full rounded-2xl object-cover"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    ) : (
                      getInitials(profileData?.username)
                    )}
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                    <label className="absolute inset-0 cursor-pointer rounded-2xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/50">
                      <Upload className="w-6 h-6 text-white" />
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </label>
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-foreground">{profileData?.username}</h2>
                    <p className="text-muted-foreground flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4" />
                      {profileData?.email}
                    </p>
                    {profileData?.user_type && (
                      <div className="mt-2">
                        <Badge variant={profileData.user_type === 'business' ? 'secondary' : 'default'} className={profileData.user_type === 'business' ? 'animate-pulse' : ''}>
                          {profileData.user_type === 'business' ? '💼 Business' : '👤 Consumer'}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>

          {/* Edit Profile Form */}
          <StaggerItem>
            <AnimatedWrapper animation="fadeInUp">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={spacing.formGap}>
                    {/* Username */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        <User className="w-4 h-4 inline mr-1" />
                        Username
                      </label>
                      <Input
                        type="text"
                        value={formData.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        placeholder="Enter your username"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        <Mail className="w-4 h-4 inline mr-1" />
                        Email Address
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Enter your email"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        <Phone className="w-4 h-4 inline mr-1" />
                        Phone Number
                      </label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="Enter your phone number"
                      />
                    </div>

                    {/* Save Button */}
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      variant="premium"
                      className="w-full"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : message.type === 'success' ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center"
                        >
                          <Check className="w-5 h-5 mr-2 text-green-600" />
                          Saved!
                        </motion.div>
                      ) : (
                        <>
                          <Save className="w-5 h-5 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </AnimatedWrapper>
          </StaggerItem>

          {/* Business Profile (if applicable) */}
          {profileData?.business_profile && (
            <StaggerItem>
              <Card>
                <CardHeader>
                  <CardTitle>Business Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={spacing.formGap}>
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <span className="text-muted-foreground text-sm">Business Name</span>
                      <span className="text-foreground font-semibold">
                        {profileData.business_profile.business_name || 'Not set'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="text-muted-foreground text-sm">Verification Status</span>
                      <Badge variant={profileData.business_profile.is_verified_by_admin ? 'default' : 'secondary'}>
                        {profileData.business_profile.is_verified_by_admin ? '✓ Verified' : '⏳ Pending'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          )}
        </StaggerContainer>
        </div>
      </div>
    </PageTransition>
  );
};

export default Profile;
