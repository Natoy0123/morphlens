import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, SwitchCamera, X, AlertCircle, ImageIcon, Check, Trash2 } from 'lucide-react';

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
    canvas.width = Math.round(cropWidth);
    canvas.height = Math.round(cropHeight);
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
    e.target.value = '';
    if (!file) return;

    if (file.type && !file.type.startsWith('image/')) {
      setCameraError('Choose an image file (JPG, PNG, WebP, or HEIC).');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setCameraError('Photo exceeds 20 MB. Choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result !== 'string') {
        setCameraError('That photo could not be read. Try another image.');
        return;
      }
      setCameraError('');
      onCapture(result);
      stopCamera();
    };
    reader.onerror = () => {
      setCameraError('That photo could not be read. Try another image.');
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
      <div className="relative w-full aspect-[3/4] sm:aspect-[4/5] max-h-[50dvh] sm:max-h-[480px] bg-zinc-950 flex items-center justify-center overflow-hidden border border-zinc-800 rounded-3xl mx-auto shadow-2xl">
        {/* Shutter Flash Animation */}
        {isShutterFlashing && (
          <div className="absolute inset-0 bg-white z-50 pointer-events-none animate-out fade-out duration-200" />
        )}

        {capturedImage ? (
          /* Captured Subject Preview */
          <div className="relative w-full h-full flex items-center justify-center bg-zinc-950">
            <img
              src={capturedImage}
              alt="Reference Portrait"
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-700 text-zinc-100 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md shadow-lg">
              <Check size={14} className="text-emerald-400" />
              <span>Reference Photo Loaded</span>
            </div>

            <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[38px] bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md transition-all active:scale-95 shadow-lg"
                title="Replace with another photo"
              >
                <Upload size={13} />
                <span>Replace</span>
              </button>

              <button
                type="button"
                onClick={onClearCapture}
                className="min-h-[38px] bg-red-950/80 hover:bg-red-900/90 border border-red-800/80 text-red-200 hover:text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md transition-all active:scale-95 shadow-lg"
                title="Remove attached photo"
              >
                <Trash2 size={13} className="text-red-400" />
                <span>Remove</span>
              </button>
            </div>
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

            {/* Subtle Viewfinder Framing Guides */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {framingMode === 'headshot' && (
                <div className="w-[54%] aspect-[1/1] max-w-[210px] border border-white/60 rounded-[50%]" />
              )}
              {framingMode === 'half_body' && (
                <div className="w-[66%] aspect-[4/5] max-w-[260px] border border-white/60 rounded-t-[70px] rounded-b-xl" />
              )}
              {framingMode === 'full_body' && (
                <div className="w-[46%] aspect-[9/16] max-w-[200px] border border-white/60 rounded-2xl" />
              )}
              {framingMode === 'auto' && (
                <div className="w-[60%] aspect-[3/4] max-w-[240px] border border-dashed border-white/50 rounded-2xl" />
              )}
            </div>

            {/* Top Controls with Close & Flip */}
            <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-auto z-20">
              <button
                type="button"
                onClick={stopCamera}
                className="w-10 h-10 rounded-full bg-black/75 hover:bg-black/90 border border-zinc-700 flex items-center justify-center text-zinc-100 backdrop-blur-md transition-all active:scale-95 shadow-lg"
                title="Close Camera"
                aria-label="Close Camera"
              >
                <X size={17} />
              </button>

              <div className="px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-zinc-700 text-xs font-mono text-zinc-200">
                CAMERA ACTIVE
              </div>

              <button
                type="button"
                onClick={toggleFacingMode}
                className="w-10 h-10 rounded-full bg-black/75 hover:bg-black/90 border border-zinc-700 flex items-center justify-center text-zinc-100 backdrop-blur-md transition-all active:scale-95 shadow-lg"
                title="Flip Camera"
                aria-label="Flip Camera"
              >
                <SwitchCamera size={16} />
              </button>
            </div>
          </div>
        ) : (
          /* Clean Standby State */
          <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="relative z-10 flex flex-col items-center max-w-[280px]">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 mb-3 shadow-xl">
                <Camera size={26} className="text-zinc-200" />
              </div>

              <h3 className="text-base font-semibold text-white mb-1">
                Reference Photo Setup
              </h3>
              <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
                Take a portrait photo or upload an image to use as your identity, stance, and body reference.
              </p>

              {cameraError && (
                <div className="flex items-start gap-2 p-2.5 mb-3 bg-red-950/60 border border-red-800/60 text-red-200 rounded-xl text-xs text-left">
                  <AlertCircle size={15} className="flex-shrink-0 text-red-400 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 w-full">
                <button
                  type="button"
                  onClick={() => startCamera()}
                  className="w-full min-h-[46px] py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98"
                >
                  <Camera size={17} />
                  Open Camera
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full min-h-[42px] py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98"
                >
                  <Upload size={14} />
                  Upload Photo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Camera Shutter Bar */}
      {isCameraActive && (
        <div className="w-full pt-2.5 pb-1 px-4 flex items-center justify-between max-w-[320px] mx-auto animate-in fade-in duration-200">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-12 h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex flex-col items-center justify-center text-zinc-300 hover:text-white transition-all active:scale-95 shadow-md"
            title="Upload Photo"
          >
            <ImageIcon size={17} />
            <span className="text-[10px] font-semibold mt-0.5 text-zinc-400">File</span>
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

          {/* Close Button */}
          <button
            type="button"
            onClick={stopCamera}
            className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center text-zinc-300 hover:text-white transition-all active:scale-95 shadow-md"
            title="Close Camera"
          >
            <X size={17} />
            <span className="text-[10px] font-semibold mt-0.5 text-zinc-400">Close</span>
          </button>
        </div>
      )}
    </div>
  );
}
