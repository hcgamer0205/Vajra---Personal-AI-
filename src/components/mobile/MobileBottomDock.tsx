import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Send,
  Square,
  MessageSquare,
  Wrench,
  Globe,
  Search,
  Keyboard,
  X,
  Sparkles,
  Volume2,
  Radio,
  Activity,
  Paperclip,
} from 'lucide-react';
import { AssistantState } from '../../types';
import { multimodalEngine } from '../../services/multimodalEngine';

interface MobileBottomDockProps {
  input: string;
  setInput: (value: string) => void;
  onSend: (text?: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  state: AssistantState;
  isListening: boolean;
  onToggleVoice: () => void;
  voiceTranscript?: string;
  messageCount: number;
  onOpenHistory: () => void;
  onOpenTools: () => void;
  onOpenSearch?: () => void;
  onOpenWebsite?: () => void;
  keyboardHeight?: number;
  isKeyboardOpen?: boolean;
}

export const MobileBottomDock: React.FC<MobileBottomDockProps> = ({
  input,
  setInput,
  onSend,
  onStop,
  isStreaming,
  state,
  isListening,
  onToggleVoice,
  voiceTranscript,
  messageCount,
  onOpenHistory,
  onOpenTools,
  onOpenSearch,
  onOpenWebsite,
  keyboardHeight = 0,
  isKeyboardOpen = false,
}) => {
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when expanded
  useEffect(() => {
    if (isInputExpanded) {
      inputRef.current?.focus();
    }
  }, [isInputExpanded]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const attach = await multimodalEngine.processUserFile(file);
      const nextText = input
        ? `${input} [Attachment: ${attach.fileName}]`
        : `Please analyze this attached document: "${attach.fileName}".`;
      setInput(nextText);
    } catch (err: any) {
      alert(err.message || 'File upload error');
    }
  };

