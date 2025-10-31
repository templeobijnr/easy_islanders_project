import React from 'react';
import { motion } from 'framer-motion';
import { User, Settings } from '@/shared/icons';
import IconButton from '@/shared/components';

interface ChatHeaderProps {
  title?: string;
  subtitle?: string;
  onSettingsClick?: () => void;
}

const ChatHeader = ({
  title = "Easy Islanders Assistant",
  subtitle = "Your AI property assistant",
  onSettingsClick
}: ChatHeaderProps) => {
  return (
    <motion.div
      className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/50 px-6 py-4"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
            <p className="text-sm text-slate-600">{subtitle}</p>
          </div>
        </div>
        {onSettingsClick && (
          <IconButton onClick={onSettingsClick} children={<Settings className="w-5 h-5" />} />
        )}
      </div>
    </motion.div>
  );
};

export default ChatHeader;