import React, { useRef, useEffect, useState } from 'react';
import {
  X,
  Camera,
  Eye,
  Zap,
  Sparkles,
  ShieldCheck,
  RotateCw,
  Maximize2,
  Sliders,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { multimodalEngine } from '../../services/multimodalEngine';
import { starkAudio } from '../../services/starkAudio';

interface StarkVisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyzeSnapshot: (analysisText: string) => void;
}

export const StarkVisionModal: React.FC<StarkVisionModalProps> = ({
  isOpen,
  onClose,
  onAnalyzeSnapshot,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [visionMode, setVisionMode] = useState<'standard' | 'thermal' | 'night' | 'wireframe'>(
    'standard'
  );
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [latestAnalysis, setLatestAnalysis] = useState<string | null>(null);
  const [targetLock, setTargetLock] = useState<{ x: number; y: number } | null>(null);

  // Initialize camera stream
  useEffect(() => {
    if (!isOpen) {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      return;
    }

    setCameraError(null);
    starkAudio.playArcReactorSpinUp();

    navigator.mediaDevices
      ?.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      .then((mediaStream) => {
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      })
      .catch((err) => {
        setCameraError('Camera access denied or unavailable. Please grant camera permission.');
      });

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  // Target lock tap simulator
  const handleTapViewfinder = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    setTargetLock({ x, y });
    starkAudio.playHudChirp();
  };

  const handleCaptureAndAnalyze = async () => {
    if (!videoRef.current || isAnalyzing) return;
    setIsAnalyzing(true);
    starkAudio.playDirectiveAcknowledged();

    try {
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

        // Convert dataUrl to File blob for Multimodal engine
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], `stark-hud-scan-${Date.now()}.jpg`, { type: 'image/jpeg' });

        const attachment = await multimodalEngine.processUserFile(file);
        const analysisPrompt = `[STARK AR HUD VISION ANALYSIS]\nTarget acquired via Stark Optics Lens (${visionMode} filter). Analyze object, text, or scene in high detail.`;

        onAnalyzeSnapshot(`${analysisPrompt}\nAttachment: ${attachment.fileName}`);
        setLatestAnalysis(`Stark HUD Scan complete. Transmitted visual data for analysis.`);
      }
    } catch (err: any) {
      setLatestAnalysis('Vision Analysis error: Could not process image frame.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Stark AR Vision Terminal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-xl select-none"
    >
      <div className="relative w-full max-w-2xl bg-[#080205] border border-amber-500/40 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.2)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Sci-Fi Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0d0307] border-b border-amber-500/30">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-amber-400 animate-pulse" />
            <div>
              <h3 className="font-hud font-bold text-xs tracking-widest text-amber-100 uppercase">
                STARK OPTICS // AR HUD VISION
              </h3>
              <p className="text-[10px] font-mono text-amber-400/60">
                MARK-VII REAL-TIME TARGET ACQUISITION & VISUAL AI
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-black/50 border border-amber-500/30 text-amber-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder Surface */}
        <div
          onClick={handleTapViewfinder}
          className="relative flex-1 bg-black overflow-hidden flex items-center justify-center min-h-[320px] cursor-crosshair"
        >
          {cameraError ? (
            <div className="flex flex-col items-center justify-center p-6 text-center gap-3">
              <AlertTriangle className="w-10 h-10 text-amber-500 animate-bounce" />
              <p className="text-xs font-mono text-amber-200">{cameraError}</p>
              <p className="text-[10px] font-mono text-amber-400/50">
                Camera feed required for real-time visual analysis.
              </p>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-all duration-300 ${
                visionMode === 'thermal'
                  ? 'hue-rotate-180 contrast-200 saturate-200'
                  : visionMode === 'night'
                  ? 'brightness-125 contrast-150 sepia-100 hue-rotate-90'
                  : visionMode === 'wireframe'
                  ? 'invert contrast-200'
                  : ''
              }`}
            />
          )}

          {/* Stark HUD AR Overlays */}
          <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
            {/* Top HUD Telemetry */}
            <div className="flex items-center justify-between text-[9px] font-mono text-amber-300/80 bg-black/60 px-3 py-1 rounded-full border border-amber-500/30 backdrop-blur-md">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                OPTICS: {visionMode.toUpperCase()}
              </span>
              <span>ZOOM: 1.0X</span>
              <span>FPS: 60.0</span>
            </div>

            {/* Target Reticle Crosshair */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-48 h-48 border border-amber-400/40 rounded-full flex items-center justify-center animate-spin-slow">
                <div className="w-36 h-36 border border-cyan-400/50 rounded-full border-dashed animate-reverse-spin" />
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                {/* 4 Bracket Corners */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-amber-400" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-amber-400" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-amber-400" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-amber-400" />
              </div>
            </div>

            {/* Tap Target Lock Marker */}
            {targetLock && (
              <div
                className="absolute w-8 h-8 border-2 border-cyan-400 rounded-full -translate-x-1/2 -translate-y-1/2 animate-ping"
                style={{ left: targetLock.x, top: targetLock.y }}
              />
            )}

            {/* Bottom Target Information */}
            <div className="flex items-center justify-between text-[9px] font-mono text-amber-200/90 bg-black/70 px-3 py-1.5 rounded-xl border border-amber-500/30 backdrop-blur-md">
              <span>TARGET: {targetLock ? `LOCK [${targetLock.x}, ${targetLock.y}]` : 'SCANNING...'}</span>
              <span>DISTANCE: 1.42m</span>
            </div>
          </div>
        </div>

        {/* Controls Toolbar */}
        <div className="p-3 bg-[#0a0205] border-t border-amber-500/30 flex flex-col gap-2">
          {/* Filter Mode Selector */}
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
            <span className="text-[10px] font-mono text-amber-400/60 uppercase shrink-0">Filter:</span>
            {(['standard', 'thermal', 'night', 'wireframe'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setVisionMode(mode);
                  starkAudio.playHudChirp();
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono capitalize transition-all cursor-pointer ${
                  visionMode === mode
                    ? 'bg-amber-500/30 border border-amber-400 text-amber-100 font-bold'
                    : 'bg-black/50 border border-amber-500/20 text-amber-400/60 hover:text-amber-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Snap & Analyze Button */}
          <button
            type="button"
            onClick={handleCaptureAndAnalyze}
            disabled={isAnalyzing}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 hover:from-yellow-300 hover:to-amber-400 text-black font-bold text-xs tracking-wider uppercase font-mono flex items-center justify-center gap-2 active:scale-98 transition-transform cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-black" />
                <span>ANALYZING TARGET VIA GEMINI AI...</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 text-black" />
                <span>SNAP & TRANSMIT FOR AI ANALYSIS</span>
              </>
            )}
          </button>

          {latestAnalysis && (
            <p className="text-[10px] font-mono text-emerald-300 text-center animate-in fade-in">
              ✓ {latestAnalysis}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
