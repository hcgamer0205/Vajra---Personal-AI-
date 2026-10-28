import React from 'react';
import {
  Sparkles,
  Zap,
  Mic,
  Volume2,
  Cpu,
  ShieldCheck,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { AssistantState } from '../../types';
import { VajraSphere } from '../VajraSphere';
import { CoreThemeId } from '../../services/vajraAppearance';

interface MobilePresenceCoreProps {
  state: AssistantState;
  isOffline: boolean;
  coreTheme?: CoreThemeId;
  customCoreColor?: string;
  isHeroMode?: boolean;
  onTapCore?: () => void;
  onSelectPrompt?: (prompt: string) => void;
  className?: string;
  currentTopic?: string;
  audioAmplitude?: number;
}

export const MobilePresenceCore: React.FC<MobilePresenceCoreProps> = ({
  state,
  isOffline,
  coreTheme = 'crimson_gold',
  customCoreColor = '#f59e0b',
  isHeroMode = true,
  onTapCore,
  onSelectPrompt,
  className = '',
  currentTopic,
  audioAmplitude = 0,
}) => {
  const sampleDirectives = [
    'YouTube kholo',
    'Google pe Python search karo',
    'Calculator start karo',
    'Kal ka mausam kaisa hai',
    'Mera note save karo',
    'Files kholo',
  ];

  const getStateBadge = () => {
    switch (state) {
      case 'listening':
        return {
          label: 'Acoustic Sensor Active',
          badge: 'LISTENING',
          color: 'text-cyan-300 border-cyan-500/50 bg-cyan-950/60',
          dot: 'bg-cyan-400 animate-ping',
          icon: Mic,
        };
      case 'thinking':
        return {
          label: 'Neural Matrix Processing',
          badge: 'THINKING',
          color: 'text-amber-300 border-amber-500/60 bg-amber-950/70',
          dot: 'bg-amber-400 animate-ping',
          icon: Cpu,
        };
      case 'planning':
        return {
          label: 'Formulating Multi-Step Plan',
          badge: 'PLANNING',
          color: 'text-yellow-300 border-yellow-500/60 bg-yellow-950/60',
          dot: 'bg-yellow-400 animate-pulse',
          icon: Zap,
        };
      case 'executing':
        return {
          label: 'Executing System Directive',
          badge: 'EXECUTING',
          color: 'text-red-300 border-red-500/60 bg-red-950/70',
          dot: 'bg-red-400 animate-ping',
          icon: Radio,
        };
      case 'verifying':
        return {
          label: 'Verifying Execution Output',
          badge: 'VERIFYING',
          color: 'text-blue-300 border-blue-500/50 bg-blue-950/60',
          dot: 'bg-blue-400 animate-ping',
          icon: ShieldCheck,
        };
      case 'speaking':
        return {
          label: 'Voice Output Active',
          badge: 'SPEAKING',
          color: 'text-yellow-200 border-yellow-500/50 bg-yellow-950/60',
          dot: 'bg-yellow-400 animate-bounce',
          icon: Volume2,
        };
      case 'success':
        return {
          label: 'Directive Verified & Complete',
          badge: 'SUCCESS',
          color: 'text-emerald-300 border-emerald-500/50 bg-emerald-950/60',
          dot: 'bg-emerald-400',
          icon: CheckCircle2,
        };
      case 'error':
        return {
          label: 'Execution Anomaly Detected',
          badge: 'ERROR',
          color: 'text-red-300 border-red-500/70 bg-red-950/80',
          dot: 'bg-red-500 animate-pulse',
          icon: AlertTriangle,
        };
      case 'awaiting_confirmation':
      case 'protected':
        return {
          label: 'Authorization Required',
          badge: 'CONFIRMATION',
          color: 'text-amber-200 border-amber-500/60 bg-amber-950/80',
          dot: 'bg-amber-400 animate-pulse',
          icon: Lock,
        };
      case 'recovering':
        return {
          label: 'Self-Healing Protocol Active',
          badge: 'RECOVERING',
          color: 'text-orange-300 border-orange-500/60 bg-orange-950/80',
          dot: 'bg-orange-400 animate-ping',
          icon: Zap,
        };
      case 'backgrounded':
      case 'paused':
        return {
          label: 'Standby Mode',
          badge: 'STANDBY',
          color: 'text-stone-400 border-stone-600/40 bg-stone-950/60',
          dot: 'bg-stone-500',
          icon: Zap,
        };
      case 'idle':
      default:
        return {
          label: isOffline ? 'On-Device Engine Active' : 'Online Standby',
          badge: 'IDLE',
          color: 'text-amber-300/80 border-amber-500/30 bg-[#120307]/70',
          dot: 'bg-emerald-400',
          icon: Zap,
        };
    }
  };

  const statusInfo = getStateBadge();
  const IconComponent = statusInfo.icon;

  if (!isHeroMode) {
    // Compact presence strip for conversation view
    return (
      <div
        className={`shrink-0 flex items-center justify-between px-3 py-1.5 bg-[#0a0205]/95 border-b border-amber-500/25 backdrop-blur-xl z-10 select-none ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onTapCore}
            className="w-10 h-10 rounded-full bg-black/70 border border-amber-500/40 overflow-hidden flex items-center justify-center shrink-0 shadow-inner active:scale-95 transition-transform cursor-pointer"
            title="VAJRA Energy Core"
            aria-label="Tap to view full Energy Core"
          >
            <VajraSphere
              state={state}
              isOffline={isOffline}
              size="sm"
              showRings={false}
              coreTheme={coreTheme}
              customCoreColor={customCoreColor}
              customDimension={40}
            />
          </button>

          <div className="min-w-0 flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-hud font-bold text-xs tracking-wider text-amber-100 truncate">
                VAJRA
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[8px] font-mono font-bold uppercase tracking-wider border ${statusInfo.color}`}
              >
                {statusInfo.badge}
              </span>
            </div>
            <span className="text-[9px] font-mono text-amber-400/60 truncate">
              {currentTopic && currentTopic !== 'general'
                ? `Topic: ${currentTopic}`
                : statusInfo.label}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const heroContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [coreDimension, setCoreDimension] = React.useState<number>(340);

  React.useEffect(() => {
    const updateDimension = () => {
      if (!heroContainerRef.current) return;
      const rect = heroContainerRef.current.getBoundingClientRect();
      const availW = rect.width;
      const availH = rect.height;
      if (availW <= 0 || availH <= 0) return;

      // Deduct 48px vertical buffer for state badge & status padding
      const maxAvailable = Math.min(availW - 24, availH - 48);
      // Scale comfortably between 260px and 520px depending on screen height/width
      const calculated = Math.max(260, Math.min(Math.floor(maxAvailable * 0.92), 520));
      setCoreDimension(calculated);
    };

    updateDimension();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && heroContainerRef.current) {
      ro = new ResizeObserver(updateDimension);
      ro.observe(heroContainerRef.current);
    }

    window.addEventListener('resize', updateDimension);
    window.addEventListener('orientationchange', updateDimension);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateDimension);
      window.removeEventListener('orientationchange', updateDimension);
    };
  }, []);

  // Pure Minimal JARVIS Hero Presence: Centered Living Energy Sphere on Midnight Canvas
  return (
    <div
      ref={heroContainerRef}
      id="vajra-mobile-hero-presence"
      className={`flex-1 w-full flex flex-col items-center justify-center relative select-none px-4 overflow-hidden bg-black ${className}`}
    >
      {/* 1. Holographic Atmospheric Radial Aura */}
      <div
        className={`absolute w-80 h-80 rounded-full transition-all duration-700 pointer-events-none ${
          state === 'listening'
            ? 'bg-cyan-500/20 blur-3xl scale-125 animate-pulse'
            : state === 'thinking' || state === 'planning'
            ? 'bg-amber-500/20 blur-3xl scale-115 animate-pulse'
            : state === 'executing'
            ? 'bg-red-600/25 blur-3xl scale-120 animate-pulse'
            : state === 'speaking'
            ? 'bg-yellow-500/20 blur-3xl scale-110 animate-pulse'
            : state === 'awaiting_confirmation' || state === 'protected'
            ? 'bg-purple-600/25 blur-3xl scale-115 animate-pulse'
            : state === 'error' || state === 'recovering'
            ? 'bg-red-600/30 blur-3xl scale-110 animate-pulse'
            : 'bg-amber-950/15 blur-2xl scale-100'
        }`}
      />

      {/* Concentric soundwave ripples on listening */}
      {state === 'listening' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-72 h-72 rounded-full border border-cyan-400/35 animate-ping opacity-60" />
          <div className="w-56 h-56 rounded-full border border-amber-400/30 animate-pulse opacity-40" />
        </div>
      )}

      {/* 2. Majestic Centered Energy Sphere */}
      <button
        type="button"
        onClick={onTapCore}
        className="relative z-10 cursor-pointer active:scale-95 transition-transform focus:outline-none focus:ring-1 focus:ring-amber-500/40 rounded-full"
        title="VAJRA Stark Holographic Reactor. Tap to toggle voice."
        aria-label="VAJRA Stark Holographic Reactor. Tap to interact."
      >
        <VajraSphere
          state={state}
          isOffline={isOffline}
          size="hero"
          showRings={true}
          coreTheme={coreTheme}
          customCoreColor={customCoreColor}
          customDimension={coreDimension}
          audioAmplitude={audioAmplitude}
          onClick={onTapCore}
        />
      </button>

      {/* 3. Whisper-Quiet State Cue (Non-competing, only active when engaged) */}
      <div className="relative z-10 mt-4 min-h-[20px] flex items-center justify-center gap-1.5 text-center transition-opacity duration-300">
        {state !== 'idle' ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-amber-500/20 backdrop-blur-sm animate-in fade-in duration-200">
            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot} shrink-0`} />
            <span className="text-[11px] font-mono tracking-wider text-amber-200/90 uppercase">
              {statusInfo.label}
            </span>
          </div>
        ) : (
          <span className="text-[10px] font-mono tracking-widest text-amber-500/30 uppercase">
            Awaiting Command
          </span>
        )}
      </div>
    </div>
  );
};
