import React from 'react';
import {
  Calculator,
  FileText,
  FolderTree,
  Globe,
  Search,
  Activity,
  Cpu,
  Sliders,
  Laptop,
  Radio,
  Smartphone,
  ShieldCheck,
  Languages,
  Bell,
  Zap,
  ShieldAlert,
  Terminal,
  Crosshair,
  RefreshCw,
} from 'lucide-react';
import { MobileBottomSheet } from './MobileBottomSheet';
import { starkAudio } from '../../services/starkAudio';

interface MobileToolsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCalculator: () => void;
  onOpenNotepad: () => void;
  onOpenFileManager: () => void;
  onOpenWebsite: () => void;
  onOpenSearch: () => void;
  onOpenVoiceDiagnostics: () => void;
  onOpenEngineModal: () => void;
  onOpenCoreSettings: () => void;
  onOpenTransparencyPanel?: () => void;
  onOpenPhoneControls?: () => void;
  onOpenLanguageSheet?: () => void;
  onOpenRemindersSheet?: () => void;
  onTriggerProtocol?: (protocolDirective: string) => void;
  onOpenStarkVision?: () => void;
  onOpenStarkDatabase?: () => void;
  onOpenStarkProtocolModal?: () => void;
  onOpenAppLinkHub?: () => void;
  onOpenUpdateManager?: () => void;
  onOpenHealthDashboard?: () => void;
}

