import React, { useEffect, useRef, useState } from 'react';
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';

export default function ImageViewerDialog({ isOpen, imageUrl, originalUrl, onClose, onDownload }) {
  const dialogRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [isOpen]);

  const handleClose = () => {
    setZoom(1);
    setShowOriginal(false);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === dialogRef.current) handleClose();
  };

  const currentDisplay = showOriginal && originalUrl ? originalUrl : imageUrl;

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        handleClose();
      }}
      onClick={handleBackdropClick}
      aria-label="Portrait Viewer"
      className="p-0 bg-transparent text-zinc-100 max-w-4xl w-[96vw] max-h-[95dvh] rounded-3xl shadow-2xl backdrop:bg-black/90 backdrop:backdrop-blur-md m-auto focus:outline-none"
    >
      <div className="relative w-full h-[85dvh] bg-zinc-950 border border-zinc-800 rounded-3xl flex flex-col overflow-hidden">
        {/* Top Control Bar */}
        <div className="flex-shrink-0 h-14 px-4 border-b border-zinc-800/80 bg-zinc-900/80 backdrop-blur-md flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-zinc-300">
              {showOriginal ? 'ORIGINAL REFERENCE' : 'SYNTHESIZED PORTRAIT'}
            </span>
            {originalUrl && (
              <button
                type="button"
                onClick={() => setShowOriginal((prev) => !prev)}
                className="px-2.5 py-1 text-[11px] font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg border border-zinc-700 transition-colors"
              >
                {showOriginal ? 'Show Generated' : 'Compare Original'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Zoom Controls */}
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
              disabled={zoom <= 1}
              aria-label="Zoom out"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-40 transition-colors"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-xs font-mono text-zinc-400 min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
              disabled={zoom >= 3}
              aria-label="Zoom in"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-40 transition-colors"
            >
              <ZoomIn size={16} />
            </button>

            {onDownload && (
              <button
                type="button"
                onClick={onDownload}
                className="ml-2 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-md"
              >
                <Download size={13} />
                Download
              </button>
            )}

            <button
              type="button"
              onClick={handleClose}
              aria-label="Close dialog"
              className="w-8 h-8 ml-1 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Image Stage */}
        <div className="flex-1 w-full h-full min-h-0 flex items-center justify-center overflow-auto p-4 select-none">
          {currentDisplay ? (
            <img
              src={currentDisplay}
              alt="Portrait Full View"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
              className="max-w-full max-h-full object-contain transition-transform duration-150 ease-out rounded-xl shadow-2xl"
            />
          ) : (
            <div className="text-zinc-500 text-xs font-mono">No image available</div>
          )}
        </div>
      </div>
    </dialog>
  );
}
