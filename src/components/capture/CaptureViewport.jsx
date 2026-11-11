import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, RotateCcw, SwitchCamera, Focus, X, AlertCircle, ImageIcon } from 'lucide-react';

export default function CaptureViewport({
  framingMode,
  capturedImage,
  onCapture,
  onClearCapture,
}) {
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState('user');
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
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Camera access unavailable. Grant permission or upload a photo.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
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
    if (!isCameraActive) return;
    const video = videoRef.current;
    const mediaStream = streamRef.current;
    if (!video || !mediaStream) return;
    video.srcObject = mediaStream;
    video.play().catch(() => {});
  }, [isCameraActive]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
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
    if (!ctx) {
      setCameraError('Could not prepare the photo. Try uploading one instead.');
      return;
    }

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
    <div className="relative w-full flex-1 flex flex-col items-center justify-center overflow-hidden bg-black select-none max-w-sm sm:max-w-md mx-auto">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      {/* Viewfinder Main Card */}
      <div className="relative w-full aspect-[3/4] sm:aspect-[4/5] max-h-[50dvh] sm:max-h-[480px] bg-zinc-950 flex items-center justify-center overflow-hidden border border-zinc-800/90 rounded-3xl mx-auto shadow-2xl">
        {/* Shutter Flash Animation */}
        {isShutterFlashing && (
          <div className="absolute inset-0 bg-white z-50 pointer-events-none animate-out fade-out duration-200" />
        )}

        {capturedImage ? (
          /* Captured Subject Preview */
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <img
              src={capturedImage}
              alt="Scanned Subject"
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

            <div className="absolute top-3.5 left-3.5 flex items-center gap-2 bg-black/75 border border-zinc-700 text-zinc-100 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Subject Acquired
            </div>

            <button
              type="button"
              onClick={onClearCapture}
              className="absolute top-3.5 right-3.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-100 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md transition-all active:scale-95 shadow-lg"
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

            {/* Viewfinder Corner Markings */}
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

            {/* Dynamic Alignment Guides */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {framingMode === 'headshot' && (
                <div className="w-[52%] aspect-[1/1] max-w-[210px] border border-white/50 rounded-[50%] shadow-[0_0_30px_rgba(255,255,255,0.1)]" />
              )}
              {framingMode === 'half_body' && (
                <div className="w-[66%] aspect-[4/5] max-w-[260px] border border-white/50 rounded-t-[70px] rounded-b-xl shadow-[0_0_30px_rgba(255,255,255,0.1)]" />
              )}
              {framingMode === 'full_body' && (
                <div className="w-[46%] aspect-[9/16] max-w-[200px] border border-white/50 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)]" />
              )}
              {framingMode === 'auto' && (
                <div className="w-[60%] aspect-[3/4] max-w-[240px] border border-dashed border-white/40 rounded-2xl" />
              )}
            </div>

            {/* Top HUD with Close & Flip */}
            <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between pointer-events-auto z-20">
              <button
                type="button"
                onClick={stopCamera}
                className="w-9 h-9 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 flex items-center justify-center text-zinc-100 backdrop-blur-md transition-all active:scale-95 shadow-lg"
                title="Close Camera"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-xs font-semibold text-zinc-200">
                <Focus size={12} className="text-amber-400" />
                <span>AF Active</span>
              </div>

              <button
                type="button"
                onClick={toggleFacingMode}
                className="w-9 h-9 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 flex items-center justify-center text-zinc-100 backdrop-blur-md transition-all active:scale-95 shadow-lg"
                title="Flip Camera"
              >
                <SwitchCamera size={15} />
              </button>
            </div>
          </div>
        ) : (
          /* Engaging Standby Stage (Never an empty black box) */
          <div className="relative w-full h-full flex flex-col items-center justify-center p-5 text-center">
            {/* Ambient Radial Mesh Background */}
            <div className="absolute inset-0 bg-[radial-gradient(#3f3f46_1px,transparent_1px)] [background-size:16px_16px] opacity-35 pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center max-w-[280px]">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200 mb-3 shadow-xl">
                <Focus size={30} className="text-amber-400 stroke-[1.7]" />
              </div>

              <h3 className="text-base font-bold tracking-tight text-white mb-1">
                Optical Scanner
              </h3>
              <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
                Scan your face or stance to synthesize any character or attire.
              </p>

              {cameraError && (
                <div className="flex items-center gap-2 p-2.5 mb-3 bg-red-950/50 border border-red-800/50 text-red-300 rounded-xl text-xs text-left">
                  <AlertCircle size={14} className="flex-shrink-0 text-red-400" />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5 w-full">
                <button
                  type="button"
                  onClick={() => startCamera()}
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-white/10 transition-all active:scale-98"
                >
                  <Camera size={16} />
                  Open Camera
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98"
                >
                  <Upload size={13} />
                  Upload Photo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Shutter Bar (Thumb Deck - Only visible when camera stream is actively running) */}
      {isCameraActive && (
        <div className="w-full pt-2.5 pb-1 px-4 flex items-center justify-between max-w-[320px] mx-auto animate-in fade-in duration-200">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-12 h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex flex-col items-center justify-center text-zinc-300 hover:text-white transition-all active:scale-95 shadow-md"
            title="Upload Photo"
          >
            <ImageIcon size={18} />
            <span className="text-[9px] font-semibold mt-0.5 text-zinc-400">Photo</span>
          </button>

          {/* Shutter Button */}
          <button
            type="button"
            onClick={takeSnapshot}
            className="relative w-16 h-16 rounded-full border-2 border-white/80 p-1 flex items-center justify-center transition-all active:scale-90 hover:border-white shadow-2xl"
            aria-label="Capture Photo"
          >
            <div className="w-full h-full rounded-full bg-white active:bg-zinc-300 transition-colors flex items-center justify-center" />
          </button>

          {/* Camera Close Button */}
          <button
            type="button"
            onClick={stopCamera}
            className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center text-zinc-300 hover:text-white transition-all active:scale-95 shadow-md"
            title="Close Camera"
          >
            <X size={18} />
            <span className="text-[9px] font-semibold mt-0.5 text-zinc-400">Close</span>
          </button>
        </div>
      )}
    </div>
  );
}
