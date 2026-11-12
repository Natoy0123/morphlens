import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  SlidersHorizontal,
  Image as ImageIcon,
  ShieldCheck,
  ShieldAlert,
  BookOpen,
  History,
} from 'lucide-react';
import FramingSelector from './components/controls/FramingSelector';
import CaptureViewport from './components/capture/CaptureViewport';
import PromptPanel from './components/prompts/PromptPanel';
import BeforeAfterSlider from './components/viewer/BeforeAfterSlider';
import ConfirmDialog from './components/ui/ConfirmDialog';
import StudioGuideDialog from './components/ui/StudioGuideDialog';
import ImageViewerDialog from './components/ui/ImageViewerDialog';
import HistoryDrawer from './components/history/HistoryDrawer';
import Toast from './components/ui/Toast';
import { synthesizePersona } from './api/generateApi';
import { readApiKey, saveApiKey } from './api/apiKey';
import { saveGenerationRecord } from './services/historyStorage';

export default function App() {
  const [framingMode, setFramingMode] = useState('headshot');
  const [capturedImage, setCapturedImage] = useState(null);
  const [prompt, setPrompt] = useState(
    'Professional portrait studio lighting, crisp natural skin texture, balanced ambient light, high-end commercial editorial quality, sharp focus'
  );
  const [negativePrompt, setNegativePrompt] = useState(
    'blurry, deformed, oversaturated, low quality, distorted anatomy'
  );
  const [selectedPreset, setSelectedPreset] = useState('natural-enhance');
  const [likeness, setLikeness] = useState(0.85);
  const [preserveBody, setPreserveBody] = useState(true);
  const [preservePose, setPreservePose] = useState(true);
  const [preserveEnvironment, setPreserveEnvironment] = useState(false);
  const [apiKey, setApiKey] = useState(() => readApiKey());
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [identityUsed, setIdentityUsed] = useState(false);
  const [renderInfo, setRenderInfo] = useState(null);
  const [captureVersion, setCaptureVersion] = useState(0);
  const [error, setError] = useState(null);
  const [retryUntil, setRetryUntil] = useState(0);
  const [clock, setClock] = useState(() => Date.now());
  const generatedRef = useRef(null);

  // Dialog and feedback state
  const [showRetakeConfirm, setShowRetakeConfirm] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

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
    if (typeof preset.preserveEnvironment === 'boolean') {
      setPreserveEnvironment(preset.preserveEnvironment);
    }
  };

  const handleCapture = (img) => {
    setCapturedImage(img);
    setCaptureVersion((version) => version + 1);
    replaceGeneratedImage(null);
    setIdentityUsed(false);
    setRenderInfo(null);
    setError(null);
    clearCooldown();
    setActiveStep('style');
    setToastMessage('Reference photo loaded successfully');
  };

  const executeClearCapture = () => {
    setCapturedImage(null);
    setCaptureVersion((version) => version + 1);
    replaceGeneratedImage(null);
    setIdentityUsed(false);
    setRenderInfo(null);
    setError(null);
    clearCooldown();
    setActiveStep('scan');
    setShowRetakeConfirm(false);
    setToastMessage('Reference photo removed');
  };

  const handleClearCaptureRequest = () => {
    if (generatedImage) {
      setShowRetakeConfirm(true);
    } else {
      executeClearCapture();
    }
  };

  const handleApiKeyChange = (key) => {
    const stored = saveApiKey(key);
    setApiKey(stored);
    setError(null);
    clearCooldown();
    setToastMessage(stored ? 'API key connected & stored' : 'API key disconnected');
  };

  const handleGenerate = async () => {
    if (!capturedImage || isGenerating) return;
    if (!prompt.trim()) {
      setError('Describe the style or transformation you want before generating.');
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
        preserveBody,
        preservePose,
        preserveEnvironment,
      });
      replaceGeneratedImage(result.url);
      setIdentityUsed(result.identityUsed);
      setRenderInfo({ model: result.model, promptUsed: result.promptUsed });
      clearCooldown();
      setActiveStep('result');
      setToastMessage('Portrait synthesized successfully');

      // Save to local IndexedDB history automatically
      saveGenerationRecord({
        originalImage: capturedImage,
        generatedImage: result.url,
        prompt,
        styleId: selectedPreset,
        likeness,
        seed: null,
        model: result.model,
        framingMode,
      }).catch((err) => console.warn('Could not auto-save to history:', err));
    } catch (err) {
      console.error('Portrait generation error:', err);
      setError(err instanceof Error ? err.message : 'Generation failed. Try again.');
      if (err?.retryAfter) {
        setClock(Date.now());
        setRetryUntil(Date.now() + err.retryAfter * 1000);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectHistoricalGeneration = (item) => {
    if (!item) return;
    if (item.originalUrl) {
      setCapturedImage(item.originalUrl);
    }
    replaceGeneratedImage(item.generatedUrl);
    if (item.prompt) setPrompt(item.prompt);
    if (item.styleId) setSelectedPreset(item.styleId);
    if (typeof item.likeness === 'number') setLikeness(item.likeness);
    if (item.framingMode) setFramingMode(item.framingMode);
    setIdentityUsed(Boolean(item.originalUrl));
    setRenderInfo({ model: item.model || 'FLUX.1', promptUsed: item.prompt });
    setActiveStep('result');
    setToastMessage('Loaded portrait from history');
  };

  const handleReset = () => {
    setActiveStep('style');
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full max-w-full overflow-hidden bg-black text-zinc-100 flex flex-col justify-between antialiased selection:bg-zinc-800 selection:text-white">
      {/* Top Header */}
      <header className="flex-shrink-0 h-12 px-4 sm:px-6 border-b border-zinc-900 bg-black/95 backdrop-blur-xl z-40 flex items-center justify-between w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center text-black font-black text-xs shadow-md">
            M
          </div>
          <span className="font-semibold text-sm tracking-tight text-white">MorphLens</span>
          <span className="hidden min-[380px]:inline text-[11px] font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">
            Studio
          </span>
        </div>

        {/* Header Right Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors active:scale-95 shadow-sm"
            title="View portrait history"
          >
            <History size={13} className="text-zinc-400" />
            <span>History</span>
          </button>

          <button
            type="button"
            onClick={() => setShowGuide(true)}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors"
          >
            <BookOpen size={13} />
            <span className="hidden sm:inline">Guide</span>
          </button>

          <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 bg-zinc-900/80 border border-zinc-800/80 px-2.5 py-1 rounded-full">
            {apiKey ? (
              <ShieldCheck size={13} className="text-emerald-400" />
            ) : (
              <ShieldAlert size={13} className="text-zinc-400" />
            )}
            <span className="hidden sm:inline">{apiKey ? 'Key Connected' : 'Free Mode'}</span>
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
                model={renderInfo?.model}
                promptUsed={renderInfo?.promptUsed}
                onConnectKey={() => setActiveStep('style')}
                onReset={handleReset}
                onInspect={() => setShowImageViewer(true)}
                onNotify={(msg) => setToastMessage(msg)}
              />
            ) : (
              <div className="w-full min-w-0 min-h-full flex flex-col items-center justify-start lg:justify-center gap-2.5 overflow-x-hidden view-fade-enter">
                {/* Viewfinder Lens */}
                <CaptureViewport
                  framingMode={framingMode}
                  capturedImage={capturedImage}
                  onCapture={handleCapture}
                  onClearCapture={handleClearCaptureRequest}
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
            className={`w-full min-w-0 h-full min-h-0 lg:col-span-5 flex flex-col justify-start overflow-y-auto overscroll-contain no-scrollbar pb-16 lg:pb-0 view-fade-enter ${
              activeStep === 'style' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            <div className="w-full min-w-0 h-full flex flex-col">
              <PromptPanel
                key={captureVersion}
                prompt={prompt}
                onPromptChange={setPrompt}
                selectedPreset={selectedPreset}
                onSelectPreset={handleSelectPreset}
                likeness={likeness}
                onLikenessChange={setLikeness}
                preserveBody={preserveBody}
                onPreserveBodyChange={setPreserveBody}
                preservePose={preservePose}
                onPreservePoseChange={setPreservePose}
                preserveEnvironment={preserveEnvironment}
                onPreserveEnvironmentChange={setPreserveEnvironment}
                negativePrompt={negativePrompt}
                onNegativePromptChange={setNegativePrompt}
                isGenerating={isGenerating}
                onGenerate={handleGenerate}
                hasCapturedSubject={Boolean(capturedImage)}
                capturedImage={capturedImage}
                onChangeCapture={() => setActiveStep('scan')}
                onRemoveCapture={handleClearCaptureRequest}
                apiKey={apiKey}
                onApiKeyChange={handleApiKeyChange}
                error={error}
                retryAfter={retryAfter}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="flex-shrink-0 lg:hidden border-t border-zinc-900 bg-black/95 backdrop-blur-xl px-4 pt-1.5 safe-bottom flex items-center justify-around z-40">
        <button
          type="button"
          onClick={() => setActiveStep('scan')}
          aria-current={activeStep === 'scan' ? 'page' : undefined}
          className={`flex flex-col items-center justify-center gap-1 min-h-[50px] w-1/3 py-1.5 rounded-xl transition-all ${
            activeStep === 'scan'
              ? 'text-white font-semibold'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Camera size={19} />
          <span className="text-[11px]">1. Photo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStep('style')}
          aria-current={activeStep === 'style' ? 'page' : undefined}
          className={`flex flex-col items-center justify-center gap-1 min-h-[50px] w-1/3 py-1.5 rounded-xl transition-all ${
            activeStep === 'style'
              ? 'text-white font-semibold'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <SlidersHorizontal size={19} />
          <span className="text-[11px]">2. Style</span>
        </button>

        <button
          type="button"
          disabled={!generatedImage}
          onClick={() => setActiveStep('result')}
          className={`flex flex-col items-center justify-center gap-1 min-h-[50px] w-1/3 py-1.5 rounded-xl transition-all ${
            activeStep === 'result'
              ? 'text-white font-semibold'
              : generatedImage
                ? 'text-zinc-400 hover:text-zinc-200'
                : 'text-zinc-700 cursor-not-allowed opacity-50'
          }`}
        >
          <ImageIcon size={19} />
          <span className="text-[11px]">3. Result</span>
        </button>
      </nav>

      {/* Accessible Dialogs & Modals */}
      <ConfirmDialog
        isOpen={showRetakeConfirm}
        title="Replace Reference Photo?"
        message="You currently have a synthesized portrait. Taking or uploading a new photo will discard the current generated result."
        confirmLabel="Replace Photo"
        cancelLabel="Keep Current"
        isDestructive={true}
        onConfirm={executeClearCapture}
        onCancel={() => setShowRetakeConfirm(false)}
      />

      <StudioGuideDialog isOpen={showGuide} onClose={() => setShowGuide(false)} />

      <ImageViewerDialog
        isOpen={showImageViewer}
        imageUrl={generatedImage}
        originalUrl={capturedImage}
        onClose={() => setShowImageViewer(false)}
        onDownload={() => {
          const a = document.createElement('a');
          a.href = generatedImage;
          a.download = `morphlens-inspect-${Date.now()}.jpg`;
          a.click();
          setToastMessage('Downloaded full-resolution portrait');
        }}
      />

      <HistoryDrawer
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onSelectGeneration={handleSelectHistoricalGeneration}
        onInspectImage={(url) => {
          replaceGeneratedImage(url);
          setShowImageViewer(true);
        }}
        onNotify={setToastMessage}
      />

      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
}
