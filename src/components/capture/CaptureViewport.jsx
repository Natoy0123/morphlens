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
      setCameraError('Camera access unavailable. Grant browser permission or select an image.');
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
    
    setIsShutterFlashing(true);
    setTimeout(() => setIsShutterFlashing(false), 200);

    const video = videoRef.current;
    const vWidth = video.videoWidth || 1280;
    const vHeight = video.videoHeight || 720;

    let targetRatio = 1;
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
    <div className="relative w-full min-w-0 max-w-full flex-1 flex flex-col justify-between overflow-hidden bg-black select-none">
      {/* Viewfinder Main Stage */}
      <div className="relative w-full aspect-[3/4] sm:aspect-[4/5] max-h-[50dvh] sm:max-h-[500px] bg-zinc-950 flex items-center justify-center overflow-hidden border border-zinc-800/80 rounded-3xl mx-auto shadow-2xl">
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

            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/70 border border-zinc-700 text-zinc-100 px-3 py-1.5 rounded-full text-xs font-mono tracking-wide backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              SUBJECT ACQUIRED
            </div>

            <button
              type="button"
              onClick={onClearCapture}
              className="absolute top-4 right-4 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-100 px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 backdrop-blur-md transition-all active:scale-95 shadow-lg"
            >
              <RotateCcw size={13} />
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
            <div className="absolute inset-4 pointer-events-none border border-white/10 rounded-2xl">
              <div className="absolute -top-0.5 -left-0.5 w-3.5 h-3.5 border-t-2 border-l-2 border-white/70" />
              <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 border-t-2 border-r-2 border-white/70" />
              <div className="absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 border-b-2 border-l-2 border-white/70" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-b-2 border-r-2 border-white/70" />

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none opacity-40">
                <div className="absolute top-1/2 left-0 right-0 h-px bg-white" />
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white" />
              </div>
            </div>

            {/* Dynamic Framing Guides */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {framingMode === 'headshot' && (
                <div className="w-[52%] aspect-[1/1] max-w-[220px] border border-white/50 rounded-[50%] shadow-[0_0_30px_rgba(255,255,255,0.1)]" />
              )}
              {framingMode === 'half_body' && (
                <div className="w-[66%] aspect-[4/5] max-w-[270px] border border-white/50 rounded-t-[70px] rounded-b-xl shadow-[0_0_30px_rgba(255,255,255,0.1)]" />
              )}
              {framingMode === 'full_body' && (
                <div className="w-[46%] aspect-[9/16] max-w-[210px] border border-white/50 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)]" />
              )}
              {framingMode === 'auto' && (
                <div className="w-[60%] aspect-[3/4] max-w-[250px] border border-dashed border-white/40 rounded-2xl" />
              )}
            </div>

            {/* Viewfinder Top HUD */}
            <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-auto z-20">
              <button
                type="button"
                onClick={stopCamera}
                className="w-9 h-9 rounded-full bg-black/70 hover:bg-black/90 border border-white/30 flex items-center justify-center text-zinc-100 backdrop-blur-md transition-all active:scale-95 shadow-lg"
                title="Close Camera"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-xs font-mono text-zinc-200">
                <Focus size={12} className="text-amber-400" />
                <span>AF ACTIVE</span>
              </div>

              <button
                type="button"
                onClick={toggleFacingMode}
                className="w-9 h-9 rounded-full bg-black/70 hover:bg-black/90 border border-white/30 flex items-center justify-center text-zinc-100 backdrop-blur-md transition-all active:scale-95 shadow-lg"
                title="Flip Camera"
              >
                <SwitchCamera size={15} />
              </button>
            </div>
          </div>
        ) : (
          /* High-End Studio Standby View */
          <div className="relative w-full h-full flex flex-col items-center justify-center p-5 sm:p-6 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center max-w-[280px] sm:max-w-xs">
              <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 mb-3.5 shadow-xl">
                <Focus size={28} className="stroke-[1.5]" />
              </div>

              <h3 className="text-sm sm:text-base font-semibold tracking-tight text-zinc-100 mb-1.5">
                Optical Identity Scanner
              </h3>
              <p className="text-xs text-zinc-400 mb-5 sm:mb-6 leading-relaxed">
                Position face or body within the viewfinder, or select an existing portrait.
              </p>

              {cameraError && (
                <div className="flex items-center gap-2 p-2.5 mb-3.5 bg-red-950/40 border border-red-800/40 text-red-300 rounded-xl text-xs text-left">
                  <AlertCircle size={14} className="flex-shrink-0 text-red-400" />
                  <span>{cameraError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => startCamera()}
                className="w-full py-3 px-5 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-white/10 transition-all active:scale-98"
              >
                <Camera size={16} />
                Activate Lens
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Camera Shutter Deck */}
      <div className="w-full pt-2.5 pb-1 px-4 sm:px-6 flex items-center justify-between max-w-[340px] sm:max-w-sm mx-auto">
        {/* Left: Upload Photo Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-12 h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex flex-col items-center justify-center text-zinc-300 hover:text-white transition-all active:scale-95 shadow-md flex-shrink-0"
          title="Upload Photo"
        >
          <ImageIcon size={17} />
          <span className="text-[9px] font-mono tracking-wider mt-0.5 text-zinc-400 font-bold">IMPORT</span>
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
          className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full border-2 border-white/80 p-1 flex items-center justify-center transition-all active:scale-90 hover:border-white shadow-xl flex-shrink-0"
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
            className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center text-zinc-300 hover:text-white transition-all active:scale-95 shadow-md flex-shrink-0"
            title="Close Camera"
          >
            <X size={17} />
            <span className="text-[9px] font-mono tracking-wider mt-0.5 text-zinc-400 font-bold">CLOSE</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={toggleFacingMode}
            className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center text-zinc-300 hover:text-white transition-all active:scale-95 shadow-md flex-shrink-0"
            title="Switch Lens"
          >
            <SwitchCamera size={17} />
            <span className="text-[9px] font-mono tracking-wider mt-0.5 text-zinc-400 font-bold">FLIP</span>
          </button>
        )}
      </div>
    </div>
  );
}
