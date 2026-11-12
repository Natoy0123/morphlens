import React from 'react';
import { User, UserCheck, Accessibility, Crop } from 'lucide-react';

const MODES = [
  { id: 'headshot', label: 'Headshot', ratio: '1:1', icon: User },
  { id: 'half_body', label: 'Half Body', ratio: '4:5', icon: UserCheck },
  { id: 'full_body', label: 'Full Body', ratio: '9:16', icon: Accessibility },
  { id: 'auto', label: 'Three-Quarter', ratio: '3:4', icon: Crop },
];

export default function FramingSelector({ currentMode, onSelectMode }) {
  return (
    <div className="w-full select-none">
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-900/90 border border-zinc-800/80 rounded-2xl shadow-inner sm:flex sm:items-center sm:justify-center sm:gap-1 sm:overflow-x-auto sm:no-scrollbar">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          const isActive = currentMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => onSelectMode(mode.id)}
              className={`w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-[13px] sm:text-xs font-semibold transition-all active:scale-95 sm:w-auto sm:flex-shrink-0 ${
                isActive
                  ? 'bg-zinc-800 text-white shadow-md border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Icon
                size={14}
                className={`flex-shrink-0 ${isActive ? 'text-zinc-100' : 'text-zinc-500'}`}
              />
              <span>{mode.label}</span>
              <span className="text-xs font-mono text-zinc-500">{mode.ratio}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
