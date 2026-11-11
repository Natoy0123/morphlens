import React, { useState } from 'react';
import { Sparkles, Sliders, Wand2, Compass, ChevronDown, ChevronUp } from 'lucide-react';
import { STYLE_PRESETS } from '../../store/presets';

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

  const handleToggleTag = (tag) => {
    if (prompt.toLowerCase().includes(tag.toLowerCase())) {
      const regex = new RegExp(`(,\\s*)?${tag}`, 'gi');
      onPromptChange(prompt.replace(regex, '').replace(/^,\s*/, '').trim());
    } else {
      const updated = prompt.trim() ? `${prompt.trim()}, ${tag}` : tag;
      onPromptChange(updated);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 bg-zinc-950 border border-zinc-800/80 rounded-3xl select-none">
      {/* Prompt-First Direction Input (text-base prevents iOS auto-zoom) */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <label className="text-xs sm:text-sm font-mono tracking-wider uppercase text-zinc-200 flex items-center gap-1.5 font-bold">
            <Wand2 size={14} className="text-amber-400" />
            Persona Creative Direction
          </label>
          <span className="text-xs text-zinc-500 font-mono">PROMPT-DRIVEN</span>
        </div>

        <textarea
          rows={3}
          value={prompt}
          onChange={(e) => {
            onPromptChange(e.target.value);
            if (selectedPreset !== 'custom') {
              onSelectPreset({ id: 'custom', name: 'Custom Direction' });
            }
          }}
          placeholder="Describe your subject, attire, lighting, and world (e.g. Victorian detective in foggy London street, sharp tweed coat, 85mm portrait)..."
          className="w-full px-4 py-3 bg-zinc-900/90 border border-zinc-800 focus:border-zinc-500 rounded-xl text-sm sm:text-base text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-colors resize-none leading-relaxed font-sans"
        />
      </div>

      {/* Quick Inspiration Presets */}
      <div>
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-xs font-mono tracking-wider uppercase text-zinc-400 font-medium">
            Quick Inceptions / Presets
          </span>
          <span className="text-xs text-zinc-500">Tap to populate</span>
        </div>

        <div className="flex overflow-x-auto no-scrollbar gap-2 py-1 -mx-1 px-1">
          {STYLE_PRESETS.map((preset) => {
            const isSelected = selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium border transition-all active:scale-95 flex-shrink-0 ${
                  isSelected
                    ? 'border-white bg-white text-black font-semibold shadow-md'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-white hover:border-zinc-700'
                }`}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modular Aesthetic Modifiers */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-mono tracking-wider uppercase text-zinc-400 font-medium">
            Style & Lens Modifiers
          </span>
          <span className="text-xs text-zinc-500">Tap to toggle</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {STYLE_TAGS.map((tag) => {
            const isApplied = prompt.toLowerCase().includes(tag.toLowerCase());
            return (
              <button
                key={tag}
                type="button"
                onClick={() => handleToggleTag(tag)}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border transition-all active:scale-95 ${
                  isApplied
                    ? 'border-amber-400/80 bg-amber-400/15 text-amber-300 font-semibold'
                    : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
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
      <div className="pt-1.5">
        <div className="flex items-center justify-between text-xs sm:text-sm mb-1.5 px-1 font-mono">
          <span className="uppercase tracking-wider text-zinc-300 flex items-center gap-1.5 font-bold">
            <Sliders size={13} className="text-amber-400" />
            Identity Retention
          </span>
          <span className="font-bold text-amber-400 text-sm">{Math.round(likeness * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.3"
          max="1.0"
          step="0.05"
          value={likeness}
          onChange={(e) => onLikenessChange(parseFloat(e.target.value))}
          className="w-full accent-amber-400 cursor-pointer h-2 bg-zinc-800 rounded-lg"
        />
        <div className="flex justify-between text-xs font-mono text-zinc-500 mt-1.5 px-1 font-medium">
          <span>HIGH CREATIVITY</span>
          <span>STRICT PHYSIQUE</span>
        </div>
      </div>

      {/* Advanced Drawer Toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs font-mono text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors px-1"
        >
          {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {showAdvanced ? 'HIDE NEGATIVE PROMPT' : 'ADVANCED NEGATIVE PROMPT'}
        </button>
        {showAdvanced && (
          <div className="mt-2">
            <input
              type="text"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="Features to suppress (e.g. blurry, cartoonish)..."
              className="w-full px-3.5 py-2 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 font-mono"
            />
          </div>
        )}
      </div>

      {/* Generate Persona CTA Button */}
      <button
        type="button"
        disabled={isGenerating || !hasCapturedSubject}
        onClick={onGenerate}
        className={`w-full py-4 px-5 rounded-2xl font-bold text-sm sm:text-base tracking-wider uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-xl ${
          !hasCapturedSubject
            ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800/60'
            : isGenerating
            ? 'bg-zinc-800 text-zinc-200 cursor-wait animate-pulse'
            : 'bg-white hover:bg-zinc-200 text-black shadow-white/10'
        }`}
      >
        <Sparkles size={16} className={hasCapturedSubject ? 'text-black' : 'text-zinc-600'} />
        {isGenerating
          ? 'SYNTHESIZING FROM PROMPT...'
          : !hasCapturedSubject
          ? 'CAPTURE SUBJECT FIRST'
          : 'SYNTHESIZE PERSONA'}
      </button>
    </div>
  );
}
