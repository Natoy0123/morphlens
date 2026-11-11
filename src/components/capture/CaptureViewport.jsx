import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Image as ImageIcon, RotateCcw, SwitchCamera, Focus, Sparkles, X, AlertCircle } from 'lucide-react';

export default function CaptureViewport({
  framingMode,
  capturedImage,
  onCapture,
  onClearCapture,
}) {
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState('user');
  const [stream, setStream] = useState(null);
  const [isShutterFlashing, setIsShutterFlashing] = useState(false);

  const startCamera = async (overrideFacing) => {
    setCameraError('');
    stopCamera();
    try {
      const mode = overrideFacing || facingMode;
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: mode,
        },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Camera access required. Please grant permission or upload a photo.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    if (isCameraActive) {
      startCamera(nextMode);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    
    // Shutter flash effect
    setIsShutterFlashing(true);
    setTimeout(() => setIsShutterFlashing(false), 200);

    const video = videoRef.current;
    const vWidth = video.videoWidth || 1280;
    const vHeight = video.videoHeight || 720;

    // Calculate aspect ratio crop based on active framing mode
    let targetRatio = 1; // headshot default 1:1
    if (framingMode === 'half_body') targetRatio = 4 / 5;
    else if (framingMode === 'full_body') targetRatio = 9 / 16;
    else if (framingMode === 'auto') targetRatio = 3 / 4;

    let cropWidth = vWidth;
    let cropHeight = cropWidth / targetRatio;

    if (cropHeight > vHeight) {
      cropHeight = vHeight;
      cropWidth = cropHeight * targetRatio;
    }

    const startX = (vWidth - cropWidth) / 2;
    const startY = (vHeight - cropHeight) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const ctx = canvas.getContext('2d');

    // Handle mirror for front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(
        video,
        vWidth - startX - cropWidth,
        startY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );
    } else {
      ctx.drawImage(
        video,
        startX,
        startY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    onCapture(dataUrl);
    stopCamera();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      onCapture(event.target.result);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative w-full flex-1 flex flex-col justify-between overflow-hidden bg-black select-none">
      {/* Viewfinder Main Stage */}
      <div className="relative w-full flex-1 min-h-[340px] sm:min-h-[420px] bg-zinc-950 flex items-center justify-center overflow-hidden border border-zinc-800/60 rounded-3xl">
        {/* Shutter White Flash Animation */}
        {isShutterFlashing && (
          <div className="absolute inset-0 bg-white z-50 pointer-events-none animate-out fade-out duration-200" />
        )}

        {capturedImage ? (
          /* Captured Preview */
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <img
              src={capturedImage}
              alt="Scanned Subject"
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

            <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/60 border border-zinc-800 text-zinc-200 px-3 py-1 rounded-full text-[11px] font-mono tracking-wide backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              SUBJECT ACQUIRED
            </div>

            <button
              type="button"
              onClick={onClearCapture}
              className="absolute top-4 right-4 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 backdrop-blur-md transition-all active:scale-95 shadow-lg"
            >
              <RotateCcw size={12} />
              Retake
            </button>
          </div>
        ) : isCameraActive ? (
          /* Live Viewfinder Feed */
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
            />

            {/* Precision Optical Viewfinder Markings */}
            <div className="absolute inset-5 pointer-events-none border border-white/10 rounded-2xl">
              <div className="absolute -top-0.5 -left-0.5 w-3 h-3 border-t-2 border-l-2 border-white/60" />
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 border-t-2 border-r-2 border-white/60" />
              <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 border-b-2 border-l-2 border-white/60" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-b-2 border-r-2 border-white/60" />

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none opacity-40">
                <div className="absolute top-1/2 left-0 right-0 h-px bg-white" />
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white" />
              </div>
            </div>

            {/* Dynamic Framing Guides */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {framingMode === 'headshot' && (
                <div className="w-[52%] aspect-[1/1] max-w-[220px] border border-white/40 rounded-[50%] shadow-[0_0_30px_rgba(255,255,255,0.08)]" />
              )}
              {framingMode === 'half_body' && (
                <div className="w-[68%] aspect-[4/5] max-w-[270px] border border-white/40 rounded-t-[70px] rounded-b-xl shadow-[0_0_30px_rgba(255,255,255,0.08)]" />
              )}
              {framingMode === 'full_body' && (
                <div className="w-[48%] aspect-[9/16] max-w-[210px] border border-white/40 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.08)]" />
              )}
              {framingMode === 'auto' && (
                <div className="w-[62%] aspect-[3/4] max-w-[250px] border border-dashed border-white/30 rounded-2xl" />
              )}
            </div>

            {/* Viewfinder Top HUD with Close Camera Button */}
            <div className="absolute top-3 inset-x-4 flex items-center justify-between pointer-events-auto z-20">
              {/* CLOSE CAMERA BUTTON */}
              <button
                type="button"
                onClick={stopCamera}
                className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 flex items-center justify-center text-zinc-200 backdrop-blur-md transition-all active:scale-95 shadow-lg"
                title="Close Camera"
              >
                <X size={15} />
              </button>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-[10px] font-mono text-zinc-300">
                <Focus size={11} className="text-amber-400" />
                <span>AF ACTIVE</span>
              </div>

              {/* FLIP LENS BUTTON */}
              <button
                type="button"
                onClick={toggleFacingMode}
                className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 flex items-center justify-center text-zinc-200 backdrop-blur-md transition-all active:scale-95 shadow-lg"
                title="Flip Camera"
              >
                <SwitchCamera size={14} />
              </button>
            </div>
          </div>
        ) : (
          /* High-End Studio Standby View */
          <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center max-w-xs">
              <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-4 shadow-2xl">
                <Focus size={28} className="text-zinc-300 stroke-[1.5]" />
              </div>

              <h3 className="text-sm font-semibold tracking-tight text-zinc-100 mb-1">
                Optical Identity Scanner
              </h3>
              <p className="text-[11px] text-zinc-400 mb-6 leading-relaxed">
                Position face or body within the viewfinder, or select an existing portrait.
              </p>

              {cameraError && (
                <div className="flex items-center gap-2 p-2.5 mb-4 bg-red-950/40 border border-red-800/40 text-red-300 rounded-xl text-[11px] text-left">
                  <AlertCircle size={13} className="flex-shrink-0 text-red-400" />
                  <span>{cameraError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => startCamera()}
                className="w-full py-3 px-5 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs flex items-center justify-center gap-2 shadow-xl shadow-white/5 transition-all active:scale-98"
              >
                <Camera size={14} />
                Activate Lens
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Camera Shutter Deck */}
      <div className="w-full pt-3 pb-2 px-6 flex items-center justify-between">
        {/* Left: Upload Photo Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-11 h-11 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex flex-col items-center justify-center text-zinc-400 hover:text-zinc-200 transition-all active:scale-95 shadow-md"
          title="Upload Photo"
        >
          <ImageIcon size={16} />
          <span className="text-[8px] font-mono tracking-wider mt-0.5 text-zinc-400">IMPORT</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Center: Iconic Camera Shutter Button */}
        <button
          type="button"
          onClick={isCameraActive ? takeSnapshot : () => startCamera()}
          className="relative w-18 h-18 rounded-full border-2 border-white/80 p-1 flex items-center justify-center transition-all active:scale-90 hover:border-white shadow-2xl"
          aria-label="Capture Photo"
        >
          <div className="w-full h-full rounded-full bg-white active:bg-zinc-300 transition-colors flex items-center justify-center">
            {!isCameraActive && <Camera size={20} className="text-black" />}
          </div>
        </button>

        {/* Right: Camera Flip or Close Button */}
        {isCameraActive ? (
          <button
            type="button"
            onClick={stopCamera}
            className="w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center text-zinc-300 hover:text-white transition-all active:scale-95 shadow-md"
            title="Close Camera"
          >
            <X size={16} />
            <span className="text-[8px] font-mono tracking-wider mt-0.5 text-zinc-400">CLOSE</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={toggleFacingMode}
            className="w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center text-zinc-400 hover:text-white transition-all active:scale-95 shadow-md"
            title="Switch Lens"
          >
            <SwitchCamera size={16} />
            <span className="text-[8px] font-mono tracking-wider mt-0.5 text-zinc-400">FLIP</span>
          </button>
        )}
      </div>
    </div>
  );
}