  // Safe Haptic feedback helper
  const triggerHaptic = (ms = 25) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {}
    }
  };

  const handleVoiceTap = () => {
    triggerHaptic(35);
    if (isStreaming) {
      onStop();
    } else {
      onToggleVoice();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!isStreaming && input.trim()) {
        triggerHaptic(20);
        onSend();
        setIsInputExpanded(false);
      }
    }
  };

  return (
    <div
      id="vajra-mobile-bottom-dock"
      style={{
        bottom: isKeyboardOpen ? `${keyboardHeight}px` : '0px',
        transition: 'bottom 0.18s ease-out',
      }}
      className="fixed left-0 right-0 z-40 bg-gradient-to-t from-[#040102] via-[#080205]/98 to-transparent pt-2 px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] select-none pointer-events-auto"
    >
      <div className="max-w-md mx-auto flex flex-col gap-1.5">
        {/* 1. Live Telemetry / Speech Preview Ribbon */}
        {isListening ? (
          <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-gradient-to-r from-[#20050e]/95 to-[#160209]/95 border border-amber-400/60 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.25)] animate-pulse backdrop-blur-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
              {/* Animated Mini Spectrum Bars */}
              <div className="flex items-center gap-0.5 shrink-0">
                <span className="w-0.5 h-3 bg-cyan-400 animate-pulse rounded-full" />
                <span className="w-0.5 h-4 bg-amber-400 animate-pulse rounded-full" />
                <span className="w-0.5 h-2 bg-cyan-400 animate-pulse rounded-full" />
                <span className="w-0.5 h-4 bg-amber-400 animate-pulse rounded-full" />
              </div>
              <span className="text-xs font-mono text-white/95 truncate italic">
                {voiceTranscript ? `"${voiceTranscript}"` : 'Listening to speech in English / Hindi...'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleVoiceTap}
              className="text-[11px] font-mono font-bold text-black px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-400 shrink-0 ml-1.5 active:scale-95 shadow-sm"
            >
              Done
            </button>
          </div>
        ) : state === 'thinking' || state === 'planning' ? (
          <div className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-[#140308]/90 border border-amber-500/40 text-amber-200 shadow-md">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-amber-200">
              {state === 'planning'
                ? 'Synthesizing Autonomous Plan...'
                : 'Neural Matrix Processing Directive...'}
            </span>
          </div>
        ) : state === 'speaking' ? (
          <div className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-[#140308]/90 border border-yellow-500/40 text-yellow-200 shadow-md">
            <Volume2 className="w-4 h-4 text-amber-400 animate-bounce" />
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-amber-100">
              VAJRA Voice Transmission Active
            </span>
          </div>
        ) : null}

        {/* 2. Expanded Mobile Command Input Bar */}
        {isInputExpanded ? (
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#0e0206]/98 border border-amber-400/70 shadow-[0_0_24px_rgba(220,38,38,0.4)] backdrop-blur-2xl animate-in slide-in-from-bottom-2 duration-150">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Transmit directive to VAJRA..."
              className="flex-1 min-w-0 bg-transparent px-3 py-2 text-sm text-white placeholder-amber-500/40 font-mono outline-none"
            />

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,application/pdf,text/plain"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-9 h-9 rounded-xl bg-[#140308] border border-amber-500/40 text-amber-300 hover:text-white flex items-center justify-center active:scale-90 transition-transform shrink-0"
              title="Attach Image or Document"
              aria-label="Attach File"
            >
              <Paperclip className="w-4 h-4 text-amber-400" />
            </button>

            {input.trim() ? (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(25);
                  onSend();
                  setIsInputExpanded(false);
                }}
                className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-black flex items-center justify-center font-bold active:scale-90 transition-transform shadow-md shadow-amber-500/30 shrink-0 cursor-pointer"
                aria-label="Send Directive"
              >
                <Send className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsInputExpanded(false)}
                className="w-11 h-11 rounded-xl bg-[#1a040b] text-amber-300/80 hover:text-white border border-amber-900/60 flex items-center justify-center active:scale-90 transition-transform shrink-0 cursor-pointer"
                aria-label="Close input"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        ) : (
          /* 3. Primary Mobile Thumb Dock Bar (Center Microphone FAB + Ergonomic Action Wings) */
          <div className="relative flex items-center justify-between px-3.5 py-2 rounded-2xl bg-[#090204]/95 border border-amber-500/35 backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.85),0_0_16px_rgba(220,38,38,0.2)]">
            {/* Left Wing: Menu / History / Tools (Touch targets >= 44px) */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(20);
                  onOpenHistory();
                }}
                className="relative min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center bg-[#140308] border border-amber-500/30 hover:border-amber-400 text-amber-300 active:scale-90 transition-all cursor-pointer"
                title="Conversation History & Logs"
                aria-label={`Open conversation history. ${messageCount} messages recorded.`}
              >
                <MessageSquare className="w-5 h-5 text-amber-400" />
                {messageCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 border border-black text-[10px] font-mono font-bold text-white flex items-center justify-center shadow-sm">
                    {messageCount > 99 ? '99+' : messageCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic(20);
                  onOpenTools();
                }}
                className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center bg-[#140308] border border-amber-500/30 hover:border-amber-400 text-amber-300 active:scale-90 transition-all cursor-pointer"
                title="Mobile Subsystems & Tools"
                aria-label="Open Mobile Subsystems"
              >
                <Wrench className="w-5 h-5 text-amber-400" />
              </button>
            </div>

            {/* Center: The Futuristic Glowing Voice Core FAB (60px x 60px) */}
            <div className="relative -my-3.5 flex items-center justify-center">
              {/* Outer Pulsing Aura */}
              <div
                className={`absolute w-20 h-20 rounded-full transition-all duration-300 pointer-events-none ${
                  isListening
                    ? 'bg-cyan-400/30 blur-md animate-ping'
                    : state === 'speaking'
                    ? 'bg-amber-400/25 blur-md animate-pulse'
                    : 'bg-red-600/20 blur-sm'
                }`}
              />

              <button
                id="vajra-mobile-fab-mic"
                type="button"
                onClick={handleVoiceTap}
                className={`relative w-15 h-15 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 shadow-2xl ${
                  isListening
                    ? 'bg-gradient-to-tr from-cyan-400 via-amber-300 to-yellow-400 text-black shadow-[0_0_28px_rgba(245,158,11,0.9)] ring-2 ring-cyan-300'
                    : isStreaming
                    ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-pulse'
                    : 'bg-gradient-to-tr from-red-950 via-[#1a040b] to-amber-950 text-amber-300 border-2 border-amber-400/80 hover:border-amber-300 shadow-[0_0_18px_rgba(220,38,38,0.5)]'
                }`}
                title={
                  isListening
                    ? 'Halt Voice Sensors'
                    : isStreaming
                    ? 'Stop Response Generation'
                    : 'Touch to Speak to VAJRA'
                }
                aria-label={
                  isListening
                    ? 'Microphone active. Tap to stop.'
                    : isStreaming
                    ? 'Generating response. Tap to stop.'
                    : 'Tap microphone to speak to VAJRA'
                }
              >
                {isStreaming ? (
                  <Square className="w-5 h-5 fill-white text-white" />
                ) : isListening ? (
                  <Mic className="w-6 h-6 animate-bounce text-black" />
                ) : (
                  <Mic className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                )}
              </button>
            </div>

            {/* Right Wing: Keyboard Directive & Quick Search (Touch targets >= 44px) */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(20);
                  setIsInputExpanded(true);
                }}
                className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center bg-[#140308] border border-amber-500/30 hover:border-amber-400 text-amber-300 active:scale-90 transition-all cursor-pointer"
                title="Type Directive"
                aria-label="Open keyboard command input"
              >
                <Keyboard className="w-5 h-5 text-amber-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic(20);
                  onOpenSearch?.();
                }}
                className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center bg-[#140308] border border-amber-500/30 hover:border-amber-400 text-amber-300 active:scale-90 transition-all cursor-pointer"
                title="Search Web"
                aria-label="Open Web Search"
              >
                <Search className="w-5 h-5 text-amber-400" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
