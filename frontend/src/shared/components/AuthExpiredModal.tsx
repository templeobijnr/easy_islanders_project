import React from 'react';
import { useNavigate } from 'react-router-dom';

type Props = {
  open: boolean;
  onClose: () => void;
  onReloginSuccess?: () => void;
};

export default function AuthExpiredModal({ open, onClose }: Props) {
  const nav = useNavigate();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <h2 className="text-lg font-semibold">Session expired</h2>
        <p className="mt-2 text-sm text-gray-600">
          Please sign in again to continue the conversation. Your unsent messages are saved and will be sent after you log in.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="rounded-md border px-3 py-1.5" onClick={onClose}>Dismiss</button>
          <button
            className="rounded-md bg-black px-3 py-1.5 text-white"
            onClick={() => nav('/login')}
          >
            Go to login
          </button>
        </div>
      </div>
    </div>
  );
}

