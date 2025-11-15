/**
 * PurposeSubtitle Component
 *
 * Displays a concise subtitle explaining the purpose of the portfolio page
 */

import React from 'react';

interface PurposeSubtitleProps {
  text?: string;
  className?: string;
}

export const PurposeSubtitle: React.FC<PurposeSubtitleProps> = ({
  text = "Manage listings, track performance, and review activity.",
  className = "",
}) => {
  return (
    <p className={`text-sm font-medium text-slate-700 mt-2 ${className}`}>
      {text}
    </p>
  );
};
