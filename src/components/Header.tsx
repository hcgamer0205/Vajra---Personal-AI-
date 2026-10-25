import React from 'react';
import { Sparkles, Sun, Moon, Trash2, Check, PanelLeft, Bot, WifiOff, Cloud, Cpu } from 'lucide-react';
import { ModelOption } from '../types';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onClearChat: () => void;
  hasMessages: boolean;
  isStreaming: boolean;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  availableModels: ModelOption[];
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  isOfflineMode: boolean;
  onOpenEngineModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  onClearChat,
  hasMessages,
  isStreaming,
  selectedModel,
  onSelectModel,
  availableModels,
  isSidebarOpen,
  onToggleSidebar,
  isOfflineMode,
  onOpenEngineModal,
}) => {
  const [showModelMenu, setShowModelMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowModelMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentModel = availableModels.find((m) => m.id === selectedModel) || {
    name: isOfflineMode ? 'Local Offline Engine' : 'Gemini 3.7 Flash',
    id: selectedModel,
  };

  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 py-3.5 border-b border-[#1F2937] bg-[#0A0A0A]/90 backdrop-blur-md text-[#E5E7EB] transition-colors"
    >
      {/* Brand & Identity */}
      <div className="flex items-center gap-3 sm:gap-4">
        {onToggleSidebar && (
          <button
            id="sidebar-toggle-button"
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-[#9CA3AF] hover:text-white hover:bg-[#1F2937] border border-[#1F2937] transition-colors"
            title={isSidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
            aria-label="Toggle sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-3">
          <div
            id="brand-logo"
            className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-900/30 text-white"
          >
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white">
                Nova
              </h1>

              {/* Mode indicator badge */}
              <button
                id="offline-mode-indicator-badge"
                type="button"
                onClick={onOpenEngineModal}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                  isOfflineMode
                    ? 'bg-violet-950/60 text-violet-300 border-violet-500/40 hover:bg-violet-900/60'
                    : 'bg-emerald-950/50 text-emerald-400 border-emerald-500/30 hover:bg-emerald-900/50'
                }`}
                title="Click to configure AI Engine & Offline Architecture"
              >
                {isOfflineMode ? (
                  <>
                    <WifiOff className="w-3 h-3 text-violet-400" />
                    <span>Offline Mode</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Cloud Online</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Controls & Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Engine Settings button */}
        {onOpenEngineModal && (
          <button
            id="engine-settings-button"
            type="button"
            onClick={onOpenEngineModal}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-[#9CA3AF] hover:text-white bg-[#141414] hover:bg-[#1F2937] border border-[#1F2937] transition-all"
            title="AI Architecture & Engine Setup"
          >
            <Cpu className="w-3.5 h-3.5 text-violet-400" />
            <span>Architecture</span>
          </button>
        )}

        {/* Model Selector Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            id="model-selector-button"
            type="button"
            onClick={() => setShowModelMenu(!showModelMenu)}
            disabled={isStreaming}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-[#D1D5DB] hover:text-white bg-[#141414] hover:bg-[#1F2937] border border-[#1F2937] transition-all disabled:opacity-50 shadow-sm"
            title="Configure AI Model"
          >
            <Bot className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden sm:inline font-mono">{currentModel.name}</span>
            <span className="sm:hidden font-mono">{currentModel.name.replace('Gemini ', '')}</span>
          </button>

          {showModelMenu && (
            <div
              id="model-dropdown-menu"
              className="absolute right-0 mt-2 w-72 p-2 rounded-2xl bg-[#0D0D0D] border border-[#1F2937] shadow-2xl shadow-black/80 z-50 animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">
                Model Engine
              </div>
              <div className="space-y-1 mt-1">
                {availableModels.map((model) => (
                  <button
                    key={model.id}
                    id={`model-option-${model.id}`}
                    type="button"
                    onClick={() => {
                      onSelectModel(model.id);
                      setShowModelMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all flex items-start justify-between gap-2 ${
                      selectedModel === model.id
                        ? 'bg-violet-600/15 border border-violet-500/30 text-white font-medium shadow-sm'
                        : 'text-[#9CA3AF] hover:text-white hover:bg-[#161616] border border-transparent'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{model.name}</span>
                        {model.isDefault && (
                          <span className="text-[10px] text-violet-400 font-normal px-1.5 py-0.2 rounded bg-violet-950/60 border border-violet-800/40">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#9CA3AF] mt-1 font-normal leading-relaxed line-clamp-2">
                        {model.description}
                      </p>
                    </div>
                    {selectedModel === model.id && (
                      <Check className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Clear Chat Button */}
        <button
          id="clear-chat-button"
          type="button"
          onClick={onClearChat}
          disabled={!hasMessages || isStreaming}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-red-500/10"
          title="Clear chat history"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear Chat</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          id="theme-toggle-button"
          type="button"
          onClick={onToggleDarkMode}
          className="p-2 rounded-xl text-[#9CA3AF] hover:text-white bg-[#141414] hover:bg-[#1F2937] border border-[#1F2937] transition-colors"
          title={darkMode ? 'Light Mode' : 'Dark Mode'}
          aria-label="Toggle theme"
        >
          {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-violet-400" />}
        </button>
      </div>
    </header>
  );
};
