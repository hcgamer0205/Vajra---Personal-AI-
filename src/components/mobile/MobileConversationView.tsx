import React, { useRef, useEffect } from 'react';
import {
  Sparkles,
  Terminal,
  ExternalLink,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Share2,
  Trash2,
  Maximize2,
  Activity,
  ShieldCheck,
  Lock,
  ArrowUpRight,
  Radio,
} from 'lucide-react';
import { Message, VajraAction, AssistantState } from '../../types';
import { CoreThemeId } from '../../services/vajraAppearance';
import { VajraMission } from '../../services/vajraContext';
import { MobilePresenceCore } from './MobilePresenceCore';
import { MobileMissionCard } from './MobileMissionCard';
import { MobileContextPills } from './MobileContextPills';

interface MobileConversationViewProps {
  messages: Message[];
  state: AssistantState;
  isStreaming: boolean;
  isOffline: boolean;
  onExecuteAction?: (action: VajraAction) => void;
  onRetry?: () => void;
  onClearHistory?: () => void;
  onSelectPrompt?: (prompt: string) => void;
  onToggleHeroView?: () => void;
  coreTheme?: CoreThemeId;
  customCoreColor?: string;
  proactiveSuggestion?: string | null;
  activeMission?: VajraMission | null;
  currentTopic?: string;
}

