import React, { useState, useEffect } from 'react';
import { X, HardDrive, Download, Trash2, FileText, Database, ShieldCheck } from 'lucide-react';
import { Message } from '../../types';

interface FileManagerToolProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  onClearHistory: () => void;
}

export const FileManagerTool: React.FC<FileManagerToolProps> = ({
  isOpen,
  onClose,
  messages,
  onClearHistory,
}) => {
  const [storageUsage, setStorageUsage] = useState({ usedKb: 0, count: 0 });

  useEffect(() => {
    try {
      let totalLength = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          totalLength += (localStorage.getItem(key) || '').length;
        }
      }
      setStorageUsage({
        usedKb: Math.round((totalLength * 2) / 1024),
        count: localStorage.length,
      });
    } catch {
      // Ignored
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleExportAll = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      app: 'VAJRA Personal AI Assistant (Stark Core)',
      messages,
      totalMessages: messages.length,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vajra_stark_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#0e0206] border border-amber-500/50 w-full max-w-lg rounded-2xl p-5 shadow-2xl relative text-[#fef3c7] flex flex-col max-h-[520px] shadow-red-950/60">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-900/50 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-900/40 text-amber-400 border border-amber-500/40 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-hud tracking-wider text-amber-200">VAJRA Session & Workspace Explorer</h3>
              <p className="text-[10px] font-mono text-amber-500/60">On-Device Browser Sandbox Quotas</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-amber-300 hover:text-white hover:bg-[#20050d] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Storage Stats Bar */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#18040a] border border-amber-500/30 p-3 rounded-xl flex items-center gap-3">
            <Database className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-xs text-amber-500/70 font-mono">Storage Used</div>
              <div className="text-base font-bold text-amber-200 font-mono">{storageUsage.usedKb} KB</div>
            </div>
          </div>
          <div className="bg-[#18040a] border border-amber-500/30 p-3 rounded-xl flex items-center gap-3">
            <FileText className="w-5 h-5 text-yellow-400" />
            <div>
              <div className="text-xs text-amber-500/70 font-mono">Telemetry Events</div>
              <div className="text-base font-bold text-amber-200 font-mono">{messages.length} msgs</div>
            </div>
          </div>
        </div>

        {/* Local Files / Artifacts List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <div className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider px-1">
            Persisted Local Artifacts
          </div>

          <div className="bg-[#18040a] border border-amber-500/30 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-xs font-semibold text-amber-100">vajra_telemetry_history.json</div>
                <div className="text-[10px] text-amber-500/60">Active session prompts & telemetry</div>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/80 text-amber-300 border border-amber-500/40">
              {messages.length} records
            </span>
          </div>

          <div className="bg-[#18040a] border border-amber-500/30 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-yellow-400" />
              <div>
                <div className="text-xs font-semibold text-amber-100">vajra_scratchpad_content.txt</div>
                <div className="text-[10px] text-amber-500/60">Persistent scratchpad drafts</div>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40">
              Active
            </span>
          </div>

          <div className="bg-red-950/30 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Sandbox Isolation:</strong> Browser security isolates this file storage from host OS root paths. Direct access to arbitrary desktop file systems is protected.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t border-amber-900/40 flex items-center justify-between">
          <button
            type="button"
            onClick={onClearHistory}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 hover:bg-red-900/60 text-xs font-mono transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Storage</span>
          </button>

          <button
            type="button"
            onClick={handleExportAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold font-mono text-xs transition-colors shadow-lg shadow-amber-500/30"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Backup JSON</span>
          </button>
        </div>
      </div>
    </div>
  );
};
