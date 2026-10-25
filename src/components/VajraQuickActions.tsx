import React from 'react';
import { Mic, Globe, Search, Play, Trash2 } from 'lucide-react';

interface VajraQuickActionsProps {
  onVoiceCommand: () => void;
  onOpenWebsite: () => void;
  onSearchWeb: () => void;
  onOpenApp: () => void;
  onClearState?: () => void;
  isListening: boolean;
  hasMessages: boolean;
}

export const VajraQuickActions: React.FC<VajraQuickActionsProps> = ({
  onVoiceCommand,
  onOpenWebsite,
  onSearchWeb,
  onOpenApp,
  onClearState,
  isListening,
  hasMessages,
}) => {
  return (
    <div
      id="vajra-quick-actions-bar"
      className="w-full max-w-3xl mx-auto px-3 py-1 flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap select-none"
    >
      {/* 1. Voice Mode */}
      <button
        type="button"
        onClick={onVoiceCommand}
        className={`group flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
          isListening
            ? 'bg-red-600/30 border-amber-400 text-amber-200 shadow-lg shadow-amber-500/40 animate-pulse'
            : 'bg-[#120307]/85 hover:bg-[#20060e] border-amber-500/30 text-amber-200/80 hover:text-amber-300 hover:border-amber-400/80 shadow-sm shadow-red-950/20'
        }`}
        title="Voice Command & Speech Interaction"
      >
        <div
          className={`p-1 rounded-lg ${
            isListening ? 'bg-amber-400 text-black' : 'bg-red-950/80 text-amber-400 border border-amber-500/30'
          }`}
        >
          <Mic className="w-3 h-3" />
        </div>
        <span className="font-semibold">{isListening ? 'Listening...' : 'Talk to VAJRA'}</span>
      </button>

      {/* 2. Open Website */}
      <button
        type="button"
        onClick={onOpenWebsite}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#120307]/85 hover:bg-[#22060e] border border-amber-500/30 hover:border-amber-400 text-xs font-mono text-amber-200/80 hover:text-amber-300 transition-all cursor-pointer shadow-sm shadow-red-950/20"
        title="Open YouTube, Google, or any custom URL"
      >
        <Globe className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden sm:inline">Open Website</span>
        <span className="sm:hidden">Web</span>
      </button>

      {/* 3. Search Web */}
      <button
        type="button"
        onClick={onSearchWeb}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#120307]/85 hover:bg-[#22060e] border border-amber-500/30 hover:border-amber-400 text-xs font-mono text-amber-200/80 hover:text-amber-300 transition-all cursor-pointer shadow-sm shadow-red-950/20"
        title="Search Google for queries or keywords"
      >
        <Search className="w-3.5 h-3.5 text-yellow-400" />
        <span className="hidden sm:inline">Search Web</span>
        <span className="sm:hidden">Search</span>
      </button>

      {/* 4. Launch Tools / Apps */}
      <button
        type="button"
        onClick={onOpenApp}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#120307]/85 hover:bg-[#22060e] border border-amber-500/30 hover:border-amber-400 text-xs font-mono text-amber-200/80 hover:text-amber-300 transition-all cursor-pointer shadow-sm shadow-red-950/20"
        title="Launch VAJRA Tools: Calculator, Scratchpad, Session Explorer, OS Bridge"
      >
        <Play className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden sm:inline">VAJRA Tools</span>
        <span className="sm:hidden">Tools</span>
      </button>

      {/* 5. Clear Active Telemetry */}
      {hasMessages && onClearState && (
        <button
          type="button"
          onClick={onClearState}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-xs font-mono text-red-300 hover:text-white transition-all cursor-pointer"
          title="Reset active directives and clear screen"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
          <span className="hidden sm:inline">Clear State</span>
        </button>
      )}
    </div>
  );
};
