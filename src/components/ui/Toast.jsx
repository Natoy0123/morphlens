import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 3500 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const icons = {
    success: <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />,
    error: <AlertCircle size={15} className="text-red-400 flex-shrink-0" />,
    info: <Info size={15} className="text-sky-400 flex-shrink-0" />,
  };

  return (
    <aside
      aria-live="polite"
      className="fixed bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-zinc-900/95 border border-zinc-700/80 text-zinc-100 text-xs font-medium shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      {icons[type] || icons.info}
      <span className="truncate max-w-[280px] sm:max-w-md">{message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        className="text-zinc-400 hover:text-white p-0.5 ml-1"
      >
        <X size={13} />
      </button>
    </aside>
  );
}
