import React, { useState } from 'react';
import {
  Sparkles,
  Sliders,
  Wand2,
  ChevronDown,
  ChevronUp,
  KeyRound,
  AlertCircle,
  ExternalLink,
  Check,
} from 'lucide-react';
import { STYLE_PRESETS } from '../../store/presets';
import { isValidApiKey, maskApiKey } from '../../api/apiKey';

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
  negativePrompt,
  onNegativePromptChange,
  isGenerating,
  onGenerate,
  hasCapturedSubject,
  apiKey,
  onApiKeyChange,
  error,
  retryAfter,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAccess, setShowAccess] = useState(() => !apiKey);
  const [keyDraft, setKeyDraft] = useState(apiKey);
  const [keyError, setKeyError] = useState('');

  const handleToggleTag = (tag) => {
    if (prompt.toLowerCase().includes(tag.toLowerCase())) {
      const regex = new RegExp(`(,\\s*)?${tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
      onPromptChange(prompt.replace(regex, '').replace(/^,\s*/, '').trim());
    } else {
      const updated = prompt.trim() ? `${prompt.trim()}, ${tag}` : tag;
      onPromptChange(updated);
    }
  };

  const handleSaveKey = () => {
    const value = keyDraft.trim();
    if (!value) {
      onApiKeyChange('');
      setKeyError('');
      return;
    }
    if (!isValidApiKey(value)) {
      setKeyError('That key does not look valid. Paste the full key from enter.pollinations.ai.');
      return;
    }
    onApiKeyChange(value);
    setKeyDraft(value);
    setKeyError('');
    setShowAccess(false);
  };

  const handleRemoveKey = () => {
    onApiKeyChange('');
    setKeyDraft('');
    setKeyError('');
  };

  const emptyPrompt = !prompt.trim();
  const isBlocked = retryAfter > 0;
  const disabled = isGenerating || !hasCapturedSubject || emptyPrompt || isBlocked;

  let ctaLabel = 'SYNTHESIZE PERSONA';
  if (!hasCapturedSubject) ctaLabel = 'CAPTURE SUBJECT FIRST';
  else if (emptyPrompt) ctaLabel = 'DESCRIBE YOUR PERSONA';
  else if (isGenerating) ctaLabel = 'SYNTHESIZING…';
  else if (isBlocked) ctaLabel = `RETRY IN ${retryAfter}S`;

  return (
    <div className="flex flex-col gap-3 p-3.5 sm:p-5 bg-zinc-950 border border-zinc-800/80 rounded-2xl select-none">
      {/* Prompt-First Direction Input */}
      <div>
        <div className="flex items-center justify-between mb-1.5 px-1">
          <label className="text-[11px] sm:text-xs font-mono tracking-wider uppercase text-zinc-300 flex items-center gap-1.5 font-bold">
            <Wand2 size={13} className="text-amber-400" />
            Persona Creative Direction
          </label>
          <span className="text-[10px] text-zinc-500 font-mono">PROMPT-DRIVEN</span>
        </div>

        <textarea
          rows={2}
          value={prompt}
          onChange={(e) => {
            onPromptChange(e.target.value);
            if (selectedPreset !== 'custom') {
              onSelectPreset({ id: 'custom', name: 'Custom Direction' });
            }
          }}
          placeholder="Describe your subject, attire, lighting, and world (e.g. Victorian detective in foggy London street, sharp tweed coat, 85mm portrait)..."
          className="w-full px-3.5 py-2.5 bg-zinc-900/90 border border-zinc-800 focus:border-zinc-500 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-colors resize-none leading-relaxed font-sans"
        />
      </div>

      {/* Model access / identity mode */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAccess((open) => !open)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-zinc-900/70 transition-colors"
        >
          <span className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider font-bold text-zinc-300">
            <KeyRound size={12} className={apiKey ? 'text-emerald-400' : 'text-amber-400'} />
            {apiKey ? `Identity On · ${maskApiKey(apiKey)}` : 'Prompt-Only Mode'}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-semibold text-zinc-500">
            {apiKey ? 'MANAGE' : 'CONNECT KEY'}
            {showAccess ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </span>
        </button>

        {showAccess && (
          <div className="px-3 pb-3 space-y-2 border-t border-zinc-800/80 pt-2.5">
            <p className="text-[11px] leading-relaxed text-zinc-400">
              Paste a Pollinations API key to send your captured photo as an identity and pose
              reference. The key is stored in this browser only.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={keyDraft}
                onChange={(e) => setKeyDraft(e.target.value)}
                placeholder="sk_..."
                autoComplete="off"
                spellCheck={false}
                className="flex-1 min-w-0 px-3 py-2 bg-black/60 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 font-mono"
              />
              <button
                type="button"
                onClick={handleSaveKey}
                className="px-3 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-bold text-xs flex items-center gap-1 flex-shrink-0 active:scale-95"
              >
                <Check size={12} />
                Save
              </button>
            </div>
            {keyError && <p className="text-[11px] text-red-300">{keyError}</p>}
            <div className="flex items-center justify-between gap-2">
              <a
                href="https://enter.pollinations.ai"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-amber-300 hover:text-amber-200 inline-flex items-center gap-1 font-semibold"
              >
                Get a Pollinations key
                <ExternalLink size={10} />
              </a>
              {apiKey && (
                <button
                  type="button"
                  onClick={handleRemoveKey}
                  className="text-[11px] text-zinc-400 hover:text-red-300 font-semibold"
                >
                  Remove key
                </button>
              )}
            </div>
            <p className="text-[10px] leading-relaxed text-zinc-500">
              Without a key, renders are text-to-image only: your photo is not used, the free tier
              is limited to one image every 45 seconds, and the provider may block anonymous
              requests.
            </p>
          </div>
        )}
      </div>

      {/* Quick Inspiration Presets */}
      <div>
        <div className="flex items-center justify-between mb-1 px-1">
          <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400 font-medium">
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
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400 font-medium">
            Style & Lens Modifiers
          </span>
          <span className="text-[11px] text-zinc-500">Tap to toggle</span>
        </div>

        <div className="flex overflow-x-auto no-scrollbar gap-1.5 py-1 -mx-1 px-1">
          {STYLE_TAGS.map((tag) => {
            const isApplied = prompt.toLowerCase().includes(tag.toLowerCase());
            return (
              <button
                key={tag}
                type="button"
                onClick={() => handleToggleTag(tag)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 flex-shrink-0 ${
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
          <span className={`font-bold text-sm ${apiKey ? 'text-amber-400' : 'text-zinc-600'}`}>
            {Math.round(likeness * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0.3"
          max="1.0"
          step="0.05"
          value={likeness}
          disabled={!apiKey}
          onChange={(e) => onLikenessChange(parseFloat(e.target.value))}
          className="w-full accent-amber-400 cursor-pointer h-2 bg-zinc-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
        />
        <div className="flex justify-between text-xs font-mono text-zinc-500 mt-1.5 px-1 font-medium">
          <span>HIGH CREATIVITY</span>
          <span>STRICT PHYSIQUE</span>
        </div>
        <p className="text-[10px] leading-relaxed text-zinc-500 mt-1.5 px-1">
          {apiKey
            ? 'Your photo is sent as the identity reference on each render.'
            : 'Photo identity is off. Connect a key to match your face; otherwise only the text prompt is rendered.'}
        </p>
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
              onChange={(e) => onNegativePromptChange(e.target.value)}
              placeholder="Features to suppress (e.g. blurry, cartoonish)..."
              className="w-full px-3.5 py-2 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 font-mono"
            />
          </div>
        )}
      </div>

      {/* Error / cooldown */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-xs text-red-200"
        >
          <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-red-100 leading-relaxed">{error}</p>
            {retryAfter > 0 && (
              <p className="mt-1 font-mono text-red-300">RETRY IN {retryAfter}S</p>
            )}
          </div>
        </div>
      )}

      {/* Generate Persona CTA Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={onGenerate}
        className={`w-full py-4 px-5 rounded-2xl font-bold text-sm sm:text-base tracking-wider uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-xl ${
          !hasCapturedSubject || emptyPrompt || isBlocked
            ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800/60'
            : isGenerating
              ? 'bg-zinc-800 text-zinc-200 cursor-wait animate-pulse'
              : 'bg-white hover:bg-zinc-200 text-black shadow-white/10'
        }`}
      >
        <Sparkles
          size={16}
          className={!hasCapturedSubject || emptyPrompt || isBlocked ? 'text-zinc-600' : 'text-black'}
        />
        {ctaLabel}
      </button>
    </div>
  );
}
