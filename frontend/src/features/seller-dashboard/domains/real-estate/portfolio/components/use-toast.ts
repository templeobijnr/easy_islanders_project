/**
 * Lightweight toast store + types used by portfolio components
 *
 * This provides minimal runtime behavior for local toasts and
 * strong types so components can safely index by toast.type.
 */
import { useCallback, useMemo, useRef, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idCounter = useRef(0);

  const push = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `t_${Date.now()}_${idCounter.current++}`;
    setToasts((prev) => [...prev, { id, ...toast }]);
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return useMemo(() => ({ toasts, push, dismiss }), [toasts, push, dismiss]);
}

// Named exports for type-only imports in components
export type { Toast as ToastTypeAlias };
export type { ToastType as ToastTypeEnum };

