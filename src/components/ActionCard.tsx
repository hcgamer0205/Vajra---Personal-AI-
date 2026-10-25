import React, { useState } from 'react';
import {
  ExternalLink,
  Search,
  Globe,
  Calculator,
  FileText,
  HardDrive,
  ShieldCheck,
  Check,
  Laptop,
  Play,
  FolderPlus,
  FilePlus,
  FolderOpen,
  ArrowRightLeft,
  Trash2,
} from 'lucide-react';
import { VajraAction } from '../types';

interface ActionCardProps {
  action: VajraAction;
  onExecute: (action: VajraAction) => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({ action, onExecute }) => {
  const [executed, setExecuted] = useState(action.status === 'executed');

  const handleClick = () => {
    onExecute(action);
    setExecuted(true);
  };

  const getIcon = () => {
    if (action.type === 'SEARCH_WEB') {
      return <Search className="w-4 h-4 text-amber-400" />;
    }
    if (action.type === 'OPEN_WEBSITE') {
      return <Globe className="w-4 h-4 text-yellow-400" />;
    }
    if (action.type === 'CREATE_FOLDER') {
      return <FolderPlus className="w-4 h-4 text-emerald-400" />;
    }
    if (action.type === 'CREATE_FILE') {
      return <FilePlus className="w-4 h-4 text-cyan-400" />;
    }
    if (action.type === 'OPEN_PATH') {
      return <FolderOpen className="w-4 h-4 text-amber-400" />;
    }
    if (action.type === 'MOVE_FILE' || action.type === 'COPY_FILE' || action.type === 'RENAME_FILE') {
      return <ArrowRightLeft className="w-4 h-4 text-amber-400" />;
    }
    if (action.type === 'DELETE_FILE') {
      return <Trash2 className="w-4 h-4 text-red-400" />;
    }
    if (action.appName === 'Calculator') {
      return <Calculator className="w-4 h-4 text-amber-400" />;
    }
    if (action.appName === 'Notepad') {
      return <FileText className="w-4 h-4 text-amber-300" />;
    }
    if (action.appName === 'File Explorer') {
      return <HardDrive className="w-4 h-4 text-red-400" />;
    }
    return <Laptop className="w-4 h-4 text-amber-400" />;
  };

  const getDomain = (urlString?: string) => {
    if (!urlString) return null;
    try {
      return new URL(urlString).hostname;
    } catch {
      return null;
    }
  };

  const domain = getDomain(action.url);

  return (
    <div className="my-2 p-3 rounded-xl bg-[#140308]/90 border border-amber-500/30 hover:border-amber-400/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left shadow-lg shadow-red-950/30">
      <div className="flex items-start sm:items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#22060e] border border-amber-500/40 flex items-center justify-center shrink-0 shadow-sm">
          {getIcon()}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-amber-200 tracking-wide font-hud">{action.title}</span>
            {domain && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#20050d] text-amber-300 border border-amber-500/40">
                {domain}
              </span>
            )}
            {action.targetPath && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1b060d] text-cyan-300 border border-cyan-500/30">
                {action.targetPath}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-400/80 font-mono">
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              <span>Safe Protocol</span>
            </span>
          </div>

          {action.description && (
            <p className="text-[11px] text-amber-100/60 truncate mt-0.5">{action.description}</p>
          )}
        </div>
      </div>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleClick}
        className={`shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
          executed
            ? 'bg-[#2a0812] text-amber-300 border border-amber-500/50'
            : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black shadow-md shadow-amber-500/30'
        }`}
      >
        {executed ? (
          <>
            <Check className="w-3.5 h-3.5 text-amber-400" />
            <span>Executed</span>
          </>
        ) : action.type === 'OPEN_WEBSITE' || action.type === 'SEARCH_WEB' ? (
          <>
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in Browser</span>
          </>
        ) : action.type === 'CREATE_FOLDER' || action.type === 'CREATE_FILE' || action.type === 'OPEN_PATH' ? (
          <>
            <Play className="w-3.5 h-3.5" />
            <span>Execute Native</span>
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5" />
            <span>Launch Action</span>
          </>
        )}
      </button>
    </div>
  );
};
