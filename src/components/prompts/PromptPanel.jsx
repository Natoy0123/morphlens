import React, { useState } from 'react';
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  KeyRound,
  AlertCircle,
  ExternalLink,
  Check,
  Lock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { STYLE_PRESETS } from '../../store/presets';
import { isValidApiKey, maskApiKey } from '../../api/apiKey';
import { validateApiKey } from '../../api/generateApi';

const STYLE_TAGS = [
  '85mm Portrait Lens',
  'Studio Rim Lighting',
  'Natural Skin Texture',
  'Soft Ambient Bokeh',
  '35mm Analog Grain',
  'Sharp Focus',
  'Cinematic Lighting',
  'High Contrast B&W',
  'Golden Hour Warmth',
];

export default function PromptPanel({
  prompt,
  onPromptChange,
  selectedPreset,
  onSelectPreset,
  likeness,
  onLikenessChange,
  preserveBody = true,
  onPreserveBodyChange,
  preservePose = true,
  onPreservePoseChange,
  preserveEnvironment = false,
  onPreserveEnvironmentChange,
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
  const [showAccess, setShowAccess] = useState(false);
  const [keyDraft, setKeyDraft] = useState(apiKey);
  const [keyError, setKeyError] = useState('');
  const [keyWarning, setKeyWarning] = useState('');
  const [keyStatus, setKeyStatus] = useState('idle');

  const handleToggleTag = (tag) => {
    if (prompt.toLowerCase().includes(tag.toLowerCase())) {
      const regex = new RegExp(`(,\\s*)?${tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
      onPromptChange(prompt.replace(regex, '').replace(/^,\s*/, '').trim());
    } else {
      const updated = prompt.trim() ? `${prompt.trim()}, ${tag}` : tag;
      onPromptChange(updated);
    }
  };

  const handleSaveKey = async () => {
    const value = keyDraft.trim();
    if (!value) {
      onApiKeyChange('');
      setKeyError('');
      setKeyWarning('');
      return;
    }
    if (!isValidApiKey(value)) {
      setKeyError('Invalid key format. Paste your full key from enter.pollinations.ai.');
      return;
    }

    setKeyStatus('checking');
    setKeyError('');
    setKeyWarning('');
    try {
      await validateApiKey(value);
      onApiKeyChange(value);
      setKeyDraft(value);
      setShowAccess(false);
    } catch (err) {
      if (err?.code === 'INVALID_KEY') {
        setKeyError(err.message);
      } else {
        onApiKeyChange(value);
        setKeyDraft(value);
        setKeyWarning(
          'Key saved, but could not be verified online right now. You can still proceed.'
        );
      }
    } finally {
      setKeyStatus('idle');
    }
  };

  const handleRemoveKey = () => {
    onApiKeyChange('');
    setKeyDraft('');
    setKeyError('');
    setKeyWarning('');
  };

  const emptyPrompt = !prompt.trim();
  const isBlocked = retryAfter > 0;
  const disabled = isGenerating || !hasCapturedSubject || emptyPrompt || isBlocked;

  let ctaLabel = 'GENERATE PORTRAIT';
  if (!hasCapturedSubject) ctaLabel = 'CAPTURE PHOTO FIRST';
  else if (emptyPrompt) ctaLabel = 'DESCRIBE YOUR PORTRAIT';
  else if (isGenerating) ctaLabel = 'GENERATING PORTRAIT…';
  else if (isBlocked) ctaLabel = `RETRY IN ${retryAfter}S`;

  return (
    <div className="flex flex-col gap-3.5 p-3.5 sm:p-5 bg-zinc-950 border border-zinc-800 rounded-2xl">
      {/* Prompt Direction Input */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5 px-1">
          <label
            htmlFor="persona-prompt"
            className="text-xs sm:text-sm font-semibold text-zinc-200 flex items-center gap-1.5"
          >
            <SlidersHorizontal size={14} className="text-zinc-400 flex-shrink-0" />
            Style & Transformation Direction
          </label>
          <span className="hidden sm:inline text-xs text-zinc-500 font-mono flex-shrink-0">
            PROMPT CONTROL
          </span>
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
          placeholder="Describe how to style or transform your portrait (e.g. Sharp tailored charcoal suit, soft studio rim lighting, 85mm portrait)..."
          className="w-full px-3.5 py-3 bg-zinc-900/90 border border-zinc-800 focus:border-zinc-500 rounded-xl text-base sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none transition-colors resize-none leading-relaxed font-sans"
        />
      </div>

      {/* Preservation & Conditioning Controls */}
      <div className="p-3 bg-zinc-900/40 border border-zinc-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
            <Lock size={13} className="text-zinc-400" />
            Preservation Controls
          </span>
          <span className="text-[11px] font-mono text-zinc-400">
            {hasCapturedSubject ? 'Active' : 'Awaiting Photo'}
          </span>
        </div>

        {/* Likeness Slider */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1 px-0.5 font-medium">
            <span className="text-zinc-300">Face & Identity Fidelity</span>
            <span className="font-mono text-zinc-200">{Math.round(likeness * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.3"
            max="1.0"
            step="0.05"
            value={likeness}
            onChange={(e) => onLikenessChange(parseFloat(e.target.value))}
            aria-label="Identity retention"
            className="w-full accent-white cursor-pointer h-2 bg-zinc-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-1 px-0.5">
            <span>FLEXIBLE STYLE</span>
            <span>STRICT FACE LOCK</span>
          </div>
        </div>

        {/* Checkbox Toggles for Body & Environment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-zinc-800/80">
          <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={preservePose && preserveBody}
              onChange={(e) => {
                const val = e.target.checked;
                onPreservePoseChange?.(val);
                onPreserveBodyChange?.(val);
              }}
              className="rounded bg-zinc-800 border-zinc-700 text-white focus:ring-0 focus:ring-offset-0"
            />
            <span>Lock Stance & Body Pose</span>
          </label>

          <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={preserveEnvironment}
              onChange={(e) => onPreserveEnvironmentChange?.(e.target.checked)}
              className="rounded bg-zinc-800 border-zinc-700 text-white focus:ring-0 focus:ring-offset-0"
            />
            <span>Preserve Original Background</span>
          </label>
        </div>
      </div>

      {/* Quick Curated Presets */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5 px-1">
          <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <Layers size={13} className="text-zinc-400" />
            Curated Styles
          </span>
          <span className="text-xs text-zinc-500 hidden sm:inline">Tap to apply</span>
        </div>

        <div className="relative">
          <div className="flex overflow-x-auto overscroll-x-contain no-scrollbar gap-2 py-1 -mx-1 pl-1 pr-6">
            {STYLE_PRESETS.map((preset) => {
              const isSelected = selectedPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    onSelectPreset(preset);
                    if (typeof preset.preserveEnvironment === 'boolean') {
                      onPreserveEnvironmentChange?.(preset.preserveEnvironment);
                    }
                  }}
                  className={`whitespace-nowrap px-3.5 min-h-[38px] rounded-xl text-xs font-medium border transition-all active:scale-95 flex-shrink-0 ${
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
          <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-zinc-950 to-transparent sm:hidden" />
        </div>
      </div>

      {/* Style & Lens Modifiers */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-1 px-1">
          <span className="text-xs font-semibold text-zinc-400">Photographic Modifiers</span>
          <span className="text-xs text-zinc-500 hidden sm:inline">Add/Remove</span>
        </div>

        <div className="relative">
          <div className="flex overflow-x-auto overscroll-x-contain no-scrollbar gap-1.5 py-1 -mx-1 pl-1 pr-6">
            {STYLE_TAGS.map((tag) => {
              const isApplied = prompt.toLowerCase().includes(tag.toLowerCase());
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className={`whitespace-nowrap px-2.5 min-h-[34px] rounded-lg text-xs font-medium border transition-all active:scale-95 flex-shrink-0 ${
                    isApplied
                      ? 'border-zinc-400 bg-zinc-800 text-white font-semibold'
                      : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {isApplied ? '✓ ' : '+ '}
                  {tag}
                </button>
              );
            })}
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-zinc-950 to-transparent sm:hidden" />
        </div>
      </div>

      {/* Advanced Settings Drawer */}
      <div>
        <button
          type="button"
          aria-expanded={showAdvanced}
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full min-h-[38px] flex items-center gap-1.5 px-1 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          <span>{showAdvanced ? 'Hide Negative Prompt' : 'Negative Prompt & Exclusion'}</span>
        </button>
        {showAdvanced && (
          <div className="mt-1.5">
            <input
              type="text"
              value={negativePrompt}
              onChange={(e) => onNegativePromptChange(e.target.value)}
              placeholder="Features to suppress (e.g. blurry, oversaturated, deformed hands)..."
              aria-label="Negative prompt"
              className="w-full min-h-[40px] px-3.5 py-2 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 font-sans"
            />
          </div>
        )}
      </div>

      {/* Model & API Access */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowAccess((prev) => !prev)}
          className="w-full min-h-[36px] flex items-center justify-between text-xs text-zinc-400 hover:text-zinc-200 px-1 py-1"
        >
          <span className="flex items-center gap-1.5">
            <KeyRound size={13} className={apiKey ? 'text-emerald-400' : 'text-zinc-500'} />
            <span>{apiKey ? `Key Connected (${maskApiKey(apiKey)})` : 'Pollinations Key (Optional)'}</span>
          </span>
          <span className="text-[11px] text-zinc-500">{showAccess ? 'Hide' : 'Configure'}</span>
        </button>

        {showAccess && (
          <div className="mt-2 p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-2">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Adding a Pollinations API key enables direct high-speed FLUX.1 Kontext Pro editing without queue limits. Without a key, generation runs through the free tier.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={keyDraft}
                onChange={(e) => setKeyDraft(e.target.value)}
                placeholder="sk_..."
                autoComplete="off"
                aria-label="Pollinations API key"
                className="flex-1 min-w-0 min-h-[40px] px-3 py-2 bg-black/60 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 font-mono"
              />
              <button
                type="button"
                onClick={handleSaveKey}
                disabled={keyStatus === 'checking'}
                className="px-3.5 min-h-[40px] rounded-lg bg-white hover:bg-zinc-200 disabled:bg-zinc-700 text-black font-semibold text-xs flex items-center gap-1 flex-shrink-0 active:scale-95"
              >
                <Check size={13} />
                {keyStatus === 'checking' ? 'Checking' : 'Save'}
              </button>
            </div>
            {keyError && <p className="text-xs text-red-300 leading-relaxed">{keyError}</p>}
            {keyWarning && <p className="text-xs text-amber-300 leading-relaxed">{keyWarning}</p>}
            <div className="flex items-center justify-between gap-2 pt-1">
              <a
                href="https://enter.pollinations.ai"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1 font-medium"
              >
                Get a key
                <ExternalLink size={11} />
              </a>
              {apiKey && (
                <button
                  type="button"
                  onClick={handleRemoveKey}
                  className="text-xs text-zinc-500 hover:text-red-400 font-medium"
                >
                  Disconnect key
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error alert */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-xs text-red-200"
        >
          <AlertCircle size={15} className="text-red-400 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-red-100">{error}</p>
            {retryAfter > 0 && <p className="mt-1 font-mono text-red-300">Retry in {retryAfter}s</p>}
          </div>
        </div>
      )}

      {/* Generate Action Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={onGenerate}
        className={`w-full min-h-[52px] py-3.5 px-5 rounded-xl font-semibold text-sm tracking-wide uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg ${
          disabled
            ? 'bg-zinc-900 text-zinc-500 cursor-not-allowed border border-zinc-800'
            : isGenerating
              ? 'bg-zinc-800 text-zinc-200 cursor-wait animate-pulse'
              : 'bg-white hover:bg-zinc-200 text-black shadow-white/5'
        }`}
      >
        <span>{ctaLabel}</span>
        {!disabled && !isGenerating && <ArrowRight size={15} />}
      </button>
    </div>
  );
}
