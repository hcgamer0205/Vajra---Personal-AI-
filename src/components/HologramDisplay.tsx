import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Sparkles,
  Radio,
  Sliders,
  Check,
  Activity,
  Palette,
  Volume2,
} from 'lucide-react';
import { Message, VajraAction, AssistantState } from '../types';
import { VajraSphere } from './VajraSphere';
import {
  CoreThemeId,
  UiAccentId,
  CORE_THEMES,
  UI_ACCENTS,
} from '../services/vajraAppearance';

export interface TemporaryNotification {
  id: string;
  text: string;
  type?: 'action_complete' | 'speech' | 'info' | 'error';
}

interface HologramDisplayProps {
  messages?: Message[];
  state: AssistantState;
  isStreaming?: boolean;
  isOffline: boolean;
  onExecuteAction?: (action: VajraAction) => void;
  onRetryLast?: () => void;
  onSwitchOffline?: () => void;
  onSelectPrompt: (prompt: string) => void;
  onOpenEngineModal?: () => void;
  onToggleVoice?: () => void;
  onOpenVoiceDiagnostics?: () => void;
  onOpenSearch?: () => void;
  onOpenUrl?: () => void;
  onOpenTool?: (tool: string) => void;
  onOpenSetup?: () => void;
  onClearChat?: () => void;
  temporaryNotification?: TemporaryNotification | null;
  onDismissNotification?: () => void;
  hudExecutionStatus?: string | null;
  coreTheme?: CoreThemeId;
  customCoreColor?: string;
  uiAccentTheme?: UiAccentId;
  customUiColor?: string;
  onOpenCoreSettings?: () => void;
  isMobileMode?: boolean;
  mobileCoreMode?: 'hero' | 'compact';
}

const SAMPLE_DIRECTIVES = [
  {
    title: 'Open YouTube',
    prompt: 'Open YouTube and search for quantum energy breakthroughs',
  },
  {
    title: 'Search Web',
    prompt: 'Search Google for latest artificial intelligence research',
  },
  {
    title: 'Launch Calculator',
    prompt: 'Open calculator to compute scientific expressions',
  },
  {
    title: 'Open Scratchpad',
    prompt: 'Open scratchpad to take research notes',
  },
];

