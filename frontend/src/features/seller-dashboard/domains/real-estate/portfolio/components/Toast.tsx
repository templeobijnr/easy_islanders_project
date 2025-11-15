/**
 * Toast Component
 *
 * Displays toast notifications with animations
 */

import React, { useEffect } from 'react';
import { X, CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';
import { Toast as ToastType, ToastType as ToastTypeEnum } from './use-toast';

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

const TOAST_ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const TOAST_COLORS = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  error: 'bg-rose-50 border-rose-200 text-rose-900',
  info: 'bg-sky-50 border-sky-200 text-sky-900',
  warning: 'bg-amber-50 border-amber-200 text-amber-900',
};

const ICON_COLORS = {
  success: 'text-emerald-600',
  error: 'text-rose-600',
  info: 'text-sky-600',
  warning: 'text-amber-600',
};

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const Icon = TOAST_ICONS[toast.type];

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-lg
        ${TOAST_COLORS[toast.type]}
        animate-in slide-in-from-right-full duration-300
      `}
      role="alert"
      aria-live="polite"
    >
      <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${ICON_COLORS[toast.type]}`} />

      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="font-semibold text-sm mb-1">
            {toast.title}
          </p>
        )}
        <p className="text-sm">
          {toast.message}
        </p>
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastType[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="pointer-events-auto space-y-3">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </div>
    </div>
  );
};
