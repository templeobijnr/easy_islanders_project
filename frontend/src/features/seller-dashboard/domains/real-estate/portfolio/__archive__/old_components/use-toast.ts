/**
 * Toast Hook
 *
 * Custom hook for managing toast notifications
 */

import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface UseToastReturn {
  toasts: Toast[];
  toast: (toast: Omit<Toast, 'id'>) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  dismiss: (id: string) => void;
}

let toastCount = 0;

export const useToast = (): UseToastReturn => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${++toastCount}`;
    const newToast: Toast = {
      id,
      duration: 5000, // Default 5 seconds
      ...toast,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after duration
    if (newToast.duration) {
      setTimeout(() => {
        dismiss(id);
      }, newToast.duration);
    }
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((message: string, title?: string) => {
    toast({ type: 'success', message, title });
  }, [toast]);

  const error = useCallback((message: string, title?: string) => {
    toast({ type: 'error', message, title });
  }, [toast]);

  const info = useCallback((message: string, title?: string) => {
    toast({ type: 'info', message, title });
  }, [toast]);

  const warning = useCallback((message: string, title?: string) => {
    toast({ type: 'warning', message, title });
  }, [toast]);

  return {
    toasts,
    toast,
    success,
    error,
    info,
    warning,
    dismiss,
  };
};
