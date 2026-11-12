import React, { useState } from 'react';
import {
  SlidersHorizontal,
  ChevronDown,
  KeyRound,
  AlertCircle,
  ExternalLink,
  Check,
  Layers,
  ArrowRight,
  Trash2,
  Loader2,
  Sparkles,
  Sliders,
  Tag,
} from 'lucide-react';
import { PRESET_CATEGORIES, STYLE_PRESETS } from '../../store/presets';
import { isValidApiKey, maskApiKey } from '../../api/apiKey';
import { validateApiKey } from '../../api/generateApi';
import { enhancePrompt } from '../../api/promptEnhancer';

const STYLE_TAGS = [
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
  onRemoveCapture,
  apiKey,
  onApiKeyChange,
  error,
  retryAfter,
}) {
  const [activeTab, setActiveTab] = useState('presets'); // 'presets' | 'custom'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showLikenessDetails, setShowLikenessDetails] = useState(false);
  const [showModifiers, setShowModifiers] = useState(false);
  const [showNegative, setShowNegative] = useState(false);
  const [showAccess, setShowAccess] = useState(false);

  const [isEnhancing, setIsEnhancing] = useState(false);
  const [keyDraft, setKeyDraft] = useState(apiKey);
  const [keyError, setKeyError] = useState('');
  const [keyWarning, setKeyWarning] = useState('');
  const [keyStatus, setKeyStatus] = useState('idle');

  const handleEnhance = async () => {
    if (!prompt.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const enriched = await enhancePrompt({ prompt, apiKey });
      if (enriched && enriched !== prompt) {
        onPromptChange(enriched);
      }
    } finally {
      setIsEnhancing(false);
    }
  };

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
  const disabled = isGenerating || emptyPrompt || isBlocked;

  let ctaLabel = 'GENERATE PORTRAIT';
  if (emptyPrompt) ctaLabel = 'DESCRIBE YOUR PORTRAIT';
  else if (isGenerating) ctaLabel = 'SYNTHESIZING PORTRAIT…';
  else if (isBlocked) ctaLabel = `RETRY IN ${retryAfter}S`;
  else if (hasCapturedSubject) ctaLabel = 'REFACTOR PORTRAIT';
  else ctaLabel = 'GENERATE FROM PROMPT';

  const filteredPresets =
    selectedCategory === 'All'
      ? STYLE_PRESETS
      : STYLE_PRESETS.filter((p) => p.category === selectedCategory);

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-3xl p-3 sm:p-4.5 shadow-2xl relative">
      {/* 1. Studio Segmented Switcher */}
      <div className="flex p-1 bg-zinc-900/90 border border-zinc-800/80 rounded-2xl mb-3 flex-shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('presets')}
          className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
            activeTab === 'presets'
              ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Layers size={13} className={activeTab === 'presets' ? 'text-white' : 'text-zinc-400'} />
          <span>Curated Personas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('custom')}
          className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
            activeTab === 'custom'
              ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <SlidersHorizontal
            size={13}
            className={activeTab === 'custom' ? 'text-white' : 'text-zinc-400'}
          />
          <span>Custom Direction</span>
        </button>
      </div>

      {/* 2. Scrollable Body Content */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-0.5 no-scrollbar">
        {/* --- TAB 1: CURATED PRESETS --- */}
        {activeTab === 'presets' && (
          <div className="space-y-3">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              {PRESET_CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95 flex-shrink-0 ${
                      isActive
                        ? 'border-zinc-300 bg-white text-black font-semibold shadow-sm'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto overscroll-contain no-scrollbar pr-0.5">
              {filteredPresets.map((preset) => {
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
                    className={`p-3 rounded-2xl border text-left transition-all active:scale-[0.98] flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? 'border-white bg-zinc-900 shadow-md ring-1 ring-white/20'
                        : 'border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-xs font-semibold text-zinc-100 line-clamp-1">
                        {preset.name}
                      </span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-white text-black flex items-center justify-center flex-shrink-0 shadow">
                          <Check size={10} className="stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <span className="text-[10px] text-zinc-400 font-mono capitalize">
                      {preset.category}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Preset Snippet Preview */}
            <div className="p-2.5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl flex items-center justify-between text-xs text-zinc-300">
              <span className="truncate pr-2 text-zinc-400 text-[11px] font-sans">
                Active prompt: <span className="text-zinc-200">{prompt}</span>
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('custom')}
                className="text-[11px] text-zinc-400 hover:text-white underline flex-shrink-0"
              >
                Edit
              </button>
            </div>
          </div>
        )}

        {/* --- TAB 2: CUSTOM PROMPT --- */}
        {activeTab === 'custom' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <label
                htmlFor="persona-prompt"
                className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5"
              >
                Describe Style & Transformation
              </label>

              <button
                type="button"
                onClick={handleEnhance}
                disabled={isEnhancing || !prompt.trim()}
                className="flex items-center gap-1 text-[11px] font-medium text-amber-300 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/60 px-2.5 py-1 rounded-lg transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none shadow-sm"
                title="Expand with AI portrait lighting & fabric details"
              >
                {isEnhancing ? (
                  <>
                    <Loader2 size={12} className="animate-spin text-amber-300" />
                    <span>Enhancing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={12} className="text-amber-400" />
                    <span>Enhance with AI</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              id="persona-prompt"
              rows={4}
              value={prompt}
              onChange={(e) => {
                onPromptChange(e.target.value);
                if (selectedPreset !== 'custom') {
                  onSelectPreset({ id: 'custom', name: 'Custom Direction' });
                }
              }}
              placeholder="Describe what to wear, lighting, and scene atmosphere (e.g. Bespoke navy tailored suit with white collared dress shirt, pure white studio background)..."
              className="w-full px-3.5 py-2.5 bg-zinc-900/90 border border-zinc-800 focus:border-zinc-500 rounded-2xl text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none transition-colors resize-none leading-relaxed font-sans"
            />

            {/* Quick Modifiers Collapsible Tray */}
            <div>
              <button
                type="button"
                onClick={() => setShowModifiers(!showModifiers)}
                className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 py-1"
              >
                <Tag size={11} />
                <span>{showModifiers ? 'Hide Modifier Tags' : '+ Add Photography Modifiers'}</span>
              </button>

              {showModifiers && (
                <div className="flex flex-wrap gap-1.5 pt-1.5 animate-in fade-in duration-150">
                  {STYLE_TAGS.map((tag) => {
                    const isApplied = prompt.toLowerCase().includes(tag.toLowerCase());
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition-all active:scale-95 ${
                          isApplied
                            ? 'border-zinc-400 bg-zinc-800 text-white font-semibold'
                            : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                        }`}
                      >
                        {isApplied ? '✓ ' : '+ '}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Negative Exclusions Drawer */}
            <div>
              <button
                type="button"
                onClick={() => setShowNegative(!showNegative)}
                className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 py-1"
              >
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-150 ${showNegative ? 'rotate-180' : ''}`}
                />
                <span>Negative Exclusions</span>
              </button>

              {showNegative && (
                <div className="pt-1.5 animate-in fade-in duration-150">
                  <input
                    type="text"
                    value={negativePrompt}
                    onChange={(e) => onNegativePromptChange(e.target.value)}
                    placeholder="Features to suppress (e.g. blurry, oversaturated, deformed hands)..."
                    aria-label="Negative prompt"
                    className="w-full px-3 py-1.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 font-sans"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. Contextual Identity & Preservation Card */}
        {hasCapturedSubject ? (
          <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-zinc-200">
                  Identity Lock: {Math.round(likeness * 100)}%
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLikenessDetails(!showLikenessDetails)}
                  className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 bg-zinc-800/80 hover:bg-zinc-800 px-2 py-0.5 rounded-lg border border-zinc-700/60 transition-colors"
                >
                  <Sliders size={11} />
                  <span>{showLikenessDetails ? 'Hide' : 'Fine-Tune'}</span>
                </button>

                {onRemoveCapture && (
                  <button
                    type="button"
                    onClick={onRemoveCapture}
                    className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 px-2 py-0.5 rounded-lg transition-colors active:scale-95"
                    title="Remove attached photo"
                  >
                    <Trash2 size={11} />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>

            {showLikenessDetails && (
              <div className="pt-2 border-t border-zinc-800/80 space-y-3 animate-in fade-in duration-150">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                    <span>Facial Likeness Fidelity</span>
                    <span className="font-mono text-zinc-200 font-medium">
                      {Math.round(likeness * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="1.0"
                    step="0.05"
                    value={likeness}
                    onChange={(e) => onLikenessChange(parseFloat(e.target.value))}
                    aria-label="Identity retention"
                    className="w-full accent-white cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-zinc-500 mt-0.5">
                    <span>FLEXIBLE</span>
                    <span>STRICT</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-1.5 text-zinc-300 cursor-pointer select-none">
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
                    <span>Lock Body Pose</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-zinc-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={preserveEnvironment}
                      onChange={(e) => onPreserveEnvironmentChange?.(e.target.checked)}
                      className="rounded bg-zinc-800 border-zinc-700 text-white focus:ring-0 focus:ring-offset-0"
                    />
                    <span>Preserve Background</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="px-3 py-2 bg-zinc-900/30 border border-zinc-850 rounded-2xl flex items-center justify-between text-[11px] text-zinc-400">
            <span className="truncate">Generating pure persona from prompt</span>
            <span className="text-zinc-500 font-mono text-[10px]">Photo Detached</span>
          </div>
        )}
      </div>

      {/* 4. Docked / Sticky Primary CTA Action Footer */}
      <div className="sticky bottom-0 pt-2.5 pb-0.5 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-900 flex-shrink-0 z-10 space-y-2">
        {/* Error alert */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 p-2.5 bg-red-950/50 border border-red-800/60 rounded-xl text-xs text-red-200"
          >
            <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
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
          className={`w-full min-h-[48px] sm:min-h-[50px] py-3 px-5 rounded-2xl font-bold text-xs sm:text-sm tracking-wide uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg ${
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

        {/* Footer Sub-links (Key Access) */}
        <div className="flex items-center justify-between px-1 text-[11px] text-zinc-500">
          <button
            type="button"
            onClick={() => setShowAccess((prev) => !prev)}
            className="flex items-center gap-1 hover:text-zinc-300 transition-colors"
          >
            <KeyRound size={11} className={apiKey ? 'text-emerald-400' : 'text-zinc-500'} />
            <span>{apiKey ? `Key Connected (${maskApiKey(apiKey)})` : 'Pollinations Key'}</span>
          </button>
          <span className="text-[10px] font-mono text-zinc-600">FLUX.1 KONTEXT PRO</span>
        </div>

        {/* Expandable Key Drawer */}
        {showAccess && (
          <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-2 animate-in slide-in-from-bottom-2 duration-150">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Adding a Pollinations API key enables direct high-speed FLUX.1 Kontext Pro editing without queue limits.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={keyDraft}
                onChange={(e) => setKeyDraft(e.target.value)}
                placeholder="sk_..."
                autoComplete="off"
                aria-label="Pollinations API key"
                className="flex-1 min-w-0 min-h-[36px] px-3 py-1.5 bg-black/60 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 font-mono"
              />
              <button
                type="button"
                onClick={handleSaveKey}
                disabled={keyStatus === 'checking'}
                className="px-3 min-h-[36px] rounded-xl bg-white hover:bg-zinc-200 disabled:bg-zinc-700 text-black font-semibold text-xs flex items-center gap-1 flex-shrink-0 active:scale-95"
              >
                <Check size={12} />
                {keyStatus === 'checking' ? 'Checking' : 'Save'}
              </button>
            </div>
            {keyError && <p className="text-xs text-red-300">{keyError}</p>}
            {keyWarning && <p className="text-xs text-amber-300">{keyWarning}</p>}
            <div className="flex items-center justify-between gap-2 pt-1 text-xs">
              <a
                href="https://enter.pollinations.ai"
                target="_blank"
                rel="noreferrer"
                className="text-zinc-400 hover:text-white inline-flex items-center gap-1"
              >
                Get a key <ExternalLink size={10} />
              </a>
              {apiKey && (
                <button
                  type="button"
                  onClick={handleRemoveKey}
                  className="text-zinc-500 hover:text-red-400"
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
