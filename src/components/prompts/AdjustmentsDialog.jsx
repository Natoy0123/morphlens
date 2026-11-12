import React, { useEffect, useRef, useState } from 'react';
import {
  SlidersHorizontal,
  X,
  User,
  Shield,
  Tag,
  Check,
  Plus,
  ExternalLink,
  Server,
  FileCode,
} from 'lucide-react';
import { isValidApiKey, maskApiKey } from '../../api/apiKey';
import { validateApiKey, validateCustomEndpoint } from '../../api/generateApi';

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

export default function AdjustmentsDialog({
  isOpen,
  onClose,
  likeness,
  onLikenessChange,
  preservePose = true,
  onPreservePoseChange,
  preserveBody = true,
  onPreserveBodyChange,
  preserveEnvironment = false,
  onPreserveEnvironmentChange,
  prompt,
  onPromptChange,
  negativePrompt,
  onNegativePromptChange,
  apiKey,
  onApiKeyChange,
  engineMode = 'pollinations',
  onEngineModeChange,
  customEndpoint = '',
  onCustomEndpointChange,
}) {
  const dialogRef = useRef(null);

  const [keyDraft, setKeyDraft] = useState(apiKey || '');
  const [keyError, setKeyError] = useState('');
  const [keyWarning, setKeyWarning] = useState('');
  const [keyStatus, setKeyStatus] = useState('idle');

  const [endpointDraft, setEndpointDraft] = useState(customEndpoint || '');
  const [endpointError, setEndpointError] = useState('');
  const [endpointSuccess, setEndpointSuccess] = useState('');
  const [endpointStatus, setEndpointStatus] = useState('idle');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [isOpen]);

  const handleBackdropClick = (e) => {
    if (e.target === dialogRef.current) onClose();
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
    } catch (err) {
      if (err?.code === 'INVALID_KEY') {
        setKeyError(err.message);
      } else {
        onApiKeyChange(value);
        setKeyDraft(value);
        setKeyWarning('Key saved, but could not be verified online right now.');
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

  const handleSaveEndpoint = async () => {
    const value = endpointDraft.trim().replace(/\/+$/, '');
    if (!value) {
      onCustomEndpointChange?.('');
      setEndpointError('');
      setEndpointSuccess('');
      return;
    }

    setEndpointStatus('testing');
    setEndpointError('');
    setEndpointSuccess('');
    try {
      const res = await validateCustomEndpoint(value);
      onCustomEndpointChange?.(value);
      setEndpointDraft(value);
      setEndpointSuccess(`Connected to ${res.model || 'FLUX.1 Backend'}`);
    } catch (err) {
      setEndpointError(err?.message || 'Could not connect to self-hosted endpoint.');
    } finally {
      setEndpointStatus('idle');
    }
  };

  const handleRemoveEndpoint = () => {
    onCustomEndpointChange?.('');
    setEndpointDraft('');
    setEndpointError('');
    setEndpointSuccess('');
  };

  const likenessLabel =
    likeness >= 0.8
      ? 'High Fidelity (Faithfully preserves facial structure and eyes)'
      : likeness >= 0.5
        ? 'Balanced (Naturally harmonizes features with the creative style)'
        : 'Creative Freedom (Allows more stylistic variation in appearance)';

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={handleBackdropClick}
      aria-labelledby="adjustments-title"
      className="p-0 bg-transparent text-zinc-100 max-w-xl w-[94vw] rounded-2xl shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-sm m-auto focus:outline-none"
    >
      <div className="p-5 sm:p-6 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col gap-5 max-h-[85dvh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200">
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <h2 id="adjustments-title" className="text-base font-bold text-white">
                Studio Adjustments
              </h2>
              <p className="text-xs text-zinc-400">
                Fine-tune identity fidelity, pose lock, exclusions, and key access
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close adjustments"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 1. Identity Likeness Fidelity */}
        <div className="space-y-2 p-3.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
          <div className="flex items-center justify-between">
            <label
              htmlFor="likeness-slider"
              className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5"
            >
              <User size={14} className="text-zinc-400" />
              <span>Facial Likeness Fidelity</span>
            </label>
            <span className="text-xs font-mono font-bold text-white bg-zinc-800 px-2 py-0.5 rounded">
              {Math.round(likeness * 100)}%
            </span>
          </div>

          <input
            id="likeness-slider"
            type="range"
            min="0.3"
            max="1.0"
            step="0.05"
            value={likeness}
            onChange={(e) => onLikenessChange(parseFloat(e.target.value))}
            className="w-full accent-white cursor-pointer h-2 bg-zinc-800 rounded-lg"
          />

          <div className="flex items-center justify-between text-xs text-zinc-400 pt-0.5">
            <span>Flexible (30%)</span>
            <span>Strict (100%)</span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed pt-1">
            {likenessLabel}
          </p>
        </div>

        {/* 2. Pose & Background Anchors */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-zinc-300 block">
            Physical Anchors
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 cursor-pointer select-none hover:border-zinc-700 transition-colors">
              <input
                type="checkbox"
                checked={preservePose && preserveBody}
                onChange={(e) => {
                  const val = e.target.checked;
                  onPreservePoseChange?.(val);
                  onPreserveBodyChange?.(val);
                }}
                className="rounded bg-zinc-800 border-zinc-700 text-white focus:ring-0 focus:ring-offset-0 mt-0.5"
              />
              <div>
                <span className="font-semibold text-zinc-200 block">Lock Body Pose</span>
                <span className="text-zinc-400 text-xs block leading-relaxed mt-0.5">
                  Maintains exact head tilt, shoulder posture, and stance.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 cursor-pointer select-none hover:border-zinc-700 transition-colors">
              <input
                type="checkbox"
                checked={preserveEnvironment}
                onChange={(e) => onPreserveEnvironmentChange?.(e.target.checked)}
                className="rounded bg-zinc-800 border-zinc-700 text-white focus:ring-0 focus:ring-offset-0 mt-0.5"
              />
              <div>
                <span className="font-semibold text-zinc-200 block">Keep Background</span>
                <span className="text-zinc-400 text-xs block leading-relaxed mt-0.5">
                  Preserves the existing room, environment, and background textures.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* 3. Photography Modifiers */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <Tag size={13} className="text-zinc-400" />
            <span>Photography Modifiers</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {STYLE_TAGS.map((tag) => {
              const isApplied = prompt.toLowerCase().includes(tag.toLowerCase());
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 flex items-center gap-1.5 ${
                    isApplied
                      ? 'border-white bg-white text-black font-semibold shadow-sm'
                      : 'border-zinc-800 bg-zinc-950/70 text-zinc-300 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  {isApplied ? (
                    <Check size={12} className="stroke-[2.5]" />
                  ) : (
                    <Plus size={12} />
                  )}
                  <span>{tag}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Negative Prompt Exclusions */}
        <div className="space-y-1.5">
          <label htmlFor="adjustments-negative" className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <Shield size={13} className="text-zinc-400" />
            <span>Negative Exclusions (Suppress Details)</span>
          </label>
          <input
            id="adjustments-negative"
            type="text"
            value={negativePrompt}
            onChange={(e) => onNegativePromptChange(e.target.value)}
            placeholder="Features to suppress (e.g. blurry, oversaturated, deformed hands)..."
            className="w-full px-3.5 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-zinc-600 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none font-sans"
          />
        </div>

        {/* 5. Inference Engine & Backend Provider */}
        <div className="space-y-3 p-3.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <Server size={14} className="text-zinc-400" />
              <span>Inference Engine</span>
            </span>

            {/* Engine Mode Tabs */}
            <div className="flex items-center p-0.5 bg-zinc-900 border border-zinc-800 rounded-lg">
              <button
                type="button"
                onClick={() => onEngineModeChange?.('pollinations')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  engineMode === 'pollinations'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Pollinations Cloud
              </button>
              <button
                type="button"
                onClick={() => onEngineModeChange?.('self-hosted')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  engineMode === 'self-hosted'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Self-Hosted FLUX.1
              </button>
            </div>
          </div>

          {engineMode === 'pollinations' ? (
            /* Pollinations Cloud API Key Settings */
            <div className="space-y-2 pt-1 border-t border-zinc-800/60">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">
                  Cloud FLUX.1 Kontext Pro & Klein endpoints
                </span>
                {apiKey && (
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-2 py-0.5 rounded">
                    Key Connected ({maskApiKey(apiKey)})
                  </span>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <input
                  type="password"
                  value={keyDraft}
                  onChange={(e) => setKeyDraft(e.target.value)}
                  placeholder="sk_..."
                  autoComplete="off"
                  className="flex-1 min-w-0 px-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-zinc-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleSaveKey}
                  disabled={keyStatus === 'checking'}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-zinc-200 disabled:bg-zinc-700 text-black font-semibold text-xs flex items-center gap-1.5 flex-shrink-0 active:scale-95 transition-colors"
                >
                  <Check size={13} />
                  <span>{keyStatus === 'checking' ? 'Testing' : 'Save'}</span>
                </button>
              </div>

              {keyError && <p className="text-xs text-red-300 font-medium">{keyError}</p>}
              {keyWarning && <p className="text-xs text-amber-300 font-medium">{keyWarning}</p>}

              <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                <a
                  href="https://enter.pollinations.ai"
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-400 hover:text-white inline-flex items-center gap-1"
                >
                  Get a Pollinations Key <ExternalLink size={11} />
                </a>
                {apiKey && (
                  <button
                    type="button"
                    onClick={handleRemoveKey}
                    className="text-xs text-zinc-400 hover:text-red-400 transition-colors"
                  >
                    Disconnect Key
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Self-Hosted / Colab Backend Settings */
            <div className="space-y-2 pt-1 border-t border-zinc-800/60">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">
                  Cloudflare Tunnel / Local GPU Endpoint
                </span>
                {customEndpoint && (
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-2 py-0.5 rounded">
                    Active Backend
                  </span>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <input
                  type="url"
                  value={endpointDraft}
                  onChange={(e) => setEndpointDraft(e.target.value)}
                  placeholder="https://random-id.trycloudflare.com or http://localhost:8000"
                  autoComplete="off"
                  className="flex-1 min-w-0 px-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-zinc-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleSaveEndpoint}
                  disabled={endpointStatus === 'testing'}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-zinc-200 disabled:bg-zinc-700 text-black font-semibold text-xs flex items-center gap-1.5 flex-shrink-0 active:scale-95 transition-colors"
                >
                  <Check size={13} />
                  <span>{endpointStatus === 'testing' ? 'Testing' : 'Connect'}</span>
                </button>
              </div>

              {endpointError && <p className="text-xs text-red-300 font-medium">{endpointError}</p>}
              {endpointSuccess && <p className="text-xs text-emerald-300 font-medium">{endpointSuccess}</p>}

              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-zinc-200">
                    <FileCode size={14} className="text-zinc-400" />
                    <span>Free Google Colab Backend</span>
                  </div>
                  <a
                    href="https://colab.research.google.com/github/Natoy0123/morphlens/blob/main/backend/colab_flux_server.ipynb"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors shadow-sm"
                  >
                    <span>1-Click Open in Colab</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Click the button above to launch FLUX.1 [schnell] on a free Google T4 GPU. Once running, copy the printed Cloudflare Tunnel URL and paste it into the field above.
                </p>
              </div>

              {customEndpoint && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleRemoveEndpoint}
                    className="text-xs text-zinc-400 hover:text-red-400 transition-colors"
                  >
                    Disconnect Endpoint
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end border-t border-zinc-800 flex-shrink-0">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="px-5 py-2 min-h-[40px] rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-all active:scale-95 shadow-md"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </dialog>
  );
}
