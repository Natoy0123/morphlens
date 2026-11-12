import React, { useState } from 'react';
import {
  SlidersHorizontal,
  KeyRound,
  AlertCircle,
  Check,
  ArrowRight,
  Trash2,
  Loader2,
  Sparkles,
  RotateCcw,
  UserCheck,
  Shirt,
  Briefcase,
  Laptop,
  Stethoscope,
  Camera,
  Film,
  Building2,
  Sun,
  Coffee,
  Compass,
  Zap,
  Shield,
  Palette,
} from 'lucide-react';
import { STYLE_PRESETS } from '../../store/presets';
import { maskApiKey } from '../../api/apiKey';
import { enhancePrompt } from '../../api/promptEnhancer';
import AdjustmentsDialog from './AdjustmentsDialog';

const PRESET_ICON_MAP = {
  Shirt,
  Briefcase,
  Laptop,
  Stethoscope,
  Sparkles,
  Camera,
  Film,
  Building2,
  Sun,
  Coffee,
  Compass,
  Zap,
  Shield,
  Palette,
};

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
  capturedImage,
  onChangeCapture,
  onRemoveCapture,
  apiKey,
  onApiKeyChange,
  error,
  retryAfter,
}) {
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

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

  const emptyPrompt = !prompt.trim();
  const isBlocked = retryAfter > 0;
  const disabled = isGenerating || emptyPrompt || isBlocked;

  let ctaLabel = 'Generate Portrait';
  if (emptyPrompt) ctaLabel = 'Describe Your Portrait';
  else if (isGenerating) ctaLabel = 'Synthesizing Portrait...';
  else if (isBlocked) ctaLabel = `Retry in ${retryAfter}s`;
  else if (hasCapturedSubject) ctaLabel = 'Generate Portrait';
  else ctaLabel = 'Generate Portrait';

  return (
    <div className="flex flex-col h-full bg-zinc-950/80 border border-zinc-800/90 rounded-2xl sm:rounded-3xl p-3 sm:p-4.5 shadow-xl relative min-h-0">
      {/* 1. Top Reference Subject Bar */}
      {hasCapturedSubject ? (
        <div className="p-2.5 bg-zinc-900/70 border border-zinc-800 rounded-2xl flex-shrink-0 mb-3.5">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              {capturedImage ? (
                <img
                  src={capturedImage}
                  alt="Reference"
                  className="w-10 h-10 rounded-xl object-cover border border-zinc-700 flex-shrink-0 shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                  <UserCheck size={18} className="text-zinc-300" />
                </div>
              )}
              <div className="min-w-0">
                <span className="text-sm font-semibold text-white block truncate">
                  Subject Attached
                </span>
                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                  <span className="text-xs text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded font-mono font-medium">
                    {Math.round(likeness * 100)}% match
                  </span>
                  {preservePose && (
                    <span className="text-xs text-zinc-400 bg-zinc-850 px-2 py-0.5 rounded">
                      Pose locked
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {onChangeCapture && (
                <button
                  type="button"
                  onClick={onChangeCapture}
                  className="text-xs px-3 py-1.5 min-h-[36px] rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700/80 transition-all flex items-center gap-1.5 active:scale-95"
                  title="Change reference photo"
                >
                  <RotateCcw size={12} />
                  <span>Change</span>
                </button>
              )}

              {onRemoveCapture && (
                <button
                  type="button"
                  onClick={onRemoveCapture}
                  className="text-xs px-3 py-1.5 min-h-[36px] rounded-xl bg-red-950/40 hover:bg-red-900/50 text-red-300 hover:text-white border border-red-900/50 transition-all flex items-center gap-1.5 active:scale-95"
                  title="Remove reference photo"
                >
                  <Trash2 size={12} className="text-red-400" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="px-3.5 py-2.5 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex items-center justify-between text-xs text-zinc-300 flex-shrink-0 mb-3.5">
          <span className="font-medium">Direct text-to-image studio mode</span>
          {onChangeCapture && (
            <button
              type="button"
              onClick={onChangeCapture}
              className="text-xs text-white underline font-semibold flex-shrink-0 ml-2"
            >
              + Add Photo
            </button>
          )}
        </div>
      )}

      {/* 2. Scrollable Body: Presets, Prompt, and Quick Adjustments */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-0.5 no-scrollbar">
        {/* Style Presets Carousel */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-sm font-semibold text-zinc-200">
              Style Presets
            </span>
            <span className="text-xs text-zinc-400">
              Tap to apply
            </span>
          </div>

          <div className="flex items-stretch gap-2.5 overflow-x-auto no-scrollbar py-1 overscroll-x-contain">
            {STYLE_PRESETS.map((preset) => {
              const isSelected = selectedPreset === preset.id;
              const IconComponent = PRESET_ICON_MAP[preset.icon] || Sparkles;

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
                  className={`w-32 sm:w-36 flex-shrink-0 p-3 rounded-2xl border text-left transition-all active:scale-95 flex flex-col justify-between gap-2.5 ${
                    isSelected
                      ? 'border-white bg-zinc-800 text-white shadow-md ring-1 ring-white/30'
                      : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-100 shadow-sm">
                      <IconComponent size={16} />
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-white text-black flex items-center justify-center flex-shrink-0 shadow">
                        <Check size={10} className="stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-zinc-100 block truncate">
                      {preset.name}
                    </span>
                    <span className="text-xs text-zinc-400 capitalize block truncate mt-0.5">
                      {preset.category}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Creative Direction Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <label
              htmlFor="persona-prompt"
              className="text-sm font-semibold text-zinc-200"
            >
              Creative Direction
            </label>

            <button
              type="button"
              onClick={handleEnhance}
              disabled={isEnhancing || !prompt.trim()}
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 px-3 py-1.5 rounded-xl transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none shadow-sm"
              title="Expand with photographic lighting & fabric details"
            >
              {isEnhancing ? (
                <>
                  <Loader2 size={13} className="animate-spin text-zinc-200" />
                  <span>Enhancing...</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} className="text-zinc-300" />
                  <span>Enhance</span>
                </>
              )}
            </button>
          </div>

          <textarea
            id="persona-prompt"
            rows={3}
            value={prompt}
            onChange={(e) => {
              onPromptChange(e.target.value);
              if (selectedPreset !== 'custom') {
                onSelectPreset({ id: 'custom', name: 'Custom' });
              }
            }}
            placeholder="Describe attire, background, lighting, or atmosphere (e.g. Bespoke navy tailored suit with white collared dress shirt, pure white studio background)..."
            className="w-full px-3.5 py-3 bg-zinc-900/90 border border-zinc-800 focus:border-zinc-500 rounded-2xl text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none transition-colors resize-none leading-relaxed font-sans"
          />
        </div>

        {/* Consolidated Studio Adjustments Bar */}
        <button
          type="button"
          onClick={() => setShowAdjustments(true)}
          className="w-full p-3 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl flex items-center justify-between text-xs sm:text-sm text-zinc-300 transition-all active:scale-[0.99] group shadow-sm"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 flex-shrink-0 group-hover:text-white group-hover:bg-zinc-700 transition-colors">
              <SlidersHorizontal size={14} />
            </div>
            <span className="font-semibold text-zinc-200 truncate">
              Studio Adjustments
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 text-xs text-zinc-400">
            <span>{Math.round(likeness * 100)}% likeness</span>
            <span>•</span>
            <span>{preservePose ? 'Pose locked' : 'Pose free'}</span>
            <span className="text-zinc-200 font-medium ml-1">Edit ▾</span>
          </div>
        </button>
      </div>

      {/* 3. Primary CTA Action Footer */}
      <div className="pt-3 bg-zinc-950/95 border-t border-zinc-900 flex-shrink-0 z-10 space-y-2.5">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 bg-red-950/60 border border-red-800/80 rounded-2xl text-xs text-red-200"
          >
            <AlertCircle size={15} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-red-100">{error}</p>
              {retryAfter > 0 && <p className="mt-1 font-mono text-red-300">Retry in {retryAfter}s</p>}
            </div>
          </div>
        )}

        <button
          type="button"
          disabled={disabled}
          onClick={onGenerate}
          className={`w-full min-h-[48px] sm:min-h-[52px] py-3 px-5 rounded-2xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg ${
            disabled
              ? 'bg-zinc-900 text-zinc-500 cursor-not-allowed border border-zinc-800'
              : isGenerating
                ? 'bg-zinc-800 text-zinc-200 cursor-wait animate-pulse'
                : 'bg-white hover:bg-zinc-200 text-black shadow-white/5'
          }`}
        >
          <span>{ctaLabel}</span>
          {!disabled && !isGenerating && <ArrowRight size={16} />}
        </button>

        <div className="flex items-center justify-between px-1 text-xs text-zinc-400">
          <button
            type="button"
            onClick={() => setShowAdjustments(true)}
            className="flex items-center gap-1.5 hover:text-zinc-200 transition-colors"
          >
            <KeyRound size={12} className={apiKey ? 'text-emerald-400' : 'text-zinc-400'} />
            <span>{apiKey ? `Key Connected (${maskApiKey(apiKey)})` : 'Pollinations Key'}</span>
          </button>
          <span className="text-xs font-mono text-zinc-400 font-medium">Studio v1.0</span>
        </div>
      </div>

      {/* Studio Adjustments Dialog */}
      {showAdjustments && (
        <AdjustmentsDialog
          isOpen={showAdjustments}
          onClose={() => setShowAdjustments(false)}
          likeness={likeness}
          onLikenessChange={onLikenessChange}
          preservePose={preservePose}
          onPreservePoseChange={onPreservePoseChange}
          preserveBody={preserveBody}
          onPreserveBodyChange={onPreserveBodyChange}
          preserveEnvironment={preserveEnvironment}
          onPreserveEnvironmentChange={onPreserveEnvironmentChange}
          prompt={prompt}
          onPromptChange={onPromptChange}
          negativePrompt={negativePrompt}
          onNegativePromptChange={onNegativePromptChange}
          apiKey={apiKey}
          onApiKeyChange={onApiKeyChange}
        />
      )}
    </div>
  );
}
