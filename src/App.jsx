import React, { useEffect, useRef, useState } from 'react';
import { Camera, Wand2, Sparkles, RotateCcw, Shield } from 'lucide-react';
import FramingSelector from './components/controls/FramingSelector';
import CaptureViewport from './components/capture/CaptureViewport';
import PromptPanel from './components/prompts/PromptPanel';
import BeforeAfterSlider from './components/viewer/BeforeAfterSlider';
import { synthesizePersona } from './api/generateApi';
import { readApiKey, saveApiKey } from './api/apiKey';

export default function App() {
  const [framingMode, setFramingMode] = useState('headshot');
  const [capturedImage, setCapturedImage] = useState(null);
  const [prompt, setPrompt] = useState(
    'Cyberpunk operative in neon rain alleyway, matte armor, volumetric fog, 85mm portrait'
  );
  const [negativePrompt, setNegativePrompt] = useState(
    'blurry, deformed, oversaturated, low quality'
  );
  const [selectedPreset, setSelectedPreset] = useState('cyberpunk');
  const [likeness, setLikeness] = useState(0.85);
  const [apiKey, setApiKey] = useState(() => readApiKey());
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [identityUsed, setIdentityUsed] = useState(false);
  const [error, setError] = useState(null);
  const [retryUntil, setRetryUntil] = useState(0);
  const [clock, setClock] = useState(() => Date.now());
  const generatedRef = useRef(null);

  // Active step: 'scan' | 'style' | 'result'
  const [activeStep, setActiveStep] = useState('scan');

  useEffect(() => {
    if (!retryUntil) return undefined;
    let timer = null;
    const tick = () => {
      const now = Date.now();
      setClock(now);
      if (now < retryUntil) timer = setTimeout(tick, 1000);
    };
    timer = setTimeout(tick, 1000);
    return () => clearTimeout(timer);
  }, [retryUntil]);

  useEffect(
    () => () => {
      if (generatedRef.current) URL.revokeObjectURL(generatedRef.current);
    },
    []
  );

  const retryAfter = retryUntil > clock ? Math.ceil((retryUntil - clock) / 1000) : 0;

  const replaceGeneratedImage = (url) => {
    if (generatedRef.current && generatedRef.current !== url) {
      URL.revokeObjectURL(generatedRef.current);
    }
    generatedRef.current = url?.startsWith('blob:') ? url : null;
    setGeneratedImage(url);
  };

  const clearCooldown = () => {
    setRetryUntil(0);
    setClock(Date.now());
  };

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset.id);
    if (preset.prompt) {
      setPrompt(preset.prompt);
    }
    if (typeof preset.negativePrompt === 'string') {
      setNegativePrompt(preset.negativePrompt);
    }
  };

  const handleCapture = (img) => {
    setCapturedImage(img);
    replaceGeneratedImage(null);
    setIdentityUsed(false);
    setError(null);
    clearCooldown();
    setActiveStep('style');
  };

  const handleClearCapture = () => {
    setCapturedImage(null);
    replaceGeneratedImage(null);
    setIdentityUsed(false);
    setError(null);
    clearCooldown();
    setActiveStep('scan');
  };

  const handleApiKeyChange = (key) => {
    const stored = saveApiKey(key);
    setApiKey(stored);
    setError(null);
    clearCooldown();
  };

  const handleGenerate = async () => {
    if (!capturedImage || isGenerating) return;
    if (!prompt.trim()) {
      setError('Describe the persona you want before synthesizing.');
      return;
    }
    if (retryAfter > 0) return;

    setIsGenerating(true);
    setError(null);

    try {
      const result = await synthesizePersona({
        prompt,
        framingMode,
        likeness,
        capturedImage,
        negativePrompt,
        apiKey,
        styleId: selectedPreset,
      });
      replaceGeneratedImage(result.url);
      setIdentityUsed(result.identityUsed);
      clearCooldown();
      setActiveStep('result');
    } catch (err) {
      console.error('Synthesis error:', err);
      setError(err instanceof Error ? err.message : 'Synthesis failed. Try again.');
      if (err?.retryAfter) {
        setClock(Date.now());
        setRetryUntil(Date.now() + err.retryAfter * 1000);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setActiveStep('style');
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full max-w-full overflow-hidden bg-black text-zinc-100 flex flex-col justify-between antialiased selection:bg-zinc-800 selection:text-white">
      {/* Top Header */}
      <header className="flex-shrink-0 h-12 px-4 sm:px-6 border-b border-zinc-900 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center text-black font-black text-xs shadow-md">
            M
          </div>
          <span className="font-bold text-sm tracking-tight text-white">MorphLens</span>
          <span className="hidden min-[380px]:inline text-xs font-semibold text-zinc-300 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">
            Studio
          </span>
        </div>

        {/* Header Right Status */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 bg-zinc-900/80 border border-zinc-800/80 px-2.5 py-1 rounded-full">
            <Shield size={12} className={apiKey ? 'text-emerald-400' : 'text-amber-400'} />
            {apiKey ? 'Identity' : 'Prompt'} Mode
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 min-w-0 w-full max-w-6xl mx-auto px-3 sm:px-6 py-2 flex flex-col justify-start lg:justify-center items-center overflow-hidden">
        <div className="w-full h-full min-h-0 max-w-lg lg:max-w-none grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-8 items-start lg:items-center justify-items-center overflow-hidden">
          {/* CAMERA / VIEWFINDER / RESULT STAGE */}
          <div
            className={`w-full min-w-0 h-full min-h-0 lg:col-span-7 flex flex-col items-center justify-start lg:justify-center overflow-y-auto no-scrollbar lg:overflow-hidden ${
              activeStep === 'style' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {activeStep === 'result' && generatedImage ? (
              <BeforeAfterSlider
                originalImage={capturedImage}
                generatedImage={generatedImage}
                identityUsed={identityUsed}
                onReset={handleReset}
              />
            ) : (
              <div className="w-full min-w-0 min-h-full flex flex-col items-center justify-start lg:justify-center gap-2 overflow-x-hidden">
                {/* Viewfinder Lens */}
                <CaptureViewport
                  framingMode={framingMode}
                  capturedImage={capturedImage}
                  onCapture={handleCapture}
                  onClearCapture={handleClearCapture}
                />

                {/* Framing Mode Selector */}
                <div className="flex-shrink-0 w-full min-w-0 flex justify-center">
                  <FramingSelector
                    currentMode={framingMode}
                    onSelectMode={(mode) => setFramingMode(mode)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* CUSTOMIZER & PROMPT STAGE */}
          <div
            className={`w-full min-w-0 h-full min-h-0 lg:col-span-5 flex flex-col justify-start overflow-y-auto overscroll-contain no-scrollbar pb-5 lg:pb-2 ${
              activeStep === 'style' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Captured Subject Quick Banner on Mobile */}
            {capturedImage ? (
              <div className="lg:hidden flex items-center justify-between gap-2 p-2.5 mb-2.5 bg-zinc-950 border border-zinc-800 rounded-2xl w-full">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={capturedImage}
                    alt="Subject Preview"
                    className="w-11 h-11 rounded-xl object-cover border border-zinc-700 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-zinc-100 block truncate">
                      Subject Captured
                    </span>
                    <span className="text-xs text-zinc-400 uppercase font-semibold">
                      Mode: {framingMode}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClearCapture}
                  className="px-3 py-2 min-h-[40px] rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm font-medium flex items-center gap-1.5 hover:text-white flex-shrink-0 active:scale-95"
                >
                  <RotateCcw size={13} />
                  Retake
                </button>
              </div>
            ) : (
              <div className="lg:hidden flex items-center justify-between gap-2 p-3 mb-2.5 bg-zinc-950 border border-amber-500/30 rounded-2xl w-full">
                <div className="flex items-center gap-2 text-sm text-amber-300 font-semibold min-w-0">
                  <Camera size={16} className="flex-shrink-0 text-amber-400" />
                  <span className="truncate">No photo scanned yet</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStep('scan')}
                  className="px-3 py-2 min-h-[40px] bg-white text-black font-bold text-sm rounded-lg active:scale-95 flex-shrink-0"
                >
                  Open Camera
                </button>
              </div>
            )}

            {/* Framing Selector: mobile style step needs its own copy because the
                camera stage (which holds the other selector) is hidden here. */}
            <div className="lg:hidden w-full mb-2.5 p-2.5 bg-zinc-950 border border-zinc-800/80 rounded-2xl">
              <div className="flex items-center justify-between px-1 mb-1.5">
                <span className="text-xs font-mono tracking-wider uppercase text-zinc-300 font-semibold">
                  Framing
                </span>
                <span className="text-xs text-zinc-400">Tap to change</span>
              </div>
              <FramingSelector
                currentMode={framingMode}
                onSelectMode={(mode) => setFramingMode(mode)}
              />
            </div>

            {/* Desktop Framing Selector */}
            <div className="hidden lg:block mb-3 p-3 bg-zinc-950 border border-zinc-900 rounded-2xl w-full">
              <FramingSelector
                currentMode={framingMode}
                onSelectMode={(mode) => setFramingMode(mode)}
              />
            </div>

            {/* Prompt & Attire Customizer */}
            <div className="w-full min-w-0">
              <PromptPanel
                prompt={prompt}
                onPromptChange={setPrompt}
                selectedPreset={selectedPreset}
                onSelectPreset={handleSelectPreset}
                likeness={likeness}
                onLikenessChange={setLikeness}
                negativePrompt={negativePrompt}
                onNegativePromptChange={setNegativePrompt}
                isGenerating={isGenerating}
                onGenerate={handleGenerate}
                hasCapturedSubject={Boolean(capturedImage)}
                apiKey={apiKey}
                onApiKeyChange={handleApiKeyChange}
                error={error}
                retryAfter={retryAfter}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (Thumb Zone) */}
      <nav className="flex-shrink-0 lg:hidden border-t border-zinc-900 bg-black/95 backdrop-blur-xl px-4 pt-1.5 safe-bottom flex items-center justify-around z-50">
        <button
          type="button"
          onClick={() => setActiveStep('scan')}
          aria-current={activeStep === 'scan' ? 'page' : undefined}
          className={`flex flex-col items-center justify-center gap-1 min-h-[52px] w-1/3 py-1.5 rounded-xl transition-all ${
            activeStep === 'scan'
              ? 'text-amber-400 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Camera size={21} />
          <span className="text-xs font-semibold">1. Camera</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStep('style')}
          aria-current={activeStep === 'style' ? 'page' : undefined}
          className={`flex flex-col items-center justify-center gap-1 min-h-[52px] w-1/3 py-1.5 rounded-xl transition-all ${
            activeStep === 'style'
              ? 'text-amber-400 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Wand2 size={21} />
          <span className="text-xs font-semibold">2. Style</span>
        </button>

        <button
          type="button"
          disabled={!generatedImage}
          onClick={() => setActiveStep('result')}
          className={`flex flex-col items-center justify-center gap-1 min-h-[52px] w-1/3 py-1.5 rounded-xl transition-all ${
            activeStep === 'result'
              ? 'text-amber-400 font-bold'
              : generatedImage
                ? 'text-zinc-400 hover:text-zinc-200'
                : 'text-zinc-600 cursor-not-allowed opacity-60'
          }`}
        >
          <Sparkles size={21} />
          <span className="text-xs font-semibold">3. Result</span>
        </button>
      </nav>
    </div>
  );
}
