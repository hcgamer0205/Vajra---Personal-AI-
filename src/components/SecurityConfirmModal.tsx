import React from 'react';
import { X, ShieldAlert, Check, AlertTriangle } from 'lucide-react';
import { VajraAction } from '../types';

interface SecurityConfirmModalProps {
  isOpen: boolean;
  action: VajraAction | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const SecurityConfirmModal: React.FC<SecurityConfirmModalProps> = ({
  isOpen,
  action,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen || !action) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#0e0206] border border-amber-500/50 w-full max-w-md rounded-2xl p-5 shadow-2xl relative text-[#fef3c7] shadow-red-950/60">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-900/50 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold font-hud tracking-wider text-amber-200">Stark Security Protocol Verification</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-lg text-amber-300 hover:text-white hover:bg-[#20050d] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Details */}
        <div className="space-y-3 text-xs text-amber-100/80 my-2">
          <p className="leading-relaxed">
            VAJRA requires Stark system authorization before dispatching the following directive:
          </p>

          <div className="bg-[#18040a] border border-amber-500/30 p-3 rounded-xl space-y-1.5 font-mono text-[11px]">
            <div className="text-amber-300 font-semibold">{action.title}</div>
            {action.url && (
              <div className="text-amber-100/70 truncate">
                <span className="text-amber-500/70">Target URL:</span> {action.url}
              </div>
            )}
            {action.appName && (
              <div className="text-amber-100/70">
                <span className="text-amber-500/70">Target Application:</span> {action.appName}
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 text-amber-300/90 text-[11px] bg-red-950/40 border border-amber-500/30 p-2.5 rounded-xl">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <span>
              All external links open safely in a new sandbox tab.
            </span>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="mt-4 pt-3 border-t border-amber-900/40 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-xl bg-[#18040a] hover:bg-[#280712] text-xs font-mono text-amber-300 hover:text-white transition-colors"
          >
            Abort
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-xs font-bold font-mono text-black transition-colors shadow-lg shadow-amber-500/30"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Authorize & Execute</span>
          </button>
        </div>
      </div>
    </div>
  );
};
