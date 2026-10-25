import React, { useState, useRef, useEffect } from 'react';
import {
  Zap,
  Volume2,
  VolumeX,
  Cpu,
  PanelLeft,
  Check,
  Activity,
  Trash2,
  Radio,
  Wifi,
  WifiOff,
  Sliders,
  History,
  Wrench,
  FolderTree,
  Settings,
  Brain,
} from 'lucide-react';
import { ModelOption } from '../types';

interface VajraHUDHeaderProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  availableModels: ModelOption[];
  isOfflineMode: boolean;
  onOpenEngineModal: () => void;
  onOpenTelemetry: () => void;
  hasMessages: boolean;
  onClearChat: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenVoiceDiagnostics?: () => void;
  isVoiceDiagActive?: boolean;
  onOpenCoreSettings?: () => void;
  onOpenMemoryVault?: () => void;
  memoryCount?: number;
  onOpenTools?: () => void;
  onOpenFiles?: () => void;
  onOpenSetup?: () => void;
  onResetHome?: () => void;
}

export const VajraHUDHeader: React.FC<VajraHUDHeaderProps> = ({
  selectedModel,
  onSelectModel,
  availableModels,
  isOfflineMode,
  onOpenEngineModal,
  onOpenTelemetry,
  hasMessages,
  onClearChat,
  isMuted,
  onToggleMute,
  onOpenVoiceDiagnostics,
  isVoiceDiagActive,
  onOpenCoreSettings,
  onOpenMemoryVault,
  memoryCount = 0,
  onOpenTools,
  onOpenFiles,
  onOpenSetup,
  onResetHome,
}) => {
  const [showModelMenu, setShowModelMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowModelMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentModel = availableModels.find((m) => m.id === selectedModel) || {
    name: isOfflineMode ? 'VAJRA In-Browser Core' : 'VAJRA Stream Engine',
    id: selectedModel,
  };

  return (
    <header
      id="vajra-top-hud"
      className="relative z-20 flex items-center justify-between px-2.5 sm:px-4 py-1 sm:py-1.5 bg-[#040102]/95 border-b border-amber-500/15 text-[#fef3c7] backdrop-blur-2xl shrink-0 select-none shadow-[0_2px_12px_-2px_rgba(220,38,38,0.2)]"
    >
      {/* Left: History Drawer & Brand Identity */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Telemetry / History Drawer Trigger */}
        <button
          id="toggle-telemetry-drawer-btn"
          type="button"
          onClick={onOpenTelemetry}
          className="p-1 sm:p-1.5 rounded-md border bg-[#0d0104] hover:bg-[#1a0208] text-amber-300 hover:text-white border-amber-500/25 hover:border-amber-400 transition-all cursor-pointer shadow-sm"
          title="Telemetry & History Log"
          aria-label="Open telemetry and history"
        >
          <History className="w-3.5 h-3.5 text-amber-400" />
        </button>

        {/* VAJRA Brand Logo / Home Trigger */}
        <button
          type="button"
          onClick={onResetHome}
          className="flex items-center gap-1.5 text-left group cursor-pointer"
          title="Return to VAJRA Energy Core"
        >
          <div className="flex items-baseline gap-1.5">
            <span className="font-hud font-bold tracking-widest text-sm sm:text-base text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)] group-hover:from-yellow-100 group-hover:to-amber-200 transition-all">
              VAJRA
            </span>
            <span className="hidden md:inline-block text-[10px] font-mono text-amber-400/60">
              J.A.R.V.I.S. CORE
            </span>
          </div>
        </button>
      </div>

      {/* Right: Sleek Telemetry Badges & Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Telemetry Badge 1: System Status */}
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0a0103] border border-amber-500/25 text-[9px] font-mono text-amber-300 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_rgba(34,211,238,0.9)]"></span>
          <span className="tracking-wider font-semibold">ONLINE</span>
          <span className="text-cyan-400/80 text-[8px] font-mono">[4.88 GHz]</span>
        </div>

        {/* Telemetry Badge 2: AI Core Selector */}
        <div className="relative" ref={menuRef}>
          <button
            id="model-selector-btn"
            type="button"
            onClick={() => setShowModelMenu(!showModelMenu)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0e0205] hover:bg-[#1a040b] border border-amber-500/30 hover:border-amber-400 text-[10px] font-mono text-amber-200 transition-all cursor-pointer shadow-sm"
            title="Switch AI Neural Core"
          >
            <Cpu className="w-2.5 h-2.5 text-amber-400" />
            <span className="truncate max-w-[80px] sm:max-w-[110px] font-semibold text-amber-100">
              {currentModel.name}
            </span>
          </button>

          {showModelMenu && (
            <div className="absolute right-0 mt-1.5 w-64 rounded-xl bg-[#080103] border border-amber-500/50 shadow-[0_10px_35px_rgba(0,0,0,0.95)] p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 backdrop-blur-xl">
              <div className="px-2 py-1 text-[9px] font-mono uppercase text-amber-400/80 border-b border-amber-900/60 mb-1 flex items-center justify-between">
                <span>VAJRA Neural Inference Matrix</span>
                <span className="text-cyan-400 text-[8px]">v3.5</span>
              </div>

              {availableModels.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    onSelectModel(model.id);
                    setShowModelMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-mono text-left transition-all ${
                    selectedModel === model.id
                      ? 'bg-amber-500/20 text-yellow-200 font-bold border border-amber-500/40 shadow-inner'
                      : 'text-amber-100/70 hover:bg-[#1a040b] hover:text-amber-100'
                  }`}
                >
                  <div className="flex flex-col">
                    <span>{model.name}</span>
                    <span className="text-[9px] text-amber-500/70">
                      {model.id === 'local-browser-engine' ? 'On-Device Core' : 'Cloud Proxy'}
                    </span>
                  </div>
                  {selectedModel === model.id && (
                    <Check className="w-3 h-3 text-amber-400 shrink-0 ml-2" />
                  )}
                </button>
              ))}

              <div className="mt-1 pt-1 border-t border-amber-900/60">
                <button
                  type="button"
                  onClick={() => {
                    setShowModelMenu(false);
                    onOpenEngineModal();
                  }}
                  className="w-full px-2 py-1 text-left text-[10px] font-mono text-amber-400 hover:text-amber-200 rounded flex items-center gap-1.5"
                >
                  <Cpu className="w-3 h-3" />
                  <span>Configure Engine Matrix</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Telemetry Badge 3: Voice Channel */}
        <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#0a0103] border border-amber-500/30 text-[10px] font-mono text-amber-300/90 shadow-sm">
          <Radio className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
          <span>VOICE: {isMuted ? 'MUTED' : 'READY'}</span>
        </div>

        {/* Telemetry Badge 4: Network */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#0a0103] border border-amber-500/30 text-[10px] font-mono text-amber-300/90 shadow-sm">
          {isOfflineMode ? (
            <>
              <WifiOff className="w-2.5 h-2.5 text-amber-500" />
              <span>OFFLINE</span>
            </>
          ) : (
            <>
              <Wifi className="w-2.5 h-2.5 text-cyan-400" />
              <span>ONLINE</span>
            </>
          )}
        </div>

        {/* Tools Matrix Trigger */}
        {onOpenTools && (
          <button
            type="button"
            onClick={onOpenTools}
            className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0d0104] hover:bg-[#1a0208] border border-amber-500/25 hover:border-amber-400 text-amber-300 hover:text-white transition-all text-[10px] font-mono shadow-sm cursor-pointer"
            title="Open Tools & Apps Matrix"
            aria-label="Tools Matrix"
          >
            <Wrench className="w-2.5 h-2.5 text-amber-400" />
            <span className="hidden md:inline font-semibold">TOOLS</span>
          </button>
        )}

        {/* File Manager Trigger */}
        {onOpenFiles && (
          <button
            type="button"
            onClick={onOpenFiles}
            className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0d0104] hover:bg-[#1a0208] border border-amber-500/25 hover:border-amber-400 text-amber-300 hover:text-white transition-all text-[10px] font-mono shadow-sm cursor-pointer"
            title="File Explorer & Artifacts"
            aria-label="File Explorer"
          >
            <FolderTree className="w-2.5 h-2.5 text-amber-400" />
            <span className="hidden lg:inline font-semibold">FILES</span>
          </button>
        )}

        {/* Memory Vault Trigger */}
        {onOpenMemoryVault && (
          <button
            type="button"
            onClick={onOpenMemoryVault}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0d0104] hover:bg-[#1a0208] border border-amber-500/30 hover:border-amber-400 text-amber-300 hover:text-white transition-all text-[10px] font-mono shadow-sm cursor-pointer"
            title={`Persistent Memory Vault (${memoryCount} active records)`}
            aria-label="Open Memory Vault"
          >
            <Brain className="w-2.5 h-2.5 text-amber-400" />
            <span className="hidden sm:inline font-semibold">MEMORY</span>
            <span className="px-1 py-0.2 rounded text-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
              {memoryCount}
            </span>
          </button>
        )}

        {/* Setup Wizard */}
        {onOpenSetup && (
          <button
            type="button"
            onClick={onOpenSetup}
            className="p-1 rounded-md bg-[#0d0104] hover:bg-[#1a0208] border border-amber-500/25 hover:border-amber-400 text-amber-300 hover:text-white transition-all cursor-pointer shadow-sm"
            title="System Setup Wizard"
            aria-label="Setup Wizard"
          >
            <Settings className="w-3 h-3 text-amber-400" />
          </button>
        )}

        {/* Core Settings & Memory Trigger */}
        {onOpenCoreSettings && (
          <button
            type="button"
            onClick={onOpenCoreSettings}
            className="p-1 rounded-md bg-[#0d0104] hover:bg-[#1a0208] border border-amber-500/25 hover:border-amber-400 text-amber-300 hover:text-white transition-all cursor-pointer shadow-sm"
            title="Core Themes & Persistent Memory Settings"
            aria-label="Core Settings"
          >
            <Sliders className="w-3 h-3 text-amber-400" />
          </button>
        )}

        {/* Audio Mute Trigger */}
        <button
          type="button"
          onClick={onToggleMute}
          className={`p-1 rounded-md border transition-all cursor-pointer ${
            !isMuted
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
              : 'bg-[#0d0104] text-amber-500/40 border-amber-950/80 hover:text-amber-300'
          }`}
          title={!isMuted ? 'Voice Audio Output Active' : 'Voice Audio Muted'}
          aria-label="Toggle voice audio output"
        >
          {!isMuted ? <Volume2 className="w-3 h-3 text-amber-400" /> : <VolumeX className="w-3 h-3" />}
        </button>

        {/* Clear Telemetry */}
        {hasMessages && (
          <button
            type="button"
            onClick={onClearChat}
            className="p-1 rounded-md bg-red-950/50 hover:bg-red-900/70 border border-red-600/50 text-red-300 hover:text-white transition-all cursor-pointer shadow-sm shadow-red-950"
            title="Clear active HUD directives"
            aria-label="Clear chat session"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </header>
  );
};