export const MobileConversationView: React.FC<MobileConversationViewProps> = ({
  messages,
  state,
  isStreaming,
  isOffline,
  onExecuteAction,
  onRetry,
  onClearHistory,
  onSelectPrompt,
  onToggleHeroView,
  coreTheme = 'crimson_gold',
  customCoreColor = '#f59e0b',
  proactiveSuggestion,
  activeMission,
  currentTopic,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAutoScrollRef = useRef(true);

  // Auto-scroll to bottom on streaming or new messages unless user scrolled up
  useEffect(() => {
    if (isAutoScrollRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // If user is within 70px of the bottom, enable auto-scroll; otherwise respect their scroll position
    isAutoScrollRef.current = scrollHeight - (scrollTop + clientHeight) < 70;
  };

  const handleCopy = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  };

  const handleShare = async (text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'VAJRA Response',
          text,
        });
      } catch {}
    } else {
      handleCopy(text);
    }
  };

  // Helper to determine action verification status label
  const getActionStatusBadge = (action: VajraAction) => {
    if (action.status === 'executed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-emerald-950/70 border border-emerald-500/50 text-emerald-300">
          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
          VERIFIED
        </span>
      );
    }
    if (action.requiresConfirmation && !action.confirmed) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-950/80 border border-amber-500/60 text-amber-300">
          <Lock className="w-2.5 h-2.5 text-amber-400" />
          PROTECTED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
        <Radio className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
        ACTION READY
      </span>
    );
  };

  return (
    <div
      id="vajra-mobile-conversation-view"
      className="flex-1 w-full h-full flex flex-col overflow-hidden bg-[#050103] relative"
    >
      {/* 1. Holographic Presence Header Strip */}
      <MobilePresenceCore
        state={state}
        isOffline={isOffline}
        coreTheme={coreTheme}
        customCoreColor={customCoreColor}
        isHeroMode={false}
        onTapCore={onToggleHeroView}
        currentTopic={currentTopic}
      />

      {/* 2. Top Utility Strip (Action controls) */}
      <div className="shrink-0 flex items-center justify-between px-3 py-1 bg-[#090205]/80 border-b border-amber-500/15 text-[10px] font-mono text-amber-400/60">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500/40" />
          <span>INTERACTION STREAM</span>
          {messages.length > 0 && (
            <span className="px-1.5 py-0.2 rounded bg-[#160309] border border-amber-500/20 text-amber-300">
              {messages.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {onToggleHeroView && (
            <button
              type="button"
              onClick={onToggleHeroView}
              className="p-1 rounded bg-[#120307] border border-amber-500/20 text-amber-300/80 hover:text-white active:scale-90 transition-transform"
              title="Expand Energy Core"
              aria-label="Expand Energy Core"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          )}
          {messages.length > 0 && onClearHistory && (
            <button
              type="button"
              onClick={onClearHistory}
              className="p-1 rounded bg-[#120307] border border-amber-500/20 text-amber-400/60 hover:text-red-400 active:scale-90 transition-transform"
              title="Clear View"
              aria-label="Clear conversation history"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Active Autonomous Multi-Step Mission Progress Card */}
      {activeMission && (
        <div className="shrink-0 px-3 pt-2">
          <MobileMissionCard mission={activeMission} />
        </div>
      )}

      {/* 4. Scrollable Intelligent Interaction Stream */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 w-full min-h-0 overflow-y-auto px-3 pt-3 pb-32 space-y-3.5 overscroll-contain"
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1`}
            >
              {/* Intelligent Surface Tag */}
              <div className="flex items-center gap-1.5 px-1 text-[9px] font-mono uppercase tracking-widest text-amber-500/60">
                {isUser ? (
                  <>
                    <span className="text-amber-400/90 font-bold">COMMANDER</span>
                    <span>•</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-amber-200 font-bold tracking-wider">VAJRA MK-VII</span>
                    <span>•</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </>
                )}
              </div>

              {/* Futuristic Etched Surface (No generic rounded chat bubbles) */}
              <div
                className={`w-full max-w-[92%] rounded-xl p-3.5 text-xs leading-relaxed transition-all shadow-md ${
                  isUser
                    ? 'bg-gradient-to-r from-[#1e050e] to-[#2a0714] border border-amber-500/40 text-amber-100 shadow-[0_2px_12px_rgba(0,0,0,0.5)]'
                    : 'bg-gradient-to-b from-[#0e0206]/98 to-[#060103]/98 border border-amber-500/30 text-amber-50 shadow-[0_4px_20px_rgba(0,0,0,0.7),0_0_8px_rgba(220,38,38,0.12)] backdrop-blur-md'
                }`}
              >
                {/* Text Content */}
                <div className="whitespace-pre-wrap break-words font-sans text-xs sm:text-sm tracking-normal leading-relaxed selection:bg-amber-500/30">
                  {msg.content}
                  {msg.isStreaming && (
                    <span className="inline-block w-1.5 h-3.5 ml-1 bg-amber-400 animate-pulse align-middle" />
                  )}
                </div>

                {/* Structured Subsystem Actions */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-amber-500/20 space-y-2">
                    {msg.actions.map((act) => (
                      <div
                        key={act.id}
                        className="p-2.5 rounded-xl bg-[#120308]/90 border border-amber-500/35 flex flex-col gap-2 shadow-inner"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Terminal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span className="font-mono text-[11px] font-bold text-amber-100 truncate">
                              {act.title}
                            </span>
                          </div>
                          {getActionStatusBadge(act)}
                        </div>

                        {act.description && (
                          <div className="text-[10px] font-mono text-amber-300/70 truncate">
                            {act.description}
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-amber-500/15">
                          <button
                            type="button"
                            onClick={() => onExecuteAction?.(act)}
                            className="min-h-[36px] px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black text-[11px] font-mono font-bold flex items-center gap-1.5 shrink-0 active:scale-95 transition-all shadow-sm cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-black text-black" />
                            <span>Run Subsystem</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Message Utility Bar for VAJRA responses */}
                {!isUser && !msg.isStreaming && (
                  <div className="mt-2.5 pt-1.5 flex items-center justify-between border-t border-amber-500/15 text-[10px] font-mono text-amber-400/50">
                    <span className="text-[9px] uppercase tracking-wider text-amber-500/40">
                      Neural Output Verified
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.content)}
                        className="p-1 rounded hover:bg-white/5 hover:text-amber-200 active:scale-90 transition-all cursor-pointer"
                        title="Copy directive text"
                        aria-label="Copy message text"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShare(msg.content)}
                        className="p-1 rounded hover:bg-white/5 hover:text-amber-200 active:scale-90 transition-all cursor-pointer"
                        title="Share directive"
                        aria-label="Share message text"
                      >
                        <Share2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Live Streaming Indicator Surface */}
        {isStreaming && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#120308]/90 border border-amber-500/40 max-w-[80%] shadow-lg">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
            <span className="text-xs font-mono text-amber-200 animate-pulse tracking-wide">
              VAJRA neural engine streaming response...
            </span>
          </div>
        )}

        {/* Context-Aware Proactive Suggestion Ribbon */}
        {proactiveSuggestion && !isStreaming && (
          <div className="pt-1 pb-1">
            <MobileContextPills
              label="Recommended Follow-Up"
              primarySuggestion={proactiveSuggestion}
              onSelect={(prompt) => onSelectPrompt?.(prompt)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
