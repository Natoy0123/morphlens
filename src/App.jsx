import React, { useState } from 'react';
import { Focus, Sliders, Sparkles, ArrowRight, RotateCcw, Check, Upload, Camera } from 'lucide-react';
import FramingSelector from './components/controls/FramingSelector';
import CaptureViewport from './components/capture/CaptureViewport';
import PromptPanel from './components/prompts/PromptPanel';
import BeforeAfterSlider from './components/viewer/BeforeAfterSlider';
import { STYLE_PRESETS } from './store/presets';

export default function App() {
  const [framingMode, setFramingMode] = useState('headshot');
  const [capturedImage, setCapturedImage] = useState(null);
  const [prompt, setPrompt] = useState('Cyberpunk operative in neon rain alleyway, matte armor, volumetric fog, 85mm portrait');
  const [selectedPreset, setSelectedPreset] = useState('cyberpunk');
  const [likeness, setLikeness] = useState(0.85);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);

  // Flow step: 'scan' | 'customize' | 'result'
  const [activeStep, setActiveStep] = useState('scan');

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset.id);
    if (preset.prompt) {
      setPrompt(preset.prompt);
    }
  };

  const handleCapture = (img) => {
    setCapturedImage(img);
    setActiveStep('customize');
  };

  const handleClearCapture = () => {
    setCapturedImage(null);
    setGeneratedImage(null);
    setActiveStep('scan');
  };

  const handleGenerate = () => {
    if (!capturedImage) return;
    setIsGenerating(true);

    // Adapt simulation dynamically to user prompt keywords
    setTimeout(() => {
      // Phase 4 wires live serverless endpoint (InstantID / PuLID API)
      setGeneratedImage('/sample-persona.png');
      setIsGenerating(false);
      setActiveStep('result');
    }, 1800);
  };

  const handleReset = () => {
    setGeneratedImage(null);
    setActiveStep('customize');
  };

  return (
    <div className="h-[100dvh] w-screen overflow-hidden bg-black text-zinc-100 flex flex-col antialiased selection:bg-zinc-800 selection:text-white">
      {/* Precision Top Bar */}
      <header className="flex-shrink-0 h-12 px-4 sm:px-6 border-b border-zinc-900 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="font-bold text-sm tracking-tight text-white uppercase font-mono">
            PersonaCraft
          </span>
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest pl-1 border-l border-zinc-800">
            OPTICAL AI
          </span>
        </div>

        {/* Minimal Step Indicator */}
        <div className="flex items-center gap-1.5 font-mono text-[10px]">
          <button
            type="button"
            onClick={() => setActiveStep('scan')}
            className={`px-2 py-0.5 rounded transition-all ${
              activeStep === 'scan' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            SCAN
          </button>
          <span className="text-zinc-700">/</span>
          <button
            type="button"
            onClick={() => setActiveStep('customize')}
            className={`px-2 py-0.5 rounded transition-all ${
              activeStep === 'customize' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            STYLE
          </button>
          <span className="text-zinc-700">/</span>
          <button
            type="button"
            disabled={!generatedImage}
            onClick={() => setActiveStep('result')}
            className={`px-2 py-0.5 rounded transition-all ${
              activeStep === 'result'
                ? 'bg-zinc-800 text-white font-bold'
                : generatedImage
                ? 'text-zinc-500 hover:text-zinc-300'
                : 'text-zinc-700 cursor-not-allowed'
            }`}
          >
            RENDER
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 overflow-hidden p-2 sm:p-4 lg:p-6 flex flex-col justify-center max-w-6xl w-full mx-auto">
        <div className="w-full h-full grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-center overflow-hidden">
          
          {/* CAMERA / VIEWFINDER / RESULT STAGE */}
          <div
            className={`w-full h-full lg:col-span-7 flex flex-col justify-between overflow-hidden ${
              activeStep === 'customize' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {activeStep === 'result' && generatedImage ? (
              <BeforeAfterSlider
                originalImage={capturedImage}
                generatedImage={generatedImage}
                onReset={handleReset}
              />
            ) : (
              <div className="w-full h-full flex flex-col justify-between overflow-hidden">
                {/* Viewfinder Lens */}
                <CaptureViewport
                  framingMode={framingMode}
                  capturedImage={capturedImage}
                  onCapture={handleCapture}
                  onClearCapture={handleClearCapture}
                />

                {/* Camera Mode Dial */}
                <div className="flex-shrink-0 pt-1 pb-1">
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
            className={`w-full h-full lg:col-span-5 flex flex-col justify-center overflow-y-auto no-scrollbar ${
              activeStep === 'customize' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Captured Subject Quick Banner on Mobile */}
            {capturedImage ? (
              <div className="lg:hidden flex items-center justify-between p-2.5 mb-2.5 bg-zinc-950 border border-zinc-800 rounded-2xl">
                <div className="flex items-center gap-2.5">
                  <img
                    src={capturedImage}
                    alt="Subject Preview"
                    className="w-10 h-10 rounded-xl object-cover border border-zinc-700"
                  />
                  <div>
                    <span className="text-xs font-semibold text-zinc-200 block">
                      Subject Stance Locked
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">
                      FRAMING: {framingMode}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClearCapture}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 text-[11px] font-mono flex items-center gap-1 hover:text-white"
                >
                  <RotateCcw size={11} />
                  RESCAN
                </button>
              </div>
            ) : (
              <div className="lg:hidden flex items-center justify-between p-3 mb-2.5 bg-zinc-950 border border-amber-500/30 rounded-2xl">
                <div className="flex items-center gap-2 text-xs text-amber-400 font-mono">
                  <Camera size={14} />
                  <span>No photo captured yet</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStep('scan')}
                  className="px-3 py-1 bg-amber-400 text-black font-semibold text-xs rounded-lg active:scale-95"
                >
                  Open Camera
                </button>
              </div>
            )}

            {/* Desktop Framing Selector */}
            <div className="hidden lg:block mb-3.5 p-3 bg-zinc-950 border border-zinc-900 rounded-2xl">
              <FramingSelector
                currentMode={framingMode}
                onSelectMode={(mode) => setFramingMode(mode)}
              />
            </div>

            {/* Prompt & Attire Customizer */}
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
      </main>
    </div>
  );
}
