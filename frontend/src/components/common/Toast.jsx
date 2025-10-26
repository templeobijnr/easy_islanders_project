import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

/**
 * Toast Component
 * 
 * Displays transient notifications (success/error).
 * Auto-dismisses after 3 seconds.
 * 
 * Props:
 * - message: string - The message to display
 * - type: 'success' | 'error' - Notification type
 * - onClose: callback - Called when toast closes
 */
export const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  const textColor = type === 'success' ? 'text-green-900' : 'text-red-900';
  const Icon = type === 'success' ? CheckCircle : AlertCircle;
  const iconColor = type === 'success' ? 'text-green-600' : 'text-red-600';

  return (
    <div className={`fixed bottom-6 right-6 z-50 max-w-sm ${bgColor} border rounded-lg shadow-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
      <p className={`flex-1 text-sm font-medium ${textColor}`}>{message}</p>
      <button
        onClick={onClose}
        className={`flex-shrink-0 ml-2 p-1 rounded hover:bg-white/50 transition-colors ${textColor} opacity-70 hover:opacity-100`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;

