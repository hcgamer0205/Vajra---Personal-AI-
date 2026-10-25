import React from 'react';
import { X, Calculator, FileText, HardDrive, Cpu, Play, Sparkles } from 'lucide-react';

interface QuickAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchTool: (tool: 'calculator' | 'notepad' | 'file_explorer' | 'native_bridge') => void;
}

export const QuickAppModal: React.FC<QuickAppModalProps> = ({
  isOpen,
  onClose,
  onLaunchTool,
}) => {
  if (!isOpen) return null;

  const tools = [
    {
      id: 'calculator' as const,
      title: 'Interactive Math Calculator',
      description: 'Perform advanced calculations, trigonometric functions, memory buffers, and formula evaluations directly in-app.',
      icon: <Calculator className="w-5 h-5 text-amber-400" />,
      status: 'Ready (In-App)',
    },
    {
      id: 'notepad' as const,
      title: 'Scratchpad & Text Console',
      description: 'Persistent notes, real-time character & word analytics, local storage saving, and 1-click text export.',
      icon: <FileText className="w-5 h-5 text-yellow-400" />,
      status: 'Ready (In-App)',
    },
    {
      id: 'file_explorer' as const,
      title: 'Session & File Explorer',
      description: 'Inspect browser storage allocations, telemetry artifact quotas, memory dumps, and cached logs.',
      icon: <HardDrive className="w-5 h-5 text-red-400" />,
      status: 'Ready (In-App)',
    },
    {
      id: 'native_bridge' as const,
      title: 'Desktop OS Companion Bridge',
      description: 'Architecture status for native system execution (Windows, macOS, Linux) via secure local companion daemon.',
      icon: <Cpu className="w-5 h-5 text-amber-300" />,
      status: 'Companion Bridge',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      {/* Modal in Iron Man Red & Gold */}
      <div className="relative z-10 w-full max-w-lg bg-[#0e0206] border border-amber-500/50 rounded-2xl shadow-2xl p-5 text-[#fef3c7] space-y-4 animate-in fade-in zoom-in-95 duration-150 shadow-red-950/60">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-900/50 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-900/40 border border-amber-500/50 flex items-center justify-center text-amber-300">
              <Play className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-hud font-bold text-base text-amber-200 tracking-wider">
                STARK SYSTEMS TOOLS LAUNCHER
              </h2>
              <p className="text-[10px] font-mono text-amber-400/80">
                In-app utilities & system extensions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-amber-300 hover:text-white bg-[#1a040b] hover:bg-[#280712] border border-amber-900/60 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tools Grid */}
        <div className="space-y-2.5">
          {tools.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                onLaunchTool(t.id);
                onClose();
              }}
              className="w-full p-3 rounded-xl bg-[#18040a] hover:bg-[#280712] border border-amber-500/30 hover:border-amber-400 text-left transition-all cursor-pointer flex items-start gap-3 group shadow-sm"
            >
              <div className="w-9 h-9 rounded-lg bg-[#0e0206] border border-amber-500/40 flex items-center justify-center shrink-0 group-hover:border-amber-400">
                {t.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-hud font-bold text-sm text-amber-200 group-hover:text-yellow-200">
                    {t.title}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-950/80 text-amber-300 border border-amber-500/40">
                    {t.status}
                  </span>
                </div>
                <p className="text-[11px] text-amber-100/70 leading-relaxed mt-1 line-clamp-2">
                  {t.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-amber-900/40 flex items-center justify-between text-[10px] font-mono text-amber-500/60">
          <div className="flex items-center gap-1 text-amber-400/80">
            <Sparkles className="w-3 h-3" />
            <span>Click any tool to launch immediately</span>
          </div>
          <span>[ESC] to close</span>
        </div>
      </div>
    </div>
  );
};
