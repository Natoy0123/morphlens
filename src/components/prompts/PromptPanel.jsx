import React from 'react';
import { Sparkles, Sliders, Wand2, Compass } from 'lucide-react';
import { STYLE_PRESETS } from '../../store/presets';

export default function PromptPanel({
  prompt,
  onPromptChange,
  selectedPreset,
  onSelectPreset,
  likeness,
  onLikenessChange,
  framingMode,
  isGenerating,
  onGenerate,
  hasCapturedSubject,
}) {
  const filteredPresets = STYLE_PRESETS.filter(
    (p) => framingMode === 'auto' || p.framingCompatibility.includes(framingMode)
  );

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5 bg-zinc-950 border border-zinc-800/80 rounded-3xl select-none">
      {/* Visual Style Cards / Presets */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400 flex items-center gap-1.5">
            <Compass size={12} className="text-amber-400" />
            Persona Aesthetic
          </span>
          <span className="text-[10px] font-mono text-zinc-500">PRESET DIRECTORY</span>
        </div>

        <div className="flex overflow-x-auto no-scrollbar gap-2 py-1 -mx-1 px-1 md:flex-wrap">
          {filteredPresets.map((preset) => {
            const isSelected = selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all active:scale-95 flex-shrink-0 ${
                  isSelected
                    ? 'border-white bg-white text-black font-semibold shadow-md'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Persona Prompt Textarea */}
      <div>
        <div className="flex items-center justify-between mb-1.5 px-1">
          <label className="text-[11px] font-mono tracking-wider uppercase text-zinc-400">
            Synthesis Prompt
          </label>
          <span className="text-[10px] text-zinc-500 font-mono">NATURAL LANGUAGE</span>
        </div>
        <textarea
          rows={2}
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Describe your subject, attire, lighting, and world..."
          className="w-full px-3.5 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors resize-none leading-relaxed font-sans"
        />
      </div>

      {/* Likeness Slider */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5 px-1 font-mono">
          <span className="text-[11px] uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Sliders size={11} className="text-amber-400" />
            Identity Retention
          </span>
          <span className="font-bold text-amber-400">{Math.round(likeness * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.3"
          max="1.0"
          step="0.05"
          value={likeness}
          onChange={(e) => onLikenessChange(parseFloat(e.target.value))}
          className="w-full accent-amber-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
        />
        <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-1 px-1">
          <span>CREATIVE DRIFT</span>
          <span>STRICT LIKENESS</span>
        </div>
      </div>

      {/* Generate CTA Button */}
      <button
        type="button"
        disabled={isGenerating || !hasCapturedSubject}
        onClick={onGenerate}
        className={`w-full py-3.5 px-4 rounded-xl font-semibold text-xs tracking-wide flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
          !hasCapturedSubject
            ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800/60'
            : isGenerating
            ? 'bg-zinc-800 text-zinc-300 cursor-wait animate-pulse'
            : 'bg-white hover:bg-zinc-200 text-black shadow-lg shadow-white/10'
        }`}
      >
        <Sparkles size={14} className={hasCapturedSubject ? 'text-black' : 'text-zinc-600'} />
        {isGenerating
          ? 'SYNTHESIZING PERSONA...'
          : !hasCapturedSubject
          ? 'CAPTURE SUBJECT TO BEGIN'
          : 'RENDER PERSONA'}
      </button>
    </div>
  );
}
