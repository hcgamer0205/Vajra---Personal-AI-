import React from 'react';
import {
  Zap,
  History,
  Mic,
  Calculator,
  FolderTree,
  Cpu,
  Settings,
  Globe,
  Search,
  Volume2,
  VolumeX,
  Shield,
  Activity,
  Laptop,
  Sliders,
} from 'lucide-react';

interface VajraNavRailProps {
  onOpenHome: () => void;
  onOpenHistory: () => void;
  onToggleVoice: () => void;
  isListening: boolean;
  onOpenTools: () => void;
  onOpenFiles: () => void;
  onOpenSystem: () => void;
  onOpenDiagnostics: () => void;
  onOpenSetup?: () => void;
  onOpenCoreSettings?: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isOfflineMode: boolean;
  activeView?: string;
}

export const VajraNavRail: React.FC<VajraNavRailProps> = ({
  onOpenHome,
  onOpenHistory,
  onToggleVoice,
  isListening,
  onOpenTools,
  onOpenFiles,
  onOpenSystem,
  onOpenDiagnostics,
  onOpenSetup,
  onOpenCoreSettings,
  isMuted,
  onToggleMute,
  isOfflineMode,
}) => {
  return (
    <aside
      id="vajra-left-nav-rail"
      className="hidden sm:flex flex-col items-center justify-between w-14 lg:w-16 py-3 bg-[#040102]/98 border-r border-amber-500/20 text-[#fef3c7] z-30 shrink-0 backdrop-blur-2xl select-none shadow-[4px_0_20px_-4px_rgba(220,38,38,0.2)]"
    >
      {/* Top Brand Emblem */}
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={onOpenHome}
          className="group relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-amber-500 to-yellow-400 p-0.5 shadow-lg shadow-red-950/60 transition-all hover:scale-105 cursor-pointer"
          title="VAJRA Command Center (Reset Core)"
          aria-label="VAJRA Command Center"
        >
          <div className="w-full h-full bg-[#040102] rounded-[10px] flex items-center justify-center text-amber-400 group-hover:text-yellow-300">
            <Zap className="w-5 h-5 text-amber-400 animate-pulse drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
          </div>
        </button>
        <span className="text-[9px] font-hud font-bold tracking-widest text-amber-400/90 uppercase">
          VAJRA
        </span>
      </div>

      {/* Center Nav Action Icons */}
      <nav className="flex flex-col items-center gap-2.5 my-auto">
        {/* 1. Home / Reactor Reset */}
        <button
          type="button"
          onClick={onOpenHome}
          className="relative p-2.5 rounded-xl text-amber-400/80 hover:text-yellow-200 hover:bg-red-950/40 border border-transparent hover:border-amber-500/40 transition-all cursor-pointer group"
          title="Home: Central Reactor & Directives"
          aria-label="Home"
        >
          <Zap className="w-4 h-4" />
          <span className="sr-only">Home</span>
          {/* Tooltip */}
          <span className="absolute left-full ml-3 px-2 py-1 bg-[#060103] border border-amber-500/40 rounded text-[10px] font-mono text-amber-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
            Central Reactor
          </span>
        </button>

        {/* 2. History & Telemetry */}
        <button
          type="button"
          onClick={onOpenHistory}
          className="relative p-2.5 rounded-xl text-amber-400/80 hover:text-yellow-200 hover:bg-red-950/40 border border-transparent hover:border-amber-500/40 transition-all cursor-pointer group"
          title="History & Telemetry Logs"
          aria-label="Interaction History"
        >
          <History className="w-4 h-4" />
          <span className="absolute left-full ml-3 px-2 py-1 bg-[#060103] border border-amber-500/40 rounded text-[10px] font-mono text-amber-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
            Interaction History
          </span>
        </button>

        {/* 3. Voice Interaction */}
        <button
          type="button"
          onClick={onToggleVoice}
          className={`relative p-2.5 rounded-xl border transition-all cursor-pointer group ${
            isListening
              ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-black shadow-[0_0_15px_rgba(245,158,11,0.8)] ring-2 ring-cyan-400/80'
              : 'text-amber-400/80 hover:text-yellow-200 hover:bg-red-950/40 border-transparent hover:border-amber-500/40'
          }`}
          title="Voice Stream Activation"
          aria-label="Voice Activation"
        >
          <Mic className={`w-4 h-4 ${isListening ? 'animate-bounce text-black' : ''}`} />
          <span className="absolute left-full ml-3 px-2 py-1 bg-[#060103] border border-amber-500/40 rounded text-[10px] font-mono text-amber-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
            {isListening ? 'Listening Active' : 'Voice Pipeline'}
          </span>
        </button>

        {/* 4. Tools Hub */}
        <button
          type="button"
          onClick={onOpenTools}
          className="relative p-2.5 rounded-xl text-amber-400/80 hover:text-yellow-200 hover:bg-red-950/40 border border-transparent hover:border-amber-500/40 transition-all cursor-pointer group"
          title="VAJRA Integrated Tools Hub"
          aria-label="Tools"
        >
          <Calculator className="w-4 h-4" />
          <span className="absolute left-full ml-3 px-2 py-1 bg-[#060103] border border-amber-500/40 rounded text-[10px] font-mono text-amber-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
            Integrated Tools Hub
          </span>
        </button>

        {/* 5. Session Files & Explorer */}
        <button
          type="button"
          onClick={onOpenFiles}
          className="relative p-2.5 rounded-xl text-amber-400/80 hover:text-yellow-200 hover:bg-red-950/40 border border-transparent hover:border-amber-500/40 transition-all cursor-pointer group"
          title="Session & Storage Explorer"
          aria-label="Session Files"
        >
          <FolderTree className="w-4 h-4" />
          <span className="absolute left-full ml-3 px-2 py-1 bg-[#060103] border border-amber-500/40 rounded text-[10px] font-mono text-amber-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
            Session & Storage Explorer
          </span>
        </button>

        {/* 6. System Engine (Cloud vs Local) */}
        <button
          type="button"
          onClick={onOpenSystem}
          className="relative p-2.5 rounded-xl text-amber-400/80 hover:text-yellow-200 hover:bg-red-950/40 border border-transparent hover:border-amber-500/40 transition-all cursor-pointer group"
          title="Neural Engine Matrix (Cloud / Offline)"
          aria-label="System Engine"
        >
          <Cpu className="w-4 h-4" />
          <span className="absolute left-full ml-3 px-2 py-1 bg-[#060103] border border-amber-500/40 rounded text-[10px] font-mono text-amber-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
            Neural Engine Matrix ({isOfflineMode ? 'On-Device' : 'Cloud'})
          </span>
        </button>
      </nav>

      {/* Bottom Controls: Setup, Core Settings, Voice Diagnostics & Mute Audio */}
      <div className="flex flex-col items-center gap-2 pt-2 border-t border-amber-900/60 w-full">
        {/* Core & Memory Settings */}
        {onOpenCoreSettings && (
          <button
            type="button"
            onClick={onOpenCoreSettings}
            className="relative p-2 rounded-xl text-amber-400/80 hover:text-yellow-200 hover:bg-red-950/40 border border-transparent hover:border-amber-500/40 transition-all cursor-pointer group"
            title="Core Lighting & Persistent Memory"
            aria-label="Core Settings"
          >
            <Sliders className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
            <span className="absolute left-full ml-3 px-2 py-1 bg-[#060103] border border-amber-500/40 rounded text-[10px] font-mono text-amber-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
              Core &amp; Memory Settings
            </span>
          </button>
        )}

        {/* Setup & Configuration */}
        {onOpenSetup && (
          <button
            type="button"
            onClick={onOpenSetup}
            className="relative p-2 rounded-xl text-amber-400/80 hover:text-yellow-200 hover:bg-red-950/40 border border-transparent hover:border-amber-500/40 transition-all cursor-pointer group"
            title="Setup & Configuration Wizard"
            aria-label="Setup & Configuration"
          >
            <Settings className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
            <span className="absolute left-full ml-3 px-2 py-1 bg-[#060103] border border-amber-500/40 rounded text-[10px] font-mono text-amber-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
              Setup & Configuration
            </span>
          </button>
        )}

        {/* 6-Stage Diagnostics */}
        <button
          type="button"
          onClick={onOpenDiagnostics}
          className="relative p-2 rounded-xl text-amber-400/80 hover:text-yellow-200 hover:bg-red-950/40 border border-transparent hover:border-amber-500/40 transition-all cursor-pointer group"
          title="Voice Pipeline Diagnostics"
          aria-label="Diagnostics"
        >
          <Activity className="w-4 h-4 text-amber-400" />
          <span className="absolute left-full ml-3 px-2 py-1 bg-[#060103] border border-amber-500/40 rounded text-[10px] font-mono text-amber-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
            6-Stage Voice Diagnostics
          </span>
        </button>

        {/* Audio Mute */}
        <button
          type="button"
          onClick={onToggleMute}
          className={`relative p-2 rounded-xl transition-all cursor-pointer group ${
            !isMuted
              ? 'text-amber-300 bg-amber-500/20 border border-amber-500/40'
              : 'text-amber-500/40 hover:text-amber-300'
          }`}
          title={!isMuted ? 'Voice Audio Output Active' : 'Voice Audio Muted'}
          aria-label="Toggle Voice Audio"
        >
          {!isMuted ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
          <span className="absolute left-full ml-3 px-2 py-1 bg-[#060103] border border-amber-500/40 rounded text-[10px] font-mono text-amber-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
            {!isMuted ? 'Voice Audio: ON' : 'Voice Audio: MUTED'}
          </span>
        </button>
      </div>
    </aside>
  );
};
