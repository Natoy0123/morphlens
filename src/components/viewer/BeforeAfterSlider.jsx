import React, { useState, useRef, useCallback } from 'react';
import { Download, RotateCcw, Sparkles, Fingerprint } from 'lucide-react';

export default function BeforeAfterSlider({
  originalImage,
  generatedImage,
  identityUsed = false,
  onReset,
}) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const updatePosition = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      updatePosition(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    updatePosition(e.clientX);
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    const filename = `morphlens-${Date.now()}.png`;

    try {
      let href = generatedImage;
      let revoke = false;
      if (!generatedImage.startsWith('blob:') && !generatedImage.startsWith('data:')) {
        const response = await fetch(generatedImage);
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        href = URL.createObjectURL(blob);
        revoke = true;
      }

      const a = document.createElement('a');
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      if (revoke) {
        setTimeout(() => URL.revokeObjectURL(href), 1000);
      }
    } catch {
      window.open(generatedImage, '_blank', 'noopener');
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between gap-3.5 bg-black select-none">
      {/* Slider Viewport */}
      <div
        ref={containerRef}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
        onTouchStart={(e) => {
          setIsDragging(true);
          if (e.touches && e.touches[0]) updatePosition(e.touches[0].clientX);
        }}
        onTouchEnd={() => setIsDragging(false)}
        onTouchMove={handleTouchMove}
        className="relative w-full flex-1 min-h-[360px] sm:min-h-[460px] bg-zinc-950 border border-zinc-800/80 rounded-3xl overflow-hidden cursor-ew-resize shadow-2xl touch-none"
      >
        {/* Generated Image Base */}
        <img
          src={generatedImage}
          alt="Synthesized Persona"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />

        {/* Original Scanned Image (Clipped) */}
        {originalImage && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
            }}
          >
            <img
              src={originalImage}
              alt="Original Subject"
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {/* Divider Line & Handle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)] pointer-events-none"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-black shadow-2xl flex items-center justify-center text-[10px] font-bold">
            ↔
          </div>
        </div>

        {/* Camera Labels */}
        <div className="absolute top-4 left-4 bg-black/75 border border-zinc-700 text-zinc-200 text-xs font-mono font-medium px-3 py-1.5 rounded-full backdrop-blur-md pointer-events-none">
          INPUT SCAN
        </div>
        <div
          className={`absolute top-4 right-4 bg-black/75 border text-xs font-mono font-medium px-3 py-1.5 rounded-full backdrop-blur-md pointer-events-none flex items-center gap-1.5 ${
            identityUsed
              ? 'border-emerald-500/40 text-emerald-300'
              : 'border-amber-500/40 text-amber-300'
          }`}
        >
          {identityUsed ? (
            <Fingerprint size={12} className="text-emerald-400" />
          ) : (
            <Sparkles size={12} className="text-amber-400" />
          )}
          {identityUsed ? 'PHOTO CONDITIONED' : 'PROMPT-ONLY RENDER'}
        </div>
      </div>

      {/* Action Controls Deck */}
      <div className="flex gap-3 w-full pt-1">
        <button
          type="button"
          onClick={handleDownload}
          className="flex-1 py-3.5 sm:py-4 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 transition-all active:scale-98 shadow-md"
        >
          <Download size={15} />
          DOWNLOAD PORTRAIT
        </button>

        <button
          type="button"
          onClick={onReset}
          className="py-3.5 sm:py-4 px-4 sm:px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all active:scale-98"
        >
          <RotateCcw size={14} />
          NEW SCAN
        </button>
      </div>
    </div>
  );
}
