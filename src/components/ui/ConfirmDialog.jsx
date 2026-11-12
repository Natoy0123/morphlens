import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  const handleBackdropClick = (e) => {
    // If click is directly on dialog backdrop (not inside content box)
    if (e.target === dialogRef.current) {
      onCancel();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClick={handleBackdropClick}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
      className="p-0 bg-transparent text-zinc-100 max-w-md w-[92vw] rounded-2xl shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm m-auto focus:outline-none"
    >
      <div className="p-5 sm:p-6 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isDestructive
                  ? 'bg-red-950/60 text-red-400 border border-red-800/60'
                  : 'bg-zinc-800 text-zinc-300 border border-zinc-700/60'
              }`}
            >
              <AlertTriangle size={18} />
            </div>
            <h2 id="confirm-dialog-title" className="text-base font-semibold text-white">
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Message */}
        <p id="confirm-dialog-message" className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            className="px-4 py-2 min-h-[40px] rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs sm:text-sm transition-all active:scale-95"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirm();
            }}
            className={`px-4 py-2 min-h-[40px] rounded-xl font-semibold text-xs sm:text-sm transition-all active:scale-95 shadow-md ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-white hover:bg-zinc-200 text-black'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
