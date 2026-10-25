import React, { useState } from 'react';
import {
  PanelLeftClose,
  Trash2,
  Download,
  Search,
  Terminal,
  MessageSquare,
  Shield,
  Activity,
  Calculator,
  FileText,
  FolderTree,
  Laptop,
  Cpu,
  Globe,
  Sparkles,
  Settings,
  Brain,
} from 'lucide-react';
import { Message } from '../types';

interface TelemetryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  onClearHistory: () => void;
  onSelectPrompt?: (prompt: string) => void;
  onOpenVoiceDiagnostics?: () => void;
  onOpenMemoryVault?: () => void;
  onOpenTool?: (tool: 'calculator' | 'notepad' | 'file_explorer' | 'native_bridge' | 'url_modal' | 'search_modal') => void;
  onOpenEngineModal?: () => void;
  onOpenSetup?: () => void;
}

export const TelemetryDrawer: React.FC<TelemetryDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  onClearHistory,
  onSelectPrompt,
  onOpenVoiceDiagnostics,
  onOpenMemoryVault,
  onOpenTool,
  onOpenEngineModal,
  onOpenSetup,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'history' | 'tools'>('history');

  if (!isOpen) return null;

  const filteredMessages = messages.filter((m) =>
    m.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportHistory = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(messages, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `vajra-telemetry-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity cursor-pointer"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="relative z-10 w-full max-w-sm sm:max-w-md bg-[#0e0206]/95 border-r border-amber-500/40 shadow-2xl flex flex-col h-full text-[#fef3c7] backdrop-blur-xl animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="p-4 border-b border-amber-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-900/40 border border-amber-500/50 flex items-center justify-center text-amber-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-hud font-bold text-sm text-amber-200 tracking-wider">
                VAJRA SYSTEM NAVIGATION
              </h2>
              <p className="text-[10px] font-mono text-amber-400/60">
                {messages.length} interaction logs • Tools & Telemetry
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-amber-300 hover:text-white bg-[#1a040b] hover:bg-[#2c0813] border border-amber-900/60 transition-all cursor-pointer"
            title="Close Drawer"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection: History vs Tools Hub */}
        <div className="grid grid-cols-2 p-2 gap-1.5 border-b border-amber-900/40 bg-[#120308]">
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-2 text-xs font-mono rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-amber-500/20 text-amber-200 font-bold border border-amber-500/40 shadow-sm'
                : 'text-amber-500/70 hover:text-amber-300 hover:bg-[#1f050f]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>History ({messages.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tools')}
            className={`py-2 text-xs font-mono rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'tools'
                ? 'bg-amber-500/20 text-amber-200 font-bold border border-amber-500/40 shadow-sm'
                : 'text-amber-500/70 hover:text-amber-300 hover:bg-[#1f050f]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Tools & Diagnostics</span>
          </button>
        </div>

        {activeTab === 'tools' ? (
          /* TOOLS HUB PANEL */
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="text-[11px] uppercase tracking-wider font-mono font-bold text-amber-400">
              VAJRA Integrated Systems
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {/* 0. Neural Memory Vault */}
              {onOpenMemoryVault && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenMemoryVault();
                  }}
                  className="w-full p-3 rounded-xl bg-[#1d030c] hover:bg-[#2e0514] border border-amber-500/40 hover:border-amber-300 text-left transition-all flex items-center gap-3 group shadow-sm"
                >
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 group-hover:border-amber-300">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-amber-200 group-hover:text-yellow-100 font-hud flex items-center gap-1.5">
                      <span>Neural Memory Vault</span>
                      <span className="px-1 py-0.2 rounded text-[8px] bg-amber-500/20 text-amber-300 font-mono font-bold">
                        PERSISTENT
                      </span>
                    </div>
                    <div className="text-[10px] text-amber-500/70">
                      Manage user directives, facts, preferences &amp; prompt context
                    </div>
                  </div>
                </button>
              )}

              {/* 1. Calculator */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTool?.('calculator');
                }}
                className="w-full p-3 rounded-xl bg-[#18040a] hover:bg-[#280712] border border-amber-500/30 hover:border-amber-400 text-left transition-all flex items-center gap-3 group"
              >
                <div className="p-2 rounded-lg bg-red-950/80 text-amber-400 border border-amber-500/40 group-hover:border-amber-400">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-amber-200 group-hover:text-yellow-100 font-hud">
                    Interactive Calculator
                  </div>
                  <div className="text-[10px] text-amber-500/60">Math calculations, formulas & trigonometric logic</div>
                </div>
              </button>

              {/* 2. Scratchpad */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTool?.('notepad');
                }}
                className="w-full p-3 rounded-xl bg-[#18040a] hover:bg-[#280712] border border-amber-500/30 hover:border-amber-400 text-left transition-all flex items-center gap-3 group"
              >
                <div className="p-2 rounded-lg bg-red-950/80 text-amber-400 border border-amber-500/40 group-hover:border-amber-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-amber-200 group-hover:text-yellow-100 font-hud">
                    Scratchpad & Notepad
                  </div>
                  <div className="text-[10px] text-amber-500/60">Persistent drafting workspace with word counter & file export</div>
                </div>
              </button>

              {/* 3. Session File Explorer */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTool?.('file_explorer');
                }}
                className="w-full p-3 rounded-xl bg-[#18040a] hover:bg-[#280712] border border-amber-500/30 hover:border-amber-400 text-left transition-all flex items-center gap-3 group"
              >
                <div className="p-2 rounded-lg bg-red-950/80 text-amber-400 border border-amber-500/40 group-hover:border-amber-400">
                  <FolderTree className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-amber-200 group-hover:text-yellow-100 font-hud">
                    Workspace & Session Explorer
                  </div>
                  <div className="text-[10px] text-amber-500/60">Local storage inspector, memory metrics & session logs</div>
                </div>
              </button>

              {/* 4. Voice Diagnostics */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenVoiceDiagnostics?.();
                }}
                className="w-full p-3 rounded-xl bg-[#18040a] hover:bg-[#280712] border border-amber-500/30 hover:border-amber-400 text-left transition-all flex items-center gap-3 group"
              >
                <div className="p-2 rounded-lg bg-red-950/80 text-amber-400 border border-amber-500/40 group-hover:border-amber-400">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-amber-200 group-hover:text-yellow-100 font-hud">
                    6-Stage Voice Diagnostics
                  </div>
                  <div className="text-[10px] text-amber-500/60">Microphone, Web Speech, AI, and TTS audio pipeline test</div>
                </div>
              </button>

              {/* 5. OS Bridge */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTool?.('native_bridge');
                }}
                className="w-full p-3 rounded-xl bg-[#18040a] hover:bg-[#280712] border border-amber-500/30 hover:border-amber-400 text-left transition-all flex items-center gap-3 group"
              >
                <div className="p-2 rounded-lg bg-red-950/80 text-amber-400 border border-amber-500/40 group-hover:border-amber-400">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-amber-200 group-hover:text-yellow-100 font-hud">
                    Desktop OS Bridge Status
                  </div>
                  <div className="text-[10px] text-amber-500/60">Architecture boundaries & future native daemon companion</div>
                </div>
              </button>

              {/* 6. Neural Engine Settings */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEngineModal?.();
                }}
                className="w-full p-3 rounded-xl bg-[#18040a] hover:bg-[#280712] border border-amber-500/30 hover:border-amber-400 text-left transition-all flex items-center gap-3 group"
              >
                <div className="p-2 rounded-lg bg-red-950/80 text-amber-400 border border-amber-500/40 group-hover:border-amber-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-amber-200 group-hover:text-yellow-100 font-hud">
                    Neural Engine Matrix
                  </div>
                  <div className="text-[10px] text-amber-500/60">Toggle Gemini Cloud vs. Local In-Browser Offline Core</div>
                </div>
              </button>

              {/* 7. Setup & Configuration Wizard */}
              {onOpenSetup && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSetup();
                  }}
                  className="w-full p-3 rounded-xl bg-[#18040a] hover:bg-[#280712] border border-amber-500/30 hover:border-amber-400 text-left transition-all flex items-center gap-3 group"
                >
                  <div className="p-2 rounded-lg bg-red-950/80 text-amber-400 border border-amber-500/40 group-hover:border-amber-400">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-amber-200 group-hover:text-yellow-100 font-hud">
                      Setup &amp; Configuration Wizard
                    </div>
                    <div className="text-[10px] text-amber-500/60">Revisit onboarding, assistant identity &amp; system preferences</div>
                  </div>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* HISTORY & TELEMETRY LOGS */
          <>
            {/* Search & Actions Bar */}
            <div className="p-3 border-b border-amber-900/40 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-amber-500/60 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search telemetry records..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#18040a] border border-amber-500/40 text-xs text-amber-100 placeholder-amber-500/40 outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={exportHistory}
                  disabled={messages.length === 0}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#18040a] hover:bg-[#280712] border border-amber-500/40 text-[11px] font-mono text-amber-300 transition-all disabled:opacity-40"
                >
                  <Download className="w-3 h-3" />
                  <span>Export JSON</span>
                </button>

                <button
                  type="button"
                  onClick={onClearHistory}
                  disabled={messages.length === 0}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-950/50 hover:bg-red-900/60 border border-red-800/60 text-[11px] font-mono text-red-300 transition-all disabled:opacity-40"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Message Records List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-amber-400/50">
                  <MessageSquare className="w-8 h-8 text-amber-500/30 mb-2" />
                  <p className="text-xs font-mono">No telemetry records yet</p>
                  <p className="text-[10px] text-amber-500/40 mt-1">Transmit directives to VAJRA to log events</p>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="text-center p-6 text-xs text-amber-500/50">
                  No records match your query
                </div>
              ) : (
                filteredMessages.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => {
                      onSelectPrompt?.(msg.content);
                      onClose();
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      msg.role === 'user'
                        ? 'bg-[#18040a] hover:bg-[#260710] border-amber-500/40 hover:border-amber-400'
                        : 'bg-[#100307] hover:bg-[#1a050d] border-red-950/80 hover:border-amber-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span
                        className={`font-semibold uppercase ${
                          msg.role === 'user' ? 'text-amber-400' : 'text-yellow-400'
                        }`}
                      >
                        {msg.role === 'user' ? 'COMMAND DIRECTIVE' : 'VAJRA SYSTEM'}
                      </span>
                      <span className="text-amber-500/60">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-[#fde68a] line-clamp-3 leading-relaxed">
                      {msg.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-amber-900/40 bg-[#0a0204] text-[10px] font-mono text-amber-500/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-amber-400" />
            <span>Encrypted Persistent Storage</span>
          </div>
          <span>VAJRA V2.5</span>
        </div>
      </aside>
    </div>
  );
};
