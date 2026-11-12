import React, { useEffect, useRef } from 'react';
import { BookOpen, X, Camera, Lock, Sliders, CheckCircle2 } from 'lucide-react';

export default function StudioGuideDialog({ isOpen, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [isOpen]);

  const handleBackdropClick = (e) => {
    if (e.target === dialogRef.current) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={handleBackdropClick}
      aria-labelledby="studio-guide-title"
      className="p-0 bg-transparent text-zinc-100 max-w-xl w-[94vw] rounded-2xl shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm m-auto focus:outline-none"
    >
      <div className="p-5 sm:p-6 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col gap-4 max-h-[85dvh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200">
              <BookOpen size={16} />
            </div>
            <div>
              <h2 id="studio-guide-title" className="text-base font-bold text-white">
                Studio Guide
              </h2>
              <p className="text-xs text-zinc-400">
                How MorphLens captures and preserves your identity
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close guide"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Framing Section */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5 uppercase font-mono tracking-wider">
            <Camera size={13} className="text-zinc-400" />
            1. Framing Modes
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl">
              <span className="font-semibold text-white block text-sm">Headshot (1:1)</span>
              <span className="text-zinc-300 text-xs leading-relaxed mt-0.5 block">
                Crown to clavicle. Ideal for avatars, corporate headshots, and clear facial detail.
              </span>
            </div>
            <div className="p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl">
              <span className="font-semibold text-white block text-sm">Half Body (4:5)</span>
              <span className="text-zinc-300 text-xs leading-relaxed mt-0.5 block">
                Head to waist. Perfect for tailored suits, jackets, and arm posture.
              </span>
            </div>
            <div className="p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl">
              <span className="font-semibold text-white block text-sm">Full Body (9:16)</span>
              <span className="text-zinc-300 text-xs leading-relaxed mt-0.5 block">
                Head to toe. Captures full standing stance, attire, and environmental scale.
              </span>
            </div>
            <div className="p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl">
              <span className="font-semibold text-white block text-sm">Three-Quarter (3:4)</span>
              <span className="text-zinc-300 text-xs leading-relaxed mt-0.5 block">
                Head to mid-thigh. Classic magazine editorial portrait framing.
              </span>
            </div>
          </div>
        </div>

        {/* Preservation Controls Section */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5 uppercase font-mono tracking-wider">
            <Lock size={13} className="text-zinc-400" />
            2. Preservation Controls
          </h3>
          <div className="p-3.5 bg-zinc-950/70 border border-zinc-800/80 rounded-xl space-y-2.5 text-xs">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={15} className="text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-zinc-100 block text-xs">Face & Identity Lock:</strong>
                <span className="text-zinc-300 text-xs leading-relaxed mt-0.5 block">
                  Instructs the conditioning model to retain your facial structure, eyes, nose, skin tone, and expression from the reference photo.
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={15} className="text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-zinc-100 block text-xs">Stance & Body Pose Lock:</strong>
                <span className="text-zinc-300 text-xs leading-relaxed mt-0.5 block">
                  Maintains your exact body proportions, shoulder angle, posture, and head tilt instead of inventing a new random pose.
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={15} className="text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-zinc-100 block text-xs">Preserve Background:</strong>
                <span className="text-zinc-300 text-xs leading-relaxed mt-0.5 block">
                  Keeps the room, lighting, and surroundings from your original photo while restyling your attire or enhancing quality.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5 uppercase font-mono tracking-wider">
            <Sliders size={13} className="text-zinc-400" />
            3. Photography Tips for Best Results
          </h3>
          <ul className="text-xs text-zinc-300 space-y-1.5 list-disc list-inside bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-800/60 leading-relaxed">
            <li>Ensure balanced lighting on your face without harsh backlit shadows.</li>
            <li>Center your subject inside the viewport alignment guides.</li>
            <li>For high likeness retention, keep the Identity Fidelity slider at 80%–95%.</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="px-4 py-2 min-h-[38px] rounded-xl bg-white text-black font-semibold text-xs transition-all active:scale-95"
          >
            Got It
          </button>
        </div>
      </div>
    </dialog>
  );
}
