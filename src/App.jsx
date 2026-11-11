import React, { useState } from 'react';
import { Camera, Wand2, Sparkles, RotateCcw, Shield, Layers, Image as ImageIcon } from 'lucide-react';
import FramingSelector from './components/controls/FramingSelector';
import CaptureViewport from './components/capture/CaptureViewport';
import PromptPanel from './components/prompts/PromptPanel';
import BeforeAfterSlider from './components/viewer/BeforeAfterSlider';
import { STYLE_PRESETS } from './store/presets';
import { synthesizePersona } from './api/generateApi';

export default function App() {
  const [framingMode, setFramingMode] = useState('headshot');
  const [capturedImage, setCapturedImage] = useState(null);
  const [prompt, setPrompt] = useState('Cyberpunk operative in neon rain alleyway, matte armor, volumetric fog, 85mm portrait');
  const [selectedPreset, setSelectedPreset] = useState('cyberpunk');
  const [likeness, setLikeness] = useState(0.85);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);

  // Active step: 'scan' | 'style' | 'result'
  const [activeStep, setActiveStep] = useState('scan');

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset.id);
    if (preset.prompt) {
      setPrompt(preset.prompt);
    }
  };

  const handleCapture = (img) => {
    setCapturedImage(img);
    setActiveStep('style');
  };

  const handleClearCapture = () => {
    setCapturedImage(null);
    setGeneratedImage(null);
    setActiveStep('scan');
  };

  const handleUseSample = () => {
    // Quick demo face
    setCapturedImage('/sample-persona.png');
    setActiveStep('style');
  };

  const handleGenerate = async () => {
    if (!capturedImage) return;
    setIsGenerating(true);

    try {
      const generatedUrl = await synthesizePersona({
        prompt,
        framingMode,
        likeness,
        capturedImage,
      });
      setGeneratedImage(generatedUrl);
      setActiveStep('result');
    } catch (err) {
      console.error('Synthesis error:', err);
      setGeneratedImage('/sample-persona.png');
      setActiveStep('result');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setGeneratedImage(null);
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
          <span className="font-bold text-sm tracking-tight text-white">
            MorphLens
          </span>
          <span className="text-[9px] font-semibold text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded-full">
            Studio
          </span>
        </div>

        {/* Header Right Status */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 bg-zinc-900/80 border border-zinc-800/80 px-2 py-0.5 rounded-full">
            <Shield size={11} className="text-emerald-400" />
            <span className="hidden xs:inline">On-Device</span> Privacy
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 w-full max-w-6xl mx-auto px-3 sm:px-6 py-2 flex flex-col justify-center items-center overflow-hidden">
        <div className="w-full h-full max-w-lg lg:max-w-none grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-8 items-center justify-items-center overflow-hidden">
          
          {/* CAMERA / VIEWFINDER / RESULT STAGE */}
          <div
            className={`w-full min-w-0 h-full lg:col-span-7 flex flex-col items-center justify-center overflow-hidden ${
              activeStep === 'style' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {activeStep === 'result' && generatedImage ? (
              <BeforeAfterSlider
                originalImage={capturedImage}
                generatedImage={generatedImage}
                onReset={handleReset}
              />
            ) : (
              <div className="w-full min-w-0 h-full flex flex-col items-center justify-center gap-2 overflow-hidden">
                {/* Viewfinder Lens */}
                <CaptureViewport
                  framingMode={framingMode}
                  capturedImage={capturedImage}
                  onCapture={handleCapture}
                  onClearCapture={handleClearCapture}
                  onUseSample={handleUseSample}
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
            className={`w-full min-w-0 h-full lg:col-span-5 flex flex-col justify-center overflow-y-auto no-scrollbar ${
              activeStep === 'style' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Captured Subject Quick Banner on Mobile */}
            {capturedImage ? (
              <div className="lg:hidden flex items-center justify-between p-2.5 mb-2.5 bg-zinc-950 border border-zinc-800 rounded-2xl w-full">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={capturedImage}
                    alt="Subject Preview"
                    className="w-10 h-10 rounded-xl object-cover border border-zinc-700 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-zinc-100 block truncate">
                      Subject Stance Locked
                    </span>
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                      Mode: {framingMode}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClearCapture}
                  className="px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium flex items-center gap-1 hover:text-white flex-shrink-0"
                >
                  <RotateCcw size={11} />
                  Retake
                </button>
              </div>
            ) : (
              <div className="lg:hidden flex items-center justify-between p-3 mb-2.5 bg-zinc-950 border border-amber-500/30 rounded-2xl w-full">
                <div className="flex items-center gap-2 text-xs text-amber-300 font-semibold min-w-0">
                  <Camera size={14} className="flex-shrink-0 text-amber-400" />
                  <span className="truncate">No photo scanned yet</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStep('scan')}
                  className="px-3 py-1 bg-white text-black font-bold text-xs rounded-lg active:scale-95 flex-shrink-0"
                >
                  Open Camera
                </button>
              </div>
            )}

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
                framingMode={framingMode}
                isGenerating={isGenerating}
                onGenerate={handleGenerate}
                hasCapturedSubject={Boolean(capturedImage)}
              />
            </div>
          </div>

        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (Thumb Zone) */}
      <nav className="flex-shrink-0 lg:hidden border-t border-zinc-900 bg-black/95 backdrop-blur-xl px-6 py-2 flex items-center justify-around z-50">
        <button
          type="button"
          onClick={() => setActiveStep('scan')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeStep === 'scan' ? 'text-amber-400 font-bold scale-105' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Camera size={19} />
          <span className="text-[11px] font-semibold">1. Camera</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStep('style')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeStep === 'style' ? 'text-amber-400 font-bold scale-105' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Wand2 size={19} />
          <span className="text-[11px] font-semibold">2. Style</span>
        </button>

        <button
          type="button"
          disabled={!generatedImage}
          onClick={() => setActiveStep('result')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeStep === 'result'
              ? 'text-amber-400 font-bold scale-105'
              : generatedImage
              ? 'text-zinc-500 hover:text-zinc-300'
              : 'text-zinc-800 cursor-not-allowed opacity-40'
          }`}
        >
          <Sparkles size={19} />
          <span className="text-[11px] font-semibold">3. Result</span>
        </button>
      </nav>
    </div>
  );
}
