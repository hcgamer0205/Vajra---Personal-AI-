import React from 'react';
import { X, WifiOff, Cloud, Cpu, HardDrive, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { VajraSphere } from './VajraSphere';

interface EngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  isForceOffline: boolean;
  onToggleForceOffline: (val: boolean) => void;
  activeEngine: 'cloud' | 'local';
  onSelectEngine: (engineId: string) => void;
}

export const EngineModal: React.FC<EngineModalProps> = ({
  isOpen,
  onClose,
  isForceOffline,
  onToggleForceOffline,
  activeEngine,
  onSelectEngine,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        id="engine-settings-modal"
        className="relative w-full max-w-2xl bg-[#0e0206] border border-amber-500/50 rounded-2xl shadow-2xl p-5 sm:p-7 overflow-hidden text-[#fef3c7]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-900/40 border border-amber-500/50 flex items-center justify-center text-amber-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold font-hud tracking-wider text-amber-200">
                VAJRA NEURAL ENGINE MATRIX
              </h3>
              <p className="text-xs font-mono text-amber-500/60">
                Hybrid Architecture: Gemini Cloud Stream & On-Device Local Core
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-amber-300 hover:text-white hover:bg-[#20050d] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Core Sphere Status Strip */}
        <div className="my-5 p-4 rounded-xl bg-[#18040a] border border-amber-500/30 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-20 h-20 shrink-0">
            <VajraSphere size="sm" state="idle" isOffline={activeEngine === 'local'} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-sm font-bold font-hud tracking-wider text-amber-200">
                {activeEngine === 'local' ? 'ON-DEVICE LOCAL REACTOR ACTIVE' : 'GEMINI CLOUD ARCHITECTURE ONLINE'}
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  activeEngine === 'local'
                    ? 'bg-amber-950/80 border-amber-600/60 text-amber-300'
                    : 'bg-red-950/80 border-amber-500/50 text-amber-300'
                }`}
              >
                {activeEngine === 'local' ? '100% On-Device' : 'Cloud Proxy'}
              </span>
            </div>
            <p className="text-xs text-amber-100/70 mt-1">
              {activeEngine === 'local'
                ? 'Directives are computed locally inside browser memory. Zero external server packets dispatched.'
                : 'Direct inference stream via secure backend proxy route (/api/chat) using Gemini models.'}
            </p>
          </div>
        </div>

        {/* Engine Selection Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {/* Local Engine Card */}
          <div
            onClick={() => {
              onSelectEngine('local-browser-engine');
              onToggleForceOffline(true);
            }}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              activeEngine === 'local'
                ? 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400/50 shadow-md shadow-amber-950/40'
                : 'bg-[#18040a] border-amber-900/40 hover:border-amber-500/60'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs font-hud">
                  <WifiOff className="w-4 h-4" />
                  <span>LOCAL BROWSER CORE</span>
                </div>
                {activeEngine === 'local' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
              </div>
              <p className="text-xs text-amber-100/70 leading-relaxed">
                Runs on-device without internet. Keeps telemetry and directives 100% private in local storage.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-amber-900/40 flex items-center justify-between text-[11px] font-mono text-amber-500/70">
              <span>Runtime: Browser / WebGPU</span>
              <span className="text-amber-400 font-medium">Ready</span>
            </div>
          </div>

          {/* Cloud Gemini Card */}
          <div
            onClick={() => {
              onSelectEngine('gemini-cloud');
              onToggleForceOffline(false);
            }}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              activeEngine === 'cloud'
                ? 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400/50 shadow-md shadow-amber-950/40'
                : 'bg-[#18040a] border-amber-900/40 hover:border-amber-500/60'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs font-hud">
                  <Cloud className="w-4 h-4" />
                  <span>GEMINI CLOUD PIPELINE</span>
                </div>
                {activeEngine === 'cloud' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
              </div>
              <p className="text-xs text-amber-100/70 leading-relaxed">
                High-reasoning cloud pipeline via secure server-side proxy (`/api/chat`).
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-amber-900/40 flex items-center justify-between text-[11px] font-mono text-amber-500/70">
              <span>Network: Online</span>
              <span className="text-amber-400 font-medium">Active</span>
            </div>
          </div>
        </div>

        {/* Offline Architecture Specs */}
        <div className="p-3.5 rounded-xl bg-[#18040a] border border-amber-500/30 text-xs font-mono mb-4 text-amber-100/80">
          <div className="text-amber-400 font-semibold mb-1 flex items-center gap-1.5 font-hud">
            <HardDrive className="w-3.5 h-3.5" />
            <span>VAJRA DECOUPLED LLM ADAPTER PATTERN</span>
          </div>
          <p className="text-[11px] text-amber-500/70 mb-2 leading-relaxed">
            The system uses decoupled <span className="text-amber-300 font-mono">LLMAdapter</span> drivers for seamless offline fallback and cloud scale.
          </p>
          <div className="bg-[#0e0206] p-2.5 rounded-lg border border-amber-900/40 text-[11px] text-[#fef3c7] space-y-1">
            <div>• Persistence: <span className="text-amber-400">IndexedDB & localStorage (On-Device)</span></div>
            <div>• LLM Contract: <span className="text-amber-400">LLMAdapter (Decoupled Core)</span></div>
            <div>• Key Shield: <span className="text-amber-400">Server proxy protects API secrets</span></div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-amber-900/40">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-500/70">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>VAJRA Protocol Verified</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold font-mono text-xs transition-colors shadow-lg shadow-amber-500/30"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
