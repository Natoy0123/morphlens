import React from 'react';
import { User, UserCheck, Accessibility, Sparkles } from 'lucide-react';

const MODES = [
  { id: 'headshot', label: 'Headshot', ratio: '1:1', icon: User },
  { id: 'half_body', label: 'Half Body', ratio: '4:5', icon: UserCheck },
  { id: 'full_body', label: 'Full Body', ratio: '9:16', icon: Accessibility },
  { id: 'auto', label: 'Auto', ratio: '3:4', icon: Sparkles },
];

export default function FramingSelector({ currentMode, onSelectMode }) {
  return (
    <div className="w-full flex items-center justify-center select-none py-1">
      {/* Sleek Segmented Pill Control */}
      <div className="flex items-center gap-1 p-1 bg-zinc-900/90 border border-zinc-800/80 rounded-2xl max-w-full overflow-x-auto no-scrollbar shadow-inner">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          const isActive = currentMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSelectMode(mode.id)}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all flex-shrink-0 active:scale-95 ${
                isActive
                  ? 'bg-zinc-800 text-white shadow-md border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon size={13} className={isActive ? 'text-amber-400' : 'text-zinc-400'} />
              <span>{mode.label}</span>
              <span className={`text-[10px] font-normal ${isActive ? 'text-zinc-400' : 'text-zinc-400'}`}>
                {mode.ratio}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
