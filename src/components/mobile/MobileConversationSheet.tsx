import React, { useRef, useEffect, useState } from 'react';
import {
  X,
  ChevronDown,
  Trash2,
  Volume2,
  VolumeX,
  Send,
  Square,
  Mic,
  Paperclip,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Radio,
  Sparkles,
  Maximize2,
  RotateCcw,
} from 'lucide-react';
import { Message, VajraAction, AssistantState } from '../../types';
import { CoreThemeId } from '../../services/vajraAppearance';
import { VajraSphere } from '../VajraSphere';
import { ChatMessage } from '../ChatMessage';
import { multimodalEngine } from '../../services/multimodalEngine';

interface MobileConversationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  state: AssistantState;
  isStreaming: boolean;
  isOffline: boolean;
  input: string;
  setInput: (value: string) => void;
  onSend: (text?: string) => void;
  onStop: () => void;
  isListening: boolean;
  onToggleVoice: () => void;
  voiceTranscript?: string;
  pendingAction: VajraAction | null;
  onConfirmPendingAction: () => void;
  onCancelPendingAction: () => void;
  onClearHistory: () => void;
  onExecuteAction: (action: VajraAction) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  coreTheme?: CoreThemeId;
  customCoreColor?: string;
  onSelectPrompt?: (prompt: string) => void;
}

