import React from 'react';
import { FRAMING_MODES } from '../../store/presets';

const MODES = [
  { id: 'headshot', label: 'HEADSHOT', ratio: '1:1' },
  { id: 'half_body', label: 'HALF BODY', ratio: '4:5' },
  { id: 'full_body', label: 'FULL BODY', ratio: '9:16' },
  { id: 'auto', label: 'AUTO', ratio: 'ADAPTIVE' },
];

export default function FramingSelector({ currentMode, onSelectMode }) {
  return (
    <div className="w-full flex flex-col items-center gap-1.5 select-none">
      {/* Apple Camera-style horizontal mode dial */}
      <div className="flex items-center justify-center gap-5 sm:gap-7 py-1 px-4 overflow-x-auto no-scrollbar">
        {MODES.map((mode) => {
          const isActive = currentMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSelectMode(mode.id)}
              className="group relative flex flex-col items-center py-1 transition-all"
            >
              <span
                className={`text-[11px] font-semibold tracking-[0.14em] transition-all ${
                  isActive
                    ? 'text-amber-400 scale-105'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {mode.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-amber-400 mt-1 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