export const MobileToolsSheet: React.FC<MobileToolsSheetProps> = ({
  isOpen,
  onClose,
  onOpenCalculator,
  onOpenNotepad,
  onOpenFileManager,
  onOpenWebsite,
  onOpenSearch,
  onOpenVoiceDiagnostics,
  onOpenEngineModal,
  onOpenCoreSettings,
  onOpenTransparencyPanel,
  onOpenPhoneControls,
  onOpenLanguageSheet,
  onOpenRemindersSheet,
  onTriggerProtocol,
  onOpenStarkVision,
  onOpenStarkDatabase,
  onOpenStarkProtocolModal,
  onOpenAppLinkHub,
  onOpenUpdateManager,
  onOpenHealthDashboard,
}) => {
  const tools = [
    {
      id: 'app_link_hub',
      title: 'Stark App Link Hub',
      description: 'Editable shortcuts for apps, web links, YouTube & deep links',
      icon: Globe,
      color: 'from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-500/40',
      action: onOpenAppLinkHub || onOpenCoreSettings,
    },
    {
      id: 'update_manager',
      title: 'Auto-Update & Upgrade Manager',
      description: 'Check signed release metadata, download APK & launch installer',
      icon: RefreshCw,
      color: 'from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/40',
      action: onOpenUpdateManager || onOpenCoreSettings,
    },
    {
      id: 'health_dashboard',
      title: 'Stark System Health Dashboard',
      description: 'Live checks for permissions, WebGL, battery, network & export report',
      icon: Activity,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/40',
      action: onOpenHealthDashboard || onOpenCoreSettings,
    },
    {
      id: 'calc',
      title: 'In-App Calculator',
      description: 'Precision arithmetic & scientific computation matrix',
      icon: Calculator,
      color: 'from-amber-500/20 to-yellow-600/20 text-amber-400 border-amber-500/40',
      action: onOpenCalculator,
    },
    {
      id: 'notepad',
      title: 'Tactical Scratchpad',
      description: 'Quick notes, directive transcripts & local scratchpad',
      icon: FileText,
      color: 'from-red-500/20 to-amber-600/20 text-red-400 border-red-500/40',
      action: onOpenNotepad,
    },
    {
      id: 'files',
      title: 'File Explorer',
      description: 'VAJRA workspace files & downloaded artifacts',
      icon: FolderTree,
      color: 'from-cyan-500/20 to-blue-600/20 text-cyan-400 border-cyan-500/40',
      action: onOpenFileManager,
    },
    {
      id: 'web',
      title: 'Web Navigation',
      description: 'Direct launch to YouTube, Google & secure URLs',
      icon: Globe,
      color: 'from-emerald-500/20 to-teal-600/20 text-emerald-400 border-emerald-500/40',
      action: onOpenWebsite,
    },
    {
      id: 'search',
      title: 'Google Web Search',
      description: 'Direct internet search query dispatcher',
      icon: Search,
      color: 'from-amber-500/20 to-orange-600/20 text-amber-400 border-amber-500/40',
      action: onOpenSearch,
    },
    {
      id: 'engine',
      title: 'Engine & Model Matrix',
      description: 'Switch between Cloud Gemini stream & Offline Local Engine',
      icon: Cpu,
      color: 'from-purple-500/20 to-pink-600/20 text-purple-400 border-purple-500/40',
      action: onOpenEngineModal,
    },
    {
      id: 'languages',
      title: 'Indian Multilingual Matrix',
      description: '20 Indian languages (Hindi, Tamil, Bengali, Marathi, etc.)',
      icon: Languages,
      color: 'from-amber-500/20 to-orange-600/20 text-amber-300 border-amber-500/40',
      action: onOpenLanguageSheet || onOpenCoreSettings,
    },
    {
      id: 'reminders',
      title: 'Proactive Intelligence & Reminders',
      description: 'Scheduled reminders, daily morning briefing & quiet hours',
      icon: Bell,
      color: 'from-cyan-500/20 to-teal-600/20 text-cyan-300 border-cyan-500/40',
      action: onOpenRemindersSheet || onOpenCoreSettings,
    },
    {
      id: 'voice_diag',
      title: 'Voice Diagnostics',
      description: 'Inspect microphone permissions, Speech API & TTS status',
      icon: Activity,
      color: 'from-red-500/20 to-amber-500/20 text-red-400 border-red-500/40',
      action: onOpenVoiceDiagnostics,
    },
    {
      id: 'settings',
      title: 'Appearance & Memory',
      description: 'Change Core theme, custom color & inspect memory vault',
      icon: Sliders,
      color: 'from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-500/40',
      action: onOpenCoreSettings,
    },
    {
      id: 'phone_control',
      title: 'Universal Phone Control',
      description: 'System settings, camera, dialer, SMS drafts, volume & emergency stop',
      icon: Smartphone,
      color: 'from-amber-500/20 to-red-600/20 text-amber-300 border-amber-500/40',
      action: onOpenPhoneControls || onOpenCoreSettings,
    },
    {
      id: 'transparency',
      title: 'Self-Awareness & State Matrix',
      description: 'Inspect live state, task reflections, self-monitoring & safety boundaries',
      icon: ShieldCheck,
      color: 'from-cyan-500/20 to-blue-600/20 text-cyan-300 border-cyan-500/40',
      action: onOpenTransparencyPanel || onOpenCoreSettings,
    },
    {
      id: 'apk',
      title: 'Download Android APK (14.3 MB)',
      description: 'Native Android APK build v1.0 (Target SDK 36, Debug Signed)',
      icon: Smartphone,
      color: 'from-emerald-500/20 to-teal-600/20 text-emerald-400 border-emerald-500/40',
      action: () => {
        window.open('/app-debug.apk', '_blank');
      },
    },
  ];

  const starkProtocols = [
    {
      id: 'house_party',
      name: 'House Party Protocol',
      tag: 'AUX STANDBY',
      desc: 'Prime all 20 languages, personal memory & Android bridges',
      directive: 'House Party Protocol',
      border: 'border-cyan-500/40 hover:border-cyan-400',
      badge: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/50',
      glow: 'from-cyan-950/40 to-blue-950/20',
      icon: Zap,
    },
    {
      id: 'veronica',
      name: 'Veronica Diagnostic',
      tag: 'TELEMETRY',
      desc: 'Complete armor, acoustic sensors & neural engine diagnostic',
      directive: 'Run Veronica Armor Diagnostic',
      border: 'border-amber-500/40 hover:border-amber-400',
      badge: 'text-amber-400 bg-amber-950/60 border-amber-800/50',
      glow: 'from-amber-950/40 to-yellow-950/20',
      icon: Crosshair,
    },
    {
      id: 'barn_door',
      name: 'Barn Door Protocol',
      tag: 'QUARANTINE',
      desc: 'Isolate external links & enforce local on-device engine',
      directive: 'Barn Door Protocol',
      border: 'border-red-500/40 hover:border-red-400',
      badge: 'text-red-400 bg-red-950/60 border-red-800/50',
      glow: 'from-red-950/40 to-orange-950/20',
      icon: ShieldAlert,
    },
    {
      id: 'clean_slate',
      name: 'Clean Slate Protocol',
      tag: 'PURGE LOGS',
      desc: 'Clear transient session logs & return energy core to baseline',
      directive: 'Clean Slate Protocol',
      border: 'border-purple-500/40 hover:border-purple-400',
      badge: 'text-purple-400 bg-purple-950/60 border-purple-800/50',
      glow: 'from-purple-950/40 to-indigo-950/20',
      icon: Terminal,
    },
  ];

  const handleProtocolClick = (directive: string) => {
    starkAudio.playProtocolEngaged();
    onClose();
    if (onTriggerProtocol) {
      onTriggerProtocol(directive);
    }
  };

  return (
    <MobileBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      height="tall"
      title="SYSTEM TOOLS & PROTOCOLS"
      subtitle="J.A.R.V.I.S. Tactical protocols & mobile micro-tools"
    >
      <div className="pb-8 space-y-5">
        {/* Stark Industries Tactical Protocols */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] font-mono tracking-widest uppercase text-amber-400/80 font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              STARK TACTICAL PROTOCOLS
            </span>
            <span className="text-[9px] font-mono text-white/40">JARVIS AUTONOMOUS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {starkProtocols.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleProtocolClick(p.directive)}
                className={`flex items-start gap-3 p-3 rounded-2xl bg-gradient-to-r ${p.glow} border ${p.border} bg-[#060205] text-left active:scale-[0.98] transition-all cursor-pointer shadow-lg group`}
              >
                <div className="w-9 h-9 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <p.icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-hud font-bold text-xs tracking-wider text-white truncate">
                      {p.name}
                    </span>
                    <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${p.badge}`}>
                      {p.tag}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-white/60 leading-tight">
                    {p.desc}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* System Micro-Tools Grid */}
        <div>
          <div className="text-[10px] font-mono tracking-widest uppercase text-amber-400/70 font-bold mb-2 px-1">
            UTILITIES & CONFIGURATION
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {tools.map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => {
                  starkAudio.playHudChirp();
                  onClose();
                  tool.action();
                }}
                className={`flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r ${tool.color} border bg-[#0b0205] text-left active:scale-95 transition-all cursor-pointer shadow-md`}
              >
                <div className="w-10 h-10 rounded-xl bg-[#040102] border border-inherit flex items-center justify-center shrink-0">
                  <tool.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-hud font-bold text-xs tracking-wider text-amber-100 truncate">
                    {tool.title}
                  </div>
                  <div className="text-[10px] font-mono text-amber-400/60 leading-tight line-clamp-2">
                    {tool.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </MobileBottomSheet>
  );
};
