import React, { useState } from 'react';
import { Sparkles, Sliders, Wand2, Compass, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { STYLE_PRESETS } from '../../store/presets';

// Quick style modifiers you can append or remove dynamically
const STYLE_TAGS = [
  '85mm Portrait Bokeh',
  'Cinematic Rim Lighting',
  'Cybernetic Implants',
  'Kodak 35mm Grain',
  'Matte Armor Plating',
  'Volumetric Fog',
  'Golden Hour Sunlight',
  'Studio Charcoal Suit',
  'Ufotable Anime Style',
];

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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [negativePrompt, setNegativePrompt] = useState('blurry, deformed, oversaturated, low quality');

  // Toggle quick modifier tag into the prompt
  const handleToggleTag = (tag) => {
    if (prompt.toLowerCase().includes(tag.toLowerCase())) {
      // Remove tag
      const regex = new RegExp(`(,\\s*)?${tag}`, 'gi');
      onPromptChange(prompt.replace(regex, '').replace(/^,\s*/, '').trim());
    } else {
      // Append tag
      const updated = prompt.trim() ? `${prompt.trim()}, ${tag}` : tag;
      onPromptChange(updated);
    }
  };

  return (
    <div className="flex flex-col gap-3.5 p-4 sm:p-5 bg-zinc-950 border border-zinc-800/80 rounded-3xl select-none">
      {/* Prompt-First Direction Input */}
      <div>
        <div className="flex items-center justify-between mb-1.5 px-1">
          <label className="text-[11px] font-mono tracking-wider uppercase text-zinc-300 flex items-center gap-1.5 font-bold">
            <Wand2 size={12} className="text-amber-400" />
            Persona Creative Direction
          </label>
          <span className="text-[10px] text-zinc-500 font-mono">PROMPT-DRIVEN</span>
        </div>

        <textarea
          rows={3}
          value={prompt}
          onChange={(e) => {
            onPromptChange(e.target.value);
            // Auto-switch to custom preset state when typing
            if (selectedPreset !== 'custom') {
              onSelectPreset({ id: 'custom', name: 'Custom Direction' });
            }
          }}
          placeholder="Type any character, clothing, lighting, or scene (e.g. Victorian detective in foggy London street, sharp tweed coat, cinematic lighting)..."
          className="w-full px-3.5 py-2.5 bg-zinc-900/90 border border-zinc-800 focus:border-zinc-500 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-colors resize-none leading-relaxed font-sans"
        />
      </div>

      {/* Quick Inspiration Presets (Optional Starters) */}
      <div>
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-400">
            Quick Inceptions / Presets
          </span>
          <span className="text-[10px] text-zinc-500">Tap to populate</span>
        </div>

        <div className="flex overflow-x-auto no-scrollbar gap-1.5 py-1 -mx-1 px-1">
          {STYLE_PRESETS.map((preset) => {
            const isSelected = selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset)}
                className={`whitespace-nowrap px-3 py-1 rounded-lg text-xs font-medium border transition-all active:scale-95 flex-shrink-0 ${
                  isSelected
                    ? 'border-white bg-white text-black font-semibold'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modular Aesthetic Modifiers (One-Tap Add/Remove) */}
      <div>
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-400">
            Style & Lens Modifiers
          </span>
          <span className="text-[10px] text-zinc-500">Tap to toggle</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {STYLE_TAGS.map((tag) => {
            const isApplied = prompt.toLowerCase().includes(tag.toLowerCase());
            return (
              <button
                key={tag}
                type="button"
                onClick={() => handleToggleTag(tag)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all active:scale-95 ${
                  isApplied
                    ? 'border-amber-400/80 bg-amber-400/10 text-amber-300'
                    : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                }`}
              >
                {isApplied ? '✓ ' : '+ '}
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Identity Likeness Weight */}
      <div className="pt-1">
        <div className="flex items-center justify-between text-xs mb-1 px-1 font-mono">
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
          <span>HIGH CREATIVITY</span>
          <span>STRICT PHYSIQUE</span>
        </div>
      </div>

      {/* Advanced Drawer Toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors px-1"
        >
          {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {showAdvanced ? 'HIDE NEGATIVE PROMPT' : 'ADVANCED NEGATIVE PROMPT'}
        </button>
        {showAdvanced && (
          <div className="mt-2">
            <input
              type="text"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="Features to suppress (e.g. blurry, cartoonish)..."
              className="w-full px-3 py-1.5 bg-zinc-900/80 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-zinc-600 font-mono"
            />
          </div>
        )}
      </div>

      {/* Generate Persona CTA Button */}
      <button
        type="button"
        disabled={isGenerating || !hasCapturedSubject}
        onClick={onGenerate}
        className={`w-full py-3.5 px-4 rounded-xl font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
          !hasCapturedSubject
            ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800/60'
            : isGenerating
            ? 'bg-zinc-800 text-zinc-300 cursor-wait animate-pulse'
            : 'bg-white hover:bg-zinc-200 text-black shadow-lg shadow-white/10'
        }`}
      >
        <Sparkles size={14} className={hasCapturedSubject ? 'text-black' : 'text-zinc-600'} />
        {isGenerating
          ? 'SYNTHESIZING FROM PROMPT...'
          : !hasCapturedSubject
          ? 'CAPTURE SUBJECT FIRST'
          : 'SYNTHESIZE PERSONA'}
      </button>
    </div>
  );
}
