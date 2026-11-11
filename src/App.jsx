import React, { useState } from 'react';
import { Focus, Sliders, Sparkles, ArrowRight, RotateCcw, Check, Upload, Camera } from 'lucide-react';
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
    setActiveStep('customize');
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-black text-zinc-100 flex flex-col justify-between antialiased selection:bg-zinc-800 selection:text-white">
      {/* Precision Top Bar */}
      <header className="flex-shrink-0 h-12 px-3 sm:px-6 border-b border-zinc-900 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-between w-full max-w-full">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
          <span className="font-bold text-xs sm:text-sm tracking-tight text-white uppercase font-mono truncate">
            PersonaCraft
          </span>
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest pl-1 border-l border-zinc-800 hidden xs:inline flex-shrink-0">
            OPTICAL AI
          </span>
        </div>

        {/* Minimal Step Indicator */}
        <div className="flex items-center gap-1 font-mono text-[9px] sm:text-[10px] flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveStep('scan')}
            className={`px-1.5 sm:px-2 py-0.5 rounded transition-all ${
              activeStep === 'scan' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            SCAN
          </button>
          <span className="text-zinc-700">/</span>
          <button
            type="button"
            onClick={() => setActiveStep('customize')}
            className={`px-1.5 sm:px-2 py-0.5 rounded transition-all ${
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
            className={`px-1.5 sm:px-2 py-0.5 rounded transition-all ${
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
      <main className="flex-1 min-w-0 w-full max-w-full overflow-x-hidden p-2 sm:p-4 lg:p-6 flex flex-col justify-center">
        <div className="w-full min-w-0 max-w-6xl mx-auto h-full grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-8 items-center">
          
          {/* CAMERA / VIEWFINDER / RESULT STAGE */}
          <div
            className={`w-full min-w-0 h-full lg:col-span-7 flex flex-col justify-between overflow-hidden ${
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
              <div className="w-full min-w-0 h-full flex flex-col justify-between overflow-hidden">
                {/* Viewfinder Lens */}
                <CaptureViewport
                  framingMode={framingMode}
                  capturedImage={capturedImage}
                  onCapture={handleCapture}
                  onClearCapture={handleClearCapture}
                />

                {/* Camera Mode Dial */}
                <div className="flex-shrink-0 pt-1 w-full min-w-0">
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
              activeStep === 'customize' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Captured Subject Quick Banner on Mobile */}
            {capturedImage ? (
              <div className="lg:hidden flex items-center justify-between p-2 mb-2 bg-zinc-950 border border-zinc-800 rounded-2xl w-full min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={capturedImage}
                    alt="Subject Preview"
                    className="w-9 h-9 rounded-xl object-cover border border-zinc-700 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-zinc-200 block truncate">
                      Subject Stance Locked
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">
                      FRAMING: {framingMode}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClearCapture}
                  className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] font-mono flex items-center gap-1 hover:text-white flex-shrink-0"
                >
                  <RotateCcw size={10} />
                  RESCAN
                </button>
              </div>
            ) : (
              <div className="lg:hidden flex items-center justify-between p-2.5 mb-2 bg-zinc-950 border border-amber-500/30 rounded-2xl w-full min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono min-w-0">
                  <Camera size={13} className="flex-shrink-0" />
                  <span className="truncate">No photo captured yet</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStep('scan')}
                  className="px-2.5 py-1 bg-amber-400 text-black font-semibold text-xs rounded-lg active:scale-95 flex-shrink-0"
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
    </div>
  );
}
