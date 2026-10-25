import React from 'react';
import {
  Zap,
  Volume2,
  VolumeX,
  Settings,
  Cpu,
  Wifi,
  WifiOff,
  Radio,
  Sliders,
  AlertCircle,
  Smartphone,
  Languages,
  Bell,
} from 'lucide-react';
import { AssistantState, ModelOption } from '../../types';

interface MobileStatusBarProps {
  selectedModel: string;
  availableModels: ModelOption[];
  isOfflineMode: boolean;
  isForceOffline: boolean;
  assistantState: AssistantState;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenEngineModal: () => void;
  onOpenCoreSettings: () => void;
  onOpenVoiceDiagnostics?: () => void;
  diagnosticWarning?: string;
  onResetHome?: () => void;
  onOpenTransparencyPanel?: () => void;
  onOpenPhoneControls?: () => void;
  onOpenLanguageSheet?: () => void;
  onOpenRemindersSheet?: () => void;
}

export const MobileStatusBar: React.FC<MobileStatusBarProps> = ({
  selectedModel,
  availableModels,
  isOfflineMode,
  isForceOffline,
  assistantState,
  isMuted,
  onToggleMute,
  onOpenEngineModal,
  onOpenCoreSettings,
  onOpenVoiceDiagnostics,
  diagnosticWarning,
  onResetHome,
  onOpenTransparencyPanel,
  onOpenPhoneControls,
  onOpenLanguageSheet,
  onOpenRemindersSheet,
}) => {
  const currentModel = availableModels.find((m) => m.id === selectedModel);
  const shortModelName = isOfflineMode
    ? 'Local Engine'
    : currentModel?.name?.includes('Lite')
    ? 'Flash Lite'
    : currentModel?.name?.includes('3.7')
    ? 'Neural 3.7'
    : 'Stream Core';

  // Haptic feedback helper
  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(20);
      } catch {}
    }
  };

  return (
    <header
      id="vajra-mobile-status-bar"
      className="relative z-30 w-full shrink-0 bg-[#040102]/95 border-b border-amber-500/20 px-3 pt-[max(env(safe-area-inset-top),0.5rem)] pb-2 backdrop-blur-2xl select-none"
    >
      <div className="flex items-center justify-between gap-2 max-w-lg mx-auto">
        {/* Left: Brand & Live State Indicator */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            if (onOpenTransparencyPanel) {
              onOpenTransparencyPanel();
            } else {
              onResetHome?.();
            }
          }}
          className="flex items-center gap-2 text-left group cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-400/50 rounded-lg p-1 -ml-1 transition-all"
          aria-label="VAJRA Home"
        >
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-tr from-red-600 via-amber-500 to-yellow-400 p-0.5 shadow-md shadow-red-950/60 shrink-0">
            <div className="w-full h-full bg-[#060103] rounded-[6px] flex items-center justify-center">
              <Zap className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
            </div>
            {/* Status dot in bottom right of logo */}
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-black ${
                assistantState === 'listening'
                  ? 'bg-cyan-400 animate-ping'
                  : assistantState === 'understanding'
                  ? 'bg-amber-400 animate-pulse'
                  : assistantState === 'thinking'
                  ? 'bg-amber-400 animate-ping'
                  : assistantState === 'planning'
                  ? 'bg-yellow-400 animate-pulse'
                  : assistantState === 'awaiting_confirmation'
                  ? 'bg-purple-400 animate-pulse'
                  : assistantState === 'executing'
                  ? 'bg-red-500 animate-ping'
                  : assistantState === 'verifying'
                  ? 'bg-blue-400 animate-ping'
                  : assistantState === 'speaking'
                  ? 'bg-yellow-400 animate-bounce'
                  : assistantState === 'paused'
                  ? 'bg-stone-500'
                  : assistantState === 'recovering'
                  ? 'bg-orange-400 animate-ping'
                  : assistantState === 'success'
                  ? 'bg-emerald-400'
                  : assistantState === 'error'
                  ? 'bg-red-600 animate-pulse'
                  : assistantState === 'backgrounded'
                  ? 'bg-stone-700'
                  : assistantState === 'protected'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-emerald-500'
              }`}
            />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-hud font-bold tracking-widest text-sm text-amber-200 leading-none">
                VAJRA
              </span>
              <span className="text-[8px] font-mono tracking-wider px-1 py-0.2 rounded bg-red-950/70 text-amber-300/80 border border-amber-500/25">
                MOBILE
              </span>
            </div>
            <span className="text-[9px] font-mono text-amber-400/60 leading-tight">
              {assistantState === 'listening'
                ? 'Acoustic Sensor Active'
                : assistantState === 'understanding'
                ? 'Parsing Directive...'
                : assistantState === 'thinking'
                ? 'Processing...'
                : assistantState === 'planning'
                ? 'Structuring Plan'
                : assistantState === 'awaiting_confirmation'
                ? 'Awaiting Confirmation'
                : assistantState === 'executing'
                ? 'Executing...'
                : assistantState === 'verifying'
                ? 'Verifying Output'
                : assistantState === 'speaking'
                ? 'Voice Synthesizer'
                : assistantState === 'paused'
                ? 'Mission Paused'
                : assistantState === 'recovering'
                ? 'Self-Healing Active'
                : assistantState === 'success'
                ? 'Complete'
                : assistantState === 'error'
                ? 'System Alert'
                : assistantState === 'backgrounded'
                ? 'Background Standby'
                : assistantState === 'protected'
                ? 'Protected Mode'
                : 'Systems Nominal'}
            </span>
          </div>
        </button>

        {/* Center: Model Engine Status Chip (Touch Target >= 44px equivalent via padding) */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            onOpenEngineModal();
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#0e0205] hover:bg-[#1a040b] border border-amber-500/30 hover:border-amber-400/70 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
          title="Switch Engine Matrix"
          aria-label={`Current Engine: ${shortModelName}. Tap to change.`}
        >
          {isOfflineMode ? (
            <WifiOff className="w-3 h-3 text-red-400 shrink-0" />
          ) : (
            <Cpu className="w-3 h-3 text-cyan-400 shrink-0 animate-pulse" />
          )}
          <span className="text-[10px] font-mono text-amber-200 font-medium truncate max-w-[85px] sm:max-w-none">
            {shortModelName}
          </span>
        </button>

        {/* Right: Quick Touch Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Diagnostic Warning Alert if active */}
          {diagnosticWarning && onOpenVoiceDiagnostics && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                onOpenVoiceDiagnostics();
              }}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-amber-300 bg-red-950/80 border border-red-500/60 active:scale-95 transition-all"
              title="Voice Diagnostic Notice"
              aria-label="Voice Diagnostic Alert"
            >
              <AlertCircle className="w-4 h-4 text-amber-400 animate-pulse" />
            </button>
          )}

          {/* Audio Output Mute / Unmute Button (min 44px touch container) */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onToggleMute();
            }}
            className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all cursor-pointer active:scale-95 ${
              isMuted
                ? 'bg-red-950/60 border-red-500/50 text-red-300 shadow-sm'
                : 'bg-[#100307] border-amber-500/30 hover:border-amber-400 text-amber-300 hover:text-white'
            }`}
            title={isMuted ? 'Voice Muted (Tap to enable voice synthesis)' : 'Voice Audio Active'}
            aria-label={isMuted ? 'Unmute VAJRA voice' : 'Mute VAJRA voice'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* Core Appearance & Settings Trigger (min 44px touch container) */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onOpenCoreSettings();
            }}
            className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#100307] border border-amber-500/30 hover:border-amber-400 text-amber-300 hover:text-white active:scale-95 transition-all cursor-pointer"
            title="Core Customization & Memory Settings"
            aria-label="Open VAJRA Core Settings"
          >
            <Sliders className="w-4 h-4 text-amber-400" />
          </button>

          {/* Indian Language Matrix Trigger */}
          {onOpenLanguageSheet && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                onOpenLanguageSheet();
              }}
              className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#100307] border border-amber-500/30 hover:border-amber-400 text-amber-300 hover:text-white active:scale-95 transition-all cursor-pointer"
              title="20 Indian Languages Matrix"
              aria-label="Open Indian Language Matrix"
            >
              <Languages className="w-4 h-4 text-amber-400" />
            </button>
          )}

          {/* Proactive Reminders & Daily Briefing Trigger */}
          {onOpenRemindersSheet && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                onOpenRemindersSheet();
              }}
              className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#100307] border border-amber-500/30 hover:border-amber-400 text-amber-300 hover:text-white active:scale-95 transition-all cursor-pointer"
              title="Proactive Reminders & Daily Briefing"
              aria-label="Open Reminders and Proactive Engine"
            >
              <Bell className="w-4 h-4 text-amber-400" />
            </button>
          )}

          {/* Universal Phone Control Quick Launch (min 44px touch container) */}
          {onOpenPhoneControls && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                onOpenPhoneControls();
              }}
              className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#100307] border border-amber-500/30 hover:border-amber-400 text-amber-300 hover:text-white active:scale-95 transition-all cursor-pointer"
              title="Universal Phone Control & Android Intents"
              aria-label="Open Phone Controls"
            >
              <Smartphone className="w-4 h-4 text-amber-400" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
