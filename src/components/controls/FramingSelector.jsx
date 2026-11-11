import React from 'react';

const MODES = [
  { id: 'headshot', label: 'HEADSHOT', ratio: '1:1' },
  { id: 'half_body', label: 'HALF BODY', ratio: '4:5' },
  { id: 'full_body', label: 'FULL BODY', ratio: '9:16' },
  { id: 'auto', label: 'AUTO', ratio: '3:4' },
];

export default function FramingSelector({ currentMode, onSelectMode }) {
  return (
    <div className="w-full flex justify-center select-none py-1.5">
      <div className="flex items-center justify-center gap-4 sm:gap-7 px-3 max-w-full">
        {MODES.map((mode) => {
          const isActive = currentMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSelectMode(mode.id)}
              className="group relative flex flex-col items-center py-1.5 px-1 transition-all flex-shrink-0 min-h-[40px] justify-center"
            >
              <span
                className={`text-xs sm:text-sm font-bold tracking-wider transition-all ${
                  isActive
                    ? 'text-amber-400 scale-105'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {mode.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
