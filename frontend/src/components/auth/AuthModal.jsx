import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone, Briefcase, Users, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../../shared/context/AuthContext';

const AuthModal = () => {
  const {
    showAuthModal, authMode, authStep, authError, authLoading,
    setAuthMode, setSelectedUserType, setAuthStep, handleLogin, handleRegister, closeAuthModal
  } = useAuth();

  const [formData, setFormData] = useState({
    username: '', email: '', password: '', phone: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (authMode === 'login') {
      await handleLogin({ email: formData.email, password: formData.password });
    } else {
      await handleRegister(formData);
    }
  };

  const handleUserTypeSelect = (type) => {
    setSelectedUserType(type);
    setAuthStep('form');
  };

  // const handleSocialLogin = (provider) => { // Removed - not used
  //   alert(`${provider} login coming soon!`);
  // };

  if (!showAuthModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl relative">
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8">
          {authMode === 'register' && authStep === 'type' && (
            <div className="space-y-4 text-center">
              <h2 className="text-2xl font-bold text-gray-800">Join Easy Islanders</h2>
              <p className="text-gray-500">First, tell us who you are.</p>
              
              <button
                onClick={() => handleUserTypeSelect('consumer')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-brand hover:bg-brand/5 transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <Users className="w-6 h-6 text-brand" />
                  <div>
                    <p className="text-gray-800 font-semibold">I'm a Customer</p>
                    <p className="text-gray-500 text-sm">To browse and book amazing experiences.</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleUserTypeSelect('business')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-brand hover:bg-brand/5 transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <Briefcase className="w-6 h-6 text-brand" />
                  <div>
                    <p className="text-gray-800 font-semibold">I'm a Business</p>
                    <p className="text-gray-500 text-sm">To list my services and reach new clients.</p>
                  </div>
                </div>
              </button>

              <p className="text-gray-500 text-sm pt-4">
                Already have an account?{' '}
                <button
                  onClick={() => { setAuthMode('login'); setAuthStep('form'); }}
                  className="text-brand hover:underline font-semibold"
                >
                  Sign in
                </button>
              </p>
            </div>
          )}

          {authStep === 'form' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800">
                  {authMode === 'login' ? 'Welcome Back' : 'Create Your Account'}
                </h2>
                <p className="text-gray-500 mt-1">
                  {authMode === 'login' ? 'Sign in to continue.' : 'Let\'s get you started.'}
                </p>
              </div>

              {authError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{authError}</p>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                {authMode === 'register' && (
                  <InputField icon={User} type="text" name="username" placeholder="Username" value={formData.username} onChange={handleInputChange} required />
                )}
                <InputField icon={Mail} type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} required />
                <InputField icon={Lock} type="password" name="password" placeholder="Password" value={formData.password} onChange={handleInputChange} required />
                {authMode === 'register' && (
                  <InputField icon={Phone} type="tel" name="phone" placeholder="Phone (Optional)" value={formData.phone} onChange={handleInputChange} />
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-brand text-white py-3 px-4 rounded-lg hover:bg-brand-dark transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {authLoading && <Loader className="w-4 h-4 animate-spin" />}
                  {authMode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-400">Or</span></div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <SocialButton provider="Google" />
                <SocialButton provider="Apple" />
                <SocialButton provider="Facebook" />
              </div>

              <p className="text-gray-500 text-sm text-center">
                {authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button
                  onClick={() => {
                    const newMode = authMode === 'login' ? 'register' : 'login';
                    setAuthMode(newMode);
                    setAuthStep(newMode === 'register' ? 'type' : 'form');
                    setFormData({ username: '', email: '', password: '', phone: '' });
                  }}
                  className="text-brand hover:underline font-semibold"
                >
                  {authMode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper component for form inputs
const InputField = ({ icon: Icon, ...props }) => (
  <div className="relative">
    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
    <input
      {...props}
      className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-3 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand"
    />
  </div>
);

// Helper component for social login buttons
const SocialButton = ({ provider }) => (
  <button
    onClick={() => alert(`${provider} login coming soon!`)}
    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
    title={`${provider} sign-in`}
  >
    {/* Placeholder SVG */}
    <svg className="w-5 h-5 mx-auto" viewBox="0 0 24 24">
      <text x="12" y="16" textAnchor="middle" fontSize="10" fill="black">{provider.charAt(0)}</text>
    </svg>
  </button>
);

export default AuthModal;