export const MobileConversationSheet: React.FC<MobileConversationSheetProps> = ({
  isOpen,
  onClose,
  messages,
  state,
  isStreaming,
  isOffline,
  input,
  setInput,
  onSend,
  onStop,
  isListening,
  onToggleVoice,
  voiceTranscript,
  pendingAction,
  onConfirmPendingAction,
  onCancelPendingAction,
  onClearHistory,
  onExecuteAction,
  isMuted,
  onToggleMute,
  coreTheme = 'crimson_gold',
  customCoreColor = '#f59e0b',
  onSelectPrompt,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAutoScrollRef = useRef(true);

  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef<number>(0);
  const currentTranslateY = useRef<number>(0);

  // Auto-scroll when new messages arrive or when streaming
  useEffect(() => {
    if (isOpen && isAutoScrollRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isOpen, messages, isStreaming]);

  // Focus input when opened if empty
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Lock body scroll while sheet is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    isAutoScrollRef.current = scrollHeight - (scrollTop + clientHeight) < 80;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const attach = await multimodalEngine.processUserFile(file);
      setInput(
        input
          ? `${input} [Attachment: ${attach.fileName}]`
          : `Please analyze this attached document: "${attach.fileName}".`
      );
    } catch (err: any) {
      console.warn('File upload error:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!isStreaming && input.trim()) {
        onSend();
      }
    }
  };

  // Drag-to-dismiss gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    if (deltaY > 0) {
      setDragY(deltaY);
      currentTranslateY.current = deltaY;
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (currentTranslateY.current > 80) {
      onClose();
    }
    setDragY(0);
    currentTranslateY.current = 0;
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="VAJRA Conversation Console"
      className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-auto select-none"
    >
      {/* 1. Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. Sheet Surface */}
      <div
        style={{
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="relative z-10 w-full h-[88dvh] max-h-[88dvh] bg-[#070104]/98 border-t border-amber-500/35 rounded-t-3xl shadow-[0_-12px_48px_rgba(0,0,0,0.9),0_-2px_20px_rgba(220,38,38,0.25)] flex flex-col text-[#fef3c7] overflow-hidden"
      >
        {/* Grab Handle */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full pt-3 pb-1 flex items-center justify-center cursor-grab active:cursor-grabbing shrink-0"
        >
          <div className="w-12 h-1.5 rounded-full bg-amber-500/40 hover:bg-amber-400 transition-colors" />
        </div>

        {/* Sheet Header */}
        <div className="px-4 py-2 border-b border-amber-950/60 flex items-center justify-between gap-2 shrink-0 bg-[#090205]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-black/70 border border-amber-500/40 overflow-hidden flex items-center justify-center shrink-0">
              <VajraSphere
                state={state}
                isOffline={isOffline}
                size="sm"
                showRings={false}
                coreTheme={coreTheme}
                customCoreColor={customCoreColor}
                customDimension={28}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-hud font-bold text-xs tracking-wider text-amber-100">
                  VAJRA CONVERSATION
                </span>
                {messages.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded bg-amber-950/80 border border-amber-500/30 text-[9px] font-mono text-amber-300">
                    {messages.length}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-mono text-amber-400/60 truncate">
                {state === 'listening'
                  ? 'Acoustic Sensor Active'
                  : state === 'thinking' || state === 'planning'
                  ? 'Processing Directive...'
                  : state === 'executing'
                  ? 'Executing Task Directive'
                  : state === 'awaiting_confirmation'
                  ? 'Awaiting Security Confirmation'
                  : state === 'speaking'
                  ? 'Voice Synthesizer Active'
                  : isOffline
                  ? 'Operating via On-Device Local Engine'
                  : 'Neural Telemetry Nominal'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Audio Mute Toggle */}
            <button
              type="button"
              onClick={onToggleMute}
              className={`min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center border transition-all cursor-pointer active:scale-90 ${
                isMuted
                  ? 'bg-red-950/60 border-red-500/40 text-red-300'
                  : 'bg-[#140308] border-amber-500/30 text-amber-300 hover:text-white'
              }`}
              title={isMuted ? 'Unmute voice' : 'Mute voice'}
              aria-label={isMuted ? 'Unmute voice' : 'Mute voice'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Clear History */}
            {messages.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center bg-[#140308] border border-amber-900/60 text-amber-400 hover:text-red-300 active:scale-90 transition-all cursor-pointer"
                title="Clear Conversation"
                aria-label="Clear Conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Dismiss / Minimize Button */}
            <button
              type="button"
              onClick={onClose}
              className="min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center bg-[#1a040b] border border-amber-900/60 text-amber-300 hover:text-white active:scale-90 transition-all cursor-pointer"
              title="Return to Energy Core"
              aria-label="Close conversation sheet"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3. Messages Stream Body */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-3"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 py-12">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 mb-3">
                <Sparkles className="w-6 h-6 text-amber-400" />
              </div>
              <p className="font-hud font-bold text-sm tracking-wider text-amber-200 uppercase mb-1">
                Awaiting Directives
              </p>
              <p className="text-xs font-mono text-amber-400/60 max-w-xs leading-relaxed">
                Transmit a text command below, or speak naturally in English, Hindi, or Hinglish.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onExecuteAction={onExecuteAction}
                onRetry={() => {
                  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
                  if (lastUser) onSend(lastUser.content);
                }}
              />
            ))
          )}

          {/* Pending Confirmation Security Card */}
          {pendingAction && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-950/90 via-amber-950/80 to-[#180309] border border-red-500/60 shadow-[0_0_24px_rgba(220,38,38,0.35)] animate-in fade-in duration-200">
              <div className="flex items-center gap-2 mb-2 text-amber-200">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
                <span className="font-hud font-bold text-xs tracking-wider text-amber-100 uppercase">
                  Security Confirmation Required
                </span>
                <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-900/60 border border-red-500/40 text-red-200 uppercase font-bold">
                  High Risk
                </span>
              </div>

              <div className="text-xs font-mono text-amber-200/90 mb-1 font-semibold">
                {pendingAction.title}
              </div>
              {pendingAction.description && (
                <div className="text-[11px] font-mono text-amber-300/70 mb-3">
                  {pendingAction.description}
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onConfirmPendingAction}
                  className="flex-1 min-h-[40px] px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-xs font-bold active:scale-95 transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Authorize & Execute</span>
                </button>
                <button
                  type="button"
                  onClick={onCancelPendingAction}
                  className="px-3 min-h-[40px] py-2 rounded-xl bg-[#1c040c] border border-amber-900/60 text-amber-300/80 hover:text-white font-mono text-xs active:scale-95 transition-all cursor-pointer"
                >
                  Deny
                </button>
              </div>
            </div>
          )}

          {/* Active Voice Acoustic Transcription Ribbon */}
          {isListening && (
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#1c040d]/95 border border-cyan-400/50 text-cyan-200 animate-pulse shadow-md">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
                <span className="text-xs font-mono text-white/95 truncate italic">
                  {voiceTranscript ? `"${voiceTranscript}"` : 'Listening to speech...'}
                </span>
              </div>
              <button
                type="button"
                onClick={onToggleVoice}
                className="text-[11px] font-mono font-bold text-black px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-400 shrink-0 ml-1.5 active:scale-95"
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* 4. Bottom Input Console */}
        <div className="shrink-0 p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] bg-[#090205] border-t border-amber-950/60">
          <div className="flex items-center gap-2">
            {/* Attachment Button */}
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
              className="min-w-[44px] min-h-[44px] rounded-xl bg-[#140308] border border-amber-500/30 text-amber-300 hover:text-white flex items-center justify-center active:scale-90 transition-transform shrink-0 cursor-pointer"
              title="Attach Document or Image"
              aria-label="Attach File"
            >
              <Paperclip className="w-4 h-4 text-amber-400" />
            </button>

            {/* Input Field */}
            <div className="flex-1 min-w-0 flex items-center bg-[#100307] border border-amber-500/35 focus-within:border-amber-400 rounded-xl px-3 py-1.5 transition-colors">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Transmit directive to VAJRA..."
                className="w-full bg-transparent text-xs text-white placeholder-amber-500/40 font-mono outline-none"
              />
            </div>

            {/* Mic / Voice Button */}
            <button
              type="button"
              onClick={onToggleVoice}
              className={`min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center border transition-all active:scale-90 shrink-0 cursor-pointer ${
                isListening
                  ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_16px_rgba(6,182,212,0.5)]'
                  : 'bg-[#140308] border-amber-500/35 text-amber-300 hover:text-white'
              }`}
              title="Voice Input (Speech)"
              aria-label="Toggle Voice Input"
            >
              <Mic className={`w-4 h-4 ${isListening ? 'animate-pulse text-cyan-300' : 'text-amber-400'}`} />
            </button>

            {/* Send or Stop Button */}
            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="min-w-[44px] min-h-[44px] rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center active:scale-90 transition-transform shadow-md shadow-red-950 shrink-0 cursor-pointer"
                title="Stop directive generation"
                aria-label="Stop Generation"
              >
                <Square className="w-4 h-4 fill-white" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (input.trim()) onSend();
                }}
                disabled={!input.trim()}
                className={`min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center font-bold active:scale-90 transition-transform shadow-md shrink-0 cursor-pointer ${
                  input.trim()
                    ? 'bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-black shadow-amber-500/20'
                    : 'bg-[#140308] border border-amber-950/60 text-amber-500/40 cursor-not-allowed'
                }`}
                title="Send Directive"
                aria-label="Send Directive"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
