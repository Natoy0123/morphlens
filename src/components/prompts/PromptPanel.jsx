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
    <div className="flex flex-col gap-3 p-3.5 sm:p-5 bg-zinc-950 border border-zinc-800/80 rounded-2xl">
      {/* Prompt-First Direction Input */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5 px-1">
          <label
            htmlFor="persona-prompt"
            className="text-xs sm:text-sm font-mono tracking-wider uppercase text-zinc-200 flex items-center gap-1.5 font-bold"
          >
            <Wand2 size={14} className="text-amber-400 flex-shrink-0" />
            Persona Creative Direction
          </label>
          <span className="hidden sm:inline text-xs text-zinc-400 font-mono flex-shrink-0">PROMPT-DRIVEN</span>
        </div>

        <textarea
          id="persona-prompt"
          rows={3}
          value={prompt}
          onChange={(e) => {
            onPromptChange(e.target.value);
            if (selectedPreset !== 'custom') {
              onSelectPreset({ id: 'custom', name: 'Custom Direction' });
            }
          }}
          placeholder="Describe your subject, attire, lighting, and world (e.g. Victorian detective in foggy London street, sharp tweed coat, 85mm portrait)..."
          className="w-full px-3.5 py-3 bg-zinc-900/90 border border-zinc-800 focus:border-zinc-500 rounded-xl text-base sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none transition-colors resize-none leading-relaxed font-sans"
        />
      </div>

      {/* Model access / identity mode */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        <button
          type="button"
          aria-expanded={showAccess}
          onClick={() => setShowAccess((open) => !open)}
          className="w-full min-h-[44px] flex items-center justify-between gap-2 px-3 py-3 text-left hover:bg-zinc-900/70 transition-colors"
        >
          <span className="flex items-center gap-2 min-w-0 text-xs sm:text-sm font-mono uppercase tracking-wider font-bold text-zinc-200">
            <KeyRound
              size={14}
              className={`flex-shrink-0 ${apiKey ? 'text-emerald-400' : 'text-amber-400'}`}
            />
            <span className="truncate">
              {apiKey ? (
                `Identity On · ${maskApiKey(apiKey)}`
              ) : (
                <>
                  Prompt-Only<span className="hidden min-[360px]:inline"> Mode</span>
                </>
              )}
            </span>
          </span>
          <span className="flex items-center gap-1 flex-shrink-0 text-xs font-semibold text-zinc-400">
            {apiKey ? 'MANAGE' : 'CONNECT KEY'}
            {showAccess ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </button>

        {showAccess && (
          <div className="px-3 pb-3 space-y-2 border-t border-zinc-800/80 pt-2.5">
            <p className="text-xs leading-relaxed text-zinc-300">
              Paste a Pollinations API key to use your photo as the identity and pose reference.
              It stays in this browser only.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={keyDraft}
                onChange={(e) => setKeyDraft(e.target.value)}
                placeholder="sk_..."
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                aria-label="Pollinations API key"
                className="flex-1 min-w-0 min-h-[44px] px-3 py-2.5 bg-black/60 border border-zinc-800 rounded-lg text-base sm:text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 font-mono"
              />
              <button
                type="button"
                onClick={handleSaveKey}
                className="px-3.5 min-h-[44px] rounded-lg bg-white hover:bg-zinc-200 text-black font-bold text-sm flex items-center gap-1 flex-shrink-0 active:scale-95"
              >
                <Check size={14} />
                Save
              </button>
            </div>
            {keyError && <p className="text-xs text-red-300 leading-relaxed">{keyError}</p>}
            <div className="flex items-center justify-between gap-2">
              <a
                href="https://enter.pollinations.ai"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-amber-300 hover:text-amber-200 inline-flex items-center gap-1 font-semibold py-1"
              >
                Get a Pollinations key
                <ExternalLink size={12} />
              </a>
              {apiKey && (
                <button
                  type="button"
                  onClick={handleRemoveKey}
                  className="text-xs text-zinc-300 hover:text-red-300 font-semibold py-1"
                >
                  Remove key
                </button>
              )}
            </div>
            <p className="text-xs leading-relaxed text-zinc-400">
              No key: text-to-image only. Your photo is ignored, free renders are limited to one
              every 45 seconds, and anonymous requests may be blocked.
            </p>
          </div>
        )}
      </div>

      {/* Quick Inspiration Presets */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-1 px-1">
          <span className="text-xs font-mono tracking-wider uppercase text-zinc-300 font-medium">
            Quick Presets
          </span>
          <span className="text-xs text-zinc-400">
            <span className="sm:hidden">Swipe →</span>
            <span className="hidden sm:inline">Tap to populate</span>
          </span>
        </div>

        <div className="relative">
          <div className="flex overflow-x-auto overscroll-x-contain no-scrollbar gap-2 py-1 -mx-1 pl-1 pr-7">
            {STYLE_PRESETS.map((preset) => {
              const isSelected = selectedPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectPreset(preset)}
                  className={`whitespace-nowrap px-3.5 min-h-[42px] rounded-xl text-sm font-medium border transition-all active:scale-95 flex-shrink-0 ${
                    isSelected
                      ? 'border-white bg-white text-black font-semibold shadow-md'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-200 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-7 bg-gradient-to-l from-zinc-950 to-transparent sm:hidden" />
        </div>
      </div>

      {/* Modular Aesthetic Modifiers */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5 px-1">
          <span className="text-xs font-mono tracking-wider uppercase text-zinc-300 font-medium">
            Style & Lens Modifiers
          </span>
          <span className="text-xs text-zinc-400">
            <span className="sm:hidden">Swipe →</span>
            <span className="hidden sm:inline">Tap to toggle</span>
          </span>
        </div>

        <div className="relative">
          <div className="flex overflow-x-auto overscroll-x-contain no-scrollbar gap-2 py-1 -mx-1 pl-1 pr-7">
            {STYLE_TAGS.map((tag) => {
              const isApplied = prompt.toLowerCase().includes(tag.toLowerCase());
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className={`whitespace-nowrap px-3 min-h-[40px] rounded-lg text-sm font-medium border transition-all active:scale-95 flex-shrink-0 ${
                    isApplied
                      ? 'border-amber-400/80 bg-amber-400/15 text-amber-300 font-semibold'
                      : 'border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100'
                  }`}
                >
                  {isApplied ? '✓ ' : '+ '}
                  {tag}
                </button>
              );
            })}
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-7 bg-gradient-to-l from-zinc-950 to-transparent sm:hidden" />
        </div>
      </div>

      {/* Identity Likeness Weight */}
      <div className="pt-1.5">
        <div className="flex items-center justify-between text-sm mb-1.5 px-1 font-mono">
          <span className="uppercase tracking-wider text-zinc-200 flex items-center gap-1.5 font-bold">
            <Sliders size={14} className="text-amber-400 flex-shrink-0" />
            Identity Retention
          </span>
          <span className={`font-bold ${apiKey ? 'text-amber-400' : 'text-zinc-500'}`}>
            {apiKey ? `${Math.round(likeness * 100)}%` : 'OFF'}
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
          aria-label="Identity retention"
          className="w-full accent-amber-400 cursor-pointer h-2.5 bg-zinc-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
        />
        <div className="flex justify-between text-xs font-mono text-zinc-400 mt-2 px-1 font-medium">
          <span>CREATIVE FREEDOM</span>
          <span>STRICT IDENTITY</span>
        </div>
        <p className="text-xs leading-relaxed text-zinc-400 mt-1.5 px-1">
          {apiKey
            ? 'Your photo is sent as the identity reference on each render.'
            : 'Photo identity is off. Connect a key to match your face; otherwise only the text prompt is rendered.'}
        </p>
      </div>

      {/* Advanced Drawer Toggle */}
      <div>
        <button
          type="button"
          aria-expanded={showAdvanced}
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full min-h-[44px] flex items-center gap-1.5 px-1 py-2 text-xs sm:text-sm font-mono text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {showAdvanced ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          {showAdvanced ? 'HIDE NEGATIVE PROMPT' : 'ADVANCED NEGATIVE PROMPT'}
        </button>
        {showAdvanced && (
          <div className="mt-2">
            <input
              type="text"
              value={negativePrompt}
              onChange={(e) => onNegativePromptChange(e.target.value)}
              placeholder="Features to suppress (e.g. blurry, cartoonish)..."
              aria-label="Negative prompt"
              className="w-full min-h-[44px] px-3.5 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-base sm:text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 font-mono"
            />
          </div>
        )}
      </div>

      {/* Error / cooldown */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-sm text-red-200"
        >
          <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
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
        className={`w-full min-h-[56px] py-4 px-5 rounded-2xl font-bold text-base tracking-wide uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-xl ${
          !hasCapturedSubject || emptyPrompt || isBlocked
            ? 'bg-zinc-900 text-zinc-500 cursor-not-allowed border border-zinc-800/60'
            : isGenerating
              ? 'bg-zinc-800 text-zinc-200 cursor-wait animate-pulse'
              : 'bg-white hover:bg-zinc-200 text-black shadow-white/10'
        }`}
      >
        <Sparkles
          size={17}
          className={!hasCapturedSubject || emptyPrompt || isBlocked ? 'text-zinc-500' : 'text-black'}
        />
        {ctaLabel}
      </button>
    </div>
  );
}
