import React, { useState, useMemo } from 'react';
import Markdown from 'react-markdown';
import { Copy, Check, Sparkles, User, AlertCircle, RefreshCw, Cpu, WifiOff, Zap } from 'lucide-react';
import { Message, VajraAction } from '../types';
import { extractActionsFromText } from '../services/actionParser';
import { ActionCard } from './ActionCard';

interface ChatMessageProps {
  message: Message;
  onRetry?: () => void;
  onSwitchOffline?: () => void;
  onExecuteAction?: (action: VajraAction) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onRetry,
  onSwitchOffline,
  onExecuteAction,
}) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  // Extract any embedded structured actions or natural intents
  const { cleanedText, actions: extractedActions } = useMemo(() => {
    if (message.error || isUser) {
      return { cleanedText: message.content, actions: [] };
    }
    return extractActionsFromText(message.content, false);
  }, [message.content, message.error, isUser]);

  const displayActions = message.actions && message.actions.length > 0 ? message.actions : extractedActions;

  const handleCopy = () => {
    const textToCopy = cleanedText || message.content;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(new Date(message.timestamp));

  return (
    <div
      id={`message-${message.id}`}
      className={`group flex gap-3 sm:gap-4 w-full max-w-4xl mx-auto py-2 px-1 sm:px-3 transition-colors ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {!isUser && (
        <div
          id={`avatar-${message.id}`}
          className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-red-600 via-amber-500 to-yellow-400 p-0.5 shadow-md shadow-red-950/60 mt-0.5"
        >
          <div className="w-full h-full bg-[#040102] rounded-[10px] flex items-center justify-center text-amber-400">
            <Zap className="w-4 h-4 text-amber-400 animate-pulse drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]" />
          </div>
        </div>
      )}

      <div
        className={`flex flex-col max-w-[90%] sm:max-w-[82%] ${
          isUser ? 'items-end' : 'items-start'
        }`}
      >
        {/* Message Card / Bubble */}
        <div
          className={`relative px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-gradient-to-r from-red-950/70 to-amber-950/50 border border-amber-500/40 text-amber-100 rounded-tr-none shadow-lg shadow-red-950/40'
              : message.error
              ? 'bg-red-950/60 border border-red-500/60 text-red-200 rounded-tl-none shadow-md'
              : 'bg-[#0a0204]/90 border border-amber-500/30 text-amber-100/90 rounded-tl-none shadow-xl shadow-black/80 backdrop-blur-xl'
          }`}
        >
          {message.error ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2.5 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
                <div>
                  <p className="font-semibold text-red-300 mb-1">
                    VAJRA Diagnostic Notice
                  </p>
                  <p className="text-xs text-red-200/90 leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              </div>

              {/* Action buttons on error */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-red-500/30">
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a0409] hover:bg-[#280710] border border-amber-500/40 text-xs font-mono text-amber-200 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Retry Directive</span>
                  </button>
                )}

                {onSwitchOffline && (
                  <button
                    type="button"
                    onClick={onSwitchOffline}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900/80 border border-amber-500/40 text-xs font-mono text-amber-300 transition-colors cursor-pointer"
                  >
                    <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                    <span>Engage Offline Core</span>
                  </button>
                )}
              </div>
            </div>
          ) : isUser ? (
            <p className="whitespace-pre-wrap break-words text-amber-100 font-normal leading-relaxed">{message.content}</p>
          ) : (
            <div className="prose prose-invert max-w-none break-words text-amber-100/90">
              <Markdown
                components={{
                  p: ({ children }) => <p className="mb-2.5 last:mb-0 leading-relaxed text-amber-100/90">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-5 mb-2.5 space-y-1 text-amber-100/90">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-5 mb-2.5 space-y-1 text-amber-100/90">{children}</ol>,
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  h1: ({ children }) => <h1 className="text-base font-bold text-amber-200 mt-3 mb-2 font-hud tracking-wide">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-sm font-bold text-amber-300 mt-2.5 mb-1.5 font-hud tracking-wide">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mt-2.5 mb-1">{children}</h3>,
                  strong: ({ children }) => <strong className="font-semibold text-amber-300">{children}</strong>,
                  code: ({ inline, className, children, ...props }: any) => {
                    return inline ? (
                      <code
                        className="px-1.5 py-0.5 rounded-md bg-[#160309] text-amber-300 border border-amber-500/40 text-xs font-mono"
                        {...props}
                      >
                        {children}
                      </code>
                    ) : (
                      <div className="my-2.5 rounded-xl overflow-hidden border border-amber-500/40 bg-[#060103] text-amber-200 text-xs font-mono shadow-xl">
                        <div className="px-3.5 py-1.5 bg-[#120308] border-b border-amber-900/60 flex justify-between items-center text-[11px] text-amber-400/80">
                          <span className="font-mono text-amber-400">VAJRA SYNTAX MATRIX</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(String(children));
                            }}
                            className="hover:text-amber-200 flex items-center gap-1 transition-colors text-xs cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </button>
                        </div>
                        <pre className="p-3.5 overflow-x-auto text-[13px] leading-relaxed text-amber-100/90 font-mono">
                          <code>{children}</code>
                        </pre>
                      </div>
                    );
                  },
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-amber-500 pl-3 my-2 text-amber-300/80 italic bg-amber-500/5 py-1 pr-2 rounded-r-lg">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {cleanedText || message.content}
              </Markdown>

              {/* Interactive Action Cards */}
              {displayActions.length > 0 && (
                <div className="mt-3 pt-2 border-t border-amber-900/50 space-y-2">
                  {displayActions.map((act) => (
                    <ActionCard
                      key={act.id}
                      action={act}
                      onExecute={onExecuteAction || (() => {})}
                    />
                  ))}
                </div>
              )}

              {message.isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-amber-400 animate-pulse align-middle rounded-sm" />
              )}
            </div>
          )}
        </div>

        {/* Footer info & copy button */}
        <div
          className={`flex items-center gap-2 mt-1 px-1 text-[11px] text-amber-500/70 font-mono ${
            isUser ? 'flex-row-reverse' : 'flex-row'
          }`}
        >
          <span>{formattedTime}</span>
          {!isUser && !message.error && message.content && (
            <button
              id={`copy-button-${message.id}`}
              type="button"
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-amber-200 flex items-center gap-1 transition-opacity text-[11px] cursor-pointer"
              title="Copy response"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-amber-400/80" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {isUser && (
        <div
          id={`avatar-${message.id}`}
          className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#140308] text-amber-300 border border-amber-500/40 flex items-center justify-center shadow-sm text-xs font-bold mt-0.5"
        >
          <User className="w-4 h-4 text-amber-300" />
        </div>
      )}
    </div>
  );
};
