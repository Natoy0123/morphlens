import React, { useState, useRef, useCallback } from 'react';
import { Download, RotateCcw, Sparkles } from 'lucide-react';

export default function BeforeAfterSlider({
  originalImage,
  generatedImage,
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

  const handleDownload = () => {
    if (!generatedImage) return;
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = `personacraft-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between gap-3 bg-black select-none">
      {/* Slider Viewport with touch-none to prevent mobile page scrolling while dragging */}
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
        className="relative w-full flex-1 min-h-[360px] sm:min-h-[440px] bg-zinc-950 border border-zinc-800/80 rounded-3xl overflow-hidden cursor-ew-resize shadow-2xl touch-none"
      >
        {/* Generated Image Base */}
        <img
          src={generatedImage}
          alt="Synthesized Persona"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />

        {/* Original Scanned Image (Clipped) */}
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

        {/* Divider Line & Minimal Handle */}
        <div
          className="absolute top-0 bottom-0 w-px bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] pointer-events-none"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white text-black shadow-xl flex items-center justify-center text-[9px] font-bold">
            ↔
          </div>
        </div>

        {/* High-End Camera Labels */}
        <div className="absolute top-3 left-3 bg-black/70 border border-zinc-800 text-zinc-300 text-[10px] font-mono px-2.5 py-1 rounded-full backdrop-blur-md pointer-events-none">
          INPUT SCAN
        </div>
        <div className="absolute top-3 right-3 bg-black/70 border border-zinc-800 text-amber-400 text-[10px] font-mono px-2.5 py-1 rounded-full backdrop-blur-md pointer-events-none flex items-center gap-1">
          <Sparkles size={10} className="text-amber-400" />
          SYNTHESIZED
        </div>
      </div>

      {/* Action Controls Deck */}
      <div className="flex gap-2.5 w-full pt-1">
        <button
          type="button"
          onClick={handleDownload}
          className="flex-1 py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 shadow-md"
        >
          <Download size={14} />
          DOWNLOAD 4K PORTRAIT
        </button>

        <button
          type="button"
          onClick={onReset}
          className="py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-medium text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98"
        >
          <RotateCcw size={13} />
          NEW SCAN
        </button>
      </div>
    </div>
  );
}
