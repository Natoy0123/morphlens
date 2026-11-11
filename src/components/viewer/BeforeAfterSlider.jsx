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
    const stamp = Date.now();

    try {
      let href = generatedImage;
      let revoke = false;
      let extension = generatedImage.startsWith('data:image/png') ? 'png' : 'jpg';

      if (!generatedImage.startsWith('blob:') && !generatedImage.startsWith('data:')) {
        const response = await fetch(generatedImage);
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        extension = blob.type.includes('png') ? 'png' : 'jpg';
        href = URL.createObjectURL(blob);
        revoke = true;
      } else {
        try {
          const blob = await fetch(generatedImage).then((response) => response.blob());
          if (blob.type.includes('png')) extension = 'png';
          else if (blob.type.includes('jpeg')) extension = 'jpg';
        } catch {
          // Keep the extension guessed from the URL; the download still works.
        }
      }

      const a = document.createElement('a');
      a.href = href;
      a.download = `morphlens-${stamp}.${extension}`;
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
        role="slider"
        tabIndex={0}
        aria-label="Compare the input scan and the synthesized persona"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(sliderPosition)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            setSliderPosition((position) => Math.max(0, position - 2));
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            setSliderPosition((position) => Math.min(100, position + 2));
          }
        }}
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
        className="relative w-full flex-1 min-h-[300px] sm:min-h-[460px] bg-zinc-950 border border-zinc-800/80 rounded-3xl overflow-hidden cursor-ew-resize shadow-2xl touch-none focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
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
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-black shadow-2xl flex items-center justify-center text-xs font-bold">
            ↔
          </div>
        </div>

        {/* Camera Labels */}
        <div className="absolute top-3 left-3 bg-black/75 border border-zinc-700 text-zinc-200 text-xs font-mono font-medium px-2.5 py-1.5 rounded-full backdrop-blur-md pointer-events-none">
          INPUT SCAN
        </div>
        <div
          className={`absolute top-3 right-3 bg-black/75 border text-xs font-mono font-medium px-2.5 py-1.5 rounded-full backdrop-blur-md pointer-events-none flex items-center gap-1 ${
            identityUsed
              ? 'border-emerald-500/40 text-emerald-300'
              : 'border-amber-500/40 text-amber-300'
          }`}
        >
          {identityUsed ? (
            <Fingerprint size={12} className="text-emerald-400 flex-shrink-0" />
          ) : (
            <Sparkles size={12} className="text-amber-400 flex-shrink-0" />
          )}
          {identityUsed ? 'PHOTO CONDITIONED' : 'PROMPT-ONLY RENDER'}
        </div>
      </div>

      {/* Action Controls Deck */}
      <div className="flex gap-3 w-full pt-1">
        <button
          type="button"
          onClick={handleDownload}
          className="flex-1 min-h-[52px] py-3.5 sm:py-4 px-3 sm:px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all active:scale-98 shadow-md whitespace-nowrap"
        >
          <Download size={16} className="flex-shrink-0" />
          <span className="sm:hidden">DOWNLOAD</span>
          <span className="hidden sm:inline">DOWNLOAD PORTRAIT</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="min-h-[52px] py-3.5 sm:py-4 px-4 sm:px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-semibold text-sm flex items-center justify-center gap-1.5 transition-all active:scale-98"
        >
          <RotateCcw size={15} />
          EDIT PROMPT
        </button>
      </div>
    </div>
  );
}
