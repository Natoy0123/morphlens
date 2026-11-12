import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  Sliders,
  RotateCcw,
  Crop,
  Sun,
  Contrast,
  Sparkles,
} from 'lucide-react';

const SOCIAL_CROPS = [
  { id: 'original', label: 'Original', ratio: null },
  { id: 'linkedin', label: 'LinkedIn (1:1)', ratio: 1 / 1, circleSafeZone: true },
  { id: 'instagram', label: 'Instagram (4:5)', ratio: 4 / 5 },
  { id: 'resume', label: 'Resume/CV (3:4)', ratio: 3 / 4 },
];

export default function ImageViewerDialog({ isOpen, imageUrl, originalUrl, onClose }) {
  const dialogRef = useRef(null);
  const imageRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [showOriginal, setShowOriginal] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState('original');
  const [showFilters, setShowFilters] = useState(false);

  // Studio Adjustments
  const [brightness, setBrightness] = useState(100); // 80 - 120
  const [contrast, setContrast] = useState(100); // 80 - 120
  const [warmth, setWarmth] = useState(0); // -25 (cool) to +25 (warm)

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
    setSelectedCrop('original');
    setShowFilters(false);
    resetAdjustments();
    onClose();
  };

  const resetAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setWarmth(0);
  };

  const handleBackdropClick = (e) => {
    if (e.target === dialogRef.current) handleClose();
  };

  const currentDisplay = showOriginal && originalUrl ? originalUrl : imageUrl;
  const activeCropObj = SOCIAL_CROPS.find((c) => c.id === selectedCrop);

  // CSS filter string for live preview
  const filterStyle = `brightness(${brightness}%) contrast(${contrast}%) ${
    warmth > 0 ? `sepia(${warmth * 0.8}%)` : warmth < 0 ? `hue-rotate(${warmth * 1.2}deg)` : ''
  }`;

  const handleExportCustomized = async () => {
    if (!currentDisplay) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentDisplay;
    await new Promise((res) => {
      img.onload = res;
    });

    const natW = img.naturalWidth || 1024;
    const natH = img.naturalHeight || 1024;

    let targetW = natW;
    let targetH = natH;
    let startX = 0;
    let startY = 0;

    if (activeCropObj?.ratio) {
      const targetRatio = activeCropObj.ratio;
      if (natW / natH > targetRatio) {
        targetW = natH * targetRatio;
        startX = (natW - targetW) / 2;
      } else {
        targetH = natW / targetRatio;
        startY = (natH - targetH) / 2;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(targetW);
    canvas.height = Math.round(targetH);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.filter = filterStyle;
    ctx.drawImage(img, startX, startY, targetW, targetH, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `morphlens_${selectedCrop}_${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }, 'image/jpeg', 0.95);
  };

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
      <div className="relative w-full h-[88dvh] bg-zinc-950 border border-zinc-800 rounded-3xl flex flex-col overflow-hidden">
        {/* Top Control Bar */}
        <div className="flex-shrink-0 min-h-[56px] px-4 py-2 border-b border-zinc-800/80 bg-zinc-900/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 z-20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-zinc-300">
              {showOriginal ? 'ORIGINAL' : 'PORTRAIT STUDIO'}
            </span>
            {originalUrl && (
              <button
                type="button"
                onClick={() => setShowOriginal((prev) => !prev)}
                className="px-2.5 py-1 text-[11px] font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg border border-zinc-700 transition-colors"
              >
                {showOriginal ? 'Show Output' : 'Compare Original'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Studio Adjustment Toggle */}
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              className={`px-2.5 py-1 text-xs rounded-lg border flex items-center gap-1.5 transition-colors ${
                showFilters
                  ? 'bg-white text-black font-semibold border-white'
                  : 'bg-zinc-800 text-zinc-300 hover:text-white border-zinc-700'
              }`}
            >
              <Sliders size={13} />
              <span>Studio Lightboard</span>
            </button>

            {/* Zoom Controls */}
            <div className="flex items-center bg-zinc-850 border border-zinc-750 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
                disabled={zoom <= 1}
                aria-label="Zoom out"
                className="w-7 h-7 rounded flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-xs font-mono text-zinc-300 min-w-[2.5rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                disabled={zoom >= 3}
                aria-label="Zoom in"
                className="w-7 h-7 rounded flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
              >
                <ZoomIn size={14} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportCustomized}
              className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-md"
            >
              <Download size={13} />
              Export
            </button>

            <button
              type="button"
              onClick={handleClose}
              aria-label="Close dialog"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Studio Lightboard Toolbar (Collapsible) */}
        {showFilters && (
          <div className="flex-shrink-0 px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs z-10 animate-in slide-in-from-top-2 duration-150">
            {/* Social Crop Presets */}
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400 font-medium flex items-center gap-1">
                <Crop size={12} /> Format:
              </span>
              {SOCIAL_CROPS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCrop(c.id)}
                  className={`px-2 py-0.5 rounded text-[11px] border font-medium transition-colors ${
                    selectedCrop === c.id
                      ? 'bg-zinc-100 text-black border-white'
                      : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border-zinc-700'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Sliders */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Sun size={12} className="text-zinc-400" />
                <span className="text-zinc-400 text-[11px]">Brightness</span>
                <input
                  type="range"
                  min="80"
                  max="120"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-16 accent-white cursor-pointer h-1.5 bg-zinc-700 rounded"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <Contrast size={12} className="text-zinc-400" />
                <span className="text-zinc-400 text-[11px]">Contrast</span>
                <input
                  type="range"
                  min="80"
                  max="120"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-16 accent-white cursor-pointer h-1.5 bg-zinc-700 rounded"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <Sparkles size={12} className="text-zinc-400" />
                <span className="text-zinc-400 text-[11px]">Warmth</span>
                <input
                  type="range"
                  min="-25"
                  max="25"
                  value={warmth}
                  onChange={(e) => setWarmth(Number(e.target.value))}
                  className="w-16 accent-white cursor-pointer h-1.5 bg-zinc-700 rounded"
                />
              </div>

              <button
                type="button"
                onClick={resetAdjustments}
                className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
                title="Reset filters"
              >
                <RotateCcw size={11} /> Reset
              </button>
            </div>
          </div>
        )}

        {/* Image Stage */}
        <div className="flex-1 w-full h-full min-h-0 flex items-center justify-center overflow-auto p-4 select-none relative bg-black/60">
          {currentDisplay ? (
            <div
              className="relative max-w-full max-h-full flex items-center justify-center transition-all"
              style={{
                aspectRatio: activeCropObj?.ratio ? `${activeCropObj.ratio}` : 'auto',
              }}
            >
              <img
                ref={imageRef}
                src={currentDisplay}
                alt="Portrait Studio View"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center',
                  filter: filterStyle,
                }}
                className={`max-w-full max-h-full object-contain transition-transform duration-150 ease-out shadow-2xl rounded-2xl ${
                  activeCropObj?.ratio ? 'object-cover w-full h-full' : ''
                }`}
              />

              {/* LinkedIn Circular Safe-Zone Guide */}
              {selectedCrop === 'linkedin' && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-[88%] aspect-square rounded-full border border-dashed border-white/60 shadow-lg" />
                </div>
              )}
            </div>
          ) : (
            <div className="text-zinc-500 text-xs font-mono">No image available</div>
          )}
        </div>
      </div>
    </dialog>
  );
}
