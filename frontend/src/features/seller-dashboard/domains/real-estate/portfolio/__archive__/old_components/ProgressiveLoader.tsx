/**
 * ProgressiveLoader Component
 *
 * Enhanced loading state with progressive messages and visual feedback
 */

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStage {
  message: string;
  duration: number; // milliseconds
}

interface ProgressiveLoaderProps {
  stages?: LoadingStage[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const DEFAULT_STAGES: LoadingStage[] = [
  { message: 'Loading portfolio data...', duration: 800 },
  { message: 'Calculating metrics...', duration: 600 },
  { message: 'Analyzing trends...', duration: 600 },
  { message: 'Almost ready...', duration: 400 },
];

export const ProgressiveLoader: React.FC<ProgressiveLoaderProps> = ({
  stages = DEFAULT_STAGES,
  className = '',
  size = 'md',
}) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  useEffect(() => {
    if (currentStageIndex >= stages.length - 1) {
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStageIndex((prev) => Math.min(prev + 1, stages.length - 1));
    }, stages[currentStageIndex].duration);

    return () => clearTimeout(timer);
  }, [currentStageIndex, stages]);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-4 py-8 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} text-lime-600 animate-spin`} />
      <div className="flex flex-col items-center gap-2">
        <p className={`${textSizeClasses[size]} font-medium text-slate-700`}>
          {stages[currentStageIndex].message}
        </p>
        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {stages.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                index === currentStageIndex
                  ? 'bg-lime-600 scale-125'
                  : index < currentStageIndex
                  ? 'bg-lime-400'
                  : 'bg-slate-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Specific loader variants for different contexts
 */
export const ListingsLoader: React.FC<{ className?: string }> = ({ className }) => {
  const stages: LoadingStage[] = [
    { message: 'Fetching your listings...', duration: 600 },
    { message: 'Loading property details...', duration: 500 },
    { message: 'Preparing table view...', duration: 400 },
  ];

  return <ProgressiveLoader stages={stages} className={className} />;
};

export const AnalyticsLoader: React.FC<{ className?: string }> = ({ className }) => {
  const stages: LoadingStage[] = [
    { message: 'Loading analytics data...', duration: 700 },
    { message: 'Calculating performance metrics...', duration: 600 },
    { message: 'Generating charts...', duration: 500 },
    { message: 'Finalizing visualizations...', duration: 400 },
  ];

  return <ProgressiveLoader stages={stages} className={className} />;
};

export const ActivityLoader: React.FC<{ className?: string }> = ({ className }) => {
  const stages: LoadingStage[] = [
    { message: 'Loading activity feed...', duration: 500 },
    { message: 'Fetching recent events...', duration: 500 },
    { message: 'Organizing timeline...', duration: 400 },
  ];

  return <ProgressiveLoader stages={stages} className={className} />;
};

export const KPILoader: React.FC<{ className?: string }> = ({ className }) => {
  const stages: LoadingStage[] = [
    { message: 'Loading portfolio summary...', duration: 600 },
    { message: 'Calculating key metrics...', duration: 500 },
    { message: 'Computing trends...', duration: 400 },
  ];

  return <ProgressiveLoader stages={stages} className={className} size="sm" />;
};

/**
 * Example usage:
 *
 * // Generic progressive loader
 * {isLoading && <ProgressiveLoader />}
 *
 * // Context-specific loaders
 * {isLoadingListings && <ListingsLoader />}
 * {isLoadingAnalytics && <AnalyticsLoader />}
 * {isLoadingActivity && <ActivityLoader />}
 * {isLoadingKPIs && <KPILoader />}
 *
 * // Custom stages
 * {isLoading && (
 *   <ProgressiveLoader
 *     stages={[
 *       { message: 'Step 1...', duration: 800 },
 *       { message: 'Step 2...', duration: 600 },
 *     ]}
 *     size="lg"
 *   />
 * )}
 */
