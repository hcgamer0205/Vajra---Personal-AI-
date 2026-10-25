import React, { useState, useEffect } from 'react';
import { X, Cpu, Laptop, CheckCircle2, Lock, Sparkles, Folder, Terminal, Download, ShieldCheck } from 'lucide-react';
import { nativeBridge } from '../../services/nativeBridge';

interface NativeBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchFallback: (tool: 'calculator' | 'notepad' | 'file_explorer') => void;
}

export const NativeBridgeModal: React.FC<NativeBridgeModalProps> = ({
  isOpen,
  onClose,
  onLaunchFallback,
}) => {
  const [status, setStatus] = useState(nativeBridge.getStatus());
  const [specialFolders, setSpecialFolders] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    if (isOpen) {
      const st = nativeBridge.getStatus();
      setStatus(st);
      if (typeof window !== 'undefined' && window.vajraDesktop?.getSpecialFolders) {
        window.vajraDesktop.getSpecialFolders().then((folders) => setSpecialFolders(folders)).catch(() => {});
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isNativeElectron = status.isElectron;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#0e0206] border border-amber-500/50 w-full max-w-xl rounded-2xl p-6 shadow-2xl relative text-[#fef3c7] max-h-[88vh] overflow-y-auto shadow-red-950/70">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-900/50 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-900/40 text-amber-400 border border-amber-500/50 flex items-center justify-center shadow-md shadow-red-900/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-hud tracking-wider text-amber-200">VAJRA Desktop Bridge & OS Architecture</h3>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  isNativeElectron
                    ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
                    : 'bg-red-950/80 text-amber-300 border-amber-500/50'
                }`}>
                  {isNativeElectron ? 'NATIVE ELECTRON' : 'BROWSER ENVIRONMENT'}
                </span>
              </div>
              <p className="text-xs font-mono text-amber-500/70">Windows Native Process Bridge, File Engine & Installer Info</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-amber-300 hover:text-white hover:bg-[#20050d] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-amber-100/90">
          {/* Status Banner */}
          <div className="bg-[#18040a] border border-amber-500/40 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm font-hud">
                {isNativeElectron ? <Sparkles className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-amber-400" />}
                <span>{isNativeElectron ? 'Direct Windows OS Integration Active' : 'Dual-Engine Architecture (Desktop + Web Sandbox)'}</span>
              </div>
              <span className="text-[11px] font-mono text-amber-400/80">Platform: {status.platform}</span>
            </div>
            <p className="leading-relaxed text-amber-100/75">
              {isNativeElectron
                ? 'VAJRA is executing natively via the secure Electron IPC layer. Direct process spawning (calc.exe, notepad.exe, explorer.exe) and full filesystem operations are enabled with sandbox safety barriers.'
                : 'VAJRA includes both a complete standalone Windows Desktop application package (VAJRA-Setup.exe via electron-builder) and rich interactive in-app tools with full fidelity in web environments.'}
            </p>
          </div>

          {/* Special Folders Map (if available) */}
          {specialFolders && (
            <div className="bg-[#140308] border border-cyan-500/30 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2 text-cyan-300 font-semibold font-mono text-[11px]">
                <Folder className="w-3.5 h-3.5" />
                <span>Host Windows Special Directories</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="bg-[#0b0204] p-2 rounded border border-amber-900/40 truncate">
                  <span className="text-amber-500">Documents:</span> <span className="text-amber-200">{specialFolders.documents}</span>
                </div>
                <div className="bg-[#0b0204] p-2 rounded border border-amber-900/40 truncate">
                  <span className="text-amber-500">Downloads:</span> <span className="text-amber-200">{specialFolders.downloads}</span>
                </div>
              </div>
            </div>
          )}

          {/* Current Capability Matrix */}
          <div className="space-y-2">
            <div className="text-[11px] uppercase tracking-wider font-mono font-bold text-amber-400">
              VAJRA System Operations & Whitelist
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div className="bg-[#18040a] border border-amber-500/40 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-semibold text-amber-100">Windows Whitelisted Application Launcher</div>
                    <div className="text-[10px] text-amber-500/70">calc.exe, notepad.exe, explorer.exe, chrome.exe, wt.exe, powershell.exe</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/80 text-amber-300 border border-amber-500/40">
                  {isNativeElectron ? 'Native IPC' : 'In-App + URI'}
                </span>
              </div>

              <div className="bg-[#18040a] border border-amber-500/40 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="font-semibold text-amber-100">Filesystem Operations Engine</div>
                    <div className="text-[10px] text-amber-500/70">Create Folder, Create File, Move, Copy, List, with user confirmation dialogs</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/80 text-amber-300 border border-amber-500/40">
                  {isNativeElectron ? 'Native FS' : 'Virtual FS'}
                </span>
              </div>

              <div className="bg-[#18040a] border border-amber-500/40 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Download className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-semibold text-amber-100">Windows NSIS Installer Packaging</div>
                    <div className="text-[10px] text-amber-500/70">Target: VAJRA-Setup.exe (Start Menu, Desktop shortcut, Add/Remove programs)</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                  Ready (dist:win)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions / Tests */}
          <div className="pt-2">
            <div className="text-[11px] uppercase tracking-wider font-mono font-bold text-amber-400 mb-2">
              Launch Built-In Tools & Fallbacks
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLaunchFallback('calculator');
                }}
                className="px-3 py-1.5 rounded-lg bg-[#18040a] hover:bg-[#280712] border border-amber-500/40 text-xs font-mono text-amber-300 transition-colors cursor-pointer"
              >
                In-App Calculator
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLaunchFallback('notepad');
                }}
                className="px-3 py-1.5 rounded-lg bg-[#18040a] hover:bg-[#280712] border border-amber-500/40 text-xs font-mono text-amber-300 transition-colors cursor-pointer"
              >
                In-App Scratchpad
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLaunchFallback('file_explorer');
                }}
                className="px-3 py-1.5 rounded-lg bg-[#18040a] hover:bg-[#280712] border border-amber-500/40 text-xs font-mono text-amber-300 transition-colors cursor-pointer"
              >
                Session & File Explorer
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-amber-900/40 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-500/70">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero arbitrary shell execution. Strict whitelist only.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold text-xs font-mono transition-colors shadow-lg shadow-amber-500/30 cursor-pointer"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
