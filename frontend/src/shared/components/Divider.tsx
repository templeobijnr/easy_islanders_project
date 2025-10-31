import React from 'react';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

const Divider = ({ orientation = 'horizontal', className = '' }: DividerProps) => {
  const baseClasses = 'bg-gradient-to-r from-transparent via-slate-200 to-transparent';
  const orientationClasses = orientation === 'horizontal'
    ? 'h-px w-full'
    : 'w-px h-full';

  return (
    <div
      className={`${baseClasses} ${orientationClasses} ${className}`}
      role="separator"
    />
  );
};

export default Divider;