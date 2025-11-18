import React from 'react';

/**
 * Hero section with gradient background and branding
 * Design inspired by chat-mockup.html
 */
const HeroSection: React.FC = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-lime-100 to-yellow-50 px-8 py-16 text-center">
      {/* Decorative blur effect */}
      <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-lime-500/10 blur-3xl" />

      {/* Badge */}
      <div className="relative z-10 mb-8 inline-flex items-center gap-3 rounded-full border border-sky-100 bg-white/90 px-6 py-3 backdrop-blur">
        <span className="text-2xl">🌴</span>
        <span className="font-medium text-slate-900">Your Island OS</span>
      </div>

      {/* Main Heading */}
      <h1 className="relative z-10 mb-6 text-5xl font-bold leading-tight text-slate-900 md:text-6xl">
        Find everything you need
        <span className="mt-2 block bg-gradient-to-r from-sky-600 to-lime-600 bg-clip-text text-transparent">
          in North Cyprus
        </span>
      </h1>

      {/* Subtitle */}
      <p className="relative z-10 mx-auto mb-12 max-w-2xl text-lg text-slate-600">
        Real Estate • Services • Events • Marketplace • Experiences
      </p>
    </div>
  );
};

export default HeroSection;
