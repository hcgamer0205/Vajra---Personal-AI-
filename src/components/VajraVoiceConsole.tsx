import React, { useRef, useEffect, useState } from 'react';
import {
  Mic,
  Send,
  Square,
  Globe,
  Search,
  Wrench,
  Volume2,
  Activity,
  Radio,
  Zap,
  Eye,
  Database,
} from 'lucide-react';
import { AssistantState } from '../types';

interface VajraVoiceConsoleProps {
  input: string;
  setInput: (value: string) => void;
  onSend: (text?: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  state: AssistantState;
  isListening: boolean;
  onToggleVoice: () => void;
  voiceTranscript?: string;
  diagnosticWarning?: string;
  onOpenDiagnostics?: () => void;
  onOpenWebsite?: () => void;
  onSearchWeb?: () => void;
  onOpenTools?: () => void;
  onOpenStarkVision?: () => void;
  onOpenStarkDatabase?: () => void;
  onOpenStarkProtocolModal?: () => void;
}

export const VajraVoiceConsole: React.FC<VajraVoiceConsoleProps> = ({
  input,
  setInput,
  onSend,
  onStop,
  isStreaming,
  state,
  isListening,
  onToggleVoice,
  voiceTranscript,
  diagnosticWarning,
  onOpenDiagnostics,
  onOpenWebsite,
  onSearchWeb,
  onOpenTools,
  onOpenStarkVision,
  onOpenStarkDatabase,
  onOpenStarkProtocolModal,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && input.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-2 pb-1 sm:pb-1.5">
      {/* Top Telemetry Feedback Ribbon & Quick Action Shortcuts */}
      <div className="flex items-center justify-between px-2 py-0.5 text-[10px] font-mono text-amber-400/80 mb-0.5">
        {/* Left State Pill */}
        <div className="flex items-center gap-1.5">
          {diagnosticWarning ? (
            <div
              onClick={onOpenDiagnostics}
              className="flex items-center gap-1 text-amber-200 bg-red-950/90 px-1.5 py-0.5 rounded border border-red-500/60 cursor-pointer hover:border-amber-400 transition-all text-[9px] shadow-sm shadow-red-950"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
              <span className="font-semibold">{diagnosticWarning}</span>
              <span className="underline text-amber-300 ml-0.5">[Diagnostics]</span>
            </div>
          ) : state === 'listening' ? (
            <div className="flex items-center gap-1.5 text-amber-300 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping shadow-[0_0_8px_rgba(34,211,238,0.9)]"></span>
              <span className="font-bold tracking-wider uppercase text-amber-200 text-[9px]">Acoustic Sensors Active...</span>
              {/* Cyan frequency wave accent */}
              <span className="hidden md:inline-flex items-center gap-0.5 text-cyan-400">
                <span className="w-0.5 h-1.5 bg-cyan-400 animate-pulse"></span>
                <span className="w-0.5 h-2.5 bg-cyan-400 animate-bounce"></span>
                <span className="w-0.5 h-1 bg-cyan-400 animate-pulse"></span>
              </span>
              {voiceTranscript && (
                <span className="text-amber-100/80 italic truncate max-w-xs text-[9px]">"{voiceTranscript}"</span>
              )}
            </div>
          ) : state === 'thinking' ? (
            <div className="flex items-center gap-1.5 text-red-300 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping shadow-[0_0_8px_rgba(239,68,68,0.9)]"></span>
              <span className="font-bold tracking-wider uppercase text-amber-200 text-[9px]">Neural Matrix Processing...</span>
            </div>
          ) : state === 'speaking' ? (
            <div className="flex items-center gap-1.5 text-yellow-300">
              <Volume2 className="w-3 h-3 text-amber-400 animate-bounce" />
              <span className="font-bold tracking-wider uppercase text-amber-100 text-[9px]">Voice Synthesis Active</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-400/70">
              <span className="w-1 h-1 rounded-full bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.6)]"></span>
              <span className="tracking-wider uppercase font-semibold text-[9px]">HUD CONSOLE // READY</span>
              <span className="hidden sm:inline text-cyan-400/50 font-mono text-[8px]">• STARK LINK</span>
            </div>
          )}
        </div>

        {/* Right Secondary Quick Action Shortcuts */}
        <div className="flex items-center gap-1">
          {onOpenWebsite && (
            <button
              type="button"
              onClick={onOpenWebsite}
              className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-[#0e0205] hover:bg-[#1a040b] border border-amber-500/20 hover:border-amber-400/70 text-[9px] font-mono text-amber-300/80 hover:text-white transition-all cursor-pointer shadow-sm"
              title="Open Website (YouTube, Google, URLs)"
            >
              <Globe className="w-2.5 h-2.5 text-amber-400" />
              <span>Web</span>
            </button>
          )}

          {onSearchWeb && (
            <button
              type="button"
              onClick={onSearchWeb}
              className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-[#0e0205] hover:bg-[#1a040b] border border-amber-500/20 hover:border-amber-400/70 text-[9px] font-mono text-amber-300/80 hover:text-white transition-all cursor-pointer shadow-sm"
              title="Search Google Query"
            >
              <Search className="w-2.5 h-2.5 text-amber-400" />
              <span>Search</span>
            </button>
          )}

          {onOpenStarkVision && (
            <button
              type="button"
              onClick={onOpenStarkVision}
              className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-[#0e0205] hover:bg-[#1a040b] border border-amber-500/20 hover:border-amber-400/70 text-[9px] font-mono text-amber-300/80 hover:text-white transition-all cursor-pointer shadow-sm"
              title="Stark AR Vision Scanner (Camera Multimodal AI)"
            >
              <Eye className="w-2.5 h-2.5 text-amber-400" />
              <span>Vision</span>
            </button>
          )}

          {onOpenStarkDatabase && (
            <button
              type="button"
              onClick={onOpenStarkDatabase}
              className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded bg-[#0e0205] hover:bg-[#1a040b] border border-amber-500/20 hover:border-amber-400/70 text-[9px] font-mono text-cyan-300/80 hover:text-white transition-all cursor-pointer shadow-sm"
              title="Stark Technical Database (Physics, Elements, Formulas)"
            >
              <Database className="w-2.5 h-2.5 text-cyan-400" />
              <span>Database</span>
            </button>
          )}

          {onOpenStarkProtocolModal && (
            <button
              type="button"
              onClick={onOpenStarkProtocolModal}
              className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded bg-[#0e0205] hover:bg-[#1a040b] border border-red-500/30 hover:border-red-400 text-[9px] font-mono text-red-300/90 hover:text-white transition-all cursor-pointer shadow-sm"
              title="Stark Protocol Execution Matrix"
            >
              <Zap className="w-2.5 h-2.5 text-red-400 animate-pulse" />
              <span>Protocols</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Futuristic Command Console Dock */}
      <div
        className={`relative flex items-center gap-1.5 p-1 sm:p-1.5 rounded-xl bg-[#050102]/95 transition-all duration-300 backdrop-blur-2xl ${
          isFocused
            ? 'border border-amber-400/80 shadow-[0_0_25px_-4px_rgba(220,38,38,0.45),0_0_12px_-2px_rgba(245,158,11,0.35)] ring-1 ring-amber-400/30'
            : 'border border-amber-500/25 hover:border-amber-400/50 shadow-[0_0_20px_-6px_rgba(220,38,38,0.25)]'
        }`}
      >
        {/* Futuristic Glowing Microphone Core Button */}
        <button
          id="vajra-voice-toggle-btn"
          type="button"
          onClick={onToggleVoice}
          className={`p-1.5 sm:p-2 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0 ${
            isListening
              ? 'bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 text-black shadow-[0_0_16px_rgba(245,158,11,0.8)] animate-pulse ring-1 ring-cyan-400/80'
              : 'bg-[#120206] text-amber-400 hover:text-yellow-200 hover:bg-[#20040c] border border-amber-500/35 hover:border-amber-400 shadow-sm shadow-red-950/30'
          }`}
          title={isListening ? 'Halt Voice Channel' : 'Activate Voice Stream (Speak to VAJRA)'}
          aria-label="Voice input"
        >
          {isListening ? (
            <Mic className="w-4 h-4 animate-bounce text-black" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </button>

        {/* Text Input Terminal */}
        <div className="flex-1 min-w-0 py-0.5 px-1">
          <textarea
            id="vajra-command-input"
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={
              isListening
                ? 'Listening to speech directive... or type command...'
                : 'Transmit directive to VAJRA (e.g. "Open YouTube", "Calculate matrix", "Search astrophysics")...'
            }
            className="w-full bg-transparent border-0 resize-none outline-none text-xs sm:text-[13px] text-[#fffdf5] placeholder-amber-500/40 font-mono leading-snug max-h-20"
          />
        </div>

        {/* Stop or Send Action Button */}
        {isStreaming ? (
          <button
            id="stop-generation-button"
            type="button"
            onClick={onStop}
            className="p-1.5 sm:p-2 rounded-lg bg-red-600/35 hover:bg-red-600/60 border border-red-500 text-red-200 transition-all cursor-pointer shrink-0 shadow-sm"
            title="Halt Stream"
          >
            <Square className="w-3.5 h-3.5 fill-red-400" />
          </button>
        ) : (
          <button
            id="send-command-button"
            type="button"
            onClick={() => onSend()}
            disabled={!input.trim()}
            className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black font-bold transition-all cursor-pointer shrink-0 disabled:opacity-20 disabled:cursor-not-allowed shadow-md shadow-amber-500/25"
            title="Transmit Directive"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

