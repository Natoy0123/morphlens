import React, { useState, useRef, useCallback } from 'react';
import { AlertTriangle, Download, RotateCcw, Fingerprint, KeyRound, CheckCircle2, Maximize2, MoveHorizontal } from 'lucide-react';

function modelLabel(model) {
  if (!model) return 'Standard Model';
  if (model.includes('kontext-pro')) return 'FLUX.1 Kontext Pro';
  if (model.includes('klein')) return 'FLUX.2 Klein';
  if (model.includes('flux')) return 'FLUX Reference Model';
  if (model.includes('classic')) return 'SANA Synthesis';
  return model.replace('black-forest-labs/', '');
}

export default function BeforeAfterSlider({
  originalImage,
  generatedImage,
  identityUsed = false,
  model = '',
  promptUsed = '',
  onConnectKey,
  onReset,
  onInspect,
  onNotify,
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
          // Keep guessed extension
        }
      }

      const a = document.createElement('a');
      a.href = href;
      a.download = `morphlens-${stamp}.${extension}`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      onNotify?.('Portrait downloaded successfully');

      if (revoke) {
        setTimeout(() => URL.revokeObjectURL(href), 1000);
      }
    } catch {
      window.open(generatedImage, '_blank', 'noopener');
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between gap-3.5 bg-black select-none view-fade-enter">
      {/* Slider Viewport */}
      <div
        ref={containerRef}
        role="slider"
        tabIndex={0}
        aria-label="Compare original reference and synthesized portrait"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(sliderPosition)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            setSliderPosition((pos) => Math.max(0, pos - 2));
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            setSliderPosition((pos) => Math.min(100, pos + 2));
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
        className="relative w-full flex-1 min-h-[300px] sm:min-h-[460px] bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden cursor-ew-resize shadow-2xl touch-none focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        {/* Generated Image Base */}
        <img
          src={generatedImage}
          alt="Synthesized Portrait"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />

        {/* Original Reference Image (Clipped) */}
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
          className="absolute top-0 bottom-0 w-0.5 bg-white/90 pointer-events-none transition-[left] duration-75"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white text-black shadow-xl border border-zinc-300 flex items-center justify-center transition-transform active:scale-110">
            <MoveHorizontal size={13} className="stroke-[2.5]" />
          </div>
        </div>

        {/* Reference and Result Labels */}
        <div className="absolute top-3 left-3 bg-black/80 border border-zinc-700 text-zinc-200 text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-md pointer-events-none">
          Reference
        </div>
        <div
          className={`absolute top-3 right-3 bg-black/80 border text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-md pointer-events-none flex items-center gap-1.5 ${
            identityUsed
              ? 'border-emerald-500/40 text-emerald-300'
              : 'border-zinc-700 text-zinc-300'
          }`}
        >
          {identityUsed ? (
            <Fingerprint size={12} className="text-emerald-400 flex-shrink-0" />
          ) : (
            <CheckCircle2 size={12} className="text-zinc-400 flex-shrink-0" />
          )}
          <span>{identityUsed ? 'Photo Applied' : 'Prompt Only'}</span>
        </div>

        {/* Inspect / Fullscreen Button */}
        {onInspect && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onInspect();
            }}
            className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-black/80 hover:bg-black border border-zinc-700 text-zinc-200 text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 transition-all active:scale-95 shadow-lg"
          >
            <Maximize2 size={13} />
            Inspect
          </button>
        )}
      </div>

      {/* Diagnostics and Action deck */}
      <div className="flex flex-col gap-2.5 w-full pt-1">
        {!identityUsed && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-200 text-xs">
            <AlertTriangle size={16} className="text-zinc-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-zinc-100">Direct Synthesis Mode</p>
              <p className="mt-0.5 text-zinc-400 leading-relaxed">
                Add an API key to enable instant FLUX image-to-image portrait transformation.
              </p>
              {onConnectKey && (
                <button
                  type="button"
                  onClick={onConnectKey}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-semibold inline-flex items-center gap-1.5 active:scale-95 shadow-sm"
                >
                  <KeyRound size={12} />
                  Connect Key
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 px-1 text-xs text-zinc-400">
          <span className="truncate font-medium">{modelLabel(model)}</span>
          <span className={identityUsed ? 'text-emerald-400 font-medium' : 'text-zinc-400'}>
            {identityUsed ? 'Photo Reference Linked' : 'Prompt Only'}
          </span>
        </div>

        {promptUsed && (
          <details className="px-1 text-xs text-zinc-500">
            <summary className="cursor-pointer font-mono uppercase tracking-wide hover:text-zinc-300">
              Prompt used
            </summary>
            <p className="mt-1.5 max-h-24 overflow-y-auto p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 leading-relaxed break-words font-sans text-xs">
              {promptUsed}
            </p>
          </details>
        )}

        <div className="flex gap-2.5 w-full">
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 min-h-[48px] py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-98 shadow-md"
          >
            <Download size={15} />
            <span>Download Portrait</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="min-h-[48px] py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98"
          >
            <RotateCcw size={14} />
            Change Style
          </button>
        </div>
      </div>
    </div>
  );
}