export const HologramDisplay: React.FC<HologramDisplayProps> = ({
  messages = [],
  state,
  isStreaming = false,
  isOffline,
  onExecuteAction,
  onRetryLast,
  onSwitchOffline,
  onSelectPrompt,
  onOpenEngineModal,
  onToggleVoice,
  onOpenVoiceDiagnostics,
  onOpenSearch,
  onOpenUrl,
  onOpenTool,
  onOpenSetup,
  onClearChat,
  temporaryNotification,
  onDismissNotification,
  hudExecutionStatus,
  coreTheme = 'crimson_gold',
  customCoreColor = '#f59e0b',
  uiAccentTheme = 'amber_gold',
  customUiColor = '#f59e0b',
  onOpenCoreSettings,
  isMobileMode = false,
  mobileCoreMode = 'hero',
}) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [sphereSize, setSphereSize] = useState<number>(360);
  const [liveFreqs, setLiveFreqs] = useState<number[]>([20, 35, 50, 45, 60, 40, 30, 25]);

  // Responsive dimension calculation using ResizeObserver to expand into available space without overflowing
  useEffect(() => {
    const updateDimension = () => {
      if (!stageRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      const availW = rect.width;
      const availH = rect.height;
      if (availW <= 0 || availH <= 0) return;

      // Allow minimal 16px buffer for corner HUD brackets so they never touch or clip
      const maxAllowed = Math.min(availW - 16, availH - 16);
      
      // On mobile devices, respect compact mode or hero mode bounding to prevent overflow
      const calculated = isMobileMode
        ? mobileCoreMode === 'compact'
          ? Math.max(88, Math.min(130, Math.floor(maxAllowed * 0.4)))
          : Math.max(160, Math.min(300, Math.floor(maxAllowed)))
        : Math.max(220, Math.min(820, Math.floor(maxAllowed)));

      setSphereSize(calculated);
    };

    updateDimension();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && stageRef.current) {
      ro = new ResizeObserver(() => {
        updateDimension();
      });
      ro.observe(stageRef.current);
    }

    window.addEventListener('resize', updateDimension);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateDimension);
    };
  }, []);

  // Subtle acoustic harmonic frequency bars (12 bands)
  useEffect(() => {
    const interval = setInterval(() => {
      const isVoiceActive = state === 'listening' || state === 'speaking' || isStreaming;
      if (!isVoiceActive && state === 'idle') {
        setLiveFreqs([12, 18, 25, 20, 30, 22, 18, 14]);
        return;
      }

      setLiveFreqs(
        Array.from({ length: 8 }, (_, i) => {
          if (state === 'speaking') {
            return Math.floor(40 + Math.random() * 55);
          } else if (state === 'listening') {
            return Math.floor(25 + Math.random() * 65);
          } else if (state === 'thinking') {
            return Math.floor(20 + Math.sin(Date.now() / 250 + i) * 25 + 20);
          }
          return Math.floor(15 + Math.random() * 20);
        })
      );
    }, 100);

    return () => clearInterval(interval);
  }, [state, isStreaming]);

  const activeThemeName =
    coreTheme === 'custom'
      ? 'Custom'
      : CORE_THEMES[coreTheme]?.name || 'Crimson & Gold';

  const isThinking = state === 'thinking';
  const isExecuting =
    state === 'executing' ||
    Boolean(hudExecutionStatus && hudExecutionStatus.includes('EXECUTING'));
  const isIntensified = isThinking || isExecuting;

  const flareColors = React.useMemo(() => {
    if (coreTheme === 'custom') {
      const p = customCoreColor || '#f59e0b';
      return {
        primary: p,
        secondary: '#dc2626',
        accent: '#22d3ee',
      };
    }
    const def = CORE_THEMES[coreTheme] || CORE_THEMES.crimson_gold;
    return {
      primary: def.primaryColor,
      secondary: def.secondaryColor,
      accent: def.accentSpark,
    };
  }, [coreTheme, customCoreColor]);

  return (
    <div
      id="vajra-reactor-centerpiece"
      className="relative w-full h-full flex flex-col items-center justify-between overflow-hidden select-none"
    >
      {/* Background Holographic Grid & Vignette */}
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none opacity-95" />
      <div className="absolute inset-0 hud-grid-bg opacity-30 pointer-events-none" />

      {/* Main Single-Viewport Stage: Expansive, Uncluttered Visual Centerpiece */}
      <div className="relative flex-1 w-full min-h-0 flex flex-col items-center justify-between px-2 py-1 sm:px-3 sm:py-1.5 z-10 overflow-hidden">
        
        {/* Sleek J.A.R.V.I.S. Iron Man Holographic Telemetry Badge */}
        <div className="text-center pt-0.5 select-none shrink-0">
          <div className="inline-flex items-center gap-2 font-mono text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-amber-300/80 bg-[#080103]/80 px-3 py-0.5 rounded-full border border-amber-500/20 backdrop-blur-md shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_rgba(34,211,238,0.9)]" />
            <span className="font-bold text-amber-200">J.A.R.V.I.S. PROTOCOL</span>
            <span className="text-amber-500/40 hidden sm:inline">•</span>
            <span className="text-amber-300/70 hidden sm:inline">VAJRA CORE MK-VII</span>
            <span className="text-amber-500/40 hidden md:inline">•</span>
            <span className="text-cyan-300 font-semibold hidden md:inline">{isOffline ? 'ON-DEVICE' : 'ARC MATRIX ACTIVE'}</span>
          </div>
        </div>

        {/* Centerpiece Stage: Pure Holographic Energy Core Floating in Center Stage */}
        <div
          ref={stageRef}
          id="vajra-energy-core-stage"
          className="relative flex-1 w-full min-h-0 flex items-center justify-center py-0.5 sm:py-1 overflow-hidden"
        >
          {/* Dynamic Ambient Volumetric Stage Bloom (Intensifies behind the entire core) */}
          <div
            className={`absolute rounded-full pointer-events-none transition-all duration-700 ease-out will-change-transform ${
              isExecuting
                ? 'opacity-95 scale-125 animate-flare-pulsate-fast'
                : isThinking
                ? 'opacity-85 scale-110 animate-flare-pulsate'
                : 'opacity-20 scale-75'
            }`}
            style={{
              width: sphereSize * 1.45,
              height: sphereSize * 1.45,
              background: isExecuting
                ? `radial-gradient(circle, ${flareColors.accent}60 0%, ${flareColors.primary}45 35%, ${flareColors.secondary}25 60%, transparent 80%)`
                : isThinking
                ? `radial-gradient(circle, ${flareColors.primary}55 0%, ${flareColors.secondary}40 40%, rgba(220,38,38,0.2) 65%, transparent 80%)`
                : `radial-gradient(circle, ${flareColors.primary}25 0%, transparent 65%)`,
              filter: 'blur(36px)',
            }}
          />

          {/* Sci-Fi HUD Corner Brackets Framing the Core */}
          <div
            className="relative flex items-center justify-center transition-all duration-500"
            style={{ width: sphereSize + 16, height: sphereSize + 16 }}
          >
            {/* Top-Left Bracket */}
            <div
              className={`absolute top-0 left-0 w-3.5 h-3.5 border-t border-l pointer-events-none transition-all duration-300 ${
                isExecuting
                  ? 'border-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.9)]'
                  : isThinking
                  ? 'border-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                  : 'border-amber-500/40'
              }`}
            />
            {/* Top-Right Bracket */}
            <div
              className={`absolute top-0 right-0 w-3.5 h-3.5 border-t border-r pointer-events-none transition-all duration-300 ${
                isExecuting
                  ? 'border-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.9)]'
                  : isThinking
                  ? 'border-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                  : 'border-amber-500/40'
              }`}
            />
            {/* Bottom-Left Bracket */}
            <div
              className={`absolute bottom-0 left-0 w-3.5 h-3.5 border-b border-l pointer-events-none transition-all duration-300 ${
                isExecuting
                  ? 'border-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.9)]'
                  : isThinking
                  ? 'border-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                  : 'border-amber-500/40'
              }`}
            />
            {/* Bottom-Right Bracket */}
            <div
              className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-b border-r pointer-events-none transition-all duration-300 ${
                isExecuting
                  ? 'border-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.9)]'
                  : isThinking
                  ? 'border-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                  : 'border-amber-500/40'
              }`}
            />

            {/* Stark HUD micro telemetry markings */}
            <div className="absolute top-1/2 -left-7 -translate-y-1/2 hidden md:flex flex-col gap-0.5 text-[7px] font-mono pointer-events-none transition-colors duration-300">
              <span className={isIntensified ? 'text-amber-200 font-bold' : 'text-amber-500/40'}>
                {isExecuting ? 'SURGE +98.4%' : isThinking ? 'SYNAPSE 94%' : 'LAT +42.88°'}
              </span>
              <span className={isIntensified ? 'text-cyan-300 font-bold' : 'text-amber-500/40'}>
                {isExecuting ? 'ARC 1420V' : isThinking ? 'INFER MK-VII' : 'GIMBAL 0.04'}
              </span>
            </div>
            <div className="absolute top-1/2 -right-7 -translate-y-1/2 hidden md:flex flex-col gap-0.5 text-[7px] font-mono pointer-events-none text-right transition-colors duration-300">
              <span className={isIntensified ? 'text-amber-200 font-bold' : 'text-amber-500/40'}>
                {isExecuting ? 'FLUX MAX' : isThinking ? 'FLUX 100%' : 'FLUX 99.8%'}
              </span>
              <span className={isIntensified ? 'text-cyan-300 font-bold' : 'text-amber-500/40'}>
                {isExecuting ? 'WARP SPEED' : isThinking ? 'COMPUTING' : 'ARC MK-VII'}
              </span>
            </div>

            {/* Dynamic Glow Flare System: Intensifies dramatically in 'thinking' and 'executing' */}
            <div
              id="vajra-hologram-glow-flare"
              className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible z-0"
              aria-hidden="true"
            >
              {/* Flare Layer 1: Radiant Core Hotspot Aura */}
              <div
                className={`absolute rounded-full transition-all duration-700 ease-out will-change-transform ${
                  isExecuting
                    ? 'opacity-100 scale-125 animate-flare-pulsate-fast'
                    : isThinking
                    ? 'opacity-85 scale-110 animate-flare-pulsate'
                    : 'opacity-25 scale-80'
                }`}
                style={{
                  width: sphereSize * 1.15,
                  height: sphereSize * 1.15,
                  background: isExecuting
                    ? `radial-gradient(circle at center, #ffffff 0%, ${flareColors.accent}90 22%, ${flareColors.primary}75 45%, ${flareColors.secondary}45 70%, transparent 90%)`
                    : isThinking
                    ? `radial-gradient(circle at center, #fffbeb 0%, ${flareColors.primary}85 25%, ${flareColors.secondary}60 55%, transparent 85%)`
                    : `radial-gradient(circle at center, ${flareColors.primary}40 0%, ${flareColors.secondary}20 50%, transparent 80%)`,
                  filter: isIntensified ? 'blur(16px)' : 'blur(24px)',
                }}
              />

              {/* Flare Layer 2: Anamorphic Horizontal Lens Flare Razor (Cinematic Optical Streak) */}
              <div
                className={`absolute transition-all duration-500 ease-out will-change-transform ${
                  isExecuting
                    ? 'opacity-100 scale-x-140 animate-flare-shimmer'
                    : isThinking
                    ? 'opacity-90 scale-x-120 animate-flare-shimmer'
                    : 'opacity-15 scale-x-45'
                }`}
                style={{
                  width: isMobileMode ? Math.min(sphereSize * 1.15, 320) : sphereSize * 1.55,
                  height: isIntensified ? 3 : 1.5,
                  background: isExecuting
                    ? `linear-gradient(90deg, transparent 0%, ${flareColors.accent} 20%, #ffffff 50%, ${flareColors.accent} 80%, transparent 100%)`
                    : `linear-gradient(90deg, transparent 0%, ${flareColors.primary} 25%, #ffffff 50%, ${flareColors.primary} 75%, transparent 100%)`,
                  boxShadow: isIntensified
                    ? `0 0 16px 2px ${isExecuting ? flareColors.accent : flareColors.primary}`
                    : 'none',
                }}
              />

              {/* Flare Layer 3: Secondary Diffuse Horizontal Horizon Bloom */}
              <div
                className={`absolute transition-all duration-500 ease-out will-change-transform ${
                  isExecuting
                    ? 'opacity-95 scale-x-130'
                    : isThinking
                    ? 'opacity-80 scale-x-110'
                    : 'opacity-10 scale-x-30'
                }`}
                style={{
                  width: isMobileMode ? Math.min(sphereSize * 1.1, 300) : sphereSize * 1.35,
                  height: isIntensified ? 22 : 6,
                  background: isExecuting
                    ? `linear-gradient(90deg, transparent 0%, ${flareColors.secondary}50 20%, ${flareColors.primary}90 50%, ${flareColors.accent}70 80%, transparent 100%)`
                    : `linear-gradient(90deg, transparent 0%, ${flareColors.secondary}50 25%, ${flareColors.primary}80 50%, ${flareColors.secondary}50 75%, transparent 100%)`,
                  filter: 'blur(8px)',
                }}
              />

              {/* Flare Layer 4: Cross-Diffraction Spikes (4-Point Starburst Lens Flare) */}
              <div
                className={`absolute transition-all duration-700 ease-out will-change-transform rotate-45 ${
                  isExecuting
                    ? 'opacity-90 scale-120 animate-flare-shimmer'
                    : isThinking
                    ? 'opacity-70 scale-100'
                    : 'opacity-0 scale-40'
                }`}
                style={{
                  width: sphereSize * 1.05,
                  height: isIntensified ? 2 : 1,
                  background: `linear-gradient(90deg, transparent 5%, ${flareColors.primary} 30%, #ffffff 50%, ${flareColors.primary} 70%, transparent 95%)`,
                  boxShadow: isIntensified ? `0 0 10px ${flareColors.primary}` : 'none',
                }}
              />
              <div
                className={`absolute transition-all duration-700 ease-out will-change-transform -rotate-45 ${
                  isExecuting
                    ? 'opacity-90 scale-120 animate-flare-shimmer'
                    : isThinking
                    ? 'opacity-70 scale-100'
                    : 'opacity-0 scale-40'
                }`}
                style={{
                  width: sphereSize * 1.05,
                  height: isIntensified ? 2 : 1,
                  background: `linear-gradient(90deg, transparent 5%, ${flareColors.primary} 30%, #ffffff 50%, ${flareColors.primary} 70%, transparent 95%)`,
                  boxShadow: isIntensified ? `0 0 10px ${flareColors.primary}` : 'none',
                }}
              />

              {/* Flare Layer 5: Dynamic Shockwave Radiation Rings */}
              {isIntensified && (
                <>
                  <div
                    className={`absolute rounded-full border will-change-transform ${
                      isExecuting ? 'animate-flare-shockwave-fast' : 'animate-flare-shockwave'
                    }`}
                    style={{
                      width: sphereSize * 0.9,
                      height: sphereSize * 0.9,
                      borderColor: isExecuting ? flareColors.accent : flareColors.primary,
                      boxShadow: `0 0 14px ${isExecuting ? flareColors.accent : flareColors.primary}`,
                    }}
                  />
                  {isExecuting && (
                    <div
                      className="absolute rounded-full border border-white/70 will-change-transform animate-flare-shockwave-fast"
                      style={{
                        width: sphereSize * 0.7,
                        height: sphereSize * 0.7,
                        animationDelay: '0.45s',
                        boxShadow: `0 0 18px #ffffff`,
                      }}
                    />
                  )}
                </>
              )}

              {/* Flare Layer 6: Blinding Singularity Core Corona Flare */}
              <div
                className={`absolute rounded-full transition-all duration-500 ease-out will-change-transform ${
                  isExecuting
                    ? 'opacity-100 scale-125'
                    : isThinking
                    ? 'opacity-85 scale-105'
                    : 'opacity-15 scale-60'
                }`}
                style={{
                  width: Math.min(100, sphereSize * 0.28),
                  height: Math.min(100, sphereSize * 0.28),
                  background: `radial-gradient(circle, #ffffff 15%, ${isExecuting ? flareColors.accent : flareColors.primary} 60%, transparent 85%)`,
                  filter: isIntensified ? 'blur(4px)' : 'blur(8px)',
                  boxShadow: isIntensified
                    ? `0 0 28px 6px ${isExecuting ? flareColors.accent : flareColors.primary}`
                    : 'none',
                }}
              />
            </div>

            {/* The Massive Holographic Core */}
            <div className="relative z-10">
              <VajraSphere
                customDimension={sphereSize}
                state={state}
                isOffline={isOffline}
                interactive={true}
                onClick={onToggleVoice}
                coreTheme={coreTheme}
                customCoreColor={customCoreColor}
              />
            </div>
          </div>
        </div>

        {/* Bottom HUD Strip: Status, Audio Harmonics, & Directives */}
        <div className="w-full max-w-xl flex flex-col items-center gap-1 pb-0.5 select-none shrink-0">
          
          {/* Status Badge & Integrated Acoustic Visualizer */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Compact Status pill */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#080103]/85 border border-amber-500/30 text-[10px] font-mono backdrop-blur-md shadow-sm">
              {hudExecutionStatus ? (
                <>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      hudExecutionStatus.includes('COMPLETE')
                        ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                        : hudExecutionStatus.includes('EXECUTING')
                        ? 'bg-amber-400 animate-spin'
                        : 'bg-cyan-400 animate-ping'
                    }`}
                  />
                  <span className="font-bold tracking-wider uppercase text-[10px] text-amber-100">
                    {hudExecutionStatus}
                  </span>
                </>
              ) : (
                <>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      state === 'speaking'
                        ? 'bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.9)]'
                        : state === 'listening'
                        ? 'bg-cyan-400 animate-ping shadow-[0_0_6px_rgba(34,211,238,0.9)]'
                        : state === 'thinking'
                        ? 'bg-amber-400 animate-pulse'
                        : state === 'executing'
                        ? 'bg-yellow-300 animate-spin'
                        : 'bg-cyan-400/80 shadow-[0_0_6px_rgba(34,211,238,0.8)]'
                    }`}
                  />
                  <span className="font-semibold tracking-wider uppercase text-[10px] text-amber-200">
                    {isOffline
                      ? 'LOCAL CORE • ACTIVE'
                      : state === 'listening'
                      ? 'ACOUSTIC SENSORS • LISTENING'
                      : state === 'thinking'
                      ? 'NEURAL MATRIX • THINKING'
                      : state === 'executing'
                      ? 'EXECUTING DIRECTIVE'
                      : state === 'speaking'
                      ? 'AUDIO TRANSMISSION'
                      : 'JARVIS CORE • ONLINE'}
                  </span>
                </>
              )}
            </div>

            {/* Subtle Slim Acoustic Spectrum Bar */}
            <div className="hidden sm:flex items-end gap-0.5 h-3 px-1.5 py-0.5 rounded-full bg-[#080103]/80 border border-amber-500/25">
              {liveFreqs.map((val, idx) => (
                <div
                  key={idx}
                  className="w-0.5 sm:w-1 rounded-full bg-gradient-to-t from-amber-500 to-cyan-300 transition-all duration-75"
                  style={{ height: `${Math.max(20, (val / 100) * 100)}%` }}
                />
              ))}
            </div>
          </div>

          {/* Temporary Floating Notification Toast */}
          {temporaryNotification && (
            <div className="animate-in fade-in zoom-in-95 duration-200 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0a0204]/95 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)] text-emerald-300 text-[11px] font-mono backdrop-blur-xl max-w-md">
              <Check className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="font-medium text-emerald-100 truncate">
                {temporaryNotification.text}
              </span>
              {onDismissNotification && (
                <button
                  type="button"
                  onClick={onDismissNotification}
                  className="ml-1 text-emerald-400/60 hover:text-emerald-200 transition-colors cursor-pointer text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Sample Directives (Sleek micro pill chips) */}
          <div className="flex flex-wrap items-center justify-center gap-1">
            {SAMPLE_DIRECTIVES.map((d) => (
              <button
                key={d.title}
                type="button"
                onClick={() => onSelectPrompt(d.prompt)}
                className="px-2 py-0.5 rounded-full bg-[#080103]/80 hover:bg-[#180309] border border-amber-500/20 hover:border-amber-400/60 text-[10px] font-mono text-amber-200/75 hover:text-white transition-all cursor-pointer shadow-sm flex items-center gap-1 group"
              >
                <Sparkles className="w-2 h-2 text-amber-400 group-hover:text-cyan-300 transition-colors" />
                <span>{d.title}</span>
              </button>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
};
