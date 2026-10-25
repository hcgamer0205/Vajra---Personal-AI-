import React, { useState } from 'react';
import {
  Trash2,
  Download,
  Search,
  MessageSquare,
  Sparkles,
  ArrowDown,
} from 'lucide-react';
import { Message, VajraAction } from '../../types';
import { MobileBottomSheet } from './MobileBottomSheet';
import { ChatMessage } from '../ChatMessage';

interface MobileHistorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  onClearHistory: () => void;
  onExecuteAction?: (action: VajraAction) => void;
  onRetry?: () => void;
  onSwitchOffline?: () => void;
  onSelectPrompt?: (prompt: string) => void;
}

export const MobileHistorySheet: React.FC<MobileHistorySheetProps> = ({
  isOpen,
  onClose,
  messages,
  onClearHistory,
  onExecuteAction,
  onRetry,
  onSwitchOffline,
  onSelectPrompt,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMessages = messages.filter((m) =>
    m.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportHistory = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(messages, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `vajra-mobile-logs-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <MobileBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      height="tall"
      title="CONVERSATION LOGS"
      subtitle={`${messages.length} interactions recorded`}
      headerActions={
        messages.length > 0 ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={exportHistory}
              className="p-2 rounded-lg text-amber-300 hover:text-white bg-[#1a040b] border border-amber-900/60 active:scale-90 transition-all"
              title="Export JSON"
              aria-label="Export history"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClearHistory}
              className="p-2 rounded-lg text-red-300 hover:text-red-100 bg-red-950/40 border border-red-500/40 active:scale-90 transition-all"
              title="Clear History"
              aria-label="Clear history"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-3 pb-8">
        {/* Search filter input */}
        {messages.length > 2 && (
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-amber-500/50" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversation telemetry..."
              className="w-full pl-9 pr-3 py-2 bg-[#120206] border border-amber-500/25 rounded-xl text-xs text-[#fef3c7] placeholder-amber-500/40 font-mono outline-none focus:border-amber-400"
            />
          </div>
        )}

        {/* Empty State */}
        {filteredMessages.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="font-hud text-sm text-amber-200 tracking-wider">
              NO TELEMETRY RECORDED
            </p>
            <p className="text-xs font-mono text-amber-400/60 max-w-xs">
              Speak or transmit a directive to initialize VAJRA interaction logs.
            </p>

            {onSelectPrompt && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
                {['Open YouTube', 'Calculate 42 * 1337', 'Who are you?'].map(
                  (p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        onSelectPrompt(p);
                        onClose();
                      }}
                      className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-[#18030a] border border-amber-500/30 text-amber-300 hover:border-amber-400 active:scale-95 transition-all"
                    >
                      {p}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        ) : (
          /* Messages Stream */
          <div className="flex flex-col gap-2">
            {filteredMessages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onRetry={onRetry}
                onSwitchOffline={onSwitchOffline}
                onExecuteAction={(act) => {
                  onExecuteAction?.(act);
                  onClose();
                }}
              />
            ))}
          </div>
        )}
      </div>
    </MobileBottomSheet>
  );
};
