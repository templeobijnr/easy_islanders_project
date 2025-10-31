import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Award, Users, Star } from '@/shared/icons';

interface TrustItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const TrustStrip = () => {
  const trustItems: TrustItem[] = [
    {
      icon: <Shield className="w-8 h-8 text-blue-600" />,
      title: "Verified Agents",
      description: "All our partners are licensed and verified"
    },
    {
      icon: <Award className="w-8 h-8 text-green-600" />,
      title: "Award Winning",
      description: "Recognized for excellence in Cyprus real estate"
    },
    {
      icon: <Users className="w-8 h-8 text-purple-600" />,
      title: "10,000+ Clients",
      description: "Trusted by thousands of satisfied customers"
    },
    {
      icon: <Star className="w-8 h-8 text-yellow-600" />,
      title: "5-Star Service",
      description: "Consistently rated excellent by our clients"
    }
  ];

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Why Choose Easy Islanders?</h2>
        <p className="text-slate-600">Your trusted partner in Cyprus real estate</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {trustItems.map((item, index) => (
          <motion.div
            key={index}
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-white/50 rounded-2xl">
                {item.icon}
              </div>
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
            <p className="text-sm text-slate-600">{item.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TrustStrip;